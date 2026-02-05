"""Factory for creating LLM providers (updated for official SDKs)."""

import logging
from typing import Type

from ii_agent.core.config.llm_config import APITypes, LLMConfig
from ii_agent.server.chat.llm.custom import CustomProvider
from ii_agent.server.chat.base import LLMClient
from ii_agent.server.chat.llm.anthropic import AnthropicProvider
from ii_agent.server.chat.llm.openai import OpenAIProvider
from ii_agent.server.chat.llm.gemini import GeminiProvider

logger = logging.getLogger(__name__)


class LLMProviderFactory:
    """Factory for creating provider-specific LLM clients using official SDKs."""

    # Registry mapping API types to provider classes
    _provider_registry: dict[APITypes, Type[LLMClient]] = {
        APITypes.ANTHROPIC: AnthropicProvider,
        APITypes.OPENAI: OpenAIProvider,
        APITypes.GEMINI: GeminiProvider,
        APITypes.CUSTOM: CustomProvider,
    }

    @classmethod
    def create_provider(cls, llm_config: LLMConfig) -> LLMClient:
        """
        Create appropriate provider based on API type.

        Args:
            llm_config: LLM configuration with API type

        Returns:
            Provider instance using official SDK

        Raises:
            ValueError: If API type not supported
        """
        api_type = llm_config.api_type

        provider_class = cls._provider_registry.get(api_type)

        if not provider_class:
            supported_types = ", ".join(t.value for t in cls._provider_registry.keys())
            raise ValueError(
                f"Unsupported API type: {api_type.value}. "
                f"Supported types: {supported_types}"
            )

        logger.info(
            f"Creating {provider_class.__name__} for model: {llm_config.model} "
            f"(API type: {api_type.value})"
        )

        cls = provider_class

        if (
            api_type == APITypes.OPENAI and llm_config.base_url is not None
        ):  # NOTE: fix backwards compatibility
            cls = CustomProvider
        return cls(llm_config)

    @classmethod
    def register_provider(
        cls,
        api_type: APITypes,
        provider_class: Type[LLMClient],
    ) -> None:
        """
        Register a new provider implementation.

        This allows extending the factory with custom providers at runtime.

        Args:
            api_type: API type enum value
            provider_class: Provider class to register

        Example:
            ```python
            class CustomProvider(ProviderClient):
                ...

            LLMProviderFactory.register_provider(
                APITypes.CUSTOM,
                CustomProvider
            )
            ```
        """
        logger.info(
            f"Registering provider {provider_class.__name__} for {api_type.value}"
        )
        cls._provider_registry[api_type] = provider_class

    @classmethod
    def get_supported_providers(cls) -> list[str]:
        """
        Get list of supported provider API types.

        Returns:
            List of supported API type values
        """
        return [api_type.value for api_type in cls._provider_registry.keys()]
