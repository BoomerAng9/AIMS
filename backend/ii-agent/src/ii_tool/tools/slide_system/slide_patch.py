"""Slide patching tool for applying patches to slide presentations."""

from pathlib import Path
from enum import Enum
import textwrap
from typing import Optional, Any
from pydantic import BaseModel, Field
from datetime import datetime

from ii_tool.core.workspace import FileSystemValidationError
from ii_tool.tools.base import (
    ToolResult,
    ToolConfirmationDetails,
)
from .base import SlideToolBase

# Name
NAME = "slide_apply_patch"
DISPLAY_NAME = "Apply Slide Patch"

DEFINITION = textwrap.dedent(
    r"""
start: begin_patch hunk+ end_patch
begin_patch: "*** Begin Slide Patch" LF
end_patch: "*** End Slide Patch" LF?

hunk: add_hunk | update_hunk
add_hunk: "*** Add Slide: " presentation_name "/" slide_number LF slide_metadata? add_line+
update_hunk: "*** Update Slide: " presentation_name "/" slide_number LF slide_metadata? change?

presentation_name: /([^/]+)/
slide_number: /(\d+)/
slide_metadata: "*** Metadata: " title_line description_line type_line?
title_line: "Title: " /(.*)/ LF
description_line: "Description: " /(.*)/ LF
type_line: "Type: " /(.*)/ LF

add_line: "+" /(.*)/ LF -> line

change: (change_context | change_line)+ eof_line?
change_context: ("@@" | "@@ " /(.+)/) LF
change_line: ("+" | "-" | " ") /(.*)/ LF
eof_line: "*** End of Slide" LF

%import common.LF
"""
)

FORMAT = {"type": "custom", "syntax": "lark", "definition": DEFINITION}

# Tool description
DESCRIPTION = """Use the `slide_apply_patch` tool to create or edit slides in presentations.

Your patch language follows this format:

*** Begin Slide Patch
[ one or more slide operations ]
*** End Slide Patch

Within that envelope, you can perform three types of operations:

*** Add Slide: <presentation_name>/<slide_number> - create a new slide
*** Update Slide: <presentation_name>/<slide_number> - patch an existing slide

For Add and Update operations, you can optionally include metadata:
*** Metadata:
Title: <slide title>
Description: <slide description>
Type: <slide type (cover, content, chart, conclusion, etc.)>

Examples:

1. Creating a new slide:
*** Begin Slide Patch
*** Add Slide: my_presentation/1
*** Metadata:
Title: Introduction
Description: Opening slide with title and agenda
Type: cover
+<!DOCTYPE html>
+<html lang="en">
+<head>
+    <meta charset="UTF-8">
+    <title>Introduction</title>
+</head>
+<body>
+    <h1>Welcome</h1>
+</body>
+</html>
*** End Slide Patch

2. Updating an existing slide:
*** Begin Slide Patch
*** Update Slide: my_presentation/2
*** Metadata:
Title: Updated Title
Description: Modified slide content
@@ <h1 class="title">
-    Old Title
+    New Title
*** End Slide Patch

3. Multiple operations:
*** Begin Slide Patch
*** Update Slide: workshop/1
@@ <title>
-Workshop Introduction
+Advanced Workshop Introduction
*** Add Slide: workshop/5
*** Metadata:
Title: Conclusion
Description: Final slide with summary
Type: conclusion
+<!DOCTYPE html>
+<html>
+<body>
+    <h1>Thank You!</h1>
+</body>
+</html>
*** End Slide Patch

Important notes:
- Presentation names and slide numbers are specified as: presentation_name/slide_number
- Slide numbers are 1-based (slide 1, not slide 0)
- When updating slides, use context lines (with spaces) to uniquely identify the location
- For HTML content, ensure proper formatting and structure
- All local file paths in HTML must be absolute paths accessible by the agent
- The tool automatically updates metadata.json timestamps
"""

SHORT_DESCRIPTION = DESCRIPTION

# Input schema
INPUT_SCHEMA = {
    "type": "object",
    "properties": {
        "input": {
            "type": "string",
            "description": "The slide_apply_patch command that you wish to execute.",
        }
    },
    "required": ["input"],
}


# Core classes
class ActionType(str, Enum):
    ADD = "add"
    UPDATE = "update"


class SlideMetadata(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    type: Optional[str] = None


class SlideChange(BaseModel):
    type: ActionType
    presentation_name: str
    slide_number: int
    old_content: Optional[str] = None
    new_content: Optional[str] = None
    metadata: Optional[SlideMetadata] = None


class SlideCommit(BaseModel):
    changes: list[SlideChange] = Field(default_factory=list)


class Chunk(BaseModel):
    orig_index: int = -1
    del_lines: list[str] = Field(default_factory=list)
    ins_lines: list[str] = Field(default_factory=list)


class SlidePatchAction(BaseModel):
    type: ActionType
    presentation_name: str
    slide_number: int
    new_content: Optional[str] = None
    chunks: list[Chunk] = Field(default_factory=list)
    metadata: Optional[SlideMetadata] = None


class SlidePatch(BaseModel):
    actions: list[SlidePatchAction] = Field(default_factory=list)


class SlideParser(BaseModel):
    lines: list[str] = Field(default_factory=list)
    index: int = 0
    patch: SlidePatch = Field(default_factory=SlidePatch)
    fuzz: int = 0
    current_slides: dict[tuple[str, int], str] = Field(default_factory=dict)

    def is_done(self, prefixes: Optional[tuple[str, ...]] = None) -> bool:
        if self.index >= len(self.lines):
            return True
        if prefixes and self.lines[self.index].startswith(prefixes):
            return True
        return False

    def startswith(self, prefix: str) -> bool:
        if self.index >= len(self.lines):
            return False
        return self.lines[self.index].startswith(prefix)

    def read_str(self, prefix: str = "", return_everything: bool = False) -> str:
        if self.index >= len(self.lines):
            return ""
        if self.lines[self.index].startswith(prefix):
            if return_everything:
                text = self.lines[self.index]
            else:
                text = self.lines[self.index][len(prefix) :]
            self.index += 1
            return text
        return ""

    def parse_metadata(self) -> Optional[SlideMetadata]:
        """Parse slide metadata if present."""
        if not self.startswith("*** Metadata:"):
            return None

        self.index += 1  # Skip metadata header
        metadata = SlideMetadata()

        # Parse Title
        title_line = self.read_str("Title: ")
        if title_line:
            metadata.title = title_line.strip()

        # Parse Description
        desc_line = self.read_str("Description: ")
        if desc_line:
            metadata.description = desc_line.strip()

        # Parse Type (optional)
        type_line = self.read_str("Type: ")
        if type_line:
            metadata.type = type_line.strip()

        return metadata

    def parse(self):
        while not self.is_done(("*** End Slide Patch",)):
            # Skip empty lines
            if self.index < len(self.lines) and self.lines[self.index].strip() == "":
                self.index += 1
                continue

            # Parse Update Slide
            line = self.read_str("*** Update Slide: ")
            if line:
                presentation_name, slide_number = self._parse_slide_path(line)
                metadata = self.parse_metadata()

                key = (presentation_name, slide_number)
                if key not in self.current_slides:
                    raise DiffError(
                        f"Update Slide Error: Slide {presentation_name}/{slide_number} not found"
                    )

                text = self.current_slides[key]
                action = self.parse_update_slide(text)
                action.presentation_name = presentation_name
                action.slide_number = slide_number
                action.metadata = metadata
                self.patch.actions.append(action)
                continue

            # Parse Add Slide
            line = self.read_str("*** Add Slide: ")
            if line:
                presentation_name, slide_number = self._parse_slide_path(line)
                metadata = self.parse_metadata()
                action = self.parse_add_slide()
                action.presentation_name = presentation_name
                action.slide_number = slide_number
                action.metadata = metadata
                self.patch.actions.append(action)
                continue

            raise DiffError(f"Unknown Line: {self.lines[self.index]}")

        if not self.startswith("*** End Slide Patch"):
            raise DiffError("Missing End Slide Patch")
        self.index += 1

    def _parse_slide_path(self, path_str: str) -> tuple[str, int]:
        """Parse presentation_name/slide_number format."""
        parts = path_str.strip().split("/")
        if len(parts) != 2:
            raise DiffError(f"Invalid slide path format: {path_str}")
        try:
            return parts[0], int(parts[1])
        except ValueError:
            raise DiffError(f"Invalid slide number: {parts[1]}")

    def parse_update_slide(self, text: str) -> SlidePatchAction:
        """Parse update slide action similar to parse_update_file."""
        action = SlidePatchAction(
            type=ActionType.UPDATE, presentation_name="", slide_number=0
        )
        lines = text.split("\n")
        index = 0

        while not self.is_done(
            (
                "*** End Slide Patch",
                "*** Update Slide:",
                "*** Add Slide:",
                "*** End of Slide",
            )
        ):
            def_str = self.read_str("@@ ")
            section_str = ""
            if not def_str:
                if self.index < len(self.lines) and self.lines[self.index] == "@@":
                    section_str = self.lines[self.index]
                    self.index += 1

            if not (def_str or section_str or index == 0):
                raise DiffError(f"Invalid Line:\n{self.lines[self.index]}")

            if def_str.strip():
                # Try to find the context line
                for i, s in enumerate(lines[index:], index):
                    if s == def_str or s.strip() == def_str.strip():
                        index = i + 1
                        if s.strip() == def_str.strip() and s != def_str:
                            self.fuzz += 1
                        break

            next_chunk_context, chunks, end_patch_index, eof = self.peek_next_section()
            next_chunk_text = "\n".join(next_chunk_context)
            new_index, fuzz = find_context(lines, next_chunk_context, index, eof)

            if new_index == -1:
                if eof:
                    raise DiffError(f"Invalid EOF Context {index}:\n{next_chunk_text}")
                else:
                    raise DiffError(f"Invalid Context {index}:\n{next_chunk_text}")

            self.fuzz += fuzz
            for ch in chunks:
                ch.orig_index += new_index
                action.chunks.append(ch)
            index = new_index + len(next_chunk_context)
            self.index = end_patch_index

        return action

    def parse_add_slide(self) -> SlidePatchAction:
        """Parse add slide action."""
        lines = []
        while not self.is_done(
            (
                "*** End Slide Patch",
                "*** Update Slide:",
                "*** Add Slide:",
            )
        ):
            s = self.read_str()
            # Skip empty lines between sections
            if s.strip() == "":
                continue
            if not s.startswith("+"):
                raise DiffError(f"Invalid Add Slide Line: {s}")
            s = s[1:]
            lines.append(s)

        return SlidePatchAction(
            type=ActionType.ADD,
            presentation_name="",  # Will be set by parse()
            slide_number=0,  # Will be set by parse()
            new_content="\n".join(lines),
        )

    def peek_next_section(self) -> tuple[list[str], list[Chunk], int, bool]:
        """Peek at the next section for context matching."""
        old: list[str] = []
        del_lines: list[str] = []
        ins_lines: list[str] = []
        chunks: list[Chunk] = []
        mode = "keep"
        orig_index = self.index

        while self.index < len(self.lines):
            s = self.lines[self.index]
            if s.startswith(
                (
                    "@@",
                    "*** End Slide Patch",
                    "*** Update Slide:",
                    "*** Add Slide:",
                    "*** End of Slide",
                )
            ):
                break
            if s == "***":
                break
            elif s.startswith("***"):
                raise DiffError(f"Invalid Line: {s}")

            self.index += 1
            last_mode = mode

            if s == "":
                s = " "
            if s[0] == "+":
                mode = "add"
            elif s[0] == "-":
                mode = "delete"
            elif s[0] == " ":
                mode = "keep"
            else:
                raise DiffError(f"Invalid Line: {s}")

            s = s[1:]

            if mode == "keep" and last_mode != mode:
                if ins_lines or del_lines:
                    chunks.append(
                        Chunk(
                            orig_index=len(old) - len(del_lines),
                            del_lines=del_lines,
                            ins_lines=ins_lines,
                        )
                    )
                del_lines = []
                ins_lines = []

            if mode == "delete":
                del_lines.append(s)
                old.append(s)
            elif mode == "add":
                ins_lines.append(s)
            elif mode == "keep":
                old.append(s)

        if ins_lines or del_lines:
            chunks.append(
                Chunk(
                    orig_index=len(old) - len(del_lines),
                    del_lines=del_lines,
                    ins_lines=ins_lines,
                )
            )

        eof = False
        if (
            self.index < len(self.lines)
            and self.lines[self.index] == "*** End of Slide"
        ):
            self.index += 1
            eof = True

        if self.index == orig_index:
            raise DiffError(
                f"Nothing in this section - {self.index=} {self.lines[self.index]}"
            )

        return old, chunks, self.index, eof


class DiffError(ValueError):
    pass


# Utility functions
def find_context_core(
    lines: list[str], context: list[str], start: int
) -> tuple[int, int]:
    if not context:
        return start, 0

    # Prefer identical match
    for i in range(start, len(lines)):
        if lines[i : i + len(context)] == context:
            return i, 0

    # RStrip is ok
    for i in range(start, len(lines)):
        if [s.rstrip() for s in lines[i : i + len(context)]] == [
            s.rstrip() for s in context
        ]:
            return i, 1

    # Strip is ok too
    for i in range(start, len(lines)):
        if [s.strip() for s in lines[i : i + len(context)]] == [
            s.strip() for s in context
        ]:
            return i, 100

    return -1, 0


def find_context(
    lines: list[str], context: list[str], start: int, eof: bool
) -> tuple[int, int]:
    if eof:
        new_index, fuzz = find_context_core(lines, context, len(lines) - len(context))
        if new_index != -1:
            return new_index, fuzz
        new_index, fuzz = find_context_core(lines, context, start)
        return new_index, fuzz + 10000
    return find_context_core(lines, context, start)


def _get_updated_content(text: str, action: SlidePatchAction) -> str:
    """Apply patches to slide content."""
    assert action.type == ActionType.UPDATE
    orig_lines = text.split("\n")
    dest_lines = []
    orig_index = 0

    for chunk in action.chunks:
        # Process unchanged lines before the chunk
        if chunk.orig_index > len(orig_lines):
            raise DiffError(
                f"_get_updated_content: chunk.orig_index {chunk.orig_index} > len(lines) {len(orig_lines)}"
            )
        if orig_index > chunk.orig_index:
            raise DiffError(
                f"_get_updated_content: orig_index {orig_index} > chunk.orig_index {chunk.orig_index}"
            )

        dest_lines.extend(orig_lines[orig_index : chunk.orig_index])
        orig_index = chunk.orig_index

        # Process inserted lines
        if chunk.ins_lines:
            dest_lines.extend(chunk.ins_lines)

        orig_index += len(chunk.del_lines)

    # Add remaining lines
    dest_lines.extend(orig_lines[orig_index:])

    return "\n".join(dest_lines)


def text_to_slide_patch(
    text: str, current_slides: dict[tuple[str, int], str]
) -> tuple[SlidePatch, int]:
    """Parse patch text into SlidePatch object."""
    lines = text.strip().split("\n")
    if (
        len(lines) < 2
        or not lines[0].startswith("*** Begin Slide Patch")
        or lines[-1] != "*** End Slide Patch"
    ):
        raise DiffError("Invalid patch text")

    parser = SlideParser(
        current_slides=current_slides,
        lines=lines,
        index=1,
    )
    parser.parse()
    return parser.patch, parser.fuzz


def identify_slides_needed(text: str) -> list[tuple[str, int]]:
    """Identify which slides need to be loaded for the patch."""
    lines = text.strip().split("\n")
    result = set()
    for line in lines:
        if line.startswith("*** Update Slide: "):
            path_str = line.split(": ", 1)[1]
            parts = path_str.strip().split("/")
            if len(parts) == 2:
                try:
                    result.add((parts[0], int(parts[1])))
                except ValueError:
                    pass
    return list(result)


def patch_to_commit(patch: SlidePatch, orig: dict[tuple[str, int], str]) -> SlideCommit:
    """Convert patch to commit."""
    commit = SlideCommit()

    for action in patch.actions:
        key = (action.presentation_name, action.slide_number)

        if action.type == ActionType.ADD:
            commit.changes.append(
                SlideChange(
                    type=ActionType.ADD,
                    presentation_name=action.presentation_name,
                    slide_number=action.slide_number,
                    new_content=action.new_content,
                    metadata=action.metadata,
                )
            )
        elif action.type == ActionType.UPDATE:
            new_content = _get_updated_content(orig[key], action)
            commit.changes.append(
                SlideChange(
                    type=ActionType.UPDATE,
                    presentation_name=action.presentation_name,
                    slide_number=action.slide_number,
                    old_content=orig[key],
                    new_content=new_content,
                    metadata=action.metadata,
                )
            )

    return commit


class SlideEditToolResultContent(BaseModel):
    """Content structure for slide edit results."""

    old_content: str
    new_content: str
    filepath: str


class SlideApplyPatchTool(SlideToolBase):
    """Tool for applying patches to slides using a unified diff format."""

    name = NAME
    display_name = DISPLAY_NAME
    description = DESCRIPTION
    input_schema = INPUT_SCHEMA
    metadata = {"format": FORMAT}
    read_only = False

    def should_confirm_execute(
        self, tool_input: dict[str, Any]
    ) -> ToolConfirmationDetails | bool:
        """Determine if patch execution should be confirmed."""
        patch_input = tool_input.get("input", "")
        return ToolConfirmationDetails(
            type="edit", message=f"Apply the following slide patch:\n{patch_input}"
        )

    def _load_slide(self, presentation_name: str, slide_number: int) -> str:
        """Load slide content."""
        presentation_path = self._get_presentation_path(presentation_name)
        slide_filename = self._get_slide_filename(slide_number)

        # Get the workspace root and build the full path properly
        workspace_root = Path(self.workspace_manager.workspace_path)
        full_presentation_path = workspace_root / presentation_path
        slide_path = full_presentation_path / slide_filename

        if not slide_path.exists():
            raise DiffError(f"Slide does not exist: {presentation_name}/{slide_number}")

        try:
            return slide_path.read_text(encoding="utf-8")
        except Exception as e:
            raise DiffError(
                f"Failed to read slide {presentation_name}/{slide_number}: {str(e)}"
            )

    def _write_slide(
        self,
        presentation_name: str,
        slide_number: int,
        content: str,
        metadata: Optional[SlideMetadata] = None,
    ) -> None:
        """Write slide content and update metadata."""
        presentation_path = self._get_presentation_path(presentation_name)

        # Get the workspace root and build the full path properly
        workspace_root = Path(self.workspace_manager.workspace_path)
        full_presentation_path = workspace_root / presentation_path
        self.workspace_manager.validate_path(str(full_presentation_path))

        # Create presentation directory if needed
        full_presentation_path.mkdir(parents=True, exist_ok=True)

        # Write slide file
        slide_filename = self._get_slide_filename(slide_number)
        slide_path = full_presentation_path / slide_filename
        slide_path.write_text(content, encoding="utf-8")

        # Update metadata
        meta = self._load_metadata(full_presentation_path)

        # Update presentation name if empty
        if not meta["presentation"]["name"]:
            meta["presentation"]["name"] = presentation_name
            meta["presentation"]["title"] = presentation_name

        # Update slide metadata
        if metadata:
            meta = self._update_slide_in_metadata(
                metadata=meta,
                slide_number=slide_number,
                title=metadata.title or f"Slide {slide_number}",
                description=metadata.description or "",
                slide_type=metadata.type or "content",
            )
        else:
            # Just update timestamp for existing slide
            slide_meta = self._find_slide_in_metadata(meta, slide_number)
            if slide_meta:
                slide_meta["updated_at"] = datetime.now().isoformat()

        self._save_metadata(full_presentation_path, meta)

    async def execute(self, tool_input: dict[str, Any]) -> ToolResult:
        """Execute the slide_apply_patch command."""
        patch_input = tool_input.get("input")

        if not patch_input:
            return ToolResult(
                llm_content="ERROR: 'input' parameter is required", is_error=True
            )

        try:
            # Identify slides needed for the patch
            slides_needed = identify_slides_needed(patch_input)

            # Load current slide contents
            current_slides = {}
            for presentation_name, slide_number in slides_needed:
                try:
                    content = self._load_slide(presentation_name, slide_number)
                    current_slides[(presentation_name, slide_number)] = content
                except DiffError:
                    # Slide doesn't exist, skip it for updates
                    pass

            # Parse the patch
            patch, fuzz = text_to_slide_patch(patch_input, current_slides)

            # Convert to commit
            commit = patch_to_commit(patch, current_slides)

            # Apply the commit
            user_display_content = []
            messages = []

            for change in commit.changes:
                key = f"{change.presentation_name}/{change.slide_number}"

                if change.type == ActionType.ADD:
                    self._write_slide(
                        change.presentation_name,
                        change.slide_number,
                        change.new_content,
                        change.metadata,
                    )
                    messages.append(f"Added slide {key}")

                    # Add to display content
                    presentation_path = self._get_presentation_path(
                        change.presentation_name
                    )
                    slide_filename = self._get_slide_filename(change.slide_number)
                    slide_path = presentation_path / slide_filename
                    workspace_filepath = f"/workspace/{slide_path}"

                    user_display_content.append(
                        SlideEditToolResultContent(
                            old_content="",
                            new_content=change.new_content or "",
                            filepath=workspace_filepath,
                        ).model_dump()
                    )

                elif change.type == ActionType.UPDATE:
                    self._write_slide(
                        change.presentation_name,
                        change.slide_number,
                        change.new_content,
                        change.metadata,
                    )
                    messages.append(f"Updated slide {key}")

                    # Add to display content
                    presentation_path = self._get_presentation_path(
                        change.presentation_name
                    )
                    slide_filename = self._get_slide_filename(change.slide_number)
                    slide_path = presentation_path / slide_filename
                    workspace_filepath = f"/workspace/{slide_path}"

                    user_display_content.append(
                        SlideEditToolResultContent(
                            old_content=change.old_content or "",
                            new_content=change.new_content or "",
                            filepath=workspace_filepath,
                        ).model_dump()
                    )

            result_msg = f"Slide patch applied successfully! (fuzz: {fuzz})\n"
            result_msg += "\n".join(messages)

            return ToolResult(
                llm_content=result_msg,
                user_display_content=(
                    user_display_content if user_display_content else None
                ),
                is_error=False,
            )

        except DiffError as e:
            return ToolResult(llm_content=f"ERROR: {str(e)}", is_error=True)
        except FileSystemValidationError as e:
            return ToolResult(llm_content=f"ERROR: {str(e)}", is_error=True)
        except Exception as e:
            return ToolResult(
                llm_content=f"ERROR: Unexpected error: {str(e)}", is_error=True
            )

    async def execute_mcp_wrapper(
        self,
        input: str,
    ):
        """MCP wrapper for the slide_apply_patch tool."""
        tool_input = {
            "input": input,
        }

        return await self._mcp_wrapper(tool_input=tool_input)
