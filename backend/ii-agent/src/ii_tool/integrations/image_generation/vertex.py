import asyncio
import datetime

from google.cloud import storage
from typing import Literal
from vertexai.preview.vision_models import ImageGenerationModel
from .base import BaseImageGenerationClient, ImageGenerationResult


IMAGE_MODEL_NAME = "imagen-4.0-generate-001"


class VertexImageGenerationClient(BaseImageGenerationClient):
    """Vertex AI implementation of image generation client."""
    
    def __init__(
        self, 
        project_id: str, 
        location: str, 
        output_bucket: str,
        model_name: str = IMAGE_MODEL_NAME,
        result_expiration_seconds: int = 3600,
        blob_name_prefix: str = "tmp/image_generation",
    ):
        """
        Initialize Vertex AI client.
        
        Args:
            project_id: GCP project ID
            location: GCP location/region
            output_bucket: GCS bucket to store generated images
            model_name: Name of the model to use for image generation
            result_expiration_seconds: Expiration time for the signed URL of the generated image
            blob_name_prefix: Prefix for the blob name of the generated image
        """
        
        self.project_id = project_id
        self.location = location
        self.output_bucket = output_bucket
        self.model = ImageGenerationModel.from_pretrained(model_name)
        self.bucket = storage.Client(project=project_id).bucket(output_bucket)
        self.result_expiration_seconds = result_expiration_seconds
        self.blob_name_prefix = blob_name_prefix

    async def generate_image(
        self,
        prompt: str,
        aspect_ratio: Literal["1:1", "16:9", "9:16", "4:3", "3:4"] = "1:1",
    ) -> ImageGenerationResult:
        """Generate image using Vertex AI API."""
        
        generate_params = {
            "number_of_images": 1,
            "language": "en",
            "aspect_ratio": aspect_ratio,
            "person_generation": "allow_all",
            "output_gcs_uri": f"gs://{self.output_bucket}/{self.blob_name_prefix}",
        }
        
        result = await asyncio.to_thread(
            self.model.generate_images,
            prompt=prompt,
            **generate_params
        )

        
        image_uri = result.images[0]._gcs_uri
        _, blob_name = image_uri.replace("gs://", "").split("/", 1)

        return ImageGenerationResult(
            url=self._get_signed_url(blob_name),
            mime_type=self._get_image_mime_type(blob_name),
            size=self._get_image_size(blob_name),
            cost=0.04 # $0.04 per image generation, https://cloud.google.com/vertex-ai/generative-ai/pricing#imagen-models
        )

    def _get_signed_url(self, blob_name: str) -> str:
        blob = self.bucket.blob(blob_name)
        return blob.generate_signed_url(
            version="v4",
            expiration=datetime.timedelta(seconds=self.result_expiration_seconds),
            method="GET",
        )

    def _get_image_size(self, blob_name: str) -> int:
        blob = self.bucket.get_blob(blob_name)
        return blob.size

    def _get_image_mime_type(self, blob_name: str) -> str:
        blob = self.bucket.get_blob(blob_name)
        return blob.content_type