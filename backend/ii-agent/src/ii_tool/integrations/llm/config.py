from typing import Literal
from pydantic_settings import BaseSettings


class LLMConfig(BaseSettings):
    openai_api_key: str | None = None
    openai_base_url: str | None = None
    openai_model: Literal["gpt-5-mini", "gpt-4.1-mini"] = "gpt-5-mini"
