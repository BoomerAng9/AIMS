"""Subscriber that tracks LLM metrics per session."""

from abc import ABC, abstractmethod
import logging

from anyio import Event
from ii_agent.core.event import EventType, RealtimeEvent
from ii_agent.db.agent import RunStatus
from ii_agent.db.manager import get_db_session_local
from ii_agent.server.services.agent_run_service import AgentRunService


logger = logging.getLogger(__name__)


class EventSubscriber(ABC):
    """Subscriber that handles metrics updates for sessions."""

    def __init__(self) -> None:
        pass

    @abstractmethod
    async def handle_event(self, event: RealtimeEvent) -> None:
        """Handle an event."""
        pass

    async def should_handle(self, event: RealtimeEvent) -> bool:
        if event.run_id is None or EventType.is_allowed_when_aborted(event.type):
            return True

        async with get_db_session_local() as db:
            task_run = await AgentRunService.get_task_by_id(db=db, task_id=event.run_id)
        if not task_run:
            raise ValueError(f"Task run not found for id: {event.run_id}")

        return task_run.status == RunStatus.RUNNING
