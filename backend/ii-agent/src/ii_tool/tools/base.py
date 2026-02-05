from abc import ABC, abstractmethod
from typing import Any, Dict, List, Literal, Optional
from fastapi import FastAPI
from pydantic import BaseModel


class ToolParam(BaseModel):
    """Internal representation of LLM tool."""

    type: Literal["function", "custom"] = "function"
    name: str
    description: str
    input_schema: dict[str, Any]  # HACK: will be use as format if type is custom


class TextContent(BaseModel):
    type: Literal["text"]
    text: str


class ImageContent(BaseModel):
    type: Literal["image"]
    data: str  # base64 encoded image data
    mime_type: str  # e.g. "image/png"


class FileEditToolResultContent(BaseModel):
    type: Literal["file_edit"] = "file_edit"
    old_content: str
    new_content: str


class FileURLContent(BaseModel):
    type: Literal["file_url"]
    url: str
    mime_type: str
    name: str
    size: int


class ToolResult(BaseModel):
    """Result of tool execution"""

    llm_content: str | List[TextContent | ImageContent]
    user_display_content: Optional[str | Dict[str, Any] | List[Dict[str, Any]]] = None
    is_error: Optional[bool] = None
    is_interrupted: bool = False

class ToolConfirmationDetails(BaseModel):
    type: Literal["edit", "bash", "mcp"]
    message: str


class BaseTool(ABC):
    name: str
    description: str
    input_schema: dict[str, Any]
    read_only: bool
    display_name: str
    metadata: Optional[Dict[str, Any]] = None  # e.g. for custom tool format

    def should_confirm_execute(
        self, tool_input: dict[str, Any]
    ) -> ToolConfirmationDetails | bool:
        """
        Determine if the tool execution should be confirmed.
        In web application mode, the tool is executed without confirmation.
        In CLI mode, some tools should be confirmed by the user before execution (e.g. file edit, shell command, etc.)

        Args:
            tool_input (dict[str, Any]): The input to the tool.

        Returns:
            ToolConfirmationDetails | bool: The confirmation details or a boolean indicating if the execution should be confirmed.
        """
        return False

    @abstractmethod
    async def execute(self, tool_input: dict[str, Any]) -> ToolResult:
        raise NotImplementedError

    async def _mcp_wrapper(self, tool_input: dict[str, Any]):
        """Wraps the tool execution to match with FastMCP Format"""

        from mcp.types import (
            ImageContent as MCPImageContent,
            TextContent as MCPTextContent,
        )
        from fastmcp.tools.tool import ToolResult as FastMCPToolResult

        internal_result = await self.execute(tool_input)
        llm_content = internal_result.llm_content

        mcp_result = []

        if isinstance(llm_content, str):
            mcp_result.append(
                MCPTextContent(
                    type="text",
                    text=llm_content,
                )
            )
        elif isinstance(llm_content, list):
            for content in llm_content:
                if isinstance(content, ImageContent):
                    mcp_result.append(
                        MCPImageContent(
                            type="image",
                            data=content.data,
                            mimeType=content.mime_type,
                        )
                    )
                elif isinstance(content, TextContent):
                    mcp_result.append(
                        MCPTextContent(
                            type="text",
                            text=content.text,
                        )
                    )

        return FastMCPToolResult(
            content=mcp_result,
            structured_content={
                "user_display_content": internal_result.user_display_content,
                "is_error": internal_result.is_error,
            },
        )

    def get_tool_params(self) -> ToolParam:
        if self.metadata:
            return ToolParam(
                type="custom",
                name=self.name,
                description=self.description,
                input_schema=self.metadata["format"],
            )
        else:
            return ToolParam(
                type="function",
                name=self.name,
                description=self.description,
                input_schema=self.input_schema,
            )
