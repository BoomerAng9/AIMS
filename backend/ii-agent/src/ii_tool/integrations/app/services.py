"""This module contains the services for the tool server."""

from .config import config
from ii_tool.integrations.image_search import create_image_search_client, ImageSearchService
from ii_tool.integrations.web_visit import create_web_visit_client, create_all_web_visit_clients, WebVisitService
from ii_tool.integrations.video_generation import create_video_generation_client, VideoGenerationService
from ii_tool.integrations.storage import create_storage_client
from ii_tool.integrations.llm import LLMClient


storage = create_storage_client(
    config=config.storage_config,
)
llm_client: LLMClient | None = None
if config.llm_config and config.llm_config.openai_api_key:
    llm_client = LLMClient(config.llm_config)

image_search_client = create_image_search_client(config.image_search_config)
image_search_service = ImageSearchService(image_search_client, storage)

# Create all web visit clients in fallback order
web_visit_clients = create_all_web_visit_clients(config.web_visit_config, config.compressor_config)
researcher_visit_client = create_web_visit_client(config.web_visit_config, config.compressor_config, client_type="gemini")

web_visit_service = WebVisitService(
    web_visit_clients,  # Pass the list of clients
    researcher_visit_client,
    llm_client,
)

video_generation_client = create_video_generation_client(config.video_generate_config)
video_generation_service = VideoGenerationService(
    video_generation_client,
    llm_client,
    storage,
)

__all__ = ["image_search_service", "web_visit_service", "video_generation_service"]
