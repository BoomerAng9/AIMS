"""Web visit tool - thin wrapper around Tool Server API."""

import json
import httpx

from ii_agent.server.chat.models import ErrorTextContent, TextResultContent

from .base import BaseTool, ToolInfo, ToolCallInput, ToolResponse


class WebVisitTool(BaseTool):
    """Visit a URL and extract its content using Tool Server."""

    def __init__(self, tool_server_url: str, user_api_key: str, session_id: str):
        self.tool_server_url = tool_server_url
        self.user_api_key = user_api_key
        self.session_id = session_id
        self._name = "web_visit"

    @property
    def name(self) -> str:
        return self._name

    def info(self) -> ToolInfo:
        return ToolInfo(
            name="web_visit",
            description=(
                "Visits a URL and extracts its content. Use this to read documentation, "
                "articles, or any web page content. Combine with web_search to first find "
                "relevant URLs, then visit them for full content."
            ),
            parameters={
                "type": "object",
                "properties": {
                    "url": {
                        "type": "string",
                        "description": "The URL to visit and extract content from",
                    },
                    "prompt": {
                        "type": "string",
                        "description": "Optional prompt to guide what information to extract from the page",
                    },
                },
            },
            required=["url"],
        )

    async def run(self, tool_call: ToolCallInput) -> ToolResponse:
        try:
            params = json.loads(tool_call.input)
            url = params["url"]
            prompt = params.get("prompt")
        except (json.JSONDecodeError, KeyError) as e:
            return ToolResponse(
                output=ErrorTextContent(value=f"Invalid tool input: {e}")
            )

        try:
            async with httpx.AsyncClient() as client:
                request_body = {"url": url, "session_id": self.session_id}
                if prompt:
                    request_body["prompt"] = prompt

                response = await client.post(
                    f"{self.tool_server_url}/web-visit",
                    json=request_body,
                    headers={"Authorization": f"Bearer {self.user_api_key}"},
                    timeout=300,
                )
                response.raise_for_status()
                data = response.json()
                content = data.get("content", "")

                return ToolResponse(
                    output=TextResultContent(value=content or "No content extracted.")
                )

        except httpx.TimeoutException:
            return ToolResponse(
                output=ErrorTextContent(
                    value=f"Visiting {url} timed out. The page may be too slow or unavailable."
                ),
            )
        except httpx.HTTPStatusError as e:
            return ToolResponse(
                output=ErrorTextContent(
                    value=f"Failed to visit {url}: {e.response.status_code}"
                ),
            )
        except Exception as e:
            return ToolResponse(
                output=ErrorTextContent(
                    value=f"Unexpected error visiting {url}: {str(e)}"
                ),
            )
