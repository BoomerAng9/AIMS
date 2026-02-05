"""Run cancellation management."""

import asyncio
import logging
from abc import ABC, abstractmethod
from typing import Dict

from redis.asyncio import Redis

logger = logging.getLogger(__name__)


class RunCancelledException(Exception):
    """Exception raised when a run is cancelled."""

    pass


class BaseRunCancellationManager(ABC):
    """Abstract base class for run cancellation managers."""

    @abstractmethod
    async def register_run(self, run_id: str) -> None:
        """Register a new run as not cancelled."""
        pass

    @abstractmethod
    async def cancel_run(self, run_id: str) -> bool:
        """Cancel a run by marking it as cancelled.

        Returns:
            bool: True if run was found and cancelled, False if run not found.
        """
        pass

    @abstractmethod
    async def is_cancelled(self, run_id: str) -> bool:
        """Check if a run is cancelled."""
        pass

    @abstractmethod
    async def cleanup_run(self, run_id: str) -> None:
        """Remove a run from tracking (called when run completes)."""
        pass

    @abstractmethod
    async def raise_if_cancelled(self, run_id: str) -> None:
        """Check if a run should be cancelled and raise exception if so."""
        pass

    @abstractmethod
    async def get_active_runs(self) -> Dict[str, bool]:
        """Get all currently tracked runs and their cancellation status."""
        pass


class MemoryRunCancellationManager(BaseRunCancellationManager):
    """In-memory cancellation manager using asyncio locks.

    WARNING: Only works within a single process/worker.
    For multi-worker deployments, use RedisRunCancellationManager.
    """

    def __init__(self):
        self._cancelled_runs: Dict[str, bool] = {}
        self._lock = asyncio.Lock()

    async def register_run(self, run_id: str) -> None:
        """Register a new run as not cancelled."""
        async with self._lock:
            self._cancelled_runs[run_id] = False

    async def cancel_run(self, run_id: str) -> bool:
        """Cancel a run by marking it as cancelled.

        Returns:
            bool: True if run was found and cancelled, False if run not found.
        """
        async with self._lock:
            if run_id in self._cancelled_runs:
                self._cancelled_runs[run_id] = True
                logger.info(f"Run {run_id} marked for cancellation")
                return True
            else:
                logger.warning(f"Attempted to cancel unknown run {run_id}")
                return False

    async def is_cancelled(self, run_id: str) -> bool:
        """Check if a run is cancelled."""
        async with self._lock:
            return self._cancelled_runs.get(run_id, False)

    async def cleanup_run(self, run_id: str) -> None:
        """Remove a run from tracking (called when run completes)."""
        async with self._lock:
            if run_id in self._cancelled_runs:
                del self._cancelled_runs[run_id]

    async def raise_if_cancelled(self, run_id: str) -> None:
        """Check if a run should be cancelled and raise exception if so."""
        if await self.is_cancelled(run_id):
            logger.info(f"Cancelling run {run_id}")
            raise RunCancelledException(f"Run {run_id} was cancelled")

    async def get_active_runs(self) -> Dict[str, bool]:
        """Get all currently tracked runs and their cancellation status."""
        async with self._lock:
            return self._cancelled_runs.copy()


class RedisRunCancellationManager(BaseRunCancellationManager):
    """Redis-based distributed cancellation manager for multi-worker deployments.

    Stores cancellation state in Redis, making it safe for use across
    multiple workers and servers.
    """

    # TTL for run state keys (1 hour - runs should complete before this)
    RUN_STATE_TTL = 3600

    def __init__(self, redis_client: Redis, namespace: str = "run_cancel"):
        """Initialize Redis cancellation manager.

        Args:
            redis_client: Async Redis client instance
            namespace: Namespace prefix for Redis keys
        """
        self._redis = redis_client
        self._namespace = namespace

    def _make_key(self, run_id: str) -> str:
        """Create namespaced Redis key for run ID.

        Args:
            run_id: Run identifier

        Returns:
            Namespaced Redis key
        """
        return f"{self._namespace}:{run_id}"

    async def register_run(self, run_id: str) -> None:
        """Register a new run as not cancelled."""
        try:
            key = self._make_key(run_id)
            # Set to "0" (not cancelled) with TTL
            await self._redis.setex(key, self.RUN_STATE_TTL, "0")
        except Exception as e:
            logger.error(
                f"Failed to register run {run_id} in Redis: {e}", exc_info=True
            )

    async def cancel_run(self, run_id: str) -> bool:
        """Cancel a run by marking it as cancelled.

        Returns:
            bool: True if run was found and cancelled, False if run not found.
        """
        try:
            key = self._make_key(run_id)
            # Check if key exists
            exists = await self._redis.exists(key)
            if exists:
                # Set to "1" (cancelled) and refresh TTL
                await self._redis.setex(key, self.RUN_STATE_TTL, "1")
                logger.info(f"Run {run_id} marked for cancellation")
                return True
            else:
                logger.warning(f"Attempted to cancel unknown run {run_id}")
                return False
        except Exception as e:
            logger.error(f"Failed to cancel run {run_id} in Redis: {e}", exc_info=True)
            return False

    async def is_cancelled(self, run_id: str) -> bool:
        """Check if a run is cancelled."""
        try:
            key = self._make_key(run_id)
            value = await self._redis.get(key)
            # Value is "1" if cancelled, "0" if active, None if not found
            return value == "1"
        except Exception as e:
            logger.error(
                f"Failed to check cancellation for run {run_id} in Redis: {e}",
                exc_info=True,
            )
            return False

    async def cleanup_run(self, run_id: str) -> None:
        """Remove a run from tracking (called when run completes)."""
        try:
            key = self._make_key(run_id)
            await self._redis.delete(key)
        except Exception as e:
            logger.error(
                f"Failed to cleanup run {run_id} in Redis: {e}", exc_info=True
            )

    async def raise_if_cancelled(self, run_id: str) -> None:
        """Check if a run should be cancelled and raise exception if so."""
        if await self.is_cancelled(run_id):
            logger.info(f"Cancelling run {run_id}")
            raise RunCancelledException(f"Run {run_id} was cancelled")

    async def get_active_runs(self) -> Dict[str, bool]:
        """Get all currently tracked runs and their cancellation status.

        Note: This can be expensive if many runs are active.
        """
        try:
            pattern = f"{self._namespace}:*"
            keys = await self._redis.keys(pattern)

            result = {}
            for key in keys:
                # Extract run_id from key
                run_id = key.split(":", 1)[1] if ":" in key else key
                value = await self._redis.get(key)
                result[run_id] = value == "1"  # True if cancelled

            return result
        except Exception as e:
            logger.error(f"Failed to get active runs from Redis: {e}", exc_info=True)
            return {}


# Initialize cancellation manager based on configuration
def _create_cancellation_manager() -> BaseRunCancellationManager:
    """Create cancellation manager based on Redis availability."""
    try:
        from ii_agent.core.config.ii_agent_config import config
        from ii_agent.server.cache import redis_client

        if config.redis_session_enabled:
            logger.info("Using Redis-based run cancellation manager")
            return RedisRunCancellationManager(redis_client=redis_client)
        else:
            logger.info("Using in-memory run cancellation manager")
            return MemoryRunCancellationManager()
    except Exception as e:
        logger.warning(
            f"Failed to initialize Redis cancellation manager, falling back to memory: {e}"
        )
        return MemoryRunCancellationManager()


# Global cancellation manager instance
_cancellation_manager = _create_cancellation_manager()



async def register_run(run_id: str) -> None:
    """Register a new run for cancellation tracking."""
    await _cancellation_manager.register_run(run_id)


async def cancel_run(run_id: str) -> bool:
    """Cancel a run."""
    return await _cancellation_manager.cancel_run(run_id)


async def is_cancelled(run_id: str) -> bool:
    """Check if a run is cancelled."""
    return await _cancellation_manager.is_cancelled(run_id)


async def cleanup_run(run_id: str) -> None:
    """Clean up cancellation tracking for a completed run."""
    await _cancellation_manager.cleanup_run(run_id)


async def raise_if_cancelled(run_id: str) -> None:
    """Check if a run should be cancelled and raise exception if so."""
    await _cancellation_manager.raise_if_cancelled(run_id)


async def get_active_runs() -> Dict[str, bool]:
    """Get all currently tracked runs and their cancellation status."""
    return await _cancellation_manager.get_active_runs()
