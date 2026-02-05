"""Registry for command handlers."""

from typing import Dict

import socketio

from ii_agent.core.event_stream import AsyncEventStream
from ii_agent.server.socket.command.command_handler import (
    CommandHandler,
    UserCommandType,
)
from ii_agent.server.socket.command.query_handler import UserQueryHandler
from ii_agent.server.socket.command.publish_handler import PublishProjectHandler
from ii_agent.server.socket.command.sandbox_status_handler import (
    SandboxStatusHandler,
)
from ii_agent.server.socket.command.awake_sandbox_handler import AwakeSandboxHandler
from ii_agent.server.socket.command.workspace_info_handler import (
    WorkspaceInfoHandler,
)
from ii_agent.server.socket.command.ping_handler import PingHandler
from ii_agent.server.socket.command.cancel_handler import CancelHandler
from ii_agent.server.socket.command.enhance_prompt_handler import (
    EnhancePromptHandler,
)
from ii_agent.subscribers.database_subscriber import DatabaseSubscriber
from ii_agent.subscribers.metrics_subscriber import MetricsSubscriber
from ii_agent.subscribers.socketio_subscriber import SocketIOSubscriber


class CommandHandlerFactory:
    """Registry for managing command handlers."""

    def __init__(
        self,
        sio: socketio.AsyncServer,
    ) -> None:
        """Initialize the command handler registry with required dependencies.

        Args:
            config: Application configuration
            agent_service: Service for managing agents
            sandbox_service: Service for managing sandboxes
            session_service: Service for managing sessions
            file_store: Storage service for files
            sio: Socket.IO server instance
        """
        self._sio = sio
        self._handlers: Dict[UserCommandType, CommandHandler] = {}
        self._initialize_handlers()

    def _initialize_handlers(self) -> None:
        """Initialize all command handlers with their dependencies."""
        event_stream = AsyncEventStream()

        event_stream.subscribe(SocketIOSubscriber(self._sio))
        event_stream.subscribe(DatabaseSubscriber())
        event_stream.subscribe(MetricsSubscriber())

        self._handlers = {
            UserCommandType.QUERY: UserQueryHandler(
                event_stream=event_stream
            ),
            UserCommandType.SANDBOX_STATUS: SandboxStatusHandler(
                event_stream=event_stream
            ),
            UserCommandType.AWAKE_SANDBOX: AwakeSandboxHandler(
                event_stream=event_stream
            ),
            UserCommandType.WORKSPACE_INFO: WorkspaceInfoHandler(
                event_stream=event_stream
            ),
            UserCommandType.PING: PingHandler(event_stream=event_stream),
            UserCommandType.CANCEL: CancelHandler(
                event_stream=event_stream
            ),
            UserCommandType.ENHANCE_PROMPT: EnhancePromptHandler(
                event_stream=event_stream
            ),
            UserCommandType.PUBLISH_PROJECT: PublishProjectHandler(
                event_stream=event_stream
            ),
        }

    def get_handler(self, command_type: UserCommandType) -> CommandHandler | None:
        """Get handler for a specific command type."""
        return self._handlers.get(command_type)

    def get_handler_by_string(self, command_type_str: str) -> CommandHandler | None:
        """Get handler by command type string."""
        try:
            command_type = UserCommandType(command_type_str)
            return self.get_handler(command_type)
        except ValueError:
            return None
