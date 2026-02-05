import httpx
import base64
import json
import magic
from typing import Any
from ii_tool.tools.base import BaseTool, ToolResult, ImageContent, FileURLContent

NAME = "read_remote_image"
DISPLAY_NAME = "Read Remote Image"

DESCRIPTION = """Reads image from given URL

Usage
- View images from web pages or direct URLs
- Use after image_search tool to check the quality and content of returned image URLs
- For local image, use `Read` tool"""

INPUT_SCHEMA = {
    "type": "object",
    "properties": {
        "url": {
            "type": "string",
            "description": "The URL of the image to read. Must be a direct link to an image file (e.g., https://example.com/image.jpg)",
        },
    },
    "required": ["url"],
}

DEFAULT_TIMEOUT = 30
MAX_IMAGE_SIZE = 50 * 1024 * 1024  # 50MB max
SUPPORTED_MIME_TYPES = {'image/jpeg', 'image/png', 'image/gif', 'image/webp'}


class ReadRemoteImageTool(BaseTool):
    name = NAME
    display_name = DISPLAY_NAME
    description = DESCRIPTION
    input_schema = INPUT_SCHEMA
    read_only = True

    def __init__(self):
        super().__init__()

    async def execute(
        self,
        tool_input: dict[str, Any],
    ) -> ToolResult:
        url = tool_input["url"]

        try:
            async with httpx.AsyncClient(timeout=DEFAULT_TIMEOUT, follow_redirects=True) as client:
                # First, make a HEAD request to check content type and size
                head_response = await client.head(url)
                content_type = head_response.headers.get("content-type", "")
                content_length = head_response.headers.get("content-length")
                
                # Check if it's an image
                if not content_type.startswith("image/"):
                    return ToolResult(
                        llm_content=f"Error: The URL does not point to an image. Content-Type: {content_type}",
                        is_error=True,
                    )
                
                # Check file size if available
                if content_length and int(content_length) > MAX_IMAGE_SIZE:
                    size_mb = int(content_length) / (1024 * 1024)
                    return ToolResult(
                        llm_content=f"Error: Image file is too large ({size_mb:.2f} MB). Maximum allowed size is {MAX_IMAGE_SIZE / (1024 * 1024)} MB.",
                        is_error=True,
                    )
                
                # Fetch the actual image
                response = await client.get(url)
                response.raise_for_status()
                
                image_data = response.content
                mime_type = magic.from_buffer(image_data, mime=True)
                if mime_type not in SUPPORTED_MIME_TYPES:
                    return ToolResult(
                        llm_content=f"Error: The image format {mime_type} is not supported. Supported formats: {', '.join(SUPPORTED_MIME_TYPES)}",
                        is_error=True,
                    )
                
                # Encode image to base64
                base64_image = base64.b64encode(image_data).decode('utf-8')

                return ToolResult(
                    llm_content=[
                        ImageContent(
                            type="image",
                            data=base64_image,
                            mime_type=mime_type
                        )
                    ],
                    user_display_content=FileURLContent(
                        type="file_url",
                        url=url,
                        mime_type=mime_type,
                        name=url.split("/")[-1],
                        size=len(image_data)
                    ).model_dump()
                )
                
        except httpx.HTTPStatusError as e:
            return ToolResult(
                llm_content=f"Error fetching image: HTTP {e.response.status_code} - {e.response.text}",
                is_error=True,
            )
        except httpx.TimeoutException:
            return ToolResult(
                llm_content=f"Error: Request timed out after {DEFAULT_TIMEOUT} seconds. The image may be too large or the server may be slow.",
                is_error=True,
            )

    async def execute_mcp_wrapper(self, url: str):
        return await self._mcp_wrapper(
            tool_input={
                "url": url,
            }
        )