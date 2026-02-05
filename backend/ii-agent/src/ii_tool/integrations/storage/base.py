from abc import ABC, abstractmethod
from typing import BinaryIO

# Abstract Object Storage Interface
class BaseStorage(ABC):
    @abstractmethod
    async def write(self, content: BinaryIO, path: str, content_type: str | None = None):
        pass

    @abstractmethod
    async def write_from_url(self, url: str, path: str, content_type: str | None = None) -> str:
        pass

    @abstractmethod
    async def write_from_local_path(self, local_path: str, target_path: str, content_type: str | None = None) -> str:
        pass

    @abstractmethod
    def get_public_url(self, path: str) -> str:
        pass