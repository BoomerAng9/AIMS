from abc import ABC, abstractmethod
from typing import Any, Dict, List, Literal
from pydantic import BaseModel


class ImageGenerationResult(BaseModel):
    url: str
    mime_type: str
    size: int
    cost: float
    search_results: List[Dict[str, Any]] | None = None


class ImageGenerationError(Exception):
    """Custom exception for image generation errors."""
    pass


class BaseImageGenerationClient(ABC):
    """Base interface for image generation clients."""
    
    @abstractmethod
    async def generate_image(
        self,
        prompt: str,
        aspect_ratio: Literal["1:1", "16:9", "9:16", "4:3", "3:4"] = "1:1",
        **kwargs,
    ) -> ImageGenerationResult:
        """Generate an image based on the provided text prompt."""
        pass
