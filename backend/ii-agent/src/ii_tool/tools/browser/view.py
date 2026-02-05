from typing import Any
from ii_tool.browser.browser import Browser
from ii_tool.tools.base import BaseTool, ToolResult, ImageContent, TextContent


class BrowserViewTool(BaseTool):
    name = "browser_view_interactive_elements"
    display_name = "Browser View Interactive Elements"
    description = "Return the visible interactive elements on the current page"
    input_schema = {"type": "object", "properties": {}, "required": []}
    read_only = False

    def __init__(self, browser: Browser):
        self.browser = browser

    async def execute(
        self,
        tool_input: dict[str, Any],
    ) -> ToolResult:
        try:
            state = await self.browser.update_state()

            highlighted_elements = "<highlighted_elements>\n"
            if state.interactive_elements:
                for element in state.interactive_elements.values():
                    start_tag = f"[{element.index}]<{element.tag_name}"

                    if element.input_type:
                        start_tag += f' type="{element.input_type}"'

                    start_tag += ">"
                    element_text = element.text.replace("\n", " ")
                    highlighted_elements += (
                        f"{start_tag}{element_text}</{element.tag_name}>\n"
                    )
            highlighted_elements += "</highlighted_elements>"

            msg = f"""Current URL: {state.url}

Current viewport information:
{highlighted_elements}"""

            text_content = TextContent(type="text", text=msg)
            image_content = ImageContent(type="image", data=state.screenshot_with_highlights, mime_type="image/png")
            return ToolResult(
                llm_content=[
                    image_content,
                    text_content
                ],
                user_display_content=image_content.model_dump()
            )
        except Exception as e:
            error_msg = f"View interactive elements operation failed: {type(e).__name__}: {str(e)}"
            return ToolResult(llm_content=error_msg, is_error=True)

    async def execute_mcp_wrapper(self):
        return await self._mcp_wrapper(tool_input={})