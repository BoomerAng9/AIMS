"""Base class and utilities for slide tools."""

import json
from pathlib import Path
from datetime import datetime
from typing import Dict, Any, Optional
from ii_tool.tools.base import BaseTool


class SlideToolBase(BaseTool):
    """Base class for all slide tools."""

    def __init__(self, workspace_manager):
        self.workspace_manager = workspace_manager
        self.presentations_dir = "presentations"

    def _sanitize_name(self, name: str) -> str:
        """Sanitize presentation name for filesystem."""
        # Replace spaces with underscores, remove special characters
        sanitized = name.replace(" ", "_")
        # Keep only alphanumeric, underscore, and hyphen
        return "".join(c for c in sanitized if c.isalnum() or c in ("_", "-"))

    def _get_presentation_path(self, presentation_name: str) -> Path:
        """Get the path to a presentation directory."""
        safe_name = self._sanitize_name(presentation_name)
        return Path(self.presentations_dir) / safe_name

    def _get_slide_filename(self, slide_number: int) -> str:
        """Generate slide filename from number."""
        return f"slide_{slide_number:03d}.html"

    def _load_metadata(self, presentation_path: Path) -> Dict[str, Any]:
        """Load presentation metadata, create if doesn't exist."""
        metadata_file = presentation_path / "metadata.json"

        if metadata_file.exists():
            try:
                return json.loads(metadata_file.read_text(encoding="utf-8"))
            except (json.JSONDecodeError, FileNotFoundError):
                # If corrupt or missing, return default
                return self._create_default_metadata()

        return self._create_default_metadata()

    def _save_metadata(self, presentation_path: Path, metadata: Dict[str, Any]) -> None:
        """Save presentation metadata."""
        # Update timestamp
        metadata["presentation"]["updated_at"] = datetime.now().isoformat()

        metadata_file = presentation_path / "metadata.json"
        metadata_file.write_text(
            json.dumps(metadata, indent=2, ensure_ascii=False), encoding="utf-8"
        )

    def _create_default_metadata(self, presentation_name: str = "") -> Dict[str, Any]:
        """Create default metadata structure."""
        now = datetime.now().isoformat()
        return {
            "presentation": {
                "name": presentation_name,
                "title": presentation_name or "Untitled Presentation",
                "description": "",
                "created_at": now,
                "updated_at": now,
            },
            "slides": [],
        }

    def _find_slide_in_metadata(
        self, metadata: Dict[str, Any], slide_number: int
    ) -> Optional[Dict[str, Any]]:
        """Find a slide by number in metadata."""
        for slide in metadata.get("slides", []):
            if slide.get("number") == slide_number:
                return slide
        return None

    def _update_slide_in_metadata(
        self,
        metadata: Dict[str, Any],
        slide_number: int,
        title: str,
        description: str,
        slide_type: str = "content",
    ) -> Dict[str, Any]:
        """Update or add slide in metadata."""
        now = datetime.now().isoformat()
        slide_id = f"slide_{slide_number:03d}"
        filename = self._get_slide_filename(slide_number)

        # Get the presentation name from metadata
        presentation_name = metadata.get("presentation", {}).get("name", "")
        safe_name = self._sanitize_name(presentation_name) if presentation_name else ""

        # Build file path and preview URL
        file_path = f"{self.presentations_dir}/{safe_name}/{filename}"
        preview_url = f"/workspace/{self.presentations_dir}/{safe_name}/{filename}"

        # Check if slide exists
        existing_slide = self._find_slide_in_metadata(metadata, slide_number)

        if existing_slide:
            # Update existing
            existing_slide["title"] = title
            existing_slide["description"] = description
            existing_slide["type"] = slide_type
            existing_slide["filename"] = filename
            existing_slide["file_path"] = file_path
            existing_slide["preview_url"] = preview_url
            existing_slide["updated_at"] = now
        else:
            # Add new slide
            new_slide = {
                "id": slide_id,
                "number": slide_number,
                "title": title,
                "description": description,
                "type": slide_type,
                "filename": filename,
                "file_path": file_path,
                "preview_url": preview_url,
                "created_at": now,
                "updated_at": now,
            }

            # Insert in correct position to maintain order
            slides = metadata.get("slides", [])
            insert_index = 0
            for i, slide in enumerate(slides):
                if slide.get("number", 0) > slide_number:
                    insert_index = i
                    break
                insert_index = i + 1

            slides.insert(insert_index, new_slide)
            metadata["slides"] = slides

        return metadata

    def _validate_html_content(self, content: str, mode: str = "SLIDE") -> bool:
        """Validate HTML follows system prompt guidelines."""
        # Basic validation - check for required dimension styles
        if mode == "SLIDE":
            # Check for 1280x720 dimensions
            required_indicators = ["1280", "720"]
        else:  # POSTER mode
            # Check for 720px width
            required_indicators = ["720"]

        # Simple check - more sophisticated validation can be added
        return any(indicator in content for indicator in required_indicators)
