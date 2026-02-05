import asyncio

from typing import Any
from ii_tool.browser.browser import Browser
from ii_tool.tools.base import BaseTool, ToolResult, ImageContent, TextContent


class BrowserDragTool(BaseTool):
    name = "browser_drag"
    display_name = "Browser Drag"
    description = "Perform drag and drop between two elements"
    input_schema = {
        "type": "object",
        "properties": {
            "coordinate_x_start": {
                "type": "number",
                "description": "X coordinate of drag start position",
            },
            "coordinate_y_start": {
                "type": "number",
                "description": "Y coordinate of drag start position",
            },
            "coordinate_x_end": {
                "type": "number",
                "description": "X coordinate of drag end position",
            },
            "coordinate_y_end": {
                "type": "number",
                "description": "Y coordinate of drag end position",
            },
        },
        "required": ["coordinate_x_start", "coordinate_y_start", "coordinate_x_end", "coordinate_y_end"],
    }
    read_only = False

    def __init__(self, browser: Browser):
        self.browser = browser

    async def execute(
        self,
        tool_input: dict[str, Any],
    ) -> ToolResult:
        try:
            coordinate_x_start = tool_input.get("coordinate_x_start")
            coordinate_y_start = tool_input.get("coordinate_y_start")
            coordinate_x_end = tool_input.get("coordinate_x_end")
            coordinate_y_end = tool_input.get("coordinate_y_end")

            if not coordinate_x_start or not coordinate_y_start or not coordinate_x_end or not coordinate_y_end:
                return ToolResult(
                    llm_content="Must provide both coordinate_x_start, coordinate_y_start, coordinate_x_end, and coordinate_y_end to drag an element",
                    is_error=True
                )

            page = await self.browser.get_current_page()
            
            # Perform drag operation from start coordinates to end coordinates
            await page.mouse.move(coordinate_x_start, coordinate_y_start)
            await page.mouse.down()
            await asyncio.sleep(0.1)
            
            await page.mouse.move(coordinate_x_end, coordinate_y_end)
            await asyncio.sleep(0.1)
            await page.mouse.up()
            
            await asyncio.sleep(1)  # Wait for any animations or updates
            
            msg = f'Dragged from coordinates ({coordinate_x_start}, {coordinate_y_start}) to ({coordinate_x_end}, {coordinate_y_end}). Make sure to verify the drag operation was successful.'
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
            error_msg = f"Drag operation failed: {type(e).__name__}: {str(e)}"
            return ToolResult(llm_content=error_msg, is_error=True)

    async def execute_mcp_wrapper(
        self,
        coordinate_x_start: int,
        coordinate_y_start: int,
        coordinate_x_end: int,
        coordinate_y_end: int,
    ):
        return await self._mcp_wrapper(
            tool_input={
                "coordinate_x_start": coordinate_x_start,
                "coordinate_y_start": coordinate_y_start,
                "coordinate_x_end": coordinate_x_end,
                "coordinate_y_end": coordinate_y_end,
            }
        )