import asyncio

from typing import Any
from ii_tool.browser.browser import Browser
from ii_tool.tools.base import BaseTool, ToolResult, ImageContent, TextContent


class BrowserPressKeyTool(BaseTool):
    name = "browser_press_key"
    display_name = "Browser Press Key"
    description = "Simulate key press in the current browser page"
    input_schema = {
        "type": "object",
        "properties": {
            "key": {
                "type": "string",
                "description": "Key name to simulate (e.g., Enter, Tab, ArrowUp), supports key combinations (e.g., Control+Enter).",
            }
        },
        "required": ["key"],
    }
    read_only = False
    
    def __init__(self, browser: Browser):
        self.browser = browser

    async def execute(
        self,
        tool_input: dict[str, Any],
    ) -> ToolResult:
        try:
            key = tool_input["key"]
            page = await self.browser.get_current_page()
            try:
                await page.keyboard.press(key)
                await asyncio.sleep(0.5)
            except Exception as e:
                return ToolResult(
                    llm_content=f"Failed to press key '{key}': {type(e).__name__}: {str(e)}",
                    is_error=True
                )

            msg = f'Pressed "{key}" on the keyboard.'
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
            return ToolResult(
                llm_content=f"Failed to press key: {type(e).__name__}: {str(e)}",
                is_error=True
            )

    async def execute_mcp_wrapper(
        self,
        key: str,
    ):
        return await self._mcp_wrapper(
            tool_input={
                "key": key,
            }
        )