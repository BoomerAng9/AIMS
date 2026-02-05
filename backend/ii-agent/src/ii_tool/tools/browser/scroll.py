import asyncio

from typing import Any
from ii_tool.browser.browser import Browser
from ii_tool.browser.utils import is_pdf_url
from ii_tool.tools.base import BaseTool, ToolResult, ImageContent, TextContent


class BrowserScrollDownTool(BaseTool):
    name = "browser_scroll_down"
    display_name = "Browser Scroll Down"
    description = "Scroll down the current browser page"
    input_schema = {"type": "object", "properties": {}, "required": []}
    read_only = False

    def __init__(self, browser: Browser):
        self.browser = browser

    async def execute(
        self,
        tool_input: dict[str, Any],
    ) -> ToolResult:
        try:
            page = await self.browser.get_current_page()
            state = self.browser.get_state()
            is_pdf = is_pdf_url(page.url)
            if is_pdf:
                await page.keyboard.press("PageDown")
                await asyncio.sleep(0.1)
            else:
                await page.mouse.move(state.viewport.width / 2, state.viewport.height / 2)
                await asyncio.sleep(0.1)
                await page.mouse.wheel(0, state.viewport.height * 0.8)
                await asyncio.sleep(0.1)

            state = await self.browser.update_state()

            msg = "Scrolled page down"
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
            error_msg = f"Scroll down operation failed: {type(e).__name__}: {str(e)}"
            return ToolResult(llm_content=error_msg, is_error=True)

    async def execute_mcp_wrapper(self):
        return await self._mcp_wrapper(tool_input={})


class BrowserScrollUpTool(BaseTool):
    name = "browser_scroll_up"
    display_name = "Browser Scroll Up"
    description = "Scroll up the current browser page"
    input_schema = {"type": "object", "properties": {}, "required": []}
    read_only = False

    def __init__(self, browser: Browser):
        self.browser = browser

    async def execute(
        self,
        tool_input: dict[str, Any],
    ) -> ToolResult:
        try:
            page = await self.browser.get_current_page()
            state = self.browser.get_state()
            is_pdf = is_pdf_url(page.url)
            if is_pdf:
                await page.keyboard.press("PageUp")
                await asyncio.sleep(0.1)
            else:
                await page.mouse.move(state.viewport.width / 2, state.viewport.height / 2)
                await asyncio.sleep(0.1)
                await page.mouse.wheel(0, -state.viewport.height * 0.8)
                await asyncio.sleep(0.1)

            state = await self.browser.update_state()

            msg = "Scrolled page up"
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
            error_msg = f"Scroll up operation failed: {type(e).__name__}: {str(e)}"
            return ToolResult(llm_content=error_msg, is_error=True)

    async def execute_mcp_wrapper(self):
        return await self._mcp_wrapper(tool_input={})