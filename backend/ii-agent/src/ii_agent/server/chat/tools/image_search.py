"""Image search tool - thin wrapper around Tool Server API."""

import json
import httpx

from ii_agent.server.chat.models import ErrorTextContent, TextResultContent

from .base import BaseTool, ToolInfo, ToolCallInput, ToolResponse


class ImageSearchTool(BaseTool):
    """Search for images using Tool Server."""

    def __init__(self, tool_server_url: str, user_api_key: str, session_id: str):
        self.tool_server_url = tool_server_url
        self.user_api_key = user_api_key
        self.session_id = session_id
        self._name = "image_search"

    @property
    def name(self) -> str:
        return self._name

    def info(self) -> ToolInfo:
        return ToolInfo(
            name="image_search",
            description=(
                "Searches for images on the web based on a query and returns URLs and metadata. "
                "Use this to find visual content, illustrations, diagrams, or reference images."
            ),
            parameters={
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "The search query to find images",
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
                    f"{self.tool_server_url}/image-search",
                    json={"query": query, "session_id": self.session_id},
                    headers={"Authorization": f"Bearer {self.user_api_key}"},
                    timeout=120,
                )
                response.raise_for_status()
                data = response.json()
                results = data.get("results", [])[:12]

                return ToolResponse(
                    output=TextResultContent(value=json.dumps(results, indent=2))
                )

        except httpx.TimeoutException:
            return ToolResponse(
                output=ErrorTextContent(
                    value="Image search timed out. Please try again."
                )
            )
        except httpx.HTTPStatusError as e:
            return ToolResponse(
                output=ErrorTextContent(
                    value=f"Image search failed: {e.response.status_code}"
                )
            )
        except Exception as e:
            return ToolResponse(
                output=ErrorTextContent(value=f"Unexpected error: {str(e)}")
            )
