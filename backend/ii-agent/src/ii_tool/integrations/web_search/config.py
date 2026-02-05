from pydantic_settings import BaseSettings


class WebSearchConfig(BaseSettings):
    firecrawl_api_key: str | None = None
    serpapi_api_key: str | None = None
    jina_api_key: str | None = None
    tavily_api_key: str | None = None

    max_results: int = 5
    
    class Config:
        env_prefix = "WEB_SEARCH_"
        env_file = ".env"
        extra = "ignore"