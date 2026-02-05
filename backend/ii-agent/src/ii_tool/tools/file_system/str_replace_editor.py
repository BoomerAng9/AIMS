"""String replacement based file editor tool with multiple editing commands."""

from typing import Any, Dict, List, Optional, Tuple
from pathlib import Path
from ii_tool.core.workspace import WorkspaceManager, FileSystemValidationError
from ii_tool.tools.base import BaseTool, ToolResult

# Name
NAME = "str_replace_based_edit_tool"
DISPLAY_NAME = "Str Replace Based Edit Tool"

# Tool description
DESCRIPTION = """Custom editing tool for viewing, creating and editing files in plain-text format
* State is persistent across command calls and discussions with the user
* If `path` is a text file, `view` displays the result of applying `cat -n`. If `path` is a directory, `view` lists non-hidden files and directories up to 2 levels deep
* The `create` command cannot be used if the specified `path` already exists as a file
* If a `command` generates a long output, it will be truncated and marked with `<response clipped>`
* The `undo_edit` command will revert the last edit made to the file at `path`
* This tool can be used for creating and editing files in plain-text format.


Before using this tool:
1. Use the view tool to understand the file's contents and context
2. Verify the directory path is correct (only applicable when creating new files):
   - Use the view tool to verify the parent directory exists and is the correct location

When making edits:
   - Ensure the edit results in idiomatic, correct code
   - Do not leave the code in a broken state
   - Always use absolute file paths (starting with /)

CRITICAL REQUIREMENTS FOR USING THIS TOOL:

1. EXACT MATCHING: The `old_str` parameter must match EXACTLY one or more consecutive lines from the file, including all whitespace and indentation. The tool will fail if `old_str` matches multiple locations or doesn't match exactly with the file content.

2. UNIQUENESS: The `old_str` must uniquely identify a single instance in the file:
   - Include sufficient context before and after the change point (3-5 lines recommended)
   - If not unique, the replacement will not be performed

3. REPLACEMENT: The `new_str` parameter should contain the edited lines that replace the `old_str`. Both strings must be different.

Remember: when making multiple file edits in a row to the same file, you should prefer to send all edits in a single message with multiple calls to this tool, rather than multiple messages with a single call each."""

SHORT_DESCRIPTION = """Custom editing tool for viewing, creating and editing files in plain-text format
* State is persistent across command calls and discussions with the user
* If `path` is a file, `view` displays the result of applying `cat -n`. If `path` is a directory, `view` lists non-hidden files and directories up to 2 levels deep
* The `create` command cannot be used if the specified `path` already exists as a file
* If a `command` generates a long output, it will be truncated and marked with `<response clipped>`
* The `undo_edit` command will revert the last edit made to the file at `path`
Notes for using the `str_replace` command:
* The `old_str` parameter should match EXACTLY one or more consecutive lines from the original file. Be mindful of whitespaces!
* If the `old_str` parameter is not unique in the file, the replacement will not be performed. Make sure to include enough context in `old_str` to make it unique
* The `new_str` parameter should contain the edited lines that should replace the `old_str`"""

# Input schema
INPUT_SCHEMA = {
    "type": "object",
    "properties": {
        "command": {
            "type": "string",
            "description": "The commands to run. Allowed options are: `view`, `create`, `str_replace`, `insert`, `undo_edit`.",
            "enum": ["view", "create", "str_replace", "insert", "undo_edit"]
        },
        "path": {
            "type": "string",
            "description": "Absolute path to file or directory, e.g. `/workspace/file.py` or `/workspace`."
        },
        "file_text": {
            "type": "string",
            "description": "Required parameter of `create` command, with the content of the file to be created."
        },
        "old_str": {
            "type": "string",
            "description": "Required parameter of `str_replace` command containing the string in `path` to replace."
        },
        "new_str": {
            "type": "string",
            "description": "Optional parameter of `str_replace` command containing the new string (if not given, no string will be added). Required parameter of `insert` command containing the string to insert."
        },
        "insert_line": {
            "type": "integer",
            "description": "Required parameter of `insert` command. The `new_str` will be inserted AFTER the line `insert_line` of `path`."
        },
        "view_range": {
            "type": "array",
            "items": {"type": "integer"},
            "description": "Optional parameter of `view` command when `path` points to a file. If none is given, the full file is shown. If provided, the file will be shown in the indicated line number range, e.g. [11, 12] will show lines 11 and 12. Indexing at 1 to start. Setting `[start_line, -1]` shows all lines from `start_line` to the end of the file."
        }
    },
    "required": ["command", "path"]
}

# Edit history storage (for undo functionality)
# Key: file path, Value: list of (old_content, new_content) tuples
EDIT_HISTORY: Dict[str, List[Tuple[str, str]]] = {}
MAX_HISTORY_PER_FILE = 10  # Keep last 10 edits per file

# Constants
MAX_OUTPUT_LINES = 500
MAX_LINE_LENGTH = 2000
DIRECTORY_DEPTH = 2


class StrReplaceEditorError(Exception):
    """Custom exception for str_replace_editor errors."""
    pass


def _truncate_output(output: str) -> str:
    """Truncate output if it exceeds maximum lines."""
    lines = output.split('\n')
    if len(lines) <= MAX_OUTPUT_LINES:
        return output

    truncated_lines = lines[:MAX_OUTPUT_LINES]
    truncated_lines.append(f"\n<response clipped after {MAX_OUTPUT_LINES} lines>")
    return '\n'.join(truncated_lines)


def _format_line(line_num: int, content: str) -> str:
    """Format a line with line number in cat -n style."""
    # Truncate long lines
    if len(content) > MAX_LINE_LENGTH:
        content = content[:MAX_LINE_LENGTH] + "..."
    return f"{line_num:6}\t{content}"


def _view_file(path: Path, view_range: Optional[List[int]] = None) -> str:
    """View file contents with line numbers."""
    try:
        with open(path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
    except UnicodeDecodeError:
        return f"ERROR: Cannot read file {path} - appears to be a binary file"
    except Exception as e:
        return f"ERROR: Failed to read file {path}: {str(e)}"

    if not lines:
        return f"File {path} is empty"

    # Handle view_range
    if view_range:
        if len(view_range) != 2:
            return "ERROR: view_range must be a list of two integers [start_line, end_line]"

        start_line, end_line = view_range

        # Validate start_line
        if start_line < 1:
            return f"ERROR: start_line must be >= 1, got {start_line}"
        if start_line > len(lines):
            return f"ERROR: start_line {start_line} exceeds file length {len(lines)}"

        # Handle end_line
        if end_line == -1:
            end_line = len(lines)
        elif end_line < 1:
            return f"ERROR: end_line must be >= 1 or -1, got {end_line}"
        elif end_line > len(lines):
            return f"ERROR: end_line {end_line} exceeds file length {len(lines)}"
        elif end_line < start_line:
            return f"ERROR: end_line {end_line} cannot be less than start_line {start_line}"

        # Convert to 0-based indexing for slicing
        lines = lines[start_line - 1:end_line]
        line_offset = start_line - 1
    else:
        line_offset = 0

    # Format output with line numbers
    output_lines = []
    for i, line in enumerate(lines, start=1):
        # Remove trailing newline for formatting
        content = line.rstrip('\n')
        output_lines.append(_format_line(i + line_offset, content))

    output = '\n'.join(output_lines)
    return _truncate_output(output)


def _view_directory(path: Path, depth: int = 0, max_depth: int = DIRECTORY_DEPTH) -> List[str]:
    """Recursively list directory contents up to specified depth."""
    items = []

    if depth >= max_depth:
        return items

    indent = "  " * depth

    try:
        # Get sorted directory contents (dirs first, then files)
        dir_items = []
        file_items = []

        for item in sorted(path.iterdir()):
            if item.name.startswith('.'):
                continue  # Skip hidden files/directories

            if item.is_dir():
                dir_items.append(item)
            elif item.is_file():
                file_items.append(item)

        # Add directories
        for item in dir_items:
            items.append(f"{indent}{item.name}/")
            # Recursively list subdirectories
            sub_items = _view_directory(item, depth + 1, max_depth)
            items.extend(sub_items)

        # Add files
        for item in file_items:
            items.append(f"{indent}{item.name}")

    except PermissionError:
        items.append(f"{indent}[Permission Denied]")
    except Exception as e:
        items.append(f"{indent}[Error: {str(e)}]")

    return items


def _perform_str_replace(file_path: Path, old_str: str, new_str: Optional[str]) -> str:
    """Perform string replacement in file."""
    # Read current file content
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        return f"ERROR: Failed to read file {file_path}: {str(e)}"

    # Check if old_str exists in the file
    occurrences = content.count(old_str)

    if occurrences == 0:
        return f"ERROR: The string '{old_str[:50]}{'...' if len(old_str) > 50 else ''}' was not found in {file_path}. Make sure the old_str matches exactly with the file content, including whitespace and indentation."

    if occurrences > 1:
        return f"ERROR: The string '{old_str[:50]}{'...' if len(old_str) > 50 else ''}' was found {occurrences} times in {file_path}. Please make it unique by providing more context."

    # Store edit history
    if str(file_path) not in EDIT_HISTORY:
        EDIT_HISTORY[str(file_path)] = []

    # Perform replacement
    if new_str is None:
        new_str = ""  # Delete if new_str is not provided

    new_content = content.replace(old_str, new_str)

    # Write new content
    try:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)

        # Add to edit history
        EDIT_HISTORY[str(file_path)].append((content, new_content))
        # Keep only last MAX_HISTORY_PER_FILE edits
        if len(EDIT_HISTORY[str(file_path)]) > MAX_HISTORY_PER_FILE:
            EDIT_HISTORY[str(file_path)].pop(0)

        return f"The file {file_path} has been edited successfully."
    except Exception as e:
        return f"ERROR: Failed to write to file {file_path}: {str(e)}"


def _perform_insert(file_path: Path, insert_line: int, new_str: str) -> str:
    """Insert text after a specific line in file."""
    # Read current file content
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
    except Exception as e:
        return f"ERROR: Failed to read file {file_path}: {str(e)}"

    # Validate insert_line
    if insert_line < 0:
        return f"ERROR: insert_line must be >= 0, got {insert_line}"
    if insert_line > len(lines):
        return f"ERROR: insert_line {insert_line} exceeds file length {len(lines)}"

    # Store original content for undo
    original_content = ''.join(lines)

    # Insert the new string after the specified line
    # insert_line=0 means insert at the beginning
    # insert_line=n means insert after line n
    if insert_line == 0:
        # Insert at beginning
        if new_str and not new_str.endswith('\n'):
            new_str += '\n'
        lines.insert(0, new_str)
    else:
        # Insert after specified line
        if new_str and not new_str.endswith('\n'):
            new_str += '\n'
        lines.insert(insert_line, new_str)

    new_content = ''.join(lines)

    # Write new content
    try:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)

        # Add to edit history
        if str(file_path) not in EDIT_HISTORY:
            EDIT_HISTORY[str(file_path)] = []
        EDIT_HISTORY[str(file_path)].append((original_content, new_content))
        # Keep only last MAX_HISTORY_PER_FILE edits
        if len(EDIT_HISTORY[str(file_path)]) > MAX_HISTORY_PER_FILE:
            EDIT_HISTORY[str(file_path)].pop(0)

        return f"Text has been successfully inserted at line {insert_line} in {file_path}."
    except Exception as e:
        return f"ERROR: Failed to write to file {file_path}: {str(e)}"


def _perform_undo(file_path: Path) -> str:
    """Undo the last edit made to a file."""
    file_path_str = str(file_path)

    if file_path_str not in EDIT_HISTORY or not EDIT_HISTORY[file_path_str]:
        return f"ERROR: No edit history found for {file_path}. Cannot undo."

    # Get the last edit
    old_content, _ = EDIT_HISTORY[file_path_str].pop()

    # Write the old content back
    try:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(old_content)

        return f"Last edit to {file_path} has been undone."
    except Exception as e:
        return f"ERROR: Failed to undo edit for {file_path}: {str(e)}"


class StrReplaceEditorTool(BaseTool):
    """Tool for advanced file editing with string replacement."""

    name = NAME
    display_name = DISPLAY_NAME
    description = DESCRIPTION
    input_schema = INPUT_SCHEMA
    read_only = False

    def __init__(self, workspace_manager: WorkspaceManager, use_short_description: bool = False):
        self.workspace_manager = workspace_manager
        self.description = SHORT_DESCRIPTION if use_short_description else DESCRIPTION


    async def execute(self, tool_input: dict[str, Any]) -> ToolResult:
        """Execute the str_replace_editor command."""
        command = tool_input.get("command")
        path_str = tool_input.get("path")

        # Validate required parameters
        if not command:
            return ToolResult(
                llm_content="ERROR: 'command' parameter is required",
                is_error=True
            )
        if not path_str:
            return ToolResult(
                llm_content="ERROR: 'path' parameter is required",
                is_error=True
            )

        # Validate path with workspace manager
        try:
            self.workspace_manager.validate_path(path_str)
        except FileSystemValidationError as e:
            return ToolResult(
                llm_content=f"ERROR: {str(e)}",
                is_error=True
            )

        path = Path(path_str).resolve()

        # Execute command
        try:
            if command == "view":
                return await self._handle_view(path, tool_input)
            elif command == "create":
                return await self._handle_create(path, tool_input)
            elif command == "str_replace":
                return await self._handle_str_replace(path, tool_input)
            elif command == "insert":
                return await self._handle_insert(path, tool_input)
            elif command == "undo_edit":
                return await self._handle_undo(path)
            else:
                return ToolResult(
                    llm_content=f"ERROR: Unknown command '{command}'",
                    is_error=True
                )
        except Exception as e:
            return ToolResult(
                llm_content=f"ERROR: {str(e)}",
                is_error=True
            )

    async def _handle_view(self, path: Path, tool_input: dict[str, Any]) -> ToolResult:
        """Handle view command."""
        view_range = tool_input.get("view_range")

        if path.is_file():
            content = _view_file(path, view_range)
        elif path.is_dir():
            items = _view_directory(path)
            if items:
                content = f"Directory contents of {path}:\n" + '\n'.join(items)
            else:
                content = f"Directory {path} is empty or contains only hidden files"
        else:
            content = f"ERROR: Path {path} does not exist"

        return ToolResult(
            llm_content=content,
            is_error=content.startswith("ERROR:")
        )

    async def _handle_create(self, path: Path, tool_input: dict[str, Any]) -> ToolResult:
        """Handle create command."""
        file_text = tool_input.get("file_text")

        if file_text is None:
            return ToolResult(
                llm_content="ERROR: 'file_text' parameter is required for 'create' command",
                is_error=True
            )

        # Check if file already exists
        if path.exists():
            return ToolResult(
                llm_content=f"ERROR: File {path} already exists. Use 'str_replace' or 'insert' to edit it.",
                is_error=True
            )

        # Create parent directories if needed
        try:
            path.parent.mkdir(parents=True, exist_ok=True)
        except Exception as e:
            return ToolResult(
                llm_content=f"ERROR: Failed to create parent directory: {str(e)}",
                is_error=True
            )

        # Write file
        try:
            with open(path, 'w', encoding='utf-8') as f:
                f.write(file_text)

            # Add to edit history (with empty original content)
            if str(path) not in EDIT_HISTORY:
                EDIT_HISTORY[str(path)] = []
            EDIT_HISTORY[str(path)].append(("", file_text))
            # Keep only last MAX_HISTORY_PER_FILE edits
            if len(EDIT_HISTORY[str(path)]) > MAX_HISTORY_PER_FILE:
                EDIT_HISTORY[str(path)].pop(0)

            return ToolResult(
                llm_content=f"File created successfully at {path}"
            )
        except Exception as e:
            return ToolResult(
                llm_content=f"ERROR: Failed to create file {path}: {str(e)}",
                is_error=True
            )

    async def _handle_str_replace(self, path: Path, tool_input: dict[str, Any]) -> ToolResult:
        """Handle str_replace command."""
        old_str = tool_input.get("old_str")
        new_str = tool_input.get("new_str")

        if old_str is None:
            return ToolResult(
                llm_content="ERROR: 'old_str' parameter is required for 'str_replace' command",
                is_error=True
            )

        # Check if file exists
        if not path.exists() or not path.is_file():
            return ToolResult(
                llm_content=f"ERROR: File {path} does not exist",
                is_error=True
            )

        result = _perform_str_replace(path, old_str, new_str)

        return ToolResult(
            llm_content=result,
            is_error=result.startswith("ERROR:")
        )

    async def _handle_insert(self, path: Path, tool_input: dict[str, Any]) -> ToolResult:
        """Handle insert command."""
        insert_line = tool_input.get("insert_line")
        new_str = tool_input.get("new_str")

        if insert_line is None:
            return ToolResult(
                llm_content="ERROR: 'insert_line' parameter is required for 'insert' command",
                is_error=True
            )

        if new_str is None:
            return ToolResult(
                llm_content="ERROR: 'new_str' parameter is required for 'insert' command",
                is_error=True
            )

        # Check if file exists
        if not path.exists() or not path.is_file():
            return ToolResult(
                llm_content=f"ERROR: File {path} does not exist",
                is_error=True
            )

        result = _perform_insert(path, insert_line, new_str)

        return ToolResult(
            llm_content=result,
            is_error=result.startswith("ERROR:")
        )

    async def _handle_undo(self, path: Path) -> ToolResult:
        """Handle undo_edit command."""
        # Check if file exists
        if not path.exists() or not path.is_file():
            return ToolResult(
                llm_content=f"ERROR: File {path} does not exist",
                is_error=True
            )

        result = _perform_undo(path)

        return ToolResult(
            llm_content=result,
            is_error=result.startswith("ERROR:")
        )

    async def execute_mcp_wrapper(
        self,
        command: str,
        path: str,
        file_text: Optional[str] = None,
        old_str: Optional[str] = None,
        new_str: Optional[str] = None,
        insert_line: Optional[int] = None,
        view_range: Optional[List[int]] = None,
    ):
        """MCP wrapper for the str_replace_editor tool."""
        tool_input = {
            "command": command,
            "path": path,
        }

        # Add optional parameters if provided
        if file_text is not None:
            tool_input["file_text"] = file_text
        if old_str is not None:
            tool_input["old_str"] = old_str
        if new_str is not None:
            tool_input["new_str"] = new_str
        if insert_line is not None:
            tool_input["insert_line"] = insert_line
        if view_range is not None:
            tool_input["view_range"] = view_range

        return await self._mcp_wrapper(tool_input=tool_input)