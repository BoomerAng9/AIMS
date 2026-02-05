"""Slide editing tool for making targeted edits to slide content."""

from typing import Any
from pathlib import Path
from pydantic import BaseModel
from ii_tool.core.workspace import FileSystemValidationError
from ii_tool.tools.base import (
    ToolResult,
    ToolConfirmationDetails,
)
from .base import SlideToolBase


# Name
NAME = "SlideEdit"
DISPLAY_NAME = "Edit slide"

# Tool description
DESCRIPTION = """Performs exact string replacements in slide HTML content.

Usage:
- Use this tool instead of FileEditTool for slide content
- Makes targeted string replacements in the slide's HTML content
- The edit will FAIL if old_string is not unique in the slide
- Use replace_all=True to replace all occurrences
- Local file paths in the HTML must be absolute paths accessible by the agent
- Automatically updates the metadata.json timestamp"""

# Input schema
INPUT_SCHEMA = {
    "type": "object",
    "properties": {
        "presentation_name": {
            "type": "string",
            "description": "Name of the presentation",
        },
        "slide_number": {
            "type": "integer",
            "description": "Slide number to edit (1-based)",
            "minimum": 1,
        },
        "old_string": {"type": "string", "description": "Text to replace in the slide"},
        "new_string": {
            "type": "string",
            "description": "Replacement text (must be different from old_string)",
        },
        "replace_all": {
            "type": "boolean",
            "description": "Replace all occurrences (default false)",
            "default": False,
        },
        "update_description": {
            "type": "string",
            "description": "Optional: update the slide's description in metadata",
        },
    },
    "required": ["presentation_name", "slide_number", "old_string", "new_string"],
}


class SlideEditToolError(Exception):
    """Custom exception for slide edit tool errors."""

    pass


class SlideEditToolResultContent(BaseModel):
    """Content structure for slide edit tool results."""

    old_content: str
    new_content: str
    filepath: str


def _perform_replacement(
    content: str, old_string: str, new_string: str, replace_all: bool
) -> tuple[str, int]:
    """Perform string replacement. Returns (new_content, occurrences)."""

    # Count occurrences
    occurrences = content.count(old_string)

    if occurrences == 0:
        raise SlideEditToolError(
            "String to replace not found in slide. "
            "Make sure the old_string exactly matches the slide content, "
            "including whitespace and indentation"
        )

    # For single replacement, ensure uniqueness
    if not replace_all and occurrences > 1:
        raise SlideEditToolError(
            f"Found {occurrences} occurrences of old_string in the slide. "
            f"Either provide more context to make it unique, "
            f"or use replace_all=True to replace all occurrences"
        )

    # Perform replacement
    if replace_all:
        new_content = content.replace(old_string, new_string)
    else:
        # Replace only first occurrence
        new_content = content.replace(old_string, new_string, 1)

    return new_content, occurrences


class SlideEditTool(SlideToolBase):
    """Tool for making targeted string replacements in slides."""

    name = NAME
    display_name = DISPLAY_NAME
    description = DESCRIPTION
    input_schema = INPUT_SCHEMA
    read_only = False

    def should_confirm_execute(
        self, tool_input: dict[str, Any]
    ) -> ToolConfirmationDetails | bool:
        presentation_name = tool_input.get("presentation_name", "")
        slide_number = tool_input.get("slide_number", 1)
        old_string = tool_input.get("old_string", "")
        new_string = tool_input.get("new_string", "")

        # Truncate strings if too long
        old_preview = old_string[:200] + ("..." if len(old_string) > 200 else "")
        new_preview = new_string[:200] + ("..." if len(new_string) > 200 else "")

        return ToolConfirmationDetails(
            type="edit",
            message=f"Edit slide {slide_number} in presentation '{presentation_name}':\n"
            f"Replace: {old_preview}\n"
            f"With: {new_preview}",
        )

    async def execute(
        self,
        tool_input: dict[str, Any],
    ) -> ToolResult:
        """Execute the slide edit operation."""
        presentation_name = tool_input.get("presentation_name")
        slide_number = tool_input.get("slide_number")
        old_string = tool_input.get("old_string")
        new_string = tool_input.get("new_string")
        replace_all = tool_input.get("replace_all", False)
        update_description = tool_input.get("update_description")

        # Validate parameters
        if old_string == new_string:
            return ToolResult(
                llm_content="ERROR: old_string and new_string cannot be the same",
                is_error=True,
            )

        try:
            # Get presentation path
            presentation_path = self._get_presentation_path(presentation_name)

            # Check if presentation exists
            if not presentation_path.exists():
                return ToolResult(
                    llm_content=f"ERROR: Presentation '{presentation_name}' not found",
                    is_error=True,
                )

            # Get slide path
            slide_filename = self._get_slide_filename(slide_number)
            slide_path = presentation_path / slide_filename

            # Check if slide exists
            if not slide_path.exists():
                return ToolResult(
                    llm_content=f"ERROR: Slide {slide_number} not found in presentation '{presentation_name}'",
                    is_error=True,
                )

            # Validate the path with workspace manager
            full_slide_path = Path.cwd() / slide_path
            self.workspace_manager.validate_existing_file_path(str(full_slide_path))

            # Read current slide content
            current_content = slide_path.read_text(encoding="utf-8")

            # Perform the replacement
            new_content, occurrences = _perform_replacement(
                current_content, old_string, new_string, replace_all
            )

            # Write the new content
            slide_path.write_text(new_content, encoding="utf-8")

            # Update metadata if needed
            metadata = self._load_metadata(presentation_path)

            # Update the slide's updated_at timestamp
            slide_meta = self._find_slide_in_metadata(metadata, slide_number)
            if slide_meta:
                from datetime import datetime

                slide_meta["updated_at"] = datetime.now().isoformat()

                # Update description if provided
                if update_description:
                    slide_meta["description"] = update_description

            # Save metadata
            self._save_metadata(presentation_path, metadata)

            msg = (
                f"Modified slide {slide_number} in presentation '{presentation_name}' - "
                f"made {occurrences} replacement(s). "
                f"Review the changes and make sure they are as expected."
            )

            # Build workspace filepath (same format as preview_url in base class)
            workspace_filepath = f"/workspace/{slide_path}"

            return ToolResult(
                llm_content=msg,
                user_display_content=[
                    SlideEditToolResultContent(
                        old_content=current_content,
                        new_content=new_content,
                        filepath=workspace_filepath,
                    ).model_dump()
                ],
                is_error=False,
            )

        except (FileSystemValidationError, SlideEditToolError) as e:
            return ToolResult(llm_content=f"ERROR: {e}", is_error=True)
        except Exception as e:
            return ToolResult(
                llm_content=f"ERROR: Failed to edit slide: {str(e)}", is_error=True
            )

    async def execute_mcp_wrapper(
        self,
        presentation_name: str,
        slide_number: int,
        old_string: str,
        new_string: str,
        replace_all: bool = False,
        update_description: str = None,
    ):
        return await self._mcp_wrapper(
            tool_input={
                "presentation_name": presentation_name,
                "slide_number": slide_number,
                "old_string": old_string,
                "new_string": new_string,
                "replace_all": replace_all,
                "update_description": update_description,
            }
        )
