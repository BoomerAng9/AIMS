import asyncio

from typing import Any
from ii_tool.browser.browser import Browser
from ii_tool.tools.base import BaseTool, ToolResult, ImageContent, TextContent


class BrowserSwitchTabTool(BaseTool):
    name = "browser_switch_tab"
    display_name = "Browser Switch Tab"
    description = "Switch to a specific tab by tab index"
    input_schema = {
        "type": "object",
        "properties": {
            "index": {
                "type": "integer",
                "description": "Index of the tab to switch to.",
            }
        },
        "required": ["index"],
    }
    read_only = False

    def __init__(self, browser: Browser):
        self.browser = browser

    async def execute(
        self,
        tool_input: dict[str, Any],
    ) -> ToolResult:
        try:
            index = int(tool_input["index"])
            await self.browser.switch_to_tab(index)
            await asyncio.sleep(0.5)
            msg = f"Switched to tab {index}"
            state = await self.browser.update_state()

            text_content = TextContent(type="text", text=msg)
            image_content = ImageContent(type="image", data=state.screenshot, mime_type="image/png")
            return ToolResult(
                llm_content=[
                    image_content,
                    text_content
                ],
                user_display_content=image_content.model_dump()
            )
        except Exception as e:
            error_msg = f"Switch tab operation failed for tab {index}: {type(e).__name__}: {str(e)}"
            return ToolResult(llm_content=error_msg, is_error=True)

    async def execute_mcp_wrapper(
        self,
        index: int,
    ):
        return await self._mcp_wrapper(
            tool_input={
                "index": index,
            }
        )


class BrowserOpenNewTabTool(BaseTool):
    name = "browser_open_new_tab"
    display_name = "Browser Open New Tab"
    description = "Open a new tab"
    input_schema = {"type": "object", "properties": {}, "required": []}
    read_only = False

    def __init__(self, browser: Browser):
        self.browser = browser

    async def execute(
        self,
        tool_input: dict[str, Any],
    ) -> ToolResult:
        try:
            await self.browser.create_new_tab()
            await asyncio.sleep(0.5)
            msg = "Opened a new tab"
            state = await self.browser.update_state()

            text_content = TextContent(type="text", text=msg)
            image_content = ImageContent(type="image", data=state.screenshot, mime_type="image/png")
            return ToolResult(
                llm_content=[
                    image_content,
                    text_content
                ],
                user_display_content=image_content.model_dump()
            )
        except Exception as e:
            error_msg = f"Open new tab operation failed: {type(e).__name__}: {str(e)}"
            return ToolResult(llm_content=error_msg, is_error=True)

    async def execute_mcp_wrapper(self):
        return await self._mcp_wrapper(tool_input={})