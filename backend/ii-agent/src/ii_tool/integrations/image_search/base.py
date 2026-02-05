from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

class ImageSearchResult(BaseModel):
    result: List[Dict[str, Any]]
    cost: float


class ImageSearchError(Exception):
    """Custom exception for image search errors."""
    pass


class BaseImageSearchClient(ABC):
    """Base interface for image search clients."""
    
    @abstractmethod
    async def search(self, query: str, **kwargs: Any) -> ImageSearchResult:
        pass