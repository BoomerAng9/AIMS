"""Sandbox manager for the server."""

import asyncio
import logging
import uuid
from typing import Any, IO, AsyncIterator, Literal, Optional

from ii_sandbox_server.db.manager import Sandboxes
from ii_sandbox_server.models import SandboxInfo
from ii_sandbox_server.lifecycle.queue import SandboxQueueScheduler
from ii_sandbox_server.config import (
    SandboxConfig,
)
from ii_sandbox_server.sandboxes import (
    BaseSandbox,
    SandboxFactory,
)
from ii_sandbox_server.models.exceptions import (
    SandboxNotFoundException,
    SandboxNotInitializedError,
)


logger = logging.getLogger(__name__)


class SandboxController:
    """Controller for sandbox lifecycle operations and database interactions."""

    def __init__(self, sandbox_config: SandboxConfig):
        self.sandbox_config = sandbox_config

        # Get the sandbox provider
        self.sandbox_provider = SandboxFactory.get_provider(
            sandbox_config.provider_type
        )

        # Initialize queue scheduler
        self.queue_scheduler = SandboxQueueScheduler(
            redis_url=sandbox_config.redis_url,
            redis_tls_ca_path=sandbox_config.redis_tls_ca_path,
            queue_name=sandbox_config.queue_name,
            max_retries=sandbox_config.max_retries,
        )

        # Queue consumer task
        self._consumer_task = None
        self._consumer_lock = asyncio.Lock()

    async def start(self):
        """Start the sandbox manager."""
        await self._ensure_consumer_started()
        logger.info("Sandbox manager started")

    async def shutdown(self):
        """Shutdown the sandbox manager."""
        if self._consumer_task:
            self._consumer_task.cancel()
            try:
                await self._consumer_task
            except asyncio.CancelledError:
                pass

        if self.queue_scheduler:
            await self.queue_scheduler.stop_consuming()

        logger.info("Sandbox manager stopped")

    async def create_sandbox(
        self,
        user_id: str,
        sandbox_template_id: str | None = None,
    ) -> BaseSandbox:
        """Create a new sandbox."""
        await self._ensure_consumer_started()
        sandbox_id = str(uuid.uuid4())
        sandbox = await self.sandbox_provider.create(
            config=self.sandbox_config,
            queue=self.queue_scheduler,
            sandbox_id=sandbox_id,
            metadata={  # For future use
                "ii_sandbox_id": sandbox_id,
                "user_id": user_id,
                "sandbox_template_id": sandbox_template_id,
            },
            sandbox_template_id=sandbox_template_id,
        )

        # Store sandbox info in database
        # TODO : store sandbox template id in database
        await Sandboxes.create_sandbox(
            sandbox_id=sandbox_id,
            provider=self.sandbox_config.provider_type,
            user_id=user_id,
            provider_sandbox_id=sandbox.provider_sandbox_id,
            status="running",
        )

        logger.info(f"Created sandbox {sandbox_id} for user {user_id}")
        return sandbox

    async def write_file(
        self, sandbox_id: str, file_path: str, content: str | bytes | IO
    ) -> bool:
        """Write a file to a sandbox."""
        await self._ensure_consumer_started()
        sandbox = await self.connect(sandbox_id)
        return await sandbox.write_file(content, file_path)

    async def read_file(self, sandbox_id: str, file_path: str) -> str:
        """Read a file from a sandbox."""
        await self._ensure_consumer_started()
        sandbox = await self.connect(sandbox_id)
        return await sandbox.read_file(file_path)

    async def download_file(
        self, sandbox_id: str, file_path: str, format: Literal["text", "bytes"] = "text"
    ) -> str | bytes:
        """Download a file from a sandbox."""
        sandbox = await self.connect(sandbox_id)
        content = await sandbox.download_file(file_path, format)
        if not content:
            raise FileNotFoundError(f"File not found or empty: {file_path}")
        return content

    async def download_file_stream(
        self, sandbox_id: str, file_path: str
    ) -> AsyncIterator[bytes]:
        """Download a file from a sandbox."""
        sandbox = await self.connect(sandbox_id)
        return await sandbox.download_file_stream(file_path)

    async def expose_port(self, sandbox_id: str, port: int) -> str:
        """Expose a port on a sandbox."""
        await self._ensure_consumer_started()
        sandbox = await self.connect(sandbox_id)
        return await sandbox.expose_port(port)

    async def connect(self, sandbox_id: str) -> BaseSandbox:
        """Connect to or resume a sandbox."""
        await self._ensure_consumer_started()

        sandbox_data = await Sandboxes.get_sandbox_by_id(sandbox_id)
        if not sandbox_data:
            raise SandboxNotFoundException(sandbox_id)

        if str(sandbox_data.status) == "paused":
            return await self._resume_sandbox(sandbox_id)
        elif str(sandbox_data.status) == "running":
            return await self._connect_sandbox(sandbox_id)
        else:
            raise SandboxNotInitializedError(
                f"Sandbox {sandbox_id} is not paused or running"
            )

    async def _connect_sandbox(self, sandbox_id: str) -> BaseSandbox:
        """Connect to a running sandbox."""
        sandbox_data = await Sandboxes.get_sandbox_by_id(sandbox_id)
        if not sandbox_data:
            raise SandboxNotFoundException(sandbox_id)

        sandbox = await self.sandbox_provider.connect(
            provider_sandbox_id=str(sandbox_data.provider_sandbox_id),
            config=self.sandbox_config,
            queue=self.queue_scheduler,
            sandbox_id=sandbox_id,
        )

        # Update activity
        await Sandboxes.update_last_activity(sandbox_id)

        logger.debug(f"Connected to sandbox {sandbox_id}")
        return sandbox

    async def _resume_sandbox(self, sandbox_id: str) -> BaseSandbox:
        """Resume a paused sandbox."""
        sandbox_data = await Sandboxes.get_sandbox_by_id(sandbox_id)
        if not sandbox_data:
            raise SandboxNotFoundException(sandbox_id)

        sandbox = await self.sandbox_provider.resume(
            provider_sandbox_id=str(sandbox_data.provider_sandbox_id),
            config=self.sandbox_config,
            queue=self.queue_scheduler,
            sandbox_id=sandbox_id,
        )

        # Update status
        await Sandboxes.update_sandbox_status(
            sandbox_id, "running", started_at=True, last_activity_at=True
        )

        logger.debug(f"Resumed sandbox {sandbox_id}")
        return sandbox

    async def upload_file(
        self, sandbox_id: str, file_content: str | bytes, remote_path: str
    ):
        """Upload a file to a sandbox."""
        await self._ensure_consumer_started()
        sandbox = await self.connect(sandbox_id)
        return await sandbox.upload_file(file_content, remote_path)

    async def pause_sandbox(self, sandbox_id: str, reason: str = "manual"):
        """Pause a sandbox."""
        await self._ensure_consumer_started()

        sandbox_data = await Sandboxes.get_sandbox_by_id(sandbox_id)
        if not sandbox_data:
            raise SandboxNotFoundException(sandbox_id)

        await self.sandbox_provider.stop(
            provider_sandbox_id=str(sandbox_data.provider_sandbox_id),
            config=self.sandbox_config,
            queue=self.queue_scheduler,
            sandbox_id=sandbox_id,
        )

        # Update status
        await Sandboxes.update_sandbox_status(sandbox_id, "paused", stopped_at=True)

        logger.debug(f"Paused sandbox {sandbox_id} due to {reason}")

    async def delete_sandbox(self, sandbox_id: str):
        """Delete a sandbox."""
        await self._ensure_consumer_started()

        sandbox_data = await Sandboxes.get_sandbox_by_id(sandbox_id)
        if not sandbox_data:
            raise SandboxNotFoundException(sandbox_id)

        await self.sandbox_provider.delete(
            provider_sandbox_id=str(sandbox_data.provider_sandbox_id),
            config=self.sandbox_config,
            queue=self.queue_scheduler,
            sandbox_id=sandbox_id,
        )

        # Remove from database
        await Sandboxes.delete_sandbox(sandbox_id)

        logger.debug(f"Deleted sandbox {sandbox_id}")

    async def schedule_timeout(self, sandbox_id: str, timeout_seconds: int):
        """Schedule a timeout for a sandbox."""
        await self._ensure_consumer_started()

        sandbox_data = await Sandboxes.get_sandbox_by_id(sandbox_id)
        if not sandbox_data:
            raise SandboxNotFoundException(sandbox_id)

        await self.sandbox_provider.schedule_timeout(
            provider_sandbox_id=str(sandbox_data.provider_sandbox_id),
            sandbox_id=sandbox_id,
            config=self.sandbox_config,
            queue=self.queue_scheduler,
            timeout_seconds=timeout_seconds,
        )

        logger.debug(f"Scheduled timeout for sandbox {sandbox_id}: {timeout_seconds}s")

    async def run_cmd(self, sandbox_id: str, command: str, background: bool = False) -> str:
        """Run a command in a sandbox."""
        await self._ensure_consumer_started()
        sandbox = await self.connect(sandbox_id)
        return await sandbox.run_cmd(command, background)

    async def create_directory(
        self, sandbox_id: str, directory_path: str, exist_ok: bool = False
    ) -> bool:
        """Create a directory in a sandbox."""
        await self._ensure_consumer_started()
        sandbox = await self.connect(sandbox_id)
        return await sandbox.create_directory(directory_path, exist_ok)

    async def get_sandbox_status(self, sandbox_id: str) -> str:
        """Get the status of a sandbox."""
        sandbox_data = await Sandboxes.get_sandbox_by_id(sandbox_id)
        if not sandbox_data:
            raise SandboxNotFoundException(sandbox_id)

        # Query the provider for status
        status = await self.sandbox_provider.get_status(
            provider_sandbox_id=str(sandbox_data.provider_sandbox_id),
            config=self.sandbox_config,
            sandbox_id=sandbox_id,
        )

        # Sync with database if status changed
        if status != sandbox_data.status:
            logger.info(
                f"Syncing sandbox {sandbox_id} status: {sandbox_data.status} -> {status}"
            )
            await Sandboxes.update_sandbox_status(sandbox_id, status)

        return status

    async def get_sandbox_info(self, sandbox_id: str) -> Optional[SandboxInfo]:
        """Get sandbox information."""
        sandbox_data = await Sandboxes.get_sandbox_by_id(sandbox_id)
        if not sandbox_data:
            raise SandboxNotFoundException(sandbox_id)
        return sandbox_data

    async def _ensure_consumer_started(self):
        """Ensure the queue consumer is started."""
        async with self._consumer_lock:
            if self._consumer_task is None:
                self._consumer_task = asyncio.create_task(self._setup_queue_consumer())

    async def _setup_queue_consumer(self):
        """Setup the message queue consumer."""
        await self.queue_scheduler.setup_consumer(self._handle_lifecycle_message)
        await self.queue_scheduler.start_consuming()
        logger.debug("Queue consumer started")

    async def _handle_lifecycle_message(
        self, sandbox_id: str, action: str, metadata: dict[str, Any]
    ):
        """Handle lifecycle messages from the queue."""
        try:
            logger.debug(
                f"Processing lifecycle action '{action}' for sandbox {sandbox_id}"
            )

            if action == "pause":
                reason = metadata.get("reason", "scheduled")
                await self.pause_sandbox(sandbox_id, reason)

            elif action == "terminate":
                await self.delete_sandbox(sandbox_id)

            else:
                logger.warning(
                    f"Unknown lifecycle action '{action}' for sandbox {sandbox_id}"
                )

        except Exception as e:
            logger.error(
                f"Error handling lifecycle message for sandbox {sandbox_id}: {e}"
            )
            # Try to clean up the sandbox on error
            try:
                #await self.delete_sandbox(sandbox_id)
                logger.error(f"Error handling lifecycle message for sandbox {sandbox_id}: {e}")
            except Exception:
                pass
