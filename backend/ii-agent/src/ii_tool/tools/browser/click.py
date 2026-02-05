import asyncio

from typing import Any, Optional
from ii_tool.browser.browser import Browser
from ii_tool.tools.base import BaseTool, ToolResult, ImageContent, TextContent


class BrowserClickTool(BaseTool):
    name = "browser_click"
    display_name = "Browser Click"
    description = "Click on an element on the current browser page"
    input_schema = {
        "type": "object",
        "properties": {
            "coordinate_x": {
                "type": "number",
                "description": "X coordinate of click position",
            },
            "coordinate_y": {
                "type": "number",
                "description": "Y coordinate of click position",
            },
            "double_click": {
                "type": "boolean",
                "description": "If True, will perform a double click on the element",
                "default": False,
            }
        },
        "required": ["coordinate_x", "coordinate_y"],
    }
    read_only = False

    def __init__(self, browser: Browser):
        self.browser = browser

    async def execute(
        self,
        tool_input: dict[str, Any],
    ) -> ToolResult:
        try:
            coordinate_x = tool_input.get("coordinate_x")
            coordinate_y = tool_input.get("coordinate_y")
            double_click = tool_input.get("double_click", False)
            if not coordinate_x or not coordinate_y:
                return ToolResult(
                    llm_content="Must provide both coordinate_x and coordinate_y to click on an element",
                    is_error=True
                )

            page = await self.browser.get_current_page()
            initial_pages = len(self.browser.context.pages) if self.browser.context else 0

            if not double_click:
                await page.mouse.click(coordinate_x, coordinate_y)
                await asyncio.sleep(1)
                msg = f"Clicked at coordinates {coordinate_x}, {coordinate_y}"
            else:
                await page.mouse.dblclick(coordinate_x, coordinate_y)
                await asyncio.sleep(1)
                msg = f"Double clicked at coordinates {coordinate_x}, {coordinate_y}"

            if self.browser.context and len(self.browser.context.pages) > initial_pages:
                new_tab_msg = "New tab opened - switching to it"
                msg += f" - {new_tab_msg}"
                await self.browser.switch_to_tab(-1)
                await asyncio.sleep(0.1)

            state = await self.browser.update_state()
            state = await self.browser.handle_pdf_url_navigation()

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
                llm_content=f"Click operation failed at ({coordinate_x}, {coordinate_y}): {type(e).__name__}: {str(e)}", 
                is_error=True
            )

    async def execute_mcp_wrapper(
        self,
        coordinate_x: int,
        coordinate_y: int,
        double_click: bool = False,
    ):
        return await self._mcp_wrapper(
            tool_input={
                "coordinate_x": coordinate_x,
                "coordinate_y": coordinate_y,
                "double_click": double_click,
            }
        )