from typing import Dict, List, Any, Literal, Optional
from pydantic import BaseModel

from ii_agent.config.agent_types import AgentType
from ii_agent.core.storage.models.settings import Settings


class WebSocketMessage(BaseModel):
    """Base model for WebSocket messages."""

    type: str
    content: Dict[str, Any] = {}


class FileInfo(BaseModel):
    """Model for file information in uploads."""

    path: str
    content: str


class UploadRequest(BaseModel):
    """Model for file upload requests."""

    session_id: str
    file: FileInfo


class SessionInfo(BaseModel):
    """Model for session information."""

    id: str
    created_at: str
    name: str = ""


class SessionResponse(BaseModel):
    """Response model for session queries."""

    sessions: List[SessionInfo]


class EventInfo(BaseModel):
    """Model for event information."""

    id: str
    session_id: str
    created_at: str
    type: str
    content: Dict[str, Any]
    workspace_dir: str


class EventResponse(BaseModel):
    """Response model for event queries."""

    events: List[EventInfo]


class QueryContentRequest(BaseModel):
    """Model for query message content."""

    text: str = ""
    resume: bool = False
    file_ids: List[str] = []


class QueryContentInternal(BaseModel):
    text: str = ""
    resume: bool = False
    file_upload_paths: List[str] = []
    images_data: List[
        Dict[str, str]
    ] = []  # in form of [{"content_type": ..., "url": ...}, ...]


class InitAgentContent(BaseModel):
    """Model for agent initialization content."""

    model_id: Optional[str] = None  # Used model_name for system model
    tool_args: Dict[str, Any] = {}
    source: Optional[Literal["user", "system"]] = None
    thinking_tokens: int = 0
    agent_type: AgentType = (
        AgentType.GENERAL
    )  # Agent type: 'general', 'video_generate', 'image', 'slide', 'website_build'
    metadata: Optional[Dict[str, Any]] = (
        None  # Optional metadata (e.g., template_id for slides)
    )


class QueryCommandContent(BaseModel):
    """Model for query command content that combines init_agent and query parameters."""

    # Init agent parameters (required for agent initialization)
    model_id: Optional[str]
    provider: Optional[str]
    source: Optional[Literal["user", "system"]] = "system"
    agent_type: AgentType
    tool_args: Dict[str, Any] = {}
    thinking_tokens: int = 0
    metadata: Optional[Dict[str, Any]] = None

    # Query parameters (required for query processing)
    text: str = ""
    resume: bool = False
    files: List[str] = []

    class Config:
        """Pydantic configuration."""

        extra = "allow"
        validate_assignment = True


class EnhancePromptContent(BaseModel):
    """Model for prompt enhancement content."""

    text: str = ""
    files: List[str] = []


class EditQueryContent(BaseModel):
    """Model for edit query content."""

    text: str = ""
    resume: bool = False
    files: List[str] = []


class ReviewResultContent(BaseModel):
    """Model for review result content."""

    user_input: str = ""


class GETSettingsModel(Settings):
    """Model for GET settings."""

    llm_api_key_set: bool
    search_api_key_set: bool
