import asyncio

from typing import Any, Optional
from ii_tool.browser.browser import Browser
from ii_tool.tools.base import BaseTool, ToolResult, ImageContent, TextContent


class BrowserEnterMultipleTextsTool(BaseTool):
    name = "browser_enter_multi_texts"
    display_name = "Browser Enter Multiple Texts"
    description = """Enter text on multiple input fields in sequence with a single call. Useful for filling forms like login (username + password), registration (name + email + password), or any multi-field form. 

Examples:
- Login form: Fill username at (300, 200) and password at (300, 250)
- Registration: Fill name at (200, 150), email at (200, 200), password at (200, 250)
- Contact form: Fill name, email, phone number, and message fields
- Profile update: Fill multiple profile fields like first name, last name, phone, address

Each field will be clicked and filled sequentially in the order provided."""
    input_schema = {
        "type": "object",
        "properties": {
            "enter_texts": {
                "type": "array",
                "description": "List of text entries to input on different fields",
                "items": {
                    "type": "object",
                    "properties": {
                        "text": {"type": "string", "description": "Text to enter"},
                        "coordinate_x": {"type": "number", "description": "X coordinate to click before entering text"},
                        "coordinate_y": {"type": "number", "description": "Y coordinate to click before entering text"},
                        "press_enter": {
                            "type": "boolean",
                            "description": "If True, press Enter after entering this text. Default is False.",
                            "default": False
                        },
                        "override": {
                            "type": "boolean",
                            "description": "If True, the current text in the element will be cleared before entering new text. If False, the new text will be appended to the existing text. Default is False.",
                            "default": False,
                        },
                    },
                    "required": ["text", "coordinate_x", "coordinate_y"],
                },
                "minItems": 1
            },
        },
        "required": ["enter_texts"],
    }
    read_only = False

    def __init__(self, browser: Browser):
        self.browser = browser

    async def execute(
        self,
        tool_input: dict[str, Any],
    ) -> ToolResult:
        try:
            enter_texts = tool_input["enter_texts"]
            
            page = await self.browser.get_current_page()
            results = []
            
            for i, entry in enumerate(enter_texts):
                text = entry["text"]
                coordinate_x = entry["coordinate_x"]
                coordinate_y = entry["coordinate_y"]
                press_enter = entry.get("press_enter", False)
                override = entry.get("override", False)
                # Click on the field
                await page.mouse.click(coordinate_x, coordinate_y)
                await asyncio.sleep(0.5)
                
                # Select all and clear existing text
                if override:
                    await page.keyboard.press("ControlOrMeta+a")
                    await asyncio.sleep(0.1)
                    await page.keyboard.press("Backspace")
                    await asyncio.sleep(0.1)
                
                # Type the text
                await page.keyboard.type(text)
                
                # Press enter if requested
                if press_enter:
                    await page.keyboard.press("Enter")
                    await asyncio.sleep(1)
                
                results.append(f'Field {i+1}: Entered "{text}" at ({coordinate_x}, {coordinate_y})')
                
                # Small delay between fields
                await asyncio.sleep(0.3)

            msg = f"Successfully entered text in {len(enter_texts)} fields:\n" + "\n".join(results)
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
            error_msg = f"Multiple text entry operation failed: {type(e).__name__}: {str(e)}"
            return ToolResult(llm_content=error_msg, is_error=True)

    async def execute_mcp_wrapper(
        self,
        enter_texts: list[dict[str, Any]],
    ):
        return await self._mcp_wrapper(
            tool_input={
                "enter_texts": enter_texts,
            }
        )