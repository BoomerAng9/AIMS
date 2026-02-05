"""Handler for enhance_prompt command."""

from typing import Dict, Any, Optional

from pydantic import ValidationError

from ii_agent.core.config.ii_agent_config import IIAgentConfig
from ii_agent.core.event import EventType, RealtimeEvent
from ii_agent.core.event_stream import EventStream
from ii_agent.core.storage.settings.file_settings_store import FileSettingsStore
from ii_agent.llm import get_client
from ii_agent.server.models.messages import EnhancePromptContent
from ii_agent.server.models.sessions import SessionInfo
from ii_agent.server.socket.command.command_handler import (
    CommandHandler,
    UserCommandType,
)
from ii_agent.server.shared import config
from ii_agent.utils.prompt_generator import enhance_user_prompt


class EnhancePromptHandler(CommandHandler):
    """Handler for enhance_prompt command."""

    def __init__(self, event_stream: EventStream) -> None:
        """Initialize the enhance prompt handler with required dependencies.

        Args:
            event_stream: Event stream for publishing events
            config: Application configuration
        """
        super().__init__(event_stream=event_stream)

    def get_command_type(self) -> UserCommandType:
        return UserCommandType.ENHANCE_PROMPT

    async def handle(self, content: Dict[str, Any], session_info: SessionInfo) -> None:
        """Handle prompt enhancement request."""
        try:
            enhance_content = EnhancePromptContent(**content)

            # Create LLM client
            user_id: Optional[str] = None  # TODO: Get actual user ID from session
            settings_store = await FileSettingsStore.get_instance(config, user_id)
            settings = await settings_store.load()

            if not settings:
                raise ValueError("Settings not found for user")

            # TODO: what model should be used for enhancement?
            llm_config = settings.llm_configs.get(enhance_content.model_name)
            if not llm_config:
                raise ValueError(
                    f"LLM config not found for model: {enhance_content.model_name}"
                )

            client = get_client(llm_config)

            # Enhance the prompt
            success, message, enhanced_prompt = await enhance_user_prompt(
                client=client,
                user_input=enhance_content.text,
                files=enhance_content.files,
            )

            if success and enhanced_prompt:
                await self.send_event(
                    RealtimeEvent(
                        type=EventType.PROMPT_GENERATED,
                        session_id=session_info.id,
                        content={
                            "result": enhanced_prompt,
                            "original_request": enhance_content.text,
                        },
                    )
                )
            else:
                await self._send_error_event(str(session_info.id), message=message)

        except ValidationError as e:
            await self._send_error_event(
                str(session_info.id),
                message=f"Invalid enhance_prompt content: {str(e)}",
                error_type="validation_error",
            )
