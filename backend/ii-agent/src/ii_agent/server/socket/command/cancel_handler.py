"""Handler for cancel command."""

import logging
from typing import Dict, Any

from sqlalchemy.orm.exc import StaleDataError

from ii_agent.core.event import AgentStatus, EventType, RealtimeEvent
from ii_agent.core.event_stream import EventStream
from ii_agent.core.pubsub import RedisPubSub
from ii_agent.db.agent import AgentRunTask, RunStatus
from ii_agent.db.manager import get_db_session_local
from ii_agent.server.services.agent_run_service import AgentRunService
from ii_agent.server.models.sessions import SessionInfo
from ii_agent.server.cache import entity_cache
from ii_agent.server.socket.command.command_handler import (
    CommandHandler,
    UserCommandType,
)

logger = logging.getLogger(__name__)


class CancelHandler(CommandHandler):
    """Handler for cancel command."""

    def __init__(self, event_stream: EventStream) -> None:
        super().__init__(event_stream=event_stream)

    def get_command_type(self) -> UserCommandType:
        return UserCommandType.CANCEL

    async def handle(self, content: Dict[str, Any], session: SessionInfo) -> None:
        # Use async cancel to publish interruption via Redis pub/sub
        try:
            async with get_db_session_local() as db:
                run_status: (
                    AgentRunTask | None
                ) = await AgentRunTask.find_last_by_session_id_and_status(
                    db=db, session_id=session.id, status=RunStatus.RUNNING
                )
                if not run_status:
                    await self._send_error_event(
                        session.id, message="Task Run not found"
                    )
                    return

                if not run_status.is_running():
                    logger.info(
                        f"Cancel requested for non-running task {run_status.id} "
                        f"in status {run_status.status}, no action taken."
                    )
                    return

                updated_task = await AgentRunService.update_task_status(
                    db=db, task_id=run_status.id, status=RunStatus.ABORTED
                )

                await db.commit()

            if not updated_task:
                await self._send_error_event(
                    session.id,
                    message="Failed to update task status",
                    run_id=run_status.id,
                )
                return

            _cached_key = f"agent_task:{str(updated_task.id)}"

            await entity_cache.evict(_cached_key)

            await self.send_event(
                RealtimeEvent(
                    type=EventType.STATUS_UPDATE,
                    session_id=session.id,
                    run_id=updated_task.id,
                    content={"status": AgentStatus.CANCELLED},
                )
            )

        except StaleDataError:
            # Handle optimistic locking conflict
            await self._send_error_event(
                session.id,
                message="Task status was updated. Please try again.",
                error_type="state_conflict",
            )
            return
