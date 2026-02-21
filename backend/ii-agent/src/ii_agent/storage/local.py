import shutil
from typing import BinaryIO
from pathlib import Path
from ii_agent.storage.base import BaseStorage


class LocalStorage(BaseStorage):
    def __init__(self, base_path: str = "/tmp/ii_agent_files"):
        self.base_path = Path(base_path)
        self.base_path.mkdir(parents=True, exist_ok=True)

    def _full_path(self, path: str) -> Path:
        return self.base_path / path.lstrip("/")

    def write(self, content: BinaryIO, path: str, content_type=None):
        full = self._full_path(path)
        full.parent.mkdir(parents=True, exist_ok=True)
        with open(full, "wb") as f:
            shutil.copyfileobj(content, f)

    def write_from_url(self, url: str, path: str, content_type=None) -> str:
        import urllib.request
        full = self._full_path(path)
        full.parent.mkdir(parents=True, exist_ok=True)
        urllib.request.urlretrieve(url, full)
        return str(full)

    def read(self, path: str) -> BinaryIO:
        return open(self._full_path(path), "rb")

    def get_download_signed_url(self, path: str, expiration_seconds: int = 3600):
        return None

    def get_upload_signed_url(self, path: str, content_type: str, expiration_seconds: int) -> str:
        return f"/local-upload/{path}"

    def is_exists(self, path: str) -> bool:
        return self._full_path(path).exists()

    def get_file_size(self, path: str) -> int:
        full = self._full_path(path)
        return full.stat().st_size if full.exists() else 0

    def get_public_url(self, path: str) -> str:
        return f"/files/{path}"

    def get_permanent_url(self, path: str) -> str:
        return f"/files/{path}"

    def upload_and_get_permanent_url(self, content: BinaryIO, path: str, content_type=None) -> str:
        self.write(content, path, content_type)
        return self.get_permanent_url(path)
