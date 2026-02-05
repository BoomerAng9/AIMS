from typing import Optional
from .base import EnhancePromptClient
from .openai_client import OpenAIEnhancePromptClient
from ii_agent.core.config.enhance_prompt_config import EnhancePromptConfig


def create_enhance_prompt_client(config: EnhancePromptConfig) -> Optional[EnhancePromptClient]:
    """
    Factory function to create an enhance prompt client based on configuration.
    
    Args:
        config: EnhancePromptConfig containing the necessary settings
        
    Returns:
        An EnhancePromptClient instance or None if not configured
    """
    if config.openai_api_key:
        return OpenAIEnhancePromptClient(
            api_key=config.openai_api_key,
            model=config.model,
            max_tokens=config.max_tokens
        )
    
    return None