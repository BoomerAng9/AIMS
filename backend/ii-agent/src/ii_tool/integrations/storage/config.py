from pydantic_settings import BaseSettings
from typing import Literal, Optional

class StorageConfig(BaseSettings):
    storage_provider: Literal["gcs", "local"] = "local"
    gcs_bucket_name: Optional[str] = None
    gcs_project_id: Optional[str] = None
    local_storage_path: str = "/.ii_agent/storage"
    local_public_base_url: str = ""