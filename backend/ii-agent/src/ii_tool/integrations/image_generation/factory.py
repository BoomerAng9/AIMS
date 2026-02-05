from .config import ImageGenerateConfig
from .base import BaseImageGenerationClient
from .duckduckgo import DuckDuckGoImageGenerationClient
from .vertex import VertexImageGenerationClient


def create_image_generation_client(settings: ImageGenerateConfig) -> BaseImageGenerationClient:
    """Factory function that creates an image generation client based on available configuration."""
    if settings.gcp_project_id and settings.gcp_location:
        print("Using Vertex AI for image generation")
        return VertexImageGenerationClient(
            project_id=settings.gcp_project_id,
            location=settings.gcp_location,
            output_bucket=settings.gcs_output_bucket,
        )
    
    print("Falling back to DuckDuckGo image search for image generation")
    return DuckDuckGoImageGenerationClient()
