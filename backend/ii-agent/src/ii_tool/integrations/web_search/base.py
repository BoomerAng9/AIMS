from pydantic import BaseModel
from abc import ABC, abstractmethod
from typing import List, Dict


class WebSearchResult(BaseModel):
    result: List[Dict[str, str]]
    cost: float

class BaseWebSearchClient(ABC):
    """Base interface for web search clients."""
    
    @abstractmethod
    async def search(self, query: str, max_results: int = 10) -> WebSearchResult:
        pass

    @abstractmethod
    async def batch_search(self, queries: List[str], max_results: int = 10) -> List[WebSearchResult]:
        pass