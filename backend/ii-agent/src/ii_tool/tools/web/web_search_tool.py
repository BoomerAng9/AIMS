import json
import httpx
from typing import Any, Dict
from ii_tool.tools.base import BaseTool, ToolResult
from ii_tool.core.tool_server import get_tool_server_url, set_tool_server_url


# Name
NAME = "web_search"
DISPLAY_NAME = "Web Search"

# Tool description
DESCRIPTION = """Performs a web search using a search engine API and returns the top 5 results with each result's title, URL, and snippet. 

When to Use
- Find information on the internet that goes beyond the model's training cutoff
- Research current events, documentation, tutorials, or updates
- Check the latest news and trends

Combine with the web_visit tool to open a result's URL and extract its full content.
"""

# Input schema
INPUT_SCHEMA = {
    "type": "object",
    "properties": {
        "query": {"type": "string", "description": "The search query to find information on the web"},
    },
    "required": ["query"],
}

MAX_RESULTS = 12
DEFAULT_TIMEOUT = 120
FAILURE_MESSAGE = "Please try again. If the problem continues, switch to browser tools for manual searching and let the user know that web search is temporarily unavailable."
    
class WebSearchTool(BaseTool):
    name = NAME
    display_name = DISPLAY_NAME
    description = DESCRIPTION
    input_schema = INPUT_SCHEMA
    read_only = True

    def __init__(self, credential: Dict, tool_server_url: str | None = None):
        super().__init__()
        if tool_server_url:
            set_tool_server_url(tool_server_url)
        self.credential = credential

    async def execute(
        self,
        tool_input: dict[str, Any],
    ) -> ToolResult:
        query = tool_input["query"]
        
        tool_server_url = get_tool_server_url()
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{tool_server_url}/web-search",
                    json={"query": query, "session_id": self.credential['session_id']},
                    headers={
                        "Authorization": f"Bearer {self.credential['user_api_key']}",
                    },
                    timeout=DEFAULT_TIMEOUT,
                )
                response.raise_for_status()
            
        except httpx.TimeoutException:
            return ToolResult(
                llm_content=f"The search engine is taking too long to respond. It might be overloaded. {FAILURE_MESSAGE}",
                is_error=True,
            )
        except httpx.NetworkError:
            return ToolResult(
                llm_content=f"The search engine is unreachable (network issue). {FAILURE_MESSAGE}",
                is_error=True,
            )
        except httpx.HTTPStatusError as e:
            return ToolResult(
                llm_content=f"The search request failed: {e}. {FAILURE_MESSAGE}",
                is_error=True,
            )

        response_data = response.json()
        results = response_data.get("results", [])[:MAX_RESULTS]
        results_str = json.dumps(results, indent=2)

        if len(results) == 0:
            return ToolResult(
                llm_content=f"The search engine processed your query '{query}' successfully but found no matching results. Try rephrasing with different keywords, broader terms, or check for typos.",
                user_display_content=results_str, # NOTE: to compatible with the current frontend implementation
                is_error=False,
            )
        
        return ToolResult(
            llm_content=results_str,
            is_error=False,
        )

    async def execute_mcp_wrapper(self, query: str):
        return await self._mcp_wrapper(
            tool_input={
                "query": query,
            }
        )
