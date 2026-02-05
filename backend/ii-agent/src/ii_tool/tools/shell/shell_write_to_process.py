from typing import Any
from ii_tool.tools.shell.terminal_manager import BaseShellManager
from ii_tool.tools.base import BaseTool, ToolResult


# Name
NAME = "BashWriteToProcess"
DISPLAY_NAME = "Write to shell process"

# Tool description
DESCRIPTION = """Write to a process in a specified shell session. Use for interacting with running processes."""

# Input schema
INPUT_SCHEMA = {
        "type": "object",
        "properties": {
            "session_name": {
                "type": "string",
                "description": "The name of the session to write to",
            },
            "input": {
                "type": "string",
                "description": "Text to write to the process",
            },
            "press_enter": {
                "type": "boolean",
                "description": "Whether to press enter after writing the text",
                "default": True
            },
        },
        "required": ["session_name", "input"],
    }



class ShellWriteToProcessTool(BaseTool):
    """Tool for writing to a process in a shell session"""

    name = NAME
    display_name = DISPLAY_NAME
    description = DESCRIPTION
    input_schema = INPUT_SCHEMA
    read_only = False

    def __init__(self, shell_manager: BaseShellManager) -> None:
        self.shell_manager = shell_manager

    async def execute(
        self,
        tool_input: dict[str, Any],
    ) -> ToolResult:
        """Execute a bash command in the specified session."""
        session_name = tool_input.get("session_name")
        input = tool_input.get("input")
        press_enter = tool_input.get("press_enter", True)
        
        if not input:
            return ToolResult(
                llm_content="input is required",
                is_error=True
            )
        
        all_current_sessions = self.shell_manager.get_all_sessions()
        if session_name not in all_current_sessions:
            return ToolResult(
                llm_content=f"Session '{session_name}' is not initialized. Use `ShellInit` to initialize a session. Available sessions: {all_current_sessions}",
                is_error=True
            )
            
        result = self.shell_manager.write_to_process(session_name, input, press_enter)
        return ToolResult(
            llm_content=result.clean_output,
            user_display_content=result.ansi_output,
            is_error=False
        )

    async def execute_mcp_wrapper(
        self,
        session_name: str,
        input: str,
        press_enter: bool = True,
    ):
        return await self._mcp_wrapper(
            tool_input={
                "session_name": session_name,
                "input": input,
                "press_enter": press_enter,
            }
        )