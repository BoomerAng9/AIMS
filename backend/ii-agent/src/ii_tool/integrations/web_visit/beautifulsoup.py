import asyncio
from typing import List
import aiohttp

from bs4 import BeautifulSoup

from ..utils import clean_soup, extract_title, get_text_from_soup
from .base import BaseWebVisitClient, WebVisitResult, WebVisitError
from .config import CompressorConfig


class BeautifulSoupWebVisitClient(BaseWebVisitClient):
    def __init__(self, compressor_config: CompressorConfig):
        if compressor_config:
            super().__init__(compressor_config)

    async def extract(self, url: str) -> WebVisitResult:
        """Extract content from a webpage using BeautifulSoup."""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(url, timeout=aiohttp.ClientTimeout(total=10)) as response:
                    response.raise_for_status()
                    html_content = await response.text()
                    encoding = response.charset or 'utf-8'

            soup = BeautifulSoup(html_content, "lxml", from_encoding=encoding)
            soup = clean_soup(soup)
            content = get_text_from_soup(soup)
            title = extract_title(soup)

            formatted_content = f"Title: {title}\n\nContent: {content}"

            return WebVisitResult(
                content=formatted_content,
                cost=0.0  # BeautifulSoup has no API cost
            )

        except Exception as e:
            raise WebVisitError(f"BeautifulSoup extraction error: {str(e)}")

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