"""Web search tool - thin wrapper around Tool Server API."""

import json
import httpx

from ii_agent.server.chat.models import ErrorTextContent, TextResultContent

from .base import BaseTool, ToolInfo, ToolCallInput, ToolResponse


class WebSearchTool(BaseTool):
    """Search the web using Tool Server."""

    def __init__(self, tool_server_url: str, user_api_key: str, session_id: str):
        self.tool_server_url = tool_server_url
        self.user_api_key = user_api_key
        self.session_id = session_id
        self._name = "web_search"

    @property
    def name(self) -> str:
        return self._name

    def info(self) -> ToolInfo:
        return ToolInfo(
            name="web_search",
            description=(
                "Performs a web search using a search engine API and returns the top 5 results "
                "with each result's title, URL, and snippet. Use this to find information on the "
                "internet that goes beyond the model's training cutoff, research current events, "
                "documentation, tutorials, or check the latest news and trends."
            ),
            parameters={
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "The search query to find information on the web",
                    }
                },
            },
            required=["query"],
        )

    async def run(self, tool_call: ToolCallInput) -> ToolResponse:
        try:
            params = json.loads(tool_call.input)
            query = params["query"]
        except (json.JSONDecodeError, KeyError) as e:
            return ToolResponse(
                output=ErrorTextContent(value=f"Invalid tool input: {e}")
            )

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.tool_server_url}/web-search",
                    json={"query": query, "session_id": self.session_id},
                    headers={"Authorization": f"Bearer {self.user_api_key}"},
                    timeout=120,
                )
                response.raise_for_status()
                data = response.json()
                results = data.get("results", [])[:12]

                if len(results) == 0:
                    return ToolResponse(
                        output=TextResultContent(
                            value=(
                                f"The search engine processed your query '{query}' successfully "
                                "but found no matching results. Try rephrasing with different "
                                "keywords, broader terms, or check for typos."
                            )
                        )
                    )

                return ToolResponse(
                    output=TextResultContent(value=json.dumps(results, indent=2))
                )

        except httpx.TimeoutException:
            return ToolResponse(
                output=ErrorTextContent(
                    value="The search engine is taking too long to respond. Please try again."
                )
            )
        except httpx.HTTPStatusError as e:
            return ToolResponse(
                output=ErrorTextContent(
                    value=f"Search request failed: {e.response.status_code}"
                )
            )
        except Exception as e:
            return ToolResponse(
                output=ErrorTextContent(value=f"Unexpected error: {str(e)}")
            )
