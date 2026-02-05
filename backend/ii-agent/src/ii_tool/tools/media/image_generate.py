import httpx

from typing import Any, Dict
from pathlib import Path
from ii_tool.tools.base import BaseTool, ToolResult, FileURLContent
from ii_tool.core.workspace import WorkspaceManager, FileSystemValidationError
from ii_tool.core.tool_server import get_tool_server_url, set_tool_server_url


# Name
NAME = "generate_image"
DISPLAY_NAME = "Generate Image"

# Tool description
DESCRIPTION = """Generates high-quality image from text prompt. The generated image will be saved as a PNG file to your specified workspace location

Use this tool to create custom images for web applications, presentations, or documentation:
- Creating hero images with emotional resonance and clear focal points for landing pages
- Generating product images with clean backgrounds and professional lighting
- Generating high-impact visuals for marketing materials and presentations
- Creating custom icons, logos, or UI elements with consistent style

For best results, structure your prompts with these elements:
1. Subject Description: Clearly define the main focus (person, object, scene, concept). Example:
- "A modern smartphone", "Professional businesswoman", "Mountain landscape"
2. Visual Style & Medium: Specify the artistic approach and rendering style. Example:
- Photography styles: "Professional headshot", "Product photography with studio lighting"
- Digital art: "Digital illustration", "3D render", "Minimalist vector art"
- Traditional art: "Oil painting", "Watercolor", "Pencil sketch", "Cartoon style"
3. Composition & Setting: Describe the environment, background, and spatial arrangement. Example:
- "Clean white background", "Modern office environment", "Sunset over ocean"
- "Close-up view", "Wide angle shot", "Bird's eye perspective"
4. Lighting & Mood: Enhance atmosphere and visual appeal. Example:
- "Soft natural lighting", "Dramatic shadows", "Warm golden hour light"
- "Professional studio lighting", "Cinematic lighting", "Bright and airy"
5. Technical Specifications: Add quality and detail modifiers. Example:
- "High resolution", "Sharp focus", "Detailed textures", "Professional quality"
- "Clean composition", "Balanced colors", "High contrast"

Supported Aspect Ratios:
- 1:1 (Square) - Perfect for social media posts, avatars, icons
- 16:9 (Landscape) - Ideal for banners, headers, presentation slides  
- 9:16 (Portrait) - Great for mobile screens, stories, vertical banners
- 4:3 (Standard) - Classic format for general content, presentations
- 3:4 (Portrait) - Suitable for posters, flyers, portrait-oriented content"""

# Input schema
INPUT_SCHEMA = {
        "type": "object",
        "properties": {
            "prompt": {
                "type": "string",
                "description": "A detailed description of the image to be generated",
            },
            "output_path": {
                "type": "string",
                "description": "The absolute path for the output PNG image file within the workspace (e.g., '/workspace/generated_images/my_image.png'). Must end with .png",
            },
            "aspect_ratio": {
                "type": "string",
                "enum": ["1:1", "16:9", "9:16", "4:3", "3:4"],
                "default": "1:1",
                "description": "The aspect ratio for the generated image",
            },
        },
        "required": ["prompt", "output_path"],
    }

DEFAULT_TIMEOUT = 120

class ImageGenerateTool(BaseTool):
    name = NAME
    display_name = DISPLAY_NAME
    description = DESCRIPTION
    input_schema = INPUT_SCHEMA
    read_only = True

    def __init__(
        self,
        workspace_manager: WorkspaceManager,
        credential: Dict,
        tool_server_url: str | None = None,
    ):
        super().__init__()
        if tool_server_url:
            set_tool_server_url(tool_server_url)
        self.workspace_manager = workspace_manager
        self.credential = credential

    async def execute(
        self,
        tool_input: dict[str, Any],
    ) -> ToolResult:
        output_path = tool_input["output_path"]
        
        # Validate output path is absolute and within workspace
        try:
            self.workspace_manager.validate_path(output_path)
        except FileSystemValidationError as e:
            return ToolResult(
                llm_content=f"Error: {e}",
                is_error=True
            )
        
        if not output_path.lower().endswith(".png"):
            return ToolResult(
                llm_content="Error: output_path must end with .png",
                is_error=True
            )

        output_path = Path(output_path).resolve()
        output_path.parent.mkdir(parents=True, exist_ok=True)

        # generate the image
        tool_server_url = get_tool_server_url()
        async with httpx.AsyncClient() as client:
            payload = {
                "prompt": tool_input["prompt"],
                "aspect_ratio": tool_input["aspect_ratio"],
                "session_id": self.credential['session_id'],
            }
            response = await client.post(
                f"{tool_server_url}/image-generation",
                json=payload,
                headers={
                    "Authorization": f"Bearer {self.credential['user_api_key']}",
                },
                timeout=DEFAULT_TIMEOUT,
            )
            response.raise_for_status()
            response_data = response.json()

        image_url = response_data.get("url")
        image_mime_type = response_data.get("mime_type") or "image/png"
        image_size = response_data.get("size") or 0
        search_results = response_data.get("search_results") or []

        if not image_url:
            if search_results:
                summary_path = self._write_search_summary(
                    output_path=output_path,
                    prompt=tool_input["prompt"],
                    search_results=search_results,
                )
                return ToolResult(
                    llm_content=(
                        "Image generation was unavailable. "
                        f"DuckDuckGo image search results were saved to {summary_path}."
                    ),
                )
            return ToolResult(
                llm_content="Error: Image generation did not return a valid image URL",
                is_error=True,
            )

        # download the image
        async with httpx.AsyncClient() as download_client:
            download_response = await download_client.get(image_url)
            download_response.raise_for_status()
            
            with open(output_path, "wb") as f:
                f.write(download_response.content)

        return ToolResult(
            llm_content=f"Image generated and saved to {output_path}",
            user_display_content=FileURLContent(
                type="file_url",
                url=image_url,
                mime_type=image_mime_type,
                name=output_path.name,
                size=image_size,
            ).model_dump(),
        )
            
    async def execute_mcp_wrapper(
        self,
        prompt: str,
        output_path: str,
        aspect_ratio: str = "1:1",
    ):
        return await self._mcp_wrapper(
            tool_input={
                "prompt": prompt,
                "output_path": output_path,
                "aspect_ratio": aspect_ratio,
            }
        )

    def _write_search_summary(
        self,
        output_path: Path,
        prompt: str,
        search_results: list[dict[str, Any]],
    ) -> Path:
        summary_path = output_path.with_suffix(".md")
        lines = [
            "# DuckDuckGo image search results",
            f"Prompt: {prompt}",
            "",
        ]
        for idx, result in enumerate(search_results, start=1):
            title = result.get("title") or "Untitled image"
            source = result.get("source") or "Unknown source"
            image_url = result.get("image_url") or result.get("url") or ""
            lines.append(f"{idx}. **{title}**  \n   Source: {source}")
            if image_url:
                lines.append(f"   URL: {image_url}")
            lines.append("")

        summary_path.parent.mkdir(parents=True, exist_ok=True)
        summary_path.write_text("\n".join(lines), encoding="utf-8")
        return summary_path
