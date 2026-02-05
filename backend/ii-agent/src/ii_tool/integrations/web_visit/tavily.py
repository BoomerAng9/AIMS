import os
import asyncio
from typing import List, Optional

from tavily import TavilyClient

from ..utils import extract_title
from .base import BaseWebVisitClient, WebVisitResult, WebVisitError
from .config import CompressorConfig


class TavilyWebVisitClient(BaseWebVisitClient):
    def __init__(self, api_key: str, compressor_config: CompressorConfig):
        if compressor_config:
            super().__init__(compressor_config)
        self.api_key = api_key
        self.tavily_client = TavilyClient(api_key=self.api_key)

    async def extract(self, url: str) -> WebVisitResult:
        """Extract content from a webpage using Tavily."""
        try:
            response = await asyncio.to_thread(self.tavily_client.extract, urls=[url])
            if response["failed_results"]:
                raise WebVisitError(f"Tavily failed to extract content from {url}")

            # Since only a single link is provided to tavily_client, the results will contain only one entry.
            content = response["results"][0]["raw_content"]
            title = response["results"][0].get("title", "")

            formatted_content = f"Title: {title}\n\nContent: {content}"

            return WebVisitResult(
                content=formatted_content,
                cost=0.0  # Tavily cost calculation can be added here if needed
            )

        except Exception as e:
            raise WebVisitError(f"Tavily extraction error: {str(e)}")

    async def extract_compress(self, url: str, query: str) -> WebVisitResult:
        """Extract and compress content from a webpage."""
        result = await self.extract(url)
        if hasattr(self, 'context_compressor'):
            compressed_content = await self.context_compressor.acompress(
                result.content,
                title="",
                query=query,
            )
            result.content = compressed_content
        return result

    async def batch_extract_compress(self, urls: List[str], query: str) -> WebVisitResult:
        """Extract and compress content from multiple webpages."""
        tasks = [self.extract_compress(url, query) for url in urls]
        results = await asyncio.gather(*tasks)
        return WebVisitResult(
            content="\n".join(result.content for result in results),
            cost=sum(result.cost for result in results)
        )