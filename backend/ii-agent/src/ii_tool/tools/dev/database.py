from typing import Any, Dict

from httpx import AsyncClient
from ii_tool.tools.base import BaseTool, ToolResult
from ii_tool.core.tool_server import get_tool_server_url, set_tool_server_url


# Name
NAME = "get_database_connection"
DISPLAY_NAME = "Get database connection"

# Tool description
DESCRIPTION = """Get a database connection.
- Get connection details for database operations.
- Support multiple database types (currently: postgres).
- Provide connection string for use in applications.
"""

# Input schema
INPUT_SCHEMA = {
    "type": "object",
    "properties": {
        "database_type": {
            "type": "string",
            "description": "Type of the database to connect to",
            "enum": ["postgres"],
        },
    },
    "required": ["database_type"],
}

DEFAULT_TIMEOUT = 120

class GetDatabaseConnection(BaseTool):
    name = NAME
    display_name = DISPLAY_NAME
    description = DESCRIPTION
    input_schema = INPUT_SCHEMA
    read_only = False

    def __init__(
        self,
        credential: Dict,
        tool_server_url: str | None = None,
    ) -> None:
        super().__init__()
        if tool_server_url:
            set_tool_server_url(tool_server_url)
        self.credential = credential
        
    async def execute(
        self,
        tool_input: dict[str, Any],
    ) -> ToolResult:
        database_type = tool_input["database_type"]
        
        tool_server_url = get_tool_server_url()
        try:
            async with AsyncClient(
                base_url=tool_server_url,
            ) as client:
                response = await client.post(
                    f"{tool_server_url}/database",
                    json={
                        "database_type": database_type,
                        "session_id": self.credential['session_id'],
                    },
                    headers={
                        "Authorization": f"Bearer {self.credential['user_api_key']}",
                    },
                    timeout=DEFAULT_TIMEOUT,
                )
        except Exception as e:
            return ToolResult(
                llm_content=f"Failed to get database connection. Error: {str(e)}",
                user_display_content=f"Failed to get database connection. Error: {str(e)}",
                is_error=True,
            )

        if response.status_code != 200 or response.json().get("success") is False:
            return ToolResult(
                llm_content=f"Failed to get database connection. Error: {response.json().get('error')}",
                user_display_content=f"Failed to get database connection. Error: {response.json().get('error')}",
                is_error=True,
            )
        connection_string = response.json()["connection_string"]

        return ToolResult(
            llm_content=f"Successfully got database connection. Tool output: {connection_string}",
            user_display_content=f"Successfully got database connection. Tool output: {connection_string}",
            is_error=False,
        )

    async def execute_mcp_wrapper(
        self,
        database_type: str,
    ):
        return await self._mcp_wrapper(
            tool_input={
                "database_type": database_type,
            }
        )
