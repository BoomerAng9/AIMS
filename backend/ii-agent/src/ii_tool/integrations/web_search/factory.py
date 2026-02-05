from .base import BaseWebSearchClient
from .serpapi import SerpAPIWebSearchClient
from .duckduckgo import DuckDuckGoWebSearchClient
from .config import WebSearchConfig


def create_web_search_client(settings: WebSearchConfig) -> BaseWebSearchClient:
    """
    Factory function that creates a web search client based on available API keys.
    Priority order: SerpAPI > Jina > Tavily > DuckDuckGo

    Args:
        settings: Settings object containing API keys

    Returns:
        BaseWebSearchClient: An instance of a web search client
    """
    serpapi_key = settings.serpapi_api_key

    if serpapi_key:
        print("Using SerpAPI to search")
        return SerpAPIWebSearchClient(api_key=serpapi_key)

    print("Using DuckDuckGo to search")
    return DuckDuckGoWebSearchClient()
