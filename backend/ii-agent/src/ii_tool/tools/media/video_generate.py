import base64
import os
import httpx
from pathlib import Path
from typing import Any, Dict

from ii_tool.tools.base import BaseTool, ToolResult, FileURLContent
from ii_tool.core.workspace import WorkspaceManager, FileSystemValidationError
from ii_tool.core.tool_server import get_tool_server_url, set_tool_server_url


_EXTENSION_TO_MIMETYPE = {
    "png": "image/png",
    "jpg": "image/jpeg",
    "jpeg": "image/jpeg",
    "webp": "image/webp",
}

DEFAULT_TIMEOUT = 300

class VideoGenerateTool(BaseTool):
    name = "generate_video"
    display_name = "Generate Video"
    description = """Generates high-quality video from text prompt or text combined with input image. The generated video will be saved as an MP4 file to your specified workspace location

Two modes of operation:
- Text-to-video: Generate a video entirely from a text prompt
- Image-to-video: Generate a video by combining a text prompt with an input image, allowing you to guide the look and feel more precisely

For best results, include the following elements in your prompt:
- Subject: The object, person, animal, or scenery that you want in your video
- Context: The background or setting in which the subject is placed
- Action: What the subject is doing (for example, walking, running, or turning their head)
- Style: This can be general or very specific. Consider using specific film style keywords, such as horror film, film noir, or animated styles like cartoon style render
- Camera motion (Optional): What the camera is doing, such as an aerial view, eye-level, top-down shot, or low-angle shot
- Composition (Optional): How the shot is framed, such as a wide shot, close-up, or extreme close-up
- Ambiance (Optional): How color and light contribute to the scene, such as blue tones, night, or warm tones

NOTE:
- As the video length increases, ensure the prompt includes richer detail to guide scene development
- Prefer short video generation (5 - 8 seconds) unless the user explicitly requests a longer video
- Avoid violence, gore or any other inappropriate, unsafe terms
"""
    input_schema = {
        "type": "object",
        "properties": {
            "prompt": {
                "type": "string",
                "description": "A detailed description of the video to be generated.",
            },
            "output_path": {
                "type": "string",
                "description": "The absolute path for the output MP4 video file within the workspace (e.g., '/workspace/generated_videos/my_video.mp4'). Must end with .mp4.",
            },
            "aspect_ratio": {
                "type": "string",
                "enum": ["16:9", "9:16"],
                "default": "16:9",
                "description": "The aspect ratio for the generated video.",
            },
            "duration_seconds": {
                "type": "integer",
                "description": "The duration of the video in seconds (5 <= duration_seconds <= 30)",
            },
            "input_image_path": {
                "type": "string",
                "description": "The absolute path to the input image file. If provided, the video will be started from the image.",
            },
        },
        "required": ["prompt", "output_path"],
    }
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
        prompt = tool_input["prompt"]
        output_path = tool_input["output_path"]
        aspect_ratio = tool_input.get("aspect_ratio", "16:9")
        duration_seconds = int(tool_input.get("duration_seconds", 5))
        input_image_path = tool_input.get("input_image_path", None)

        # Validate output path is absolute and within workspace
        try:
            self.workspace_manager.validate_path(output_path)
        except FileSystemValidationError as e:
            return ToolResult(llm_content=f"Error: {e}", is_error=True)

        if not output_path.lower().endswith(".mp4"):
            return ToolResult(llm_content=f"Error: output_path: `{output_path}` must end with .mp4", is_error=True)

        output_path = Path(output_path).resolve()
        output_path.parent.mkdir(parents=True, exist_ok=True)

        if duration_seconds < 5 or duration_seconds > 30:
            return ToolResult(llm_content=f"Error: duration_seconds: `{duration_seconds}` must be between 5 and 30", is_error=True)

        payload = {
            "prompt": prompt,
            "aspect_ratio": aspect_ratio,
            "duration_seconds": duration_seconds,
            "session_id": self.credential['session_id'],
        }

        if input_image_path:
            # Validate input image path is absolute and within workspace
            try:
                self.workspace_manager.validate_path(input_image_path)
            except FileSystemValidationError as e:
                return ToolResult(llm_content=f"Error: {e}", is_error=True)
            
            if not os.path.exists(input_image_path):
                return ToolResult(llm_content=f"Error: input_image_path: `{input_image_path}` does not exist", is_error=True)

            with open(input_image_path, "rb") as f:
                image_base64 = base64.b64encode(f.read()).decode("utf-8")
                image_extension = input_image_path.split(".")[-1].lower()
                image_mime_type = _EXTENSION_TO_MIMETYPE.get(image_extension)
                if not image_mime_type:
                    return ToolResult(llm_content=f"Error: Unsupported image format: {image_extension}. Supported formats: {', '.join(_EXTENSION_TO_MIMETYPE.keys())}", is_error=True)
                payload["image_base64"] = image_base64
                payload["image_mime_type"] = image_mime_type
        
        # generate the video
        tool_server_url = get_tool_server_url()
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{tool_server_url}/video-generation",
                json=payload,
                headers={
                    "Authorization": f"Bearer {self.credential['user_api_key']}",
                },
                timeout=DEFAULT_TIMEOUT,
            )
            response.raise_for_status()
            response_data = response.json()
        
        video_url = response_data.get("url")
        video_mime_type = response_data.get("mime_type") or "video/mp4"
        video_size = response_data.get("size") or 0
        search_results = response_data.get("search_results") or []

        if not video_url or (video_mime_type and not video_mime_type.startswith("video/")):
            if search_results:
                summary_path = self._write_search_summary(
                    output_path=output_path,
                    prompt=prompt,
                    search_results=search_results,
                )
                return ToolResult(
                    llm_content=(
                        "Video generation was unavailable. "
                        f"DuckDuckGo video search results were saved to {summary_path}."
                    ),
                )

            return ToolResult(
                llm_content="Error: Video generation did not return a downloadable video",
                is_error=True,
            )

        # download the video
        async with httpx.AsyncClient() as download_client:
            download_response = await download_client.get(video_url)
            download_response.raise_for_status()

            with open(output_path, "wb") as f:
                f.write(download_response.content)

        user_display_content = None
        if video_url:
            user_display_content = FileURLContent(
                type="file_url",
                url=video_url,
                mime_type=video_mime_type,
                name=output_path.name,
                size=video_size,
            ).model_dump()

        return ToolResult(
            llm_content=f"Video generated and saved to {output_path}",
            user_display_content=user_display_content,
        )

    async def execute_mcp_wrapper(self, 
        prompt: str, 
        output_path: str, 
        aspect_ratio: str = "16:9",
        duration_seconds: int = 5, 
        input_image_path: str | None = None,
    ):        
        return await self._mcp_wrapper(
            tool_input={
                "prompt": prompt,
                "output_path": output_path,
                "aspect_ratio": aspect_ratio,
                "duration_seconds": duration_seconds,
                "input_image_path": input_image_path,
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
            "# DuckDuckGo video search results",
            f"Prompt: {prompt}",
            "",
        ]
        for idx, result in enumerate(search_results, start=1):
            title = result.get("title") or "Untitled video"
            description = result.get("description") or ""
            video_url = result.get("video_url") or result.get("url") or ""
            duration = result.get("duration") or ""
            source = result.get("source") or "Unknown source"

            lines.append(f"{idx}. **{title}** ({source})")
            if duration:
                lines.append(f"   Duration: {duration}")
            if description:
                lines.append(f"   {description}")
            if video_url:
                lines.append(f"   URL: {video_url}")
            lines.append("")

        summary_path.parent.mkdir(parents=True, exist_ok=True)
        summary_path.write_text("\n".join(lines), encoding="utf-8")
        return summary_path
