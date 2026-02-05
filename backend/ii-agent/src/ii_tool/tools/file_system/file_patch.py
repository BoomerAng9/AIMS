from pathlib import Path
from enum import Enum
import textwrap
from typing import Callable, Optional, Any
from pydantic import BaseModel, Field


from ii_tool.core.workspace import FileSystemValidationError, WorkspaceManager
from ii_tool.tools.base import (
    BaseTool,
    ToolResult,
    FileEditToolResultContent,
    ToolConfirmationDetails,
)

# Name
NAME = "apply_patch"
DISPLAY_NAME = "Apply Patch"

DEFINITION = textwrap.dedent(
    """
start: begin_patch hunk+ end_patch
begin_patch: "*** Begin Patch" LF
end_patch: "*** End Patch" LF?

hunk: add_hunk | delete_hunk | update_hunk
add_hunk: "*** Add File: " filename LF add_line+
delete_hunk: "*** Delete File: " filename LF
update_hunk: "*** Update File: " filename LF change_move? change?

filename: /(.+)/
add_line: "+" /(.*)/ LF -> line

change_move: "*** Move to: " filename LF
change: (change_context | change_line)+ eof_line?
change_context: ("@@" | "@@ " /(.+)/) LF
change_line: ("+" | "-" | " ") /(.*)/ LF
eof_line: "*** End of File" LF

%import common.LF
"""
)

FORMAT = {"type": "custom", "syntax": "lark", "definition": DEFINITION}

# Tool description
DESCRIPTION = """Use the `apply_patch` tool to edit files.
Your patch language is a stripped‑down, file‑oriented diff format designed to be easy to parse and safe to apply. You can think of it as a high‑level envelope:

*** Begin Patch
[ one or more file sections ]
*** End Patch

Within that envelope, you get a sequence of file operations.
You MUST include a header to specify the action you are taking.
Each operation starts with one of three headers:

*** Add File: <path> - create a new file. Every following line is a + line (the initial contents).
*** Delete File: <path> - remove an existing file. Nothing follows.
*** Update File: <path> - patch an existing file in place (optionally with a rename).

May be immediately followed by *** Move to: <new path> if you want to rename the file.
Then one or more “hunks”, each introduced by @@ (optionally followed by a hunk header).
Within a hunk each line starts with:

For instructions on [context_before] and [context_after]:
- By default, show 3 lines of code immediately above and 3 lines immediately below each change. If a change is within 3 lines of a previous change, do NOT duplicate the first change’s [context_after] lines in the second change’s [context_before] lines.
- If 3 lines of context is insufficient to uniquely identify the snippet of code within the file, use the @@ operator to indicate the class or function to which the snippet belongs. For instance, we might have:
@@ class BaseClass
[3 lines of pre-context]
- [old_code]
+ [new_code]
[3 lines of post-context]

- If a code block is repeated so many times in a class or function such that even a single `@@` statement and 3 lines of context cannot uniquely identify the snippet of code, you can use multiple `@@` statements to jump to the right context. For instance:

@@ class BaseClass
@@ 	 def method():
[3 lines of pre-context]
- [old_code]
+ [new_code]
[3 lines of post-context]

The full grammar definition is below:
Patch := Begin { FileOp } End
Begin := "*** Begin Patch" NEWLINE
End := "*** End Patch" NEWLINE
FileOp := AddFile | DeleteFile | UpdateFile
AddFile := "*** Add File: " path NEWLINE { "+" line NEWLINE }
DeleteFile := "*** Delete File: " path NEWLINE
UpdateFile := "*** Update File: " path NEWLINE [ MoveTo ] { Hunk }
MoveTo := "*** Move to: " newPath NEWLINE
Hunk := "@@" [ header ] NEWLINE { HunkLine } [ "*** End of File" NEWLINE ]
HunkLine := (" " | "-" | "+") text NEWLINE

A full patch can combine several operations:

*** Begin Patch
*** Add File: hello.txt
+Hello world
*** Update File: src/app.py
*** Move to: src/main.py
@@ def greet():
-print("Hi")
+print("Hello, world!")
*** Delete File: obsolete.txt
*** End Patch

It is important to remember:

- You must include a header with your intended action (Add/Delete/Update)
- You must prefix new lines with `+` even when creating a new file
- File references can only be absolute paths NEVER RELATIVE PATHS
"""


SHORT_DESCRIPTION = DESCRIPTION

# Input schema
INPUT_SCHEMA = {
    "type": "object",
    "properties": {
        "input": {
            "type": "string",
            "description": "The apply_patch command that you wish to execute.",
        }
    },
    "required": ["input"],
}


# Core classes from the original implementation
class ActionType(str, Enum):
    ADD = "add"
    DELETE = "delete"
    UPDATE = "update"


class FileChange(BaseModel):
    type: ActionType
    old_content: Optional[str] = None
    new_content: Optional[str] = None
    move_path: Optional[str] = None


class Commit(BaseModel):
    changes: dict[str, FileChange] = Field(default_factory=dict)


class Chunk(BaseModel):
    orig_index: int = -1  # line index of the first line in the original file
    del_lines: list[str] = Field(default_factory=list)
    ins_lines: list[str] = Field(default_factory=list)


class PatchAction(BaseModel):
    type: ActionType
    new_file: Optional[str] = None
    chunks: list[Chunk] = Field(default_factory=list)
    move_path: Optional[str] = None


class Patch(BaseModel):
    actions: dict[str, PatchAction] = Field(default_factory=dict)


class Parser(BaseModel):
    current_files: dict[str, str] = Field(default_factory=dict)
    lines: list[str] = Field(default_factory=list)
    index: int = 0
    patch: Patch = Field(default_factory=Patch)
    fuzz: int = 0

    def is_done(self, prefixes: Optional[tuple[str, ...]] = None) -> bool:
        if self.index >= len(self.lines):
            return True
        if prefixes and self.lines[self.index].startswith(prefixes):
            return True
        return False

    def startswith(self, prefix: Optional[tuple[str, ...]]) -> bool:
        assert self.index < len(self.lines), f"Index: {self.index} >= {len(self.lines)}"
        if self.lines[self.index].startswith(prefix):
            return True
        return False

    def read_str(self, prefix: str = "", return_everything: bool = False) -> str:
        assert self.index < len(self.lines), f"Index: {self.index} >= {len(self.lines)}"
        if self.lines[self.index].startswith(prefix):
            if return_everything:
                text = self.lines[self.index]
            else:
                text = self.lines[self.index][len(prefix) :]
            self.index += 1
            return text
        return ""

    def parse(self):
        while not self.is_done(("*** End Patch",)):
            # Skip empty lines
            if self.index < len(self.lines) and self.lines[self.index].strip() == "":
                self.index += 1
                continue

            path = self.read_str("*** Update File: ")
            if path:
                if path in self.patch.actions:
                    raise DiffError(f"Update File Error: Duplicate Path: {path}")
                move_to = self.read_str("*** Move to: ")
                if path not in self.current_files:
                    raise DiffError(f"Update File Error: Missing File: {path}")
                text = self.current_files[path]
                action = self.parse_update_file(text)
                action.move_path = move_to
                self.patch.actions[path] = action
                continue
            path = self.read_str("*** Delete File: ")
            if path:
                if path in self.patch.actions:
                    raise DiffError(f"Delete File Error: Duplicate Path: {path}")
                if path not in self.current_files:
                    raise DiffError(f"Delete File Error: Missing File: {path}")
                self.patch.actions[path] = PatchAction(
                    type=ActionType.DELETE,
                )
                continue
            path = self.read_str("*** Add File: ")
            if path:
                if path in self.patch.actions:
                    raise DiffError(f"Add File Error: Duplicate Path: {path}")
                self.patch.actions[path] = self.parse_add_file()
                continue
            raise DiffError(f"Unknown Line: {self.lines[self.index]}")
        if not self.startswith("*** End Patch"):
            raise DiffError("Missing End Patch")
        self.index += 1

    def parse_update_file(self, text: str) -> PatchAction:
        action = PatchAction(
            type=ActionType.UPDATE,
        )
        lines = text.split("\n")
        index = 0
        while not self.is_done(
            (
                "*** End Patch",
                "*** Update File:",
                "*** Delete File:",
                "*** Add File:",
                "*** End of File",
            )
        ):
            def_str = self.read_str("@@ ")
            section_str = ""
            if not def_str:
                if self.lines[self.index] == "@@":
                    section_str = self.lines[self.index]
                    self.index += 1
            if not (def_str or section_str or index == 0):
                raise DiffError(f"Invalid Line:\n{self.lines[self.index]}")
            if def_str.strip():
                found = False
                if not [s for s in lines[:index] if s == def_str]:
                    # def str is a skip ahead operator
                    for i, s in enumerate(lines[index:], index):
                        if s == def_str:
                            index = i + 1
                            found = True
                            break
                if not found and not [
                    s for s in lines[:index] if s.strip() == def_str.strip()
                ]:
                    # def str is a skip ahead operator
                    for i, s in enumerate(lines[index:], index):
                        if s.strip() == def_str.strip():
                            index = i + 1
                            self.fuzz += 1
                            found = True
                            break
            next_chunk_context, chunks, end_patch_index, eof = peek_next_section(
                self.lines, self.index
            )
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
            continue
        return action

    def parse_add_file(self) -> PatchAction:
        lines = []
        while not self.is_done(
            ("*** End Patch", "*** Update File:", "*** Delete File:", "*** Add File:")
        ):
            s = self.read_str()
            # Skip empty lines between file sections
            if s.strip() == "":
                continue
            if not s.startswith("+"):
                raise DiffError(f"Invalid Add File Line: {s}")
            s = s[1:]
            lines.append(s)
        return PatchAction(
            type=ActionType.ADD,
            new_file="\n".join(lines),
        )


class DiffError(ValueError):
    pass


# Utility functions
def find_context_core(
    lines: list[str], context: list[str], start: int
) -> tuple[int, int]:
    if not context:
        return start, 0

    # Prefer identical
    for i in range(start, len(lines)):
        if lines[i : i + len(context)] == context:
            return i, 0
    # RStrip is ok
    for i in range(start, len(lines)):
        if [s.rstrip() for s in lines[i : i + len(context)]] == [
            s.rstrip() for s in context
        ]:
            return i, 1
    # Fine, Strip is ok too.
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


def peek_next_section(
    lines: list[str], index: int
) -> tuple[list[str], list[Chunk], int, bool]:
    old: list[str] = []
    del_lines: list[str] = []
    ins_lines: list[str] = []
    chunks: list[Chunk] = []
    mode = "keep"
    orig_index = index
    while index < len(lines):
        s = lines[index]
        if s.startswith(
            (
                "@@",
                "*** End Patch",
                "*** Update File:",
                "*** Delete File:",
                "*** Add File:",
                "*** End of File",
            )
        ):
            break
        if s == "***":
            break
        elif s.startswith("***"):
            raise DiffError(f"Invalid Line: {s}")
        index += 1
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
        del_lines = []
        ins_lines = []
    if index < len(lines) and lines[index] == "*** End of File":
        index += 1
        return old, chunks, index, True
    if index == orig_index:
        raise DiffError(f"Nothing in this section - {index=} {lines[index]}")
    return old, chunks, index, False


def text_to_patch(text: str, orig: dict[str, str]) -> tuple[Patch, int]:
    lines = text.strip().split("\n")
    if (
        len(lines) < 2
        or not lines[0].startswith("*** Begin Patch")
        or lines[-1] != "*** End Patch"
    ):
        raise DiffError("Invalid patch text")

    parser = Parser(
        current_files=orig,
        lines=lines,
        index=1,
    )
    parser.parse()
    return parser.patch, parser.fuzz


def identify_files_needed(text: str) -> list[str]:
    lines = text.strip().split("\n")
    result = set()
    for line in lines:
        if line.startswith("*** Update File: "):
            result.add(line[len("*** Update File: ") :])
        if line.startswith("*** Delete File: "):
            result.add(line[len("*** Delete File: ") :])
    return list(result)


def _get_updated_file(text: str, action: PatchAction, path: str) -> str:
    assert action.type == ActionType.UPDATE
    orig_lines = text.split("\n")
    dest_lines = []
    orig_index = 0
    dest_index = 0
    for chunk in action.chunks:
        # Process the unchanged lines before the chunk
        if chunk.orig_index > len(orig_lines):
            raise DiffError(
                f"_get_updated_file: {path}: chunk.orig_index {chunk.orig_index} > len(lines) {len(orig_lines)}"
            )
        if orig_index > chunk.orig_index:
            raise DiffError(
                f"_get_updated_file: {path}: orig_index {orig_index} > chunk.orig_index {chunk.orig_index}"
            )
        assert orig_index <= chunk.orig_index
        dest_lines.extend(orig_lines[orig_index : chunk.orig_index])
        delta = chunk.orig_index - orig_index
        orig_index += delta
        dest_index += delta
        # Process the inserted lines
        if chunk.ins_lines:
            for i in range(len(chunk.ins_lines)):
                dest_lines.append(chunk.ins_lines[i])
            dest_index += len(chunk.ins_lines)
        orig_index += len(chunk.del_lines)
    # Final part
    dest_lines.extend(orig_lines[orig_index:])
    delta = len(orig_lines) - orig_index
    orig_index += delta
    dest_index += delta
    assert orig_index == len(orig_lines)
    assert dest_index == len(dest_lines)
    return "\n".join(dest_lines)


def patch_to_commit(patch: Patch, orig: dict[str, str]) -> Commit:
    commit = Commit()
    for path, action in patch.actions.items():
        if action.type == ActionType.DELETE:
            commit.changes[path] = FileChange(
                type=ActionType.DELETE, old_content=orig[path]
            )
        elif action.type == ActionType.ADD:
            commit.changes[path] = FileChange(
                type=ActionType.ADD, new_content=action.new_file
            )
        elif action.type == ActionType.UPDATE:
            new_content = _get_updated_file(text=orig[path], action=action, path=path)
            commit.changes[path] = FileChange(
                type=ActionType.UPDATE,
                old_content=orig[path],
                new_content=new_content,
                move_path=action.move_path,
            )
    return commit


def load_files(paths: list[str], open_fn: Callable) -> dict[str, str]:
    orig = {}
    for path in paths:
        orig[path] = open_fn(path)
    return orig


def apply_commit(commit: Commit, write_fn: Callable, remove_fn: Callable) -> None:
    for path, change in commit.changes.items():
        if change.type == ActionType.DELETE:
            remove_fn(path)
        elif change.type == ActionType.ADD:
            write_fn(path, change.new_content)
        elif change.type == ActionType.UPDATE:
            if change.move_path:
                write_fn(change.move_path, change.new_content)
                remove_fn(path)
            else:
                write_fn(path, change.new_content)


def process_patch(
    text: str, open_fn: Callable, write_fn: Callable, remove_fn: Callable
) -> tuple[str, Commit, int]:
    if not text.startswith("*** Begin Patch"):
        raise DiffError("Patch must start with '*** Begin Patch'")
    paths = identify_files_needed(text)
    orig = load_files(paths, open_fn)
    patch, fuzz = text_to_patch(text, orig)
    commit = patch_to_commit(patch, orig)
    apply_commit(commit, write_fn, remove_fn)
    return f"Patch applied successfully! (fuzz: {fuzz})", commit, fuzz


class ApplyPatchTool(BaseTool):
    """Tool for applying patches using the V4A diff format."""

    name = NAME
    display_name = DISPLAY_NAME
    description = DESCRIPTION
    input_schema = INPUT_SCHEMA
    metadata = {"format": FORMAT}
    read_only = False

    def __init__(self, workspace_manager: WorkspaceManager):
        self.workspace_manager = workspace_manager

    def should_confirm_execute(
        self, tool_input: dict[str, Any]
    ) -> ToolConfirmationDetails | bool:
        """Determine if patch execution should be confirmed."""
        patch_input = tool_input.get("input", "")
        return ToolConfirmationDetails(
            type="edit", message=f"Apply the following patch:\n{patch_input}"
        )

    def _open_file(self, path: str) -> str:
        """Read file contents with workspace validation."""
        self.workspace_manager.validate_path(path)
        file_path = Path(path).resolve()

        if not file_path.exists():
            raise FileSystemValidationError(f"File does not exist: {path}")

        try:
            with open(file_path, "r", encoding="utf-8") as f:
                return f.read()
        except UnicodeDecodeError:
            raise DiffError(f"Cannot read file {path} - appears to be a binary file")
        except Exception as e:
            raise DiffError(f"Failed to read file {path}: {str(e)}")

    def _write_file(self, path: str, content: str) -> None:
        """Write file contents with workspace validation."""
        self.workspace_manager.validate_path(path)
        file_path = Path(path).resolve()

        # Create parent directories if needed
        file_path.parent.mkdir(parents=True, exist_ok=True)

        try:
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(content)
        except Exception as e:
            raise DiffError(f"Failed to write file {path}: {str(e)}")

    def _remove_file(self, path: str) -> None:
        """Remove file with workspace validation."""
        self.workspace_manager.validate_path(path)
        file_path = Path(path).resolve()

        if not file_path.exists():
            raise DiffError(f"Cannot remove file {path} - does not exist")

        try:
            file_path.unlink()
        except Exception as e:
            raise DiffError(f"Failed to remove file {path}: {str(e)}")

    async def execute(self, tool_input: dict[str, Any]) -> ToolResult:
        """Execute the apply_patch command."""
        patch_input = tool_input.get("input")

        if not patch_input:
            return ToolResult(
                llm_content="ERROR: 'input' parameter is required", is_error=True
            )

        try:
            result_msg, commit, fuzz = process_patch(
                patch_input, self._open_file, self._write_file, self._remove_file
            )

            # Build user_display_content array with FileEditToolResultContent
            user_display_content = []

            for path, change in commit.changes.items():
                if change.type == ActionType.UPDATE:
                    # For updates, show old and new content
                    user_display_content.append(
                        FileEditToolResultContent(
                            old_content=change.old_content or "",
                            new_content=change.new_content or "",
                        ).model_dump()
                    )
                elif change.type == ActionType.ADD:
                    # For new files, only show new content
                    user_display_content.append(
                        FileEditToolResultContent(
                            old_content="", new_content=change.new_content or ""
                        ).model_dump()
                    )
                elif change.type == ActionType.DELETE:
                    # For deletions, only show old content
                    user_display_content.append(
                        FileEditToolResultContent(
                            old_content=change.old_content or "", new_content=""
                        ).model_dump()
                    )

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
        """MCP wrapper for the apply_patch tool."""
        tool_input = {
            "input": input,
        }

        return await self._mcp_wrapper(tool_input=tool_input)
