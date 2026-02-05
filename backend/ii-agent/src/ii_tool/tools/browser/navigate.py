import asyncio

from typing import Any
from playwright.async_api import TimeoutError
from ii_tool.browser.browser import Browser
from ii_tool.tools.base import BaseTool, ToolResult, ImageContent, TextContent


class BrowserNavigationTool(BaseTool):
    name = "browser_navigation"
    display_name = "Browser Navigation"
    description = "Navigate browser to specified URL"
    input_schema = {
        "type": "object",
        "properties": {
            "url": {
                "type": "string",
                "description": "Complete URL to visit. Must include protocol prefix.",
            }
        },
        "required": ["url"],
    }
    read_only = False

    def __init__(self, browser: Browser):
        self.browser = browser

    async def execute(
        self,
        tool_input: dict[str, Any],
    ) -> ToolResult:
        try:
            url = tool_input["url"]

            page = await self.browser.get_current_page()
            try:
                await page.goto(url, wait_until="domcontentloaded")
                await asyncio.sleep(1.5)
            except TimeoutError:
                msg = f"Timeout error navigating to {url}"
                return ToolResult(llm_content=msg, is_error=True)
            except Exception as e:
                msg = f"Navigation failed to {url}: {type(e).__name__}: {str(e)}"
                return ToolResult(llm_content=msg, is_error=True)

            state = await self.browser.update_state()
            state = await self.browser.handle_pdf_url_navigation()

            msg = f"Navigated to {url}"

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
            error_msg = f"Navigation operation failed: {type(e).__name__}: {str(e)}"
            return ToolResult(llm_content=error_msg, is_error=True)

    async def execute_mcp_wrapper(
        self,
        url: str,
    ):
        return await self._mcp_wrapper(
            tool_input={
                "url": url,
            }
        )


class BrowserRestartTool(BaseTool):
    name = "browser_restart"
    display_name = "Browser Restart"
    description = "Restart browser and navigate to specified URL"
    input_schema = {
        "type": "object",
        "properties": {
            "url": {
                "type": "string",
                "description": "Complete URL to visit after restart. Must include protocol prefix.",
            }
        },
        "required": ["url"],
    }
    read_only = False

    def __init__(self, browser: Browser):
        self.browser = browser

    async def execute(
        self,
        tool_input: dict[str, Any],
    ) -> ToolResult:
        try:
            url = tool_input["url"]
            await self.browser.restart()

            page = await self.browser.get_current_page()
            try:
                await page.goto(url, wait_until="domcontentloaded")
                await asyncio.sleep(1.5)
            except TimeoutError:
                msg = f"Timeout error navigating to {url}"
                return ToolResult(llm_content=msg, is_error=True)
            except Exception as e:
                msg = f"Navigation failed to {url}: {type(e).__name__}: {str(e)}"
                return ToolResult(llm_content=msg, is_error=True)

            state = await self.browser.update_state()
            state = await self.browser.handle_pdf_url_navigation()

            msg = f"Navigated to {url}"

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
            error_msg = f"Browser restart and navigation failed: {type(e).__name__}: {str(e)}"
            return ToolResult(llm_content=error_msg, is_error=True)

    async def execute_mcp_wrapper(
        self,
        url: str,
    ):
        return await self._mcp_wrapper(
            tool_input={
                "url": url,
            }
        )