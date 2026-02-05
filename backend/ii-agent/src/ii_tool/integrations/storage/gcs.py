"""Google Cloud Storage provider implementation."""
import aiohttp
from typing import BinaryIO
from gcloud.aio.storage import Storage
from .base import BaseStorage


class GCS(BaseStorage):
    """Asynchronous Google Cloud Storage provider for file storage."""

    def __init__(self, project_id: str, bucket_name: str):
        # Note: In gcloud-aio, client creation is often managed with context managers
        # so we don't initialize a persistent client here.
        self.project_id = project_id
        self.bucket_name = bucket_name

    async def write(self, content: BinaryIO, path: str, content_type: str | None = None):
        """Asynchronously writes content to a GCS blob."""
        
        async with Storage() as client:
            # Reset file pointer to the beginning
            content.seek(0)
            
            # The upload method is now an awaitable coroutine
            await client.upload(
                self.bucket_name,
                path,  # This is the object/blob name
                content.read(),
                headers={'Content-Type': content_type} if content_type else None
            )

    async def write_from_url(self, url: str, path: str, content_type: str | None = None):
        """Asynchronously downloads a file from a URL and uploads it to GCS."""

        async with aiohttp.ClientSession() as session:
            async with session.get(url) as response:
                response.raise_for_status()
                response_content = await response.read()

                async with Storage() as client:
                    await client.upload(
                        self.bucket_name,
                        path,
                        response_content,
                        headers={'Content-Type': content_type} if content_type else None
                        )

    async def write_from_local_path(self, local_path: str, target_path: str, content_type: str | None = None):
        """Asynchronously reads a file from a local path and uploads it to GCS."""
        with open(local_path, 'rb') as file_content:
            content = file_content.read()
        
        async with Storage() as client:
            await client.upload(
                self.bucket_name,
                target_path,
                content,
                headers={'Content-Type': content_type} if content_type else None
            )

    def get_public_url(self, path: str) -> str:
        # NOTE: assume that the blob is already public
        return f"https://storage.googleapis.com/{self.bucket_name}/{path}"