"""
Enhance prompt API endpoints.
"""

import logging
from fastapi import APIRouter
from pydantic import BaseModel
from ii_agent.integrations.enhance_prompt import create_enhance_prompt_client
from ii_agent.core.config.enhance_prompt_config import EnhancePromptConfig
from ii_agent.server.api.deps import CurrentUser

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/enhance-prompt", tags=["Enhance Prompt"])


class EnhancePromptRequest(BaseModel):
    prompt: str
    context: str | None = None


class EnhancePromptResponse(BaseModel):
    original_prompt: str
    enhanced_prompt: str
    reasoning: str | None = None


@router.post("", response_model=EnhancePromptResponse)
async def enhance_prompt(request: EnhancePromptRequest, current_user: CurrentUser):
    """Enhance a prompt for better AI responses."""
    enhance_prompt_config = EnhancePromptConfig()
    client = create_enhance_prompt_client(enhance_prompt_config)
    if not client:
        # If no client configured, return the original prompt
        return EnhancePromptResponse(
            original_prompt=request.prompt,
            enhanced_prompt=request.prompt,
            reasoning="No enhance prompt provider configured",
        )

    result = await client.enhance(request.prompt, request.context)
    return EnhancePromptResponse(
        original_prompt=result.original_prompt,
        enhanced_prompt=result.enhanced_prompt,
        reasoning=result.reasoning,
    )
