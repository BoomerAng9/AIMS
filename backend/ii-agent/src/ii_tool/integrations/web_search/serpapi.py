import urllib.parse
import aiohttp
import asyncio
from typing import List, Dict
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
from .base import BaseWebSearchClient, WebSearchResult
from .exception import (
    WebSearchExhaustedError, 
    WebSearchProviderError, 
    WebSearchNetworkError
)

_DEFAULT_TIMEOUT = 15


class SerpAPIWebSearchClient(BaseWebSearchClient):
    """SerpAPI implementation of web search client."""
    
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://serpapi.com/search.json"

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=1, max=8),
        retry=retry_if_exception_type((WebSearchProviderError, WebSearchNetworkError))
    )
    async def search(self, query: str, max_results: int = 10) -> WebSearchResult:
        params = {
            "q": query,
            "api_key": self.api_key,
            "num": min(max_results, 100),
        }
        encoded_url = f"{self.base_url}?{urllib.parse.urlencode(params)}"
        
        try:
            async with aiohttp.ClientSession(
                timeout=aiohttp.ClientTimeout(total=_DEFAULT_TIMEOUT)
            ) as session:
                async with session.get(encoded_url) as response:
                    # Rate limit / quota exceeded
                    if response.status == 429:
                        raise WebSearchExhaustedError("SerpAPI rate limit reached or quota exceeded")
                    
                    # Server errors - temporary, can retry
                    if response.status >= 500:
                        raise WebSearchProviderError("SerpAPI server error")
                    
                    response.raise_for_status()
                    response_data = await response.json()
        
        except asyncio.TimeoutError:
            raise WebSearchNetworkError("SerpAPI request timeout")
        except aiohttp.ClientError:
            raise WebSearchNetworkError("SerpAPI network connection error")
        
        results = response_data.get("organic_results", [])

        search_response = [
            {
                "query": query,
                "title": result.get("title", ""),
                "url": result.get("link", ""),
                "content": result.get("snippet", "")
            }
            for result in results
        ]

        return WebSearchResult(
            result=search_response,
            cost=275 / 30_000, # $275 per month ~ 30,000 queries with BIG DATA: https://serpapi.com/pricing
        )
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=1, max=8),
        retry=retry_if_exception_type((WebSearchProviderError, WebSearchNetworkError))
    )
    async def batch_search(self, queries: List[str], max_results: int = 6) -> List[WebSearchResult]:
        tasks = [self.search(query, max_results) for query in queries]
        results = await asyncio.gather(*tasks)
        return results
        
        