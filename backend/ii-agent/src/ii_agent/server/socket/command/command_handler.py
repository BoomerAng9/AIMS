from abc import ABC, abstractmethod
from enum import Enum
from typing import Dict, Any
import uuid

from ii_agent.core.event import EventType, RealtimeEvent
from ii_agent.core.event_stream import EventStream
from ii_agent.server.models.sessions import SessionInfo


class UserCommandType(str, Enum):
    INIT_AGENT = "init_agent"
    QUERY = "query"
    WORKSPACE_INFO = "workspace_info"
    AWAKE_SANDBOX = "awake_sandbox"
    SANDBOX_STATUS = "sandbox_status"
    PING = "ping"
    CANCEL = "cancel"
    ENHANCE_PROMPT = "enhance_prompt"
    PUBLISH_PROJECT = "publish"


class CommandHandler(ABC):
    """Base class for command handlers."""

    def __init__(self, event_stream: EventStream) -> None:
        self.event_stream = event_stream

    @abstractmethod
    def get_command_type(self) -> UserCommandType:
        """Return the command type this handler processes."""
        pass

    @abstractmethod
    async def handle(self, content: Dict[str, Any], session_info: SessionInfo) -> None:
        """Handle the command with the given content and session.

        Args:
            content: Command content dictionary
            session: Session information
        """
        pass

    async def send_event(self, event: RealtimeEvent) -> None:
        await self.event_stream.publish(event)

    def get_event_stream(self) -> EventStream:
        return self.event_stream

    async def _send_error_event(
        self,
        session_id: str | uuid.UUID,
        message: str,
        error_type: str = "error",
        run_id: uuid.UUID = None,
    ) -> None:
        """Send error event to the session.

        Args:
            session_id: ID of the session to send the error to
            message: Error message to display
            error_type: Type of error for frontend handling
        """

        session_uuid = (
            uuid.UUID(session_id) if isinstance(session_id, str) else session_id
        )

        await self.send_event(
            RealtimeEvent(
                session_id=session_uuid,
                run_id=run_id,
                type=EventType.ERROR,
                content={
                    "message": message,
                    "error_type": error_type,
                },
            )
        )

    async def _send_event(
        self,
        session_id: str | uuid.UUID,
        message: str,
        event_type: EventType,
        run_id: uuid.UUID = None,
        **kwargs,
    ) -> None:
        """Send success event to the session.

        Args:
            session_id: ID of the session to send the event to
            message: Success message to display
            event_type: Type of event (default: "system")
            **kwargs: Additional content to include in the event
        """
        content = {"message": message}
        content.update(kwargs)

        session_uuid = (
            uuid.UUID(session_id) if isinstance(session_id, str) else session_id
        )

        await self.send_event(
            RealtimeEvent(
                session_id=session_uuid,
                run_id=run_id,
                type=event_type,
                content=content,
            )
        )
