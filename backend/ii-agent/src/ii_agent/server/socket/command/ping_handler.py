"""Handler for ping command."""

from typing import Dict, Any

from ii_agent.core.event import EventType, RealtimeEvent
from ii_agent.core.event_stream import EventStream
from ii_agent.server.models.sessions import SessionInfo
from ii_agent.server.socket.command.command_handler import (
    CommandHandler,
    UserCommandType,
)


class PingHandler(CommandHandler):
    """Handler for ping command."""

    def __init__(self, event_stream: EventStream) -> None:
        super().__init__(event_stream=event_stream)

    def get_command_type(self) -> UserCommandType:
        return UserCommandType.PING

    async def handle(self, content: Dict[str, Any], session_info: SessionInfo) -> None:
        """Handle ping message."""
        await self.send_event(
            RealtimeEvent(type=EventType.PONG, session_id=session_info.id, content={})
        )
