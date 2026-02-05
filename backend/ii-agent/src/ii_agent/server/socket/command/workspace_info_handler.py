"""Handler for workspace_info command."""

from typing import Dict, Any

from ii_agent.core.event import EventType, RealtimeEvent
from ii_agent.core.event_stream import EventStream
from ii_agent.server.models.sessions import SessionInfo
from ii_agent.server.socket.command.command_handler import (
    CommandHandler,
    UserCommandType,
)
from ii_agent.server.shared import config


class WorkspaceInfoHandler(CommandHandler):
    """Handler for workspace info command."""

    def __init__(self, event_stream: EventStream) -> None:
        """Initialize the workspace info handler with required dependencies.

        Args:
            event_stream: Event stream for publishing events
        """
        super().__init__(event_stream=event_stream)

    def get_command_type(self) -> UserCommandType:
        return UserCommandType.WORKSPACE_INFO

    async def handle(self, content: Dict[str, Any], session_info: SessionInfo) -> None:
        """Handle workspace info request."""
        # Get workspace path from configuration
        workspace_path = str(config.workspace_path)

        await self.send_event(
            RealtimeEvent(
                type=EventType.WORKSPACE_INFO,
                session_id=session_info.id,
                content={"path": workspace_path},
            )
        )
