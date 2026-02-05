from .config import VideoGenerateConfig
from .base import BaseVideoGenerationClient
from .duckduckgo import DuckDuckGoVideoGenerationClient
from .vertex import VertexVideoGenerationClient


def create_video_generation_client(settings: VideoGenerateConfig) -> BaseVideoGenerationClient:
    """
    Factory function that creates a video generation client based on available configuration.
    """
    if settings.gcp_project_id and settings.gcp_location:
        print("Using Vertex AI for video generation")
        return VertexVideoGenerationClient(
            project_id=settings.gcp_project_id,
            location=settings.gcp_location,
            output_bucket=settings.gcs_output_bucket,
        )
    
    print("Falling back to DuckDuckGo video search for video requests")
    return DuckDuckGoVideoGenerationClient()
