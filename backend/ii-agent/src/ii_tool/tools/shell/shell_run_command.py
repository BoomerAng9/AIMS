from typing import Any
from ii_tool.tools.shell.terminal_manager import BaseShellManager, ShellCommandTimeoutError, ShellBusyError
from ii_tool.tools.base import BaseTool, ToolResult, ToolConfirmationDetails
from ii_tool.core.workspace import WorkspaceManager


# Constants
DEFAULT_TIMEOUT = 60
MAX_TIMEOUT = 180
# Name
NAME = "Bash"
DISPLAY_NAME = "Run bash command"

# Tool description
DESCRIPTION = f"""Executes a bash command in a persistent shell session

Usage notes:
- It is very helpful if you write a clear, concise description of what this command does in 5-10 words
- To run multiple commands, join them with ';' or '&&'. Do not use newlines
- For long-running tasks (e.g., deployments), set `wait_for_output` to False and monitor progress with the `BashView` tool
- You can specify an optional timeout in seconds (up to {MAX_TIMEOUT} seconds). If not specified, commands will timeout after {DEFAULT_TIMEOUT} seconds
"""

# Input schema
INPUT_SCHEMA = {
    "type": "object",
    "properties": {
        "session_name": {
            "type": "string",
            "description": "The name of the session to execute the command in."
        },
        "command": {
            "type": "string",
            "description": "The command to execute."
        },
        "description": {
            "type": "string",
            "description": "Clear, concise description of what this command does in 5-10 words. Examples:\nInput: ls\nOutput: Lists files in current directory\n\nInput: git status\nOutput: Shows working tree status\n\nInput: npm install\nOutput: Installs package dependencies\n\nInput: mkdir foo\nOutput: Creates directory 'foo'"
        },
        "timeout": {
            "type": "integer",
            "description": "The timeout for the command in seconds. Maximum is {MAX_TIMEOUT} seconds.",
            "default": DEFAULT_TIMEOUT
        },
        "wait_for_output": {
            "type": "boolean",
            "description": "If True, wait for the command to finish and return its output (up to the timeout). If False, run in background.",
            "default": True
        }
    },
    "required": ["session_name", "command", "description"]
}

class ShellRunCommand(BaseTool):
    name = NAME
    display_name = DISPLAY_NAME
    description = DESCRIPTION
    input_schema = INPUT_SCHEMA
    read_only = False
    
    def __init__(self, shell_manager: BaseShellManager, workspace_manager: WorkspaceManager) -> None:
        self.shell_manager = shell_manager
        self.workspace_manager = workspace_manager

    def should_confirm_execute(self, tool_input: dict[str, Any]) -> ToolConfirmationDetails | bool:
        return ToolConfirmationDetails(
            type="bash",
            message=f"{tool_input['description']} - command: {tool_input['command']}"
        )

    async def execute(
        self,
        tool_input: dict[str, Any],
    ) -> ToolResult:
        """Execute a bash command in the specified session."""
        session_name = tool_input.get("session_name")
        command = tool_input.get("command")
        description = tool_input.get("description")
        timeout = tool_input.get("timeout", DEFAULT_TIMEOUT)
        wait_for_output = tool_input.get("wait_for_output", True)
        
        if not command:
            return ToolResult(
                llm_content="Command is required",
                is_error=True
            )
        
        if timeout > MAX_TIMEOUT:
            return ToolResult(
                llm_content=f"Timeout must be less than {MAX_TIMEOUT} seconds",
                is_error=True
            )
        
        all_current_sessions = self.shell_manager.get_all_sessions()
        
        if session_name not in all_current_sessions:
            # return ToolResult(
            #     llm_content=f"Session '{session_name}' is not initialized. Use `BashInit` to initialize a session. Available sessions: {all_current_sessions}",
            #     is_error=True
            # )
            
            # create the session
            start_directory = str(self.workspace_manager.get_workspace_path())
            self.shell_manager.create_session(session_name, start_directory)
            
        try:
            result = self.shell_manager.run_command(session_name, command, timeout=timeout, wait_for_output=wait_for_output)
            return ToolResult(
                llm_content=result.clean_output,
                user_display_content=result.ansi_output,
                is_error=False
            )
        except ShellCommandTimeoutError:
            current_output = self.shell_manager.get_session_output(session_name)
            return ToolResult(
                llm_content=f"Command timed out. Current view:\n\n{current_output.clean_output}.",
                user_display_content=f"Command timed out. Current view:\n\n{current_output.ansi_output}.",
                is_error=True
            )
        except ShellBusyError:
            current_output = self.shell_manager.get_session_output(session_name)
            return ToolResult(
                llm_content=f"The last command is not finished. Current view:\n\n{current_output.clean_output}. Use another session or wait for the last command to finish.",
                user_display_content=f"The last command is not finished. Current view:\n\n{current_output.ansi_output}.",
                is_error=True
            )

    async def execute_mcp_wrapper(
        self,
        session_name: str,
        command: str,
        description: str,
        timeout: int = DEFAULT_TIMEOUT,
        wait_for_output: bool = True,
    ):
        return await self._mcp_wrapper(
            tool_input={
                "session_name": session_name,
                "command": command,
                "description": description,
                "timeout": timeout,
                "wait_for_output": wait_for_output,
            }
        )