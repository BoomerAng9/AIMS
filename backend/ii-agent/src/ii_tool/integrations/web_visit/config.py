from typing import List, Dict, Any, Literal
from pydantic_settings import BaseSettings


class WebVisitConfig(BaseSettings):
    firecrawl_api_key: str | None = None
    gemini_api_key: str | None = None
    jina_api_key: str | None = None
    tavily_api_key: str | None = None

    max_output_length: int = 40_000

    class Config:
        env_prefix = "WEB_VISIT_"
        env_file = ".env"
        extra = "ignore"
        

class CompressorConfig(BaseSettings):
    compress_types: List[Literal["llm", "embedding"]] = ["llm"]
    embedding_config: Dict[str, Any] | None = None
    llm_config: Dict[str, Any] | None = None
    max_output_words: int = 6500
    max_input_words: int = 32_000
    chunk_size: int = 1000
    chunk_overlap: int = 0
    similarity_threshold: float = 0.3
    
    class Config:
        env_prefix = "COMPRESSOR_"
        env_file = ".env"
        extra = "ignore"