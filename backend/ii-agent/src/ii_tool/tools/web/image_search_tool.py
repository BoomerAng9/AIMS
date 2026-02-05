import httpx
import json
from typing import Any, Dict
from ii_tool.tools.base import BaseTool, ToolResult
from ii_tool.core.tool_server import get_tool_server_url, set_tool_server_url


# Name
NAME = "image_search"
DISPLAY_NAME = "Image Search"

# Tool description
DESCRIPTION = """Searches the web for images based on your query and returns relevant results with metadata.

Usage:
- Use this tool for factual or real-world image needs for your project, website, presentation, etc.
- Get high-quality images by setting the minimum width and height with higher values
- Use the aspect ratio and image type filters to find images that match your project's design requirements
- For non-factual scenarios, artistic or creative image needs, use `generate_image` tool instead

Don't worry about the license or copyright issues. This tool is designed to find images that are free to use and are not copyrighted.
Use `read_remote_image` to check the quality and content of returned images before incorporating them into your project."""

# Input schema
INPUT_SCHEMA = {
    "type": "object",
    "properties": {
        "query": {
            "type": "string", 
            "description": "The search terms to find images. Use descriptive keywords for best results (e.g., 'modern office interior', 'abstract geometric pattern', 'fresh vegetables on white background')"
        },
        "aspect_ratio": {
            "type": "string", 
            "enum": ["all", "square", "tall", "wide", "panoramic"], 
            "default": "all",
            "description": "Filter images by aspect ratio. Options: 'all' (any ratio), 'square' (1:1, ideal for social media posts), 'tall' (portrait orientation), 'wide' (16:9 or similar, perfect for banners), 'panoramic' (ultra-wide for headers). Default is 'all'."
        },
        "image_type": {
            "type": "string", 
            "enum": ["all", "face", "photo", "clipart", "lineart", "animated"], 
            "default": "all",
            "description": "Filter by image type. Options: 'all' (any type), 'face' (portraits and people), 'photo' (realistic photographs), 'clipart' (graphics and illustrations), 'lineart' (drawings and sketches), 'animated' (GIFs and animations). Default is 'all'."
        },
        "min_width": {
            "type": "number", 
            "default": 300,
            "description": "Minimum image width in pixels. Use this to ensure images meet resolution requirements (e.g., 1920 for HD displays, 300 for thumbnails). Default is 300."
        },
        "min_height": {
            "type": "number", 
            "default": 300,
            "description": "Minimum image height in pixels. Use this to ensure images meet resolution requirements (e.g., 1080 for HD displays, 300 for thumbnails). Default is 300."
        },
        "is_product": {
            "type": "boolean", 
            "default": False,
            "description": "Set to true to prioritize product images from shopping and e-commerce sites. Useful for finding commercial product photos, catalog images, and shopping-related visuals. Default is false."
        },
    },
    "required": ["query"],
}

MAX_RESULTS = 5
DEFAULT_TIMEOUT = 120


class ImageSearchTool(BaseTool):
    name = NAME
    display_name = DISPLAY_NAME
    description = DESCRIPTION
    input_schema = INPUT_SCHEMA
    read_only = True

    def __init__(self, credential: Dict, tool_server_url: str | None = None):
        super().__init__()
        if tool_server_url:
            set_tool_server_url(tool_server_url)
        self.credential = credential

    def _format_results(self, results: list[dict[str, Any]]) -> str:
        """The results is the list of dicts with the following keys:
        {
            "title": str,
            "source": str,
            "image_url": str,
            "width": int,
            "height": int,
            "is_product": bool,
        }
        """

        llm_content = ""
        for result in results:
            llm_content += f"Title: {result['title']}\n"
            llm_content += f"Source: {result['source']}\n"
            llm_content += f"Image URL: {result['image_url']}\n"
            llm_content += f"Width: {result['width']}\n"
            llm_content += f"Height: {result['height']}\n"
            llm_content += "--------------------------------\n"
         
        return llm_content

    async def execute(
        self,
        tool_input: dict[str, Any],
    ) -> ToolResult:
        query = tool_input["query"]
        aspect_ratio = tool_input.get("aspect_ratio", "all")
        image_type = tool_input.get("image_type", "all")
        min_width = tool_input.get("min_width", 0)
        min_height = tool_input.get("min_height", 0)
        is_product = tool_input.get("is_product", False)

        tool_server_url = get_tool_server_url()
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{tool_server_url}/image-search",
                    json={
                        "query": query,
                        "aspect_ratio": aspect_ratio,
                        "image_type": image_type,
                        "min_width": min_width,
                        "min_height": min_height,
                        "is_product": is_product,
                        "session_id": self.credential['session_id'],
                    },
                    headers={
                        "Authorization": f"Bearer {self.credential['user_api_key']}",
                    },
                    timeout=DEFAULT_TIMEOUT,
                )
                response.raise_for_status()
                response_data = response.json()

            results = response_data["results"][:MAX_RESULTS]

            if len(results) == 0:
                return ToolResult(
                    llm_content="No results found. Please try again with different keywords, broader terms or try updating the parameters",
                    error=False,
                )

            llm_content = self._format_results(results)
            
            # TODO: custom the user display content
            return ToolResult(
                llm_content=llm_content,
                user_display_content=json.dumps(results, indent=2),
            )
        except httpx.TimeoutException:
            return ToolResult(
                llm_content=f"The search engine is taking too long to respond. It might be overloaded.",
                error=True,
            )
        except httpx.NetworkError:
            return ToolResult(
                llm_content=f"The search engine is unreachable (network issue).",
                error=True,
            )
        except httpx.HTTPStatusError as e:
            return ToolResult(
                llm_content=f"The search request failed: {e}.",
                error=True,
            )
    async def execute_mcp_wrapper(self, query: str, aspect_ratio: str = "all", image_type: str = "all", min_width: int = 0, min_height: int = 0, is_product: bool = False):
        return await self._mcp_wrapper(
            tool_input={
                "query": query,
                "aspect_ratio": aspect_ratio,
                "image_type": image_type,
                "min_width": min_width,
                "min_height": min_height,
                "is_product": is_product,
            }
        )
