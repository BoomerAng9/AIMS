import httpx
from typing import Any, List, Dict
from ii_tool.tools.base import BaseTool, ToolResult
from ii_tool.core.tool_server import get_tool_server_url, set_tool_server_url


# Name
NAME = "web_visit_compress"
DISPLAY_NAME = "Web Visit Compress"

# Tool description
DESCRIPTION = "You should call this tool when you need to visit a webpage and extract relevant content. Returns relevant webpage content as text."

# Input schema
INPUT_SCHEMA = {
    "type": "object",
    "properties": {
        "urls": {
            "type": "array",
            "items": {
                "type": "string",
            },
            "description": "The urls of the webpages to visit.",
        },
        "query": {
            "type": "string",
            "description": "The query to extract relevant content.",
        },
    },
    "required": ["urls", "query"],
}

DEFAULT_TIMEOUT = 300


class WebVisitCompressTool(BaseTool):
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
        urls = tool_input["urls"]
        query = tool_input["query"]
        process_urls = []
        for url in urls:
            if "arxiv.org/abs" in url:
                url = "https://arxiv.org/html/" + url.split("/")[-1]
            process_urls.append(url)

        tool_server_url = get_tool_server_url()
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{tool_server_url}/researcher-web-visit",
                    json={"urls": process_urls, "query": query, "session_id": self.credential['session_id']},
                    headers={
                        "Authorization": f"Bearer {self.credential['user_api_key']}",
                    },
                    timeout=DEFAULT_TIMEOUT,
                )
                response.raise_for_status()
                response_data = response.json()
        except Exception as e:
            return ToolResult(
                llm_content="",
                user_display_content=str(e),
                is_error=True,
            )

        if not response_data["success"]:
            return ToolResult(
                llm_content="",
                user_display_content=response_data["error"],
                is_error=True,
            )

        content = response_data["content"]

        return ToolResult(
            llm_content=content,
            user_display_content=content,
        )


    async def execute_mcp_wrapper(self, urls: List[str], query: str):
        return await self._mcp_wrapper(
            tool_input={
                "urls": urls,
                "query": query,
            }
        )
