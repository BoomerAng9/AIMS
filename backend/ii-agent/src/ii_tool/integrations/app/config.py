from pydantic_settings import BaseSettings, SettingsConfigDict
from ii_tool.integrations.image_generation import ImageGenerateConfig
from ii_tool.integrations.image_search import ImageSearchConfig
from ii_tool.integrations.video_generation import VideoGenerateConfig
from ii_tool.integrations.web_search import WebSearchConfig
from ii_tool.integrations.web_visit import WebVisitConfig, CompressorConfig
from ii_tool.integrations.database import DatabaseConfig
from ii_tool.integrations.storage import StorageConfig
from ii_tool.integrations.llm import LLMConfig


class ToolServerConfig(BaseSettings):
    database_url: str
    web_search_config: WebSearchConfig = WebSearchConfig()
    web_visit_config: WebVisitConfig = WebVisitConfig()
    image_search_config: ImageSearchConfig = ImageSearchConfig()
    video_generate_config: VideoGenerateConfig = VideoGenerateConfig()
    image_generate_config: ImageGenerateConfig = ImageGenerateConfig()
    database_config: DatabaseConfig = DatabaseConfig()
    compressor_config: CompressorConfig = CompressorConfig()
    storage_config: StorageConfig = StorageConfig()
    llm_config: LLMConfig = LLMConfig()

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

config = ToolServerConfig()
