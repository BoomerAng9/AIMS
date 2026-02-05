"""Pydantic models for chat API requests/responses.

Message Format Documentation
============================

This module defines message formats compatible with all major LLM providers:
- OpenAI (GPT-4, GPT-3.5, o1)
- Anthropic (Claude 3, Claude 3.5)
- Google (Gemini)

Message Types Stored in Database
---------------------------------

1. User Messages:
   {
       "role": "user",
       "content": "text content",
       "tool_calls": null,
       "function_call": null
   }

2. Assistant Messages (Text):
   {
       "role": "assistant",
       "content": "response text",
       "tool_calls": null,
       "function_call": null,
       "reasoning_content": null  # For o1 models
   }

3. Assistant Messages (with Tool Calls):
   {
       "role": "assistant",
       "content": null,  # Can be null when making tool calls
       "tool_calls": [
           {
               "id": "call_123",
               "type": "function",
               "function": {
                   "name": "get_weather",
                   "arguments": "{\"location\": \"SF\"}"
               }
           }
       ],
       "function_call": null,
       "reasoning_content": null
   }

4. Tool Response Messages:
   {
       "role": "tool",
       "content": "tool result",
       "tool_call_id": "call_123",
       "name": "get_weather"
   }

5. Assistant Messages (with Reasoning):
   {
       "role": "assistant",
       "content": "final answer",
       "tool_calls": null,
       "function_call": null,
       "reasoning_content": "thinking process..."  # OpenAI o1, Claude extended thinking
   }
"""

import base64
from dataclasses import dataclass
from enum import Enum
from typing import List, Optional, Union, Dict, Any, Literal
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field

from ii_agent.metrics.models import TokenUsage


MessageRoleType = Literal["user", "assistant", "system", "tool"]
SessionStatusType = Literal["active", "completed", "stopped", "error"]
ToolCallTypeType = Literal["function"]


class ChatMessageRequest(BaseModel):
    """Request to send a chat message."""

    content: str = Field(
        ..., description="Message content - can be string or structured content object"
    )
    model_id: str = Field(..., description="LLM model ID")
    file_ids: Optional[List[str]] = Field(
        None, description="List of file paths to include in the message"
    )
    session_id: Optional[UUID] = Field(None, description="Existing session ID")
    tools: Optional[Dict[str, bool]] = Field(
        None,
        description="Tool enablement configuration. Keys: tool names, Values: enabled status. "
        "Available tools: web_search, image_search, web_visit, code_interpreter. "
        "Example: {'web_search': true, 'code_interpreter': false}. "
        "If None or empty, no tools are enabled.",
    )


class StopConversationRequest(BaseModel):
    """Request to send a chat message."""

    session_id: UUID = Field(..., description="Existing session ID")


class StopConversationResponse(BaseModel):
    """Request to send a chat message."""

    success: bool = Field(
        ..., description="Whether the conversation was successfully stopped"
    )
    last_message_id: Optional[UUID] = Field(
        None, description="ID of the last message in the conversation"
    )


class TokenDetailsCompletion(BaseModel):
    """Completion token usage details."""

    reasoning_tokens: Optional[int] = None
    accepted_prediction_tokens: Optional[int] = None
    rejected_prediction_tokens: Optional[int] = None


class TokenDetailsPrompt(BaseModel):
    """Prompt token usage details."""

    cached_tokens: Optional[int] = None
    audio_tokens: Optional[int] = None


class UsageObject(BaseModel):
    """Token usage statistics."""

    completion_tokens: int
    prompt_tokens: int
    total_tokens: int
    completion_tokens_details: Optional[TokenDetailsCompletion] = None
    prompt_tokens_details: Optional[TokenDetailsPrompt] = None


class FileAttachmentResponse(BaseModel):
    id: UUID
    file_name: str
    file_size: int
    content_type: str
    created_at: datetime


class ChatMessageResponse(BaseModel):
    """Single chat message response.

    The content field contains a list of ContentPart objects directly from the database.

    Example:
    [
        {"type": "text", "text": "hello"},
        {"type": "reasoning", "thinking": "...", "signature": "..."},
        {"type": "tool_call", "id": "...", "name": "...", "input": "...", "finished": true},
        {"type": "tool_result", "tool_call_id": "...", "name": "...", "content": "...", "is_error": false}
    ]
    """

    id: str
    role: MessageRoleType
    content: List[Dict[str, Any]] = Field(
        ...,
        description="List of ContentPart objects (text, reasoning, tool_call, tool_result, etc.)",
    )
    usage: Optional[TokenUsage] = None
    tokens: Optional[int] = None
    model: Optional[str] = None
    created_at: datetime
    files: List[FileAttachmentResponse] = Field(default_factory=list)
    finish_reason: Optional[str] = None

    class Config:
        from_attributes = True


class MessageHistoryResponse(BaseModel):
    """Response with message history."""

    messages: List[ChatMessageResponse]
    has_more: bool
    total_count: int


class ClearHistoryResponse(BaseModel):
    """Response after clearing history."""

    success: bool
    deleted_count: int
    message: str


class ModelInfo(BaseModel):
    """Information about an available model."""

    id: str
    name: str
    provider: str
    cost_per_1k_tokens: float
    max_tokens: int
    supports_streaming: bool


class ModelsListResponse(BaseModel):
    """Response with list of available models."""

    models: List[ModelInfo]


class SessionMetadata(BaseModel):
    """Chat session metadata."""

    session_id: str = Field(..., description="Unique session identifier")
    name: str = Field(..., description="Session name")
    status: SessionStatusType = Field(..., description="Session status")
    agent_type: Literal["chat"] = Field(..., description="Type of agent")
    model_id: str = Field(..., description="LLM model ID used for this session")
    created_at: str = Field(..., description="Session creation timestamp (ISO 8601)")

    class Config:
        json_schema_extra = {
            "example": {
                "session_id": "550e8400-e29b-41d4-a716-446655440000",
                "name": "Chat - 2025-10-23 15:30",
                "status": "active",
                "agent_type": "chat",
                "model_id": "gpt-4",
                "created_at": "2025-10-23T15:30:00.000Z",
            }
        }


class MessageRole(str, Enum):
    """Message role enum."""

    ASSISTANT = "assistant"
    USER = "user"
    SYSTEM = "system"
    TOOL = "tool"


class ProviderFileInfo(BaseModel):
    """Provider-specific file information stored in message metadata."""

    provider: str = Field(
        ..., description="Provider name (e.g., 'openai', 'anthropic')"
    )
    file_ids: List[str] = Field(..., description="List of provider-specific file IDs")
    container_id: Optional[str] = Field(
        default=None,
        description="Optional container identifier when provider groups files (e.g., OpenAI containers)",
    )


class MessageMetadata(BaseModel):
    """Metadata stored with chat messages."""

    provider_files: List[ProviderFileInfo] = Field(
        default_factory=list,
        description="Provider-specific file IDs for multi-provider support",
    )


class FinishReason(str, Enum):
    """Reason why message generation finished."""

    END_TURN = "end_turn"
    MAX_TOKENS = "max_tokens"
    TOOL_USE = "tool_use"
    CANCELED = "canceled"
    ERROR = "error"
    PERMISSION_DENIED = "permission_denied"
    PAUSE_TURN = "pause_turn"
    UNKNOWN = "unknown"


class BaseContentPart(BaseModel):
    """Base class for all content parts with provider-specific data.

    provider_options: Provider-specific data (both input and output)
        - When extracting FROM provider: Write provider data here
        - When converting TO provider: Read provider data from here
        - Example: {"google": {"thoughtSignature": "base64..."}}
    """

    provider_options: Optional[Dict[str, Any]] = None


class TextContent(BaseContentPart):
    """Plain text content."""

    type: Literal["text"] = "text"
    text: str


class ReasoningContent(BaseContentPart):
    """Reasoning/thinking content from models like o1, o3-mini, Claude extended thinking."""

    type: Literal["reasoning"] = "reasoning"
    thinking: str
    signature: str = ""
    started_at: Optional[int] = None
    finished_at: Optional[int] = None


class ImageURLContent(BaseContentPart):
    """Image content with URL."""

    type: Literal["image_url"] = "image_url"
    url: str
    detail: Optional[str] = None


class BinaryContent(BaseContentPart):
    """Binary data (images, files) with base64 encoding."""

    type: Literal["binary"] = "binary"
    path: str
    mime_type: str
    data: bytes

    def to_base64(self, provider: str = "anthropic") -> str:
        """Convert to base64 string with provider-specific format."""
        encoded = base64.b64encode(self.data).decode("utf-8")
        if provider == "openai":
            return f"data:{self.mime_type};base64,{encoded}"
        return encoded

    class Config:
        arbitrary_types_allowed = True


class ToolCall(BaseContentPart):
    """Tool/function call made by assistant."""

    type: Literal["tool_call"] = "tool_call"
    id: str
    name: str
    input: str
    function_type: str = Field(default="function", alias="function_type")
    finished: bool = True
    provider_executed: bool = (
        False  # NOTE: whether the tool call was executed by the provider
    )


# Content part types for array results
class TextContentPart(BaseModel):
    """Text content part."""

    type: Literal["text"] = "text"
    text: str
    provider_options: Optional[Dict[str, Any]] = None


class FileDataContentPart(BaseModel):
    """File data content part."""

    type: Literal["file-data"] = "file-data"
    data: str
    mime_type: str
    filename: Optional[str] = None
    provider_options: Optional[Dict[str, Any]] = None


class FileUrlContentPart(BaseModel):
    """File URL content part."""

    type: Literal["file-url"] = "file-url"
    url: str
    mime_type: str
    provider_options: Optional[Dict[str, Any]] = None


class FileIdContentPart(BaseModel):
    """File ID content part."""

    type: Literal["file-id"] = "file-id"
    file_id: Union[str, Dict[str, str]]
    mime_type: str
    provider_options: Optional[Dict[str, Any]] = None


class ImageDataContentPart(BaseModel):
    """Image data content part."""

    type: Literal["image-data"] = "image-data"
    data: str
    media_type: str
    provider_options: Optional[Dict[str, Any]] = None


class ImageUrlContentPart(BaseModel):
    """Image URL content part."""

    type: Literal["image-url"] = "image-url"
    url: str
    provider_options: Optional[Dict[str, Any]] = None


class ImageFileIdContentPart(BaseModel):
    """Image file ID content part."""

    type: Literal["image-file-id"] = "image-file-id"
    file_id: Union[str, Dict[str, str]]
    provider_options: Optional[Dict[str, Any]] = None


class CustomContentPart(BaseModel):
    """Custom provider-specific content part."""

    type: Literal["custom"] = "custom"
    provider_options: Optional[Dict[str, Any]] = None


# Union of all content part types
ContentPartType = Union[
    TextContentPart,
    FileDataContentPart,
    FileUrlContentPart,
    FileIdContentPart,
    ImageDataContentPart,
    ImageUrlContentPart,
    ImageFileIdContentPart,
    CustomContentPart,
]


# Tool Result Content Types
class TextResultContent(BaseModel):
    """Text content result."""

    type: Literal["text"] = "text"
    value: str
    provider_options: Optional[Dict[str, Any]] = None


class JsonResultContent(BaseModel):
    """JSON content result."""

    type: Literal["json"] = "json"
    value: Any
    provider_options: Optional[Dict[str, Any]] = None


class ExecutionDeniedContent(BaseModel):
    """Execution denied result."""

    type: Literal["execution-denied"] = "execution-denied"
    reason: Optional[str] = None
    provider_options: Optional[Dict[str, Any]] = None


class ErrorTextContent(BaseModel):
    """Error text result."""

    type: Literal["error-text"] = "error-text"
    value: str
    provider_options: Optional[Dict[str, Any]] = None


class ErrorJsonContent(BaseModel):
    """Error JSON result."""

    type: Literal["error-json"] = "error-json"
    value: Any
    provider_options: Optional[Dict[str, Any]] = None


class ArrayResultContent(BaseModel):
    """Array of content parts result."""

    type: Literal["array"] = "array"
    value: List[ContentPartType]


# Union of all result content types
ToolResultContent = Union[
    TextResultContent,
    JsonResultContent,
    ExecutionDeniedContent,
    ErrorTextContent,
    ErrorJsonContent,
    ArrayResultContent,
]


class ToolResult(BaseContentPart):
    """Result from tool execution."""

    type: Literal["tool_result"] = "tool_result"
    tool_call_id: str
    name: str
    output: ToolResultContent
    provider_options: Optional[Dict[str, Any]] = None


class Finish(BaseContentPart):
    """Message completion marker with finish reason."""

    type: Literal["finish"] = "finish"
    reason: FinishReason
    time: int
    message: str = ""
    details: str = ""


class CodeBlockContent(BaseContentPart):
    """Code interpreter execution result."""

    type: Literal["code_block"] = "code_block"
    id: str
    content: str
    status: str
    outputs: Optional[List[Dict]] = None
    container_id: Optional[str] = None


ContentPart = Union[
    TextContent,
    ReasoningContent,
    ImageURLContent,
    BinaryContent,
    ToolCall,
    ToolResult,
    Finish,
    CodeBlockContent,
]


@dataclass
class CodeInterpreter:
    id: str
    code: str
    status: str
    container_id: str
    outputs: List[str] | None = None


@dataclass
class RunResponseOutput:
    """Complete response from provider."""

    content: List[ContentPart]
    usage: TokenUsage
    finish_reason: FinishReason
    files: List[Dict[str, Any]] | None = None
    provider_metadata: Optional[Dict[str, Any]] = None


class EventType(str, Enum):
    """Granular event types for streaming."""

    CONTENT_START = "content_start"
    CONTENT_DELTA = "content_delta"
    CONTENT_STOP = "content_stop"
    TOOL_USE_START = "tool_use_start"
    TOOL_USE_DELTA = "tool_use_delta"
    TOOL_USE_STOP = "tool_use_stop"
    THINKING_START = "thinking_start"
    THINKING_DELTA = "thinking_delta"
    THINKING_STOP = "thinking_stop"
    SIGNATURE_DELTA = "signature_delta"
    TOOL_RESULT = "tool_result"  # TOOL_RESULT send in full, not streamed
    COMPLETE = "complete"
    ERROR = "error"
    WARNING = "warning"


@dataclass
class RunResponseEvent:
    """Event emitted during streaming."""

    type: EventType
    content: Optional[str] = None
    thinking: Optional[str] = None
    signature: Optional[str] = None
    response: Optional[RunResponseOutput] = None
    tool_call: Optional[ToolCall] = None
    code_interpreter: Optional[Dict[str, Any]] = None
    tool_result: Optional[ToolResult] = None
    error: Optional[Exception] = None

    def to_sse_event(self) -> Optional[Dict[str, Any]]:
        """
        Convert ProviderEvent to SSE event dictionary.

        Returns:
            Dict suitable for SSE streaming to frontend, or None for COMPLETE events
        """
        # Handle COMPLETE separately - not sent as SSE event
        if self.type == EventType.COMPLETE:
            return None

        # Build base event with type from enum
        event = {"type": self.type.value}

        # Add type-specific fields
        if self.type == EventType.CONTENT_DELTA:
            event["content"] = self.content

        elif self.type == EventType.THINKING_DELTA:
            event["thinking"] = self.thinking

        elif self.type == EventType.SIGNATURE_DELTA:
            # Special case: signature uses "thinking_delta" type for frontend compatibility
            event["type"] = EventType.THINKING_DELTA.value
            event["signature"] = self.signature

        elif self.type in (
            EventType.TOOL_USE_START,
            EventType.TOOL_USE_DELTA,
            EventType.TOOL_USE_STOP,
        ):
            event["tool_call"] = self.tool_call

        elif self.type == EventType.TOOL_RESULT:
            event["tool_call_id"] = self.tool_result.tool_call_id
            event["name"] = self.tool_result.name
            event["output"] = self.tool_result.output.model_dump()

        return event


class Message(BaseModel):
    """Strongly-typed message with ContentPart list."""

    id: UUID
    role: MessageRole
    session_id: str
    parts: List[ContentPart]
    model: Optional[str] = None
    provider: Optional[str] = None
    created_at: int = 0
    updated_at: int = 0
    file_ids: List[str] | None = None
    tokens: Optional[int] = None
    tools_enabled: Optional[Dict[str, bool]] = None
    provider_metadata: Optional[Dict] = None
    finish_reason: Optional[str] = None

    def content(self) -> Optional[TextContent]:
        """Extract first text content part."""
        for part in self.parts:
            if isinstance(part, TextContent):
                return part
        return None

    def tool_calls(self) -> List[ToolCall]:
        """Extract all tool call parts."""
        return [
            p for p in self.parts if isinstance(p, ToolCall) and not p.provider_executed
        ]

    def tool_results(self) -> List[ToolResult]:
        """Extract all tool result parts."""
        return [p for p in self.parts if isinstance(p, ToolResult)]

    def code_interpreter(self) -> List[CodeBlockContent]:
        """Extract all tool result parts."""
        return [p for p in self.parts if isinstance(p, CodeBlockContent)]

    def reasoning(self) -> Optional[ReasoningContent]:
        """Extract reasoning content if present."""
        for part in self.parts:
            if isinstance(part, ReasoningContent):
                return part
        return None
