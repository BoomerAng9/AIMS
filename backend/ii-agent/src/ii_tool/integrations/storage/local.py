"""Local filesystem storage provider implementation.

Fallback when GCS credentials are not configured.
Stores files under /.ii_agent/storage/ (Docker volume).
"""
import os
import aiohttp
import aiofiles
from typing import BinaryIO
from .base import BaseStorage


class LocalStorage(BaseStorage):
    """Local filesystem storage provider for development/fallback."""

    def __init__(self, base_path: str = "/.ii_agent/storage", public_base_url: str = ""):
        self.base_path = base_path
        self.public_base_url = public_base_url
        os.makedirs(self.base_path, exist_ok=True)

    def _full_path(self, path: str) -> str:
        full = os.path.join(self.base_path, path)
        os.makedirs(os.path.dirname(full), exist_ok=True)
        return full

    async def write(self, content: BinaryIO, path: str, content_type: str | None = None):
        """Write binary content to a local file."""
        full_path = self._full_path(path)
        content.seek(0)
        data = content.read()
        async with aiofiles.open(full_path, "wb") as f:
            await f.write(data)

    async def write_from_url(self, url: str, path: str, content_type: str | None = None):
        """Download from URL and save locally."""
        full_path = self._full_path(path)
        async with aiohttp.ClientSession() as session:
            async with session.get(url) as response:
                response.raise_for_status()
                data = await response.read()
                async with aiofiles.open(full_path, "wb") as f:
                    await f.write(data)

    async def write_from_local_path(self, local_path: str, target_path: str, content_type: str | None = None):
        """Copy a local file to storage path."""
        full_path = self._full_path(target_path)
        async with aiofiles.open(local_path, "rb") as src:
            data = await src.read()
        async with aiofiles.open(full_path, "wb") as dst:
            await dst.write(data)

    def get_public_url(self, path: str) -> str:
        if self.public_base_url:
            return f"{self.public_base_url}/{path}"
        return f"file://{self._full_path(path)}"
