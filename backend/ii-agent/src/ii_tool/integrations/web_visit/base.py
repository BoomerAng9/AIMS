from abc import ABC, abstractmethod
from typing import List
from pydantic import BaseModel

from ii_tool.integrations.web_visit.config import CompressorConfig
from ii_tool.integrations.web_visit.compressor.context_compressor import ContextCompressor
from ii_tool.integrations.web_visit.compressor.embedding_compressor import EmbeddingCompressor
from ii_tool.integrations.web_visit.compressor.llm_compressor import LLMCompressor

class WebVisitError(Exception):
    """Base exception for web visit errors"""
    pass

class WebVisitResult(BaseModel):
    content: str
    cost: float

class BaseWebVisitClient(ABC):
    """Base interface for web visit clients."""

    def __init__(self, compressor_config: CompressorConfig):
        compressors = []
        for compressor_type in compressor_config.compress_types:
            if compressor_type == "llm" and compressor_config.llm_config:
                compressors.append(LLMCompressor(llm_config=compressor_config.llm_config))
            elif compressor_type == "embedding" and compressor_config.embedding_config:
                compressors.append(EmbeddingCompressor(compressor_config.embedding_config))
        self.context_compressor = ContextCompressor(
            compressors=compressors,
            max_output_words=compressor_config.max_output_words,
            max_input_words=compressor_config.max_input_words,
            chunk_size=compressor_config.chunk_size,
            chunk_overlap=compressor_config.chunk_overlap,
        )
    
    @abstractmethod
    async def extract(self, url: str) -> WebVisitResult:
        """Extract content from a webpage."""
        pass

    @abstractmethod
    async def extract_compress(self, url: str, query: str) -> WebVisitResult:
        """Extract content from a webpage and compress it."""
        pass

    @abstractmethod
    async def batch_extract_compress(self, urls: List[str], query: str) -> WebVisitResult:
        """Extract content from a webpage and compress it."""
        pass