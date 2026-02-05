import asyncio

from typing import Any
from ii_tool.browser.browser import Browser
from ii_tool.tools.base import BaseTool, ToolResult, ImageContent, TextContent


class BrowserWaitTool(BaseTool):
    name = "browser_wait"
    display_name = "Browser Wait"
    description = "Wait for the page to load"
    input_schema = {"type": "object", "properties": {}, "required": []}
    read_only = False

    def __init__(self, browser: Browser):
        self.browser = browser

    async def execute(
        self,
        tool_input: dict[str, Any],
    ) -> ToolResult:
        try:
            await asyncio.sleep(1)
            state = await self.browser.update_state()
            state = await self.browser.handle_pdf_url_navigation()

            msg = "Waited for page"

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
            error_msg = f"Wait operation failed: {type(e).__name__}: {str(e)}"
            return ToolResult(llm_content=error_msg, is_error=True)

    async def execute_mcp_wrapper(self):
        return await self._mcp_wrapper(tool_input={})