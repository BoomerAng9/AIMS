import asyncio
from typing import List
from ..logger import get_logger
from . import utils
from .base import BaseWebVisitClient, WebVisitResult, WebVisitError
from ii_tool.integrations.llm.client import LLMClient

logger = get_logger("ii_tool.web_visit.service")

class WebVisitService:
    def __init__(self, web_visit_clients: List[BaseWebVisitClient], researcher_visit_client: BaseWebVisitClient, llm_client: LLMClient | None):
        self.web_visit_clients = web_visit_clients  # List of clients in fallback order
        self.researcher_visit_client = researcher_visit_client
        self.llm_client = llm_client

    async def visit(self, url: str, prompt: str | None = None) -> WebVisitResult:
        # Try each client in order until one succeeds
        raw_content = None
        errors = []

        for client in self.web_visit_clients:
            logger.info(f"Using : {str(client)}")
            try:
                raw_content = await client.extract(url)
                break  # Success, exit the loop
            except (WebVisitError, Exception) as e:
                logger.warning(str(e))
                errors.append(e)
                # Continue to next client
                continue

        if raw_content is None:
            # All clients failed
            logger.error(str(errors))
            raise WebVisitError(f"All web visit clients failed. All errors: {errors}")

        cost = raw_content.cost
        final_content = f"URL: {url}\n"
        final_content += f"Content: {raw_content}\n"
        final_content += "-----------------------------------\n"
        if not prompt or not self.llm_client:
            return WebVisitResult(
                content=final_content,
                cost=cost,
            )

        # process the content with prompt
        formatted_prompt = utils.get_visit_webpage_prompt(raw_content.content, prompt)
        llm_processed = await self.llm_client.generate(formatted_prompt)
        llm_processed_content = llm_processed.content
        final_content = f"URL: {url}\n"
        final_content += f"Content: {llm_processed_content}\n"
        final_content += "-----------------------------------\n"
        llm_processed_cost = llm_processed.cost
        return WebVisitResult(
            content=final_content,
            cost=cost + llm_processed_cost,
        )

    async def batch_visit(self, urls: List[str], query: str) -> WebVisitResult:
        tasks = [self.visit(url, query) for url in urls]
        results = await asyncio.gather(*tasks)
        return WebVisitResult(
            content = "\n".join(result.content for result in results),
            cost=sum(result.cost for result in results)
        )

    async def researcher_visit(self, urls: List[str], query: str) -> WebVisitResult:
        return await self.researcher_visit_client.batch_extract_compress(urls, query)
