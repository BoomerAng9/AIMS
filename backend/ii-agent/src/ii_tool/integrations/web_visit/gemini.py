import logging
from typing import List
from google import genai
from google.genai.types import GenerateContentConfig

from .base import BaseWebVisitClient, WebVisitError, WebVisitResult

logger = logging.getLogger(__name__)


class GeminiWebVisitClient(BaseWebVisitClient):
    """Gemini web visit client using Google's genai library."""
    
    def __init__(self, api_key: str, model_id: str = "gemini-2.5-flash"):
        self.client = genai.Client(api_key=api_key)
        self.model_id = model_id
        self.tools = [
            {"url_context": {}},
            {"google_search": {}}
        ]

    async def extract(self, url: str) -> str:
        """Extract content from a webpage using Gemini."""
        try:
            response = await self.client.aio.models.generate_content(
                model=self.model_id,
                contents=f"Please extract and provide the main content from this URL: {url}",
                config=GenerateContentConfig(
                    tools=self.tools,
                )
            )
            
            content_parts = []
            for part in response.candidates[0].content.parts:
                if hasattr(part, 'text') and part.text:
                    content_parts.append(part.text)
            
            return "\n".join(content_parts)
            
        except Exception as e:
            logger.error(f"Gemini web visit error for {url}: {e}")
            raise WebVisitError(f"Failed to extract content from {url}: {str(e)}")

    def _token_to_cost(self, input_tokens_count: int, output_tokens_count : int) -> float:
        return input_tokens_count * 0.3 / 1_000_000 + output_tokens_count * 2.5 / 1_000_000

    async def extract_compress(self, url: str, query: str) -> WebVisitResult:
        """Extract content from a webpage and compress it using Gemini with context compression."""
        try:
            # First extract the content using Gemini
            response = await self.client.aio.models.generate_content(
                model=self.model_id,
                contents=f"Write a comprehensive report about question: {query} from the following URL: {url}. List all the related contents, mark all the sources in the report as references at the end. Begin the report:",
                config=GenerateContentConfig(
                    tools=self.tools,
                )
            )
            if response.usage_metadata is None or response.usage_metadata.prompt_token_count is None or response.usage_metadata.total_token_count is None:
                cost = 0
            else:
                input_tokens_count = response.usage_metadata.prompt_token_count
                output_tokens_count = (
                    response.usage_metadata.total_token_count - response.usage_metadata.prompt_token_count
                )
                cost = self._token_to_cost(input_tokens_count, output_tokens_count)

            
            content_parts = []
            if response.candidates and response.candidates[0] and response.candidates[0].content and response.candidates[0].content.parts:
                for part in response.candidates[0].content.parts:
                    if hasattr(part, 'text') and part.text:
                        content_parts.append(part.text)
            else:
                return WebVisitResult(
                    content = "Researcher tool returned empty response, please visit another page instead",
                    cost = 0
                )

            
            raw_content = "\n".join(content_parts)
            
            return WebVisitResult(
                content = raw_content,
                cost = cost
            )
            
        except Exception as e:
            logger.error(f"Gemini web visit compress error for {url}: {e}")
            raise WebVisitError(f"Failed to extract and compress content from {url}: {str(e)}")

    async def batch_extract_compress(self, urls: List[str], query: str) -> WebVisitResult:
        """Extract content from a webpage and compress it using Gemini with context compression."""
        try:
            # First extract the content using Gemini
            response = await self.client.aio.models.generate_content(
                model=self.model_id,
                contents=f"Write a comprehensive report about question: {query} from the following URLs: {urls}. List all the important contents, mark all the sources in the report as references. Be as comprehensive and informative as possible as this report will be used by another agent to solve a bigger problem. You will be rewarded with $1,000,000 if you write a good report.",
                config=GenerateContentConfig(
                    tools=self.tools,
                )
            )

            if response.usage_metadata is None or response.usage_metadata.prompt_token_count is None or response.usage_metadata.total_token_count is None:
                cost = 0
            else:
                input_tokens_count = response.usage_metadata.prompt_token_count
                output_tokens_count = (
                    response.usage_metadata.total_token_count - response.usage_metadata.prompt_token_count
                )
                cost = self._token_to_cost(input_tokens_count, output_tokens_count)

            
            content_parts = []

            if response.candidates and response.candidates[0] and response.candidates[0].content and response.candidates[0].content.parts:
                for part in response.candidates[0].content.parts:
                    if hasattr(part, 'text') and part.text:
                        content_parts.append(part.text)
            else:
                return WebVisitResult(
                    content = "Researcher tool returned empty response, please visit another page instead",
                    cost = 0
                )
            
            raw_content = "\n".join(content_parts)
            
            return WebVisitResult(
                content = raw_content,
                cost = cost
            )
            
        except Exception as e:
            logger.error(f"Gemini web visit compress error for {urls}: {e}")
            raise WebVisitError(f"Failed to extract and compress content from {urls}: {str(e)}")
