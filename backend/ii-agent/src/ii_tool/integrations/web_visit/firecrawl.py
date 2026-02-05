import asyncio
from typing import Any, List
import aiohttp

from .config import CompressorConfig
from .base import BaseWebVisitClient, WebVisitResult, WebVisitError


class FireCrawlWebVisitClient(BaseWebVisitClient):
    """FireCrawl implementation of web visit client."""
    
    def __init__(self, api_key: str, compressor_config: CompressorConfig):
        self.api_key = api_key
        self.base_url = "https://api.firecrawl.dev/v1/scrape"
        super().__init__(compressor_config)
        
        
    async def _firecrawl_credit_to_cost(self, firecrawl_credit: int) -> float:
        """Convert FireCrawl credit to cost."""
        return firecrawl_credit * 83 / 100000 # $83 per month ~ 100000 credits with standard price: https://www.firecrawl.dev/pricing


    async def _extract(self, url: str) -> dict[str, Any]:
        """Visit webpage and extract content using FireCrawl."""

        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}",
        }
        payload = {
            "url": url,
            "onlyMainContent": False,
            "formats": ["markdown"],
        }

        async with aiohttp.ClientSession() as session:
            async with session.post(
                self.base_url, headers=headers, json=payload,
            ) as response:
                response.raise_for_status()
                response_data = await response.json()

        data = response_data.get("data", {})
        return data
    
    async def extract(self, url: str) -> WebVisitResult:
        """Visit webpage and extract content using FireCrawl."""
        data = await self._extract(url)
        credits_used = data.get("metadata", {}).get("creditsUsed", 0)
        markdown = data.get("markdown", "")
        if markdown is None or (isinstance(markdown, str) and not markdown.strip()):
            raise WebVisitError(
                "No content could be extracted from webpage"
            )
        return WebVisitResult(
            content=markdown,
            cost=await self._firecrawl_credit_to_cost(credits_used),
        )
    
    async def extract_compress(self, url: str, query: str) -> WebVisitResult:
        """Visit webpage and extract content using FireCrawl."""
        data = await self._extract(url)
        raw_content = data.get("markdown", "")
        credits_used = data.get("metadata", {}).get("creditsUsed", 0)
        cost=await self._firecrawl_credit_to_cost(credits_used)

        compressed_content = await self.context_compressor.acompress(
            raw_content,
            title=data.get("title", ""),
            query=query,
        )
    
        return_str = ""
        if data.get("title"):
            return_str += f"Title: {data.get('title', '')}\n"
        return_str += f"URL: {url}\n"
        return_str += f"Content: {compressed_content}\n"
        return_str += "-----------------------------------\n"
        return WebVisitResult(
            content=return_str,
            cost=cost
        )
    
    async def batch_extract_compress(self, urls: List[str], query: str) -> WebVisitResult:
        """Visit webpage and extract content using FireCrawl."""
        tasks = [self.extract_compress(url, query) for url in urls]
        results = await asyncio.gather(*tasks)
        return WebVisitResult(
            content = "\n".join(result.content for result in results),
            cost = sum(result.cost for result in results)
        )