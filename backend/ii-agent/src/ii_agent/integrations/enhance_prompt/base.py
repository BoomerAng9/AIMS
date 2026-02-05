from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Optional


@dataclass
class EnhancedPromptResult:
    """Result of prompt enhancement."""
    original_prompt: str
    enhanced_prompt: str
    reasoning: Optional[str] = None


class EnhancePromptClient(ABC):
    """Abstract base class for prompt enhancement clients."""
    
    @abstractmethod
    async def enhance(
        self, 
        prompt: str,
        context: Optional[str] = None
    ) -> EnhancedPromptResult:
        """
        Enhance a prompt for better results.
        
        Args:
            prompt: The original prompt to enhance
            context: Optional context about the use case
            
        Returns:
            EnhancedPromptResult containing the enhanced prompt
        """
        pass