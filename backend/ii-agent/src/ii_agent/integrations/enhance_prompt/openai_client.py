import openai
from typing import Optional
from .base import EnhancePromptClient, EnhancedPromptResult


class OpenAIEnhancePromptClient(EnhancePromptClient):
    """OpenAI implementation for prompt enhancement."""
    
    SYSTEM_PROMPT = """You are a prompt enhancement assistant. Rewrite user requests into clear, actionable prompts that preserve their exact intent.

MUST FOLLOW THE RULES:
- Identify and articulate the core objective
- Add only the essential missing context
- Use precise, unambiguous language
- Maintain original scope - don't add features or complexity
- Do not add any features beyond the user request
- Do not mention tech-stack if it is not mentioned in the user request
- Do not mention any security-related information beyond the user request
- Do not add the  deliverables section if they do not appear on the user request

Output the enhanced prompt directly, no explanations.
"""
    
    def __init__(self, api_key: str, model: str = "gpt-5-mini", max_tokens: int = 4096):
        """
        Initialize the OpenAI enhance prompt client.
        
        Args:
            api_key: OpenAI API key
            model: OpenAI model to use (default: gpt-5-mini for efficiency)
            max_tokens: Maximum number of tokens to generate
        """
        self.client = openai.AsyncOpenAI(api_key=api_key)
        self.model = model
        self.max_tokens = max_tokens
    
    async def enhance(
        self, 
        prompt: str,
        context: Optional[str] = None
    ) -> EnhancedPromptResult:
        """
        Enhance a prompt using OpenAI.
        
        Args:
            prompt: The original prompt to enhance
            context: Optional context about the use case
            
        Returns:
            EnhancedPromptResult containing the enhanced prompt
        """
        user_message = prompt
        if context:
            user_message = f"Enhance this request into a detailed prompt: {prompt}\n\nAdditional context - {context}"
        else:
            user_message = f"Enhance this request into a detailed prompt: {prompt}"
        
        response = await self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": self.SYSTEM_PROMPT},
                {"role": "user", "content": user_message}
            ],
            max_completion_tokens=self.max_tokens,
            reasoning_effort="low",
            extra_body={"verbosity": "low"},
        )
        enhanced_prompt = response.choices[0].message.content.strip()
        
        return EnhancedPromptResult(
            original_prompt=prompt,
            enhanced_prompt=enhanced_prompt,
            reasoning=None
        )