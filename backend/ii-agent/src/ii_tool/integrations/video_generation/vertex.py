import asyncio
import time
import base64
import datetime
from google import genai
from google.genai import types
from google.cloud import storage
from typing import Literal
from .base import BaseVideoGenerationClient, VideoGenerationResult



VIDEO_MODEL_NAME = "veo-2.0-generate-001"


class VertexVideoGenerationClient(BaseVideoGenerationClient):
    """Vertex AI implementation of video generation client."""
    
    def __init__(
        self, 
        project_id: str, 
        location: str, 
        output_bucket: str,
        model_name: str = VIDEO_MODEL_NAME,
        result_expiration_seconds: int = 3600,
        blob_name_prefix: str = "tmp/video_generation",
    ):
        """
        Initialize Vertex AI client.
        
        Args:
            project_id: GCP project ID
            location: GCP location/region
            output_bucket: GCS bucket to store generated videos
            model_name: Name of the model to use for video generation
            result_expiration_seconds: Expiration time for the signed URL of the generated video
            blob_name_prefix: Prefix for the blob name of the generated image
        """
        
        self.project_id = project_id
        self.location = location
        self.output_bucket = output_bucket
        self.client = genai.Client(
            project=project_id,
            location=location,
            vertexai=True,
        )
        self.model_name = model_name
        self.bucket = storage.Client(project=project_id).bucket(output_bucket)
        self.result_expiration_seconds = result_expiration_seconds
        self.blob_name_prefix = blob_name_prefix
    
    async def generate_video(
        self,
        prompt: str,
        aspect_ratio: Literal["16:9", "9:16"] = "16:9",
        duration_seconds: int = 5,
        image_base64: str | None = None,
        image_mime_type: str | None = None,
    ) -> VideoGenerationResult:
        """Generate video from text prompt or/and image."""
        image = None
        if image_base64 and image_mime_type:
            image = types.Image(
                image_bytes=base64.b64decode(image_base64),
                mime_type=image_mime_type,
            )

        # submit the operation
        operation = await self.client.aio.models.generate_videos(
            model=self.model_name,
            image=image,
            prompt=prompt,
            config=types.GenerateVideosConfig(
                aspect_ratio=aspect_ratio,
                number_of_videos=1,
                duration_seconds=duration_seconds,
                output_gcs_uri=f"gs://{self.output_bucket}/{self.blob_name_prefix}",
            )
        )

        polling_interval_seconds = 5
        max_wait_time_seconds = 180
        elapsed_time = 0

        while not operation.done:
            if elapsed_time >= max_wait_time_seconds:
                raise TimeoutError(
                    f"Video generation timed out after {max_wait_time_seconds} seconds."
                )
            await asyncio.sleep(polling_interval_seconds)
            elapsed_time += polling_interval_seconds
            operation = self.client.operations.get(operation)

        # TODO: handle the case where there are no generated videos like ethics violation
        if  operation.result and operation.result.generated_videos and operation.result.generated_videos[0].video:
            video_uri = operation.result.generated_videos[0].video.uri
            _, blob_name = video_uri.replace("gs://", "").split("/", 1)

            return VideoGenerationResult(
                url=self._get_signed_url(blob_name),
                mime_type=self._get_video_mime_type(blob_name),
                size=self._get_video_size(blob_name),
                cost=0.5 * duration_seconds # $0.5 per second, https://cloud.google.com/vertex-ai/generative-ai/pricing
            )
        else:
            return VideoGenerationResult(
                url="No Video could be generated. This could be network issue or the image contain ethical violation.",
                mime_type="N/A",
                size=0,
                cost=0
            )

    def _get_signed_url(self, blob_name: str) -> str:
        blob = self.bucket.blob(blob_name)
        return blob.generate_signed_url(
            version="v4",
            expiration=datetime.timedelta(seconds=self.result_expiration_seconds),
            method="GET",
        )

    def _get_video_size(self, blob_name: str) -> int:
        blob = self.bucket.get_blob(blob_name)
        return blob.size

    def _get_video_mime_type(self, blob_name: str) -> str:
        blob = self.bucket.get_blob(blob_name)
        return blob.content_type