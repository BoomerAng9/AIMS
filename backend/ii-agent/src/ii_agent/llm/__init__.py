from ii_agent.core.config.llm_config import APITypes, LLMConfig
from ii_agent.llm.base import LLMClient
from ii_agent.llm.openai import OpenAIDirectClient, OpenAIResponsesClient
from ii_agent.llm.anthropic import AnthropicDirectClient
from ii_agent.llm.gemini import GeminiDirectClient
from ii_agent.utils.constants import is_gpt5_family


def get_client(config: LLMConfig) -> LLMClient:
    """Get a client for a given client name."""
    if config.api_type == APITypes.ANTHROPIC:
        return AnthropicDirectClient(
            llm_config=config,
        )
    elif config.api_type == APITypes.OPENAI:
        if is_gpt5_family(config.model):
            return OpenAIResponsesClient(llm_config=config)
        else:
            return OpenAIDirectClient(llm_config=config)
    elif config.api_type == APITypes.GEMINI:
        return GeminiDirectClient(llm_config=config)
    elif config.api_type == APITypes.CUSTOM:
        return OpenAIDirectClient(llm_config=config)


__all__ = [
    "LLMClient",
    "OpenAIDirectClient",
    "OpenAIResponsesClient",
    "AnthropicDirectClient",
    "GeminiDirectClient",
    "get_client",
]
