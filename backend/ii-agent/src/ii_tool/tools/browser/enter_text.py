import asyncio

from typing import Any, Optional
from ii_tool.browser.browser import Browser
from ii_tool.tools.base import BaseTool, ToolResult, ImageContent, TextContent


class BrowserEnterTextTool(BaseTool):
    name = "browser_enter_text"
    display_name = "Browser Enter Text"
    description = "Enter text with a keyboard. If coordinates are provided, will click on that position first before entering text."
    input_schema = {
        "type": "object",
        "properties": {
            "text": {"type": "string", "description": "Text to enter with a keyboard."},
            "coordinate_x": {
                "type": "number",
                "description": "Optional X coordinate to click before entering text",
            },
            "coordinate_y": {
                "type": "number",
                "description": "Optional Y coordinate to click before entering text",
            },
            "press_enter": {
                "type": "boolean",
                "description": "If True, `Enter` button will be pressed after entering the text. Use this when you think it would make sense to press `Enter` after entering the text, such as when you're submitting a form, performing a search, etc.",
                "default": False,
            },
            "override": {
                "type": "boolean",
                "description": "If True, the current text in the element will be cleared before entering new text. If False, the new text will be appended to the existing text. Default is False.",
                "default": False,
            },
        },
        "required": ["text"],
    }
    read_only = False

    def __init__(self, browser: Browser):
        self.browser = browser

    async def execute(
        self,
        tool_input: dict[str, Any],
    ) -> ToolResult:
        try:
            text = tool_input["text"]
            coordinate_x = tool_input.get("coordinate_x")
            coordinate_y = tool_input.get("coordinate_y")
            press_enter = tool_input.get("press_enter", False)
            override = tool_input.get("override", False)

            page = await self.browser.get_current_page()
            
            # Click on coordinates if provided
            if coordinate_x is not None and coordinate_y is not None:
                await page.mouse.click(coordinate_x, coordinate_y)
                await asyncio.sleep(0.5)

            # Only clear existing text if override is True
            if override:
                await page.keyboard.press("ControlOrMeta+a")
                await asyncio.sleep(0.1)
                await page.keyboard.press("Backspace")
                await asyncio.sleep(0.1)

            await page.keyboard.type(text)

            if press_enter:
                await page.keyboard.press("Enter")
                await asyncio.sleep(2)

            click_msg = f" at coordinates ({coordinate_x}, {coordinate_y})" if coordinate_x is not None and coordinate_y is not None else ""
            msg = f'Entered "{text}" on the keyboard{click_msg}. Make sure to double check that the text was entered to where you intended.'
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
            error_msg = f"Enter text operation failed: {type(e).__name__}: {str(e)}"
            return ToolResult(llm_content=error_msg, is_error=True)

    async def execute_mcp_wrapper(
        self,
        text: str,
        coordinate_x: Optional[float] = None,
        coordinate_y: Optional[float] = None,
        press_enter: bool = False,
        override: bool = False,
    ):
        tool_input = {
            "text": text,
            "press_enter": press_enter,
            "override": override,
        }
        if coordinate_x is not None:
            tool_input["coordinate_x"] = coordinate_x
        if coordinate_y is not None:
            tool_input["coordinate_y"] = coordinate_y
            
        return await self._mcp_wrapper(tool_input=tool_input)