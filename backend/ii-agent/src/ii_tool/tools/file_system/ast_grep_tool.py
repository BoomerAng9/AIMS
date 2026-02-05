"""AST-based code search tool using ast-grep."""

import subprocess
import json
from pathlib import Path
from typing import Dict, List, Optional, Any
from ii_tool.core.workspace import WorkspaceManager, FileSystemValidationError
from ii_tool.tools.base import BaseTool, ToolResult


# Constants
MAX_RESULTS = 100
COMMAND_TIMEOUT = 30

# Name
NAME = "ASTGrep"
DISPLAY_NAME = "AST-based code search"

# Tool description
DESCRIPTION = """Searches for AST patterns within code files using structural matching. Supports multiple programming languages and returns matches with file paths, line numbers, and code context.
YOU MUST USE THIS TOOL WHENEVER YOU WANT TO SEARCH FOR CODE.
Usage:
- AST patterns: Use code-like patterns with wildcards (e.g., 'function $NAME($ARGS) { $BODY }', 'import $MODULE from "$PATH"')
- Wildcards: Use $UPPERCASE for capturing parts (e.g., $NAME, $ARGS, $BODY)
- Language auto-detection: Automatically detects programming language from file extensions
- Filter files by pattern with the `include` parameter (e.g., '*.js', '*.{ts,tsx}')
- Supports 20+ programming languages including JavaScript, TypeScript, Python, Java, Go, Rust, etc.
"""

# Language mapping for ast-grep
LANGUAGE_EXTENSIONS = {
    '.js': 'javascript',
    '.jsx': 'javascript', 
    '.ts': 'typescript',
    '.tsx': 'typescript',
    '.py': 'python',
    '.java': 'java',
    '.go': 'go',
    '.rs': 'rust',
    '.c': 'c',
    '.cpp': 'cpp',
    '.cc': 'cpp',
    '.cxx': 'cpp',
    '.cs': 'csharp',
    '.rb': 'ruby',
    '.php': 'php',
    '.kt': 'kotlin',
    '.swift': 'swift',
    '.dart': 'dart',
    '.scala': 'scala',
    '.html': 'html',
    '.css': 'css',
    '.vue': 'vue',
    '.svelte': 'svelte',
}

# Input schema
INPUT_SCHEMA = {
    "type": "object",
    "properties": {
        "pattern": {
            "type": "string",
            "description": "AST pattern to search for (e.g., 'function $NAME($ARGS) { $BODY }', 'class $CLASS extends $PARENT', 'import $MODULE from \"$PATH\"')"
        },
        "path": {
            "type": "string", 
            "description": "The absolute path to the directory to search within. If omitted, searches the current working directory"
        },
        "include": {
            "type": "string",
            "description": "A glob pattern to filter which files are searched (e.g., '*.js', '*.{ts,tsx}', 'src/**'). If omitted, searches all files"
        },
        "language": {
            "type": "string",
            "description": "Programming language for AST parsing (e.g., 'javascript', 'python', 'typescript'). If omitted, auto-detects from file extensions"
        }
    },
    "required": ["pattern"]
}


class ASTGrepToolError(Exception):
    """Custom exception for AST grep tool errors."""
    pass


def _detect_language_from_path(file_path: str) -> Optional[str]:
    """Detect programming language from file extension."""
    path = Path(file_path)
    extension = path.suffix.lower()
    return LANGUAGE_EXTENSIONS.get(extension)


def _run_ast_grep(pattern: str, search_path: Path, include: Optional[str] = None, language: Optional[str] = None) -> List[Dict[str, Any]]:
    """Execute ast-grep command and parse JSON results."""
    try:
        # Build ast-grep command
        cmd = ['ast-grep', 'run', '--json=compact', '--pattern', pattern]
        
        # Add language if specified
        if language:
            cmd.extend(['--lang', language])
        
        # Add glob pattern if specified
        if include:
            cmd.extend(['--globs', include])
        
        # Add search path
        cmd.append(str(search_path))
        
        # Execute ast-grep
        result = subprocess.run(cmd, 
                                capture_output=True, 
                                text=True, 
                                timeout=COMMAND_TIMEOUT)
        
        if result.returncode == 1:
            # No matches found
            return []
        elif result.returncode != 0:
            # Error occurred
            raise subprocess.CalledProcessError(result.returncode, cmd, result.stderr)
        
        # Parse JSON output
        if not result.stdout.strip():
            return []
        
        try:
            # ast-grep outputs a JSON array
            matches = json.loads(result.stdout.strip())
            return matches if isinstance(matches, list) else []
        except json.JSONDecodeError:
            # Fallback: try line by line parsing
            matches = []
            for line in result.stdout.strip().split('\n'):
                if not line:
                    continue
                try:
                    match_data = json.loads(line)
                    matches.append(match_data)
                except json.JSONDecodeError:
                    continue
            return matches
        
    except subprocess.TimeoutExpired:
        raise ASTGrepToolError("Search operation timed out")
    except subprocess.CalledProcessError as e:
        error_msg = e.stderr.strip() if e.stderr else f"Command failed with exit code {e.returncode}"
        raise ASTGrepToolError(f"ast-grep command failed: {error_msg}")
    except FileNotFoundError:
        raise ASTGrepToolError("ast-grep not found. Please install ast-grep: pip install ast-grep-cli")


class ASTGrepTool(BaseTool):
    """Tool for searching code using AST-based pattern matching."""
    
    name = NAME
    display_name = DISPLAY_NAME
    description = DESCRIPTION
    input_schema = INPUT_SCHEMA
    read_only = True

    def __init__(self, workspace_manager: WorkspaceManager):
        self.workspace_manager = workspace_manager

    def _format_results(self, matches: List[Dict[str, Any]], pattern: str, search_path: Path, include: Optional[str] = None, language: Optional[str] = None) -> str:
        """Format search results for display."""
        if not matches:
            search_desc = f"AST pattern \"{pattern}\" in {search_path}"
            if language:
                search_desc += f" (language: {language})"
            if include:
                search_desc += f" (filter: {include})"
            return f"No matches found for {search_desc}"
        
        # Limit results
        total_matches = len(matches)
        if total_matches > MAX_RESULTS:
            matches = matches[:MAX_RESULTS]
        
        # Group matches by file
        files_with_matches = {}
        for match in matches:
            file_path = match.get('file', 'unknown')
            if file_path not in files_with_matches:
                files_with_matches[file_path] = []
            files_with_matches[file_path].append(match)
        
        # Sort files by name
        sorted_files = sorted(files_with_matches.keys())
        
        # Format output
        result_lines = []
        search_desc = f"AST pattern \"{pattern}\" in {search_path}"
        if language:
            search_desc += f" (language: {language})"
        if include:
            search_desc += f" (filter: {include})"
        
        result_lines.append(f"Found {len(matches)} matches for {search_desc}:")
        result_lines.append("---")
        
        for file_path in sorted_files:
            result_lines.append(f"File: {file_path}")
            for match in files_with_matches[file_path]:
                # Extract match information
                range_info = match.get('range', {})
                start_line = range_info.get('start', {}).get('line', 'unknown')
                if start_line != 'unknown':
                    start_line = start_line + 1  # ast-grep uses 0-based line numbers, convert to 1-based
                text = match.get('text', '').strip()
                
                result_lines.append(f"L{start_line}: {text}")
            result_lines.append("---")
        
        if total_matches > MAX_RESULTS:
            result_lines.append(f"Note: Results limited to {MAX_RESULTS} matches. Total matches found: {total_matches}")
        
        return '\n'.join(result_lines)

    async def execute(
        self,
        tool_input: dict[str, Any],
    ) -> ToolResult:
        """
        Search for AST pattern in code files using ast-grep.
        """
        pattern = tool_input.get("pattern")
        path = tool_input.get("path")
        include = tool_input.get("include")
        language = tool_input.get("language")
        
        try:
            # Determine search directory
            if path is None:
                search_dir = self.workspace_manager.get_workspace_path()
            else:
                self.workspace_manager.validate_existing_directory_path(path)
                search_dir = Path(path).resolve()
            
            # Run ast-grep search
            matches = _run_ast_grep(pattern, search_dir, include, language)

            # Format and return results
            result_content = self._format_results(matches, pattern, search_dir, include, language)
            return ToolResult(
                llm_content=result_content,
                is_error=False
            )
            
        except (subprocess.CalledProcessError, OSError, FileSystemValidationError, ASTGrepToolError) as e:
            return ToolResult(
                llm_content=f"ERROR: {e}",
                is_error=True
            )

    async def execute_mcp_wrapper(
        self,
        pattern: str,
        path: Optional[str] = None,
        include: Optional[str] = None,
        language: Optional[str] = None,
    ):
        return await self._mcp_wrapper(
            tool_input={
                "pattern": pattern,
                "path": path,
                "include": include,
                "language": language,
            }
        )