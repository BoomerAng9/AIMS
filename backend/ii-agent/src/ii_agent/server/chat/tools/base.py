"""
Tool interface for chat tools.

Simple, clean interface without complex wrappers.
"""

from abc import ABC, abstractmethod
from typing import Any, Dict, Optional
from pydantic import BaseModel

from ii_agent.server.chat.models import ToolResultContent


class ToolInfo(BaseModel):
    """Tool metadata for LLM."""

    name: str
    description: str
    parameters: Dict[str, Any]  # JSON schema
    required: list[str]


class ToolResponse(BaseModel):
    """Result of tool execution."""

    output: ToolResultContent
    metadata: Optional[Dict[str, Any]] = None


class ToolCallInput(BaseModel):
    """Tool invocation from LLM."""

    id: str
    name: str
    input: str  # JSON string of parameters


class BaseTool(ABC):
    """
    Base interface for chat tools.

    Follows Go pattern: simple Run() method that takes ToolCall and returns ToolResponse.
    No complex confirmation flows, MCP wrappers, or multi-format support.
    """

    @abstractmethod
    def info(self) -> ToolInfo:
        """Return tool metadata for LLM."""
        pass

    @property
    @abstractmethod
    def name(self) -> str:
        """Return tool name."""
        pass

    @abstractmethod
    async def run(self, tool_call: ToolCallInput) -> ToolResponse:
        """
        Execute the tool.

        Args:
            tool_call: Tool invocation with id, name, and input (JSON string)

        Returns:
            ToolResponse with content and error status
        """
        pass
