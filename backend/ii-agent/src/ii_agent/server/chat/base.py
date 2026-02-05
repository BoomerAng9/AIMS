"""Provider interface definitions matching research architecture."""

from abc import ABC, abstractmethod

from typing import (
    AsyncIterator,
    List,
    Optional,
    Dict,
    Any,
)
from ii_agent.server.chat.message_service import Message
from ii_agent.server.chat.models import RunResponseEvent, RunResponseOutput


class LLMClient(ABC):
    """Abstract provider client interface."""

    async def upload_files(
        self,
        user_message: Message,
    ) -> Dict[str, List[str]]:
        """
        Upload files attached to a user message to the provider's API if needed.

        Args:
            user_message: The user message that may contain file attachments
            session_id: Optional session identifier for provider-specific grouping
            container_id: Optional provider container identifier to target

        Returns:
            Dict mapping message_id to list of provider-specific file IDs.
            Empty dict if provider doesn't support file uploads or no files provided.
        """
        return {}

    async def get_or_create_container(self, session_id: str) -> Optional[str]:
        """Ensure code interpreter container exists when provider supports it."""
        return None

    @abstractmethod
    async def send(
        self,
        messages: List[Message],
        tools: Optional[List[Any]] = None,
        provider_options: Optional[Dict[str, Any]] = None,
    ) -> RunResponseOutput:
        """
        Send messages and get complete response.

        Args:
            messages: List of Message objects
            tools: Optional list of tool definitions (OpenAI function format)
                   Expected format for each tool:
                   {
                       "type": "function",
                       "function": {
                           "name": str,
                           "description": str,
                           "parameters": dict (JSON schema)
                       }
                   }

            provider_options: Optional provider-specific options.
                Format: {"anthropic": {"container": {"skills": [...]}}, "openai": {...}}
                Example for Anthropic skills:
                {
                    "anthropic": {
                        "container": {
                            "id": "container_123",  # optional, for reuse
                            "skills": [
                                {"type": "anthropic", "skill_id": "pptx", "version": "latest"}
                            ]
                        }
                    }
                }
        """
        pass

    @abstractmethod
    async def stream(
        self,
        messages: List[Message],
        tools: Optional[List[Any]] = None,
        is_code_interpreter_enabled: bool = False,
        session_id: Optional[str] = None,
        provider_options: Optional[Dict[str, Any]] = None,
    ) -> AsyncIterator[RunResponseEvent]:
        """
        Stream response events.

        Args:
            messages: List of Message objects
            tools: Optional list of tool definitions (OpenAI function format)
                   Each provider converts this to their native format.
            is_code_interpreter_enabled: Whether code interpreter is enabled (OpenAI only)
            session_id: Session ID for container management (OpenAI only)
            provider_options: Optional provider-specific options.
               Format: {"anthropic": {"container": {"skills": [...]}}, "openai": {...}}
               Example for Anthropic skills:
               {
                   "anthropic": {
                       "container": {
                           "id": "container_123",  # optional, for reuse
                           "skills": [
                               {"type": "anthropic", "skill_id": "pptx", "version": "latest"}
                           ]
                       }
                   }
               }

        """
        pass

    @abstractmethod
    def model(self) -> Dict[str, Any]:
        """Get model metadata."""
        pass
