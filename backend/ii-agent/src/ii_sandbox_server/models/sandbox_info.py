"""Sandbox management Pydantic models."""

from pydantic import BaseModel
from typing import Optional, Dict, Any


class SandboxInfo(BaseModel):
    """Model for sandbox information."""

    id: str
    provider: str
    user_id: str
    provider_sandbox_id: str
    template: str
    status: str
    cpu_limit: int
    memory_limit: int
    disk_limit: int
    network_enabled: bool
    metadata: Optional[Dict[str, Any]] = None
    created_at: str
    started_at: Optional[str] = None
    stopped_at: Optional[str] = None
    last_activity_at: Optional[str] = None
