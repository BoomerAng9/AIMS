from pydantic_settings import BaseSettings


class ImageSearchConfig(BaseSettings):
    serpapi_api_key: str | None = None

    max_results: int = 5

    class Config:
        env_prefix = "IMAGE_SEARCH_"
        env_file = ".env"
        extra = "ignore"