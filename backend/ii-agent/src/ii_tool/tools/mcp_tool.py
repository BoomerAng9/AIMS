from typing import Any, Literal
import asyncio
from fastmcp import Client
from fastmcp.exceptions import ToolError
from ii_tool.tools.base import (
    BaseTool,
    ToolResult,
    TextContent,
    ImageContent,
    ToolConfirmationDetails,
)


DEFAULT_TIMEOUT = 1800  # 5 minutes


async def with_retry(func, *args, retries=2, delay=1, **kwargs):
    """Wrapper function to retry async operations"""
    last_exception = None
    for attempt in range(retries + 1):  # retries + 1 for initial attempt
        try:
            return await func(*args, **kwargs)
        except Exception as e:
            last_exception = e
            if attempt < retries:  # Don't sleep on the last attempt
                await asyncio.sleep(delay)
            else:
                raise last_exception


class MCPTool(BaseTool):
    def __init__(
        self,
        mcp_client: Client,
        name: str,
        display_name: str,
        description: str,
        input_schema: dict[str, Any],
        read_only: bool,
        type: Literal[
            "function", "openai_custom"
        ] = "function",  # check https://platform.openai.com/docs/guides/function-calling#context-free-grammars
    ):
        # MCP information
        self.mcp_client = mcp_client

        # Tool information
        self.name = name
        self.display_name = display_name
        self.description = description
        self.read_only = read_only
        if type == "function":
            self.input_schema = input_schema
        else:
            self.format = (
                input_schema  # HACK: this way we can pass format as input_schemas
            )

    def should_confirm_execute(
        self, tool_input: dict[str, Any]
    ) -> ToolConfirmationDetails | bool:
        return ToolConfirmationDetails(
            type="mcp",
            message=f"Do you want to execute the MCP tool {self.name} with input {tool_input}?",
        )

    async def execute(self, tool_input: dict[str, Any]) -> ToolResult:
        try:
            async with self.mcp_client:
                mcp_results = await with_retry(
                    self.mcp_client.call_tool,
                    self.name,
                    tool_input,
                    timeout=DEFAULT_TIMEOUT,
                )

                llm_content = []
                has_image_content = False
                for mcp_result in mcp_results.content:
                    if mcp_result.type == "text":
                        llm_content.append(
                            TextContent(type="text", text=mcp_result.text)
                        )
                    elif mcp_result.type == "image":
                        llm_content.append(
                            ImageContent(
                                type="image",
                                data=mcp_result.data,
                                mime_type=mcp_result.mimeType,
                            )
                        )
                        has_image_content = True
                    else:
                        raise ValueError(f"Unknown result type: {mcp_result.type}")

                user_display_content = None
                is_error = False
                # Logic for our internal tools
                if mcp_results.structured_content is not None:
                    user_display_content = mcp_results.structured_content.get(
                        "user_display_content"
                    )
                    is_error = mcp_results.structured_content.get("is_error")
                # For external tools (like MCP) or internal tools that don't have a user_display_content
                if not user_display_content:
                    if not has_image_content:
                        user_display_content = "\n".join(
                            [content.text for content in llm_content]
                        )
                    else:
                        user_display_content = [
                            content.model_dump() for content in llm_content
                        ]

                return ToolResult(
                    llm_content=llm_content,
                    user_display_content=user_display_content,
                    is_error=is_error,
                )
        except ToolError as e:
            return ToolResult(
                llm_content=f"Error while calling tool {self.name} with input {tool_input}: {str(e)}\n\nPlease analyze the error message to determine if it's due to incorrect input parameters or an internal tool issue. If the error is due to incorrect input, retry with the correct parameters. Otherwise, try an alternative approach and inform the user about the issue.",
                user_display_content=f"Error while calling tool {self.name} with input {tool_input}: {str(e)}",
                is_error=True,
            )
        except Exception as e:
            return ToolResult(
                llm_content=f"Error while calling tool {self.name} with input {tool_input}: {str(e)}\n\nPlease analyze the error message to determine if it's due to incorrect input parameters or an internal tool issue. If the error is due to incorrect input, retry with the correct parameters. Otherwise, try an alternative approach and inform the user about the issue.",
                user_display_content=f"Error while calling tool {self.name} with input {tool_input}: {str(e)}",
                is_error=True,
            )
