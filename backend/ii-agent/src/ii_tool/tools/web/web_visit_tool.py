import httpx
from typing import Any, Dict
from ii_tool.tools.base import BaseTool, ToolResult
from ii_tool.core.tool_server import get_tool_server_url, set_tool_server_url

# Name
NAME = "web_visit"
DISPLAY_NAME = "Web Visit"

# Tool description
DESCRIPTION = """Retrieves and extracts the text content of a given webpage URL. It is useful when you need to extract information from a webpage after discovering it through search results

When to Use:
- Access the full content of an article, documentation page, or blog post
- Gather detailed information from a specific source URL
- Use after web_search tool to dive deeper into a chosen result
- Extract specific information from a webpage using a prompt (e.g., "Extract the main pricing tiers" or "Summarize the key features")

NOTE: Prefer using prompt to get focused, relevant information instead of processing large raw content
"""

# Input schema
INPUT_SCHEMA = {
        "type": "object",
        "properties": {
            "url": {
                "type": "string",
                "description": "The URL of the webpage to visit and extract content from",
            },
            "prompt": {
                "type": "string",
                "description": "The prompt to run on the content of the webpage. If provided, processes the webpage content with this prompt to extract specific information. If not provided, returns the raw extracted content"
            }
        },
        "required": ["url"],
    }
DEFAULT_TIMEOUT = 300
FAILURE_MESSAGE = "Please try again. If the problem continues, switch to browser tools for manual visiting and let the user know that web visit is temporarily unavailable."


class WebVisitTool(BaseTool):
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
        url = tool_input["url"]
        prompt = tool_input.get("prompt", None)
        if "arxiv.org/abs" in url:
            url = "https://arxiv.org/html/" + url.split("/")[-1]

        request_data = {
            "url": url,
            "session_id": self.credential['session_id'],
        }
        if prompt:
            request_data["prompt"] = prompt

        tool_server_url = get_tool_server_url()
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{tool_server_url}/web-visit",
                    json=request_data,
                    headers={
                        "Authorization": f"Bearer {self.credential['user_api_key']}",
                    },
                    timeout=DEFAULT_TIMEOUT
                )
                response.raise_for_status()
        except httpx.TimeoutException:
            if not prompt:
                return ToolResult(
                    llm_content=f"The webpage visit engine is taking too long to load. {FAILURE_MESSAGE}",
                    error=True,
                )
            else:
                return ToolResult(
                    llm_content=f"The webpage visit engine is taking too long to process prompt, try again without using `prompt` to get the raw content",
                    error=True,
                )
        except httpx.NetworkError:
            return ToolResult(
                llm_content=f"The webpage visit engine is unreachable (network issue). {FAILURE_MESSAGE}",
                error=True,
            )
        except httpx.HTTPStatusError as e:
            return ToolResult(
                llm_content=f"The visit request failed: {e}. {FAILURE_MESSAGE}",
                error=True,
            )

        response_data = response.json()
        content = response_data.get("content", None)
        if content is None or (isinstance(content, str) and not content.strip()):
            return ToolResult(
                llm_content="The webpage content is empty or un-extractable (e.g. login, paywall, etc.). Please try again with a different URL or use browser tools to visit manually.",
                error=True,
            )

        return ToolResult(
            llm_content=content,
        )


    async def execute_mcp_wrapper(self, url: str, prompt: str = None):
        return await self._mcp_wrapper(
            tool_input={
                "url": url,
                "prompt": prompt,
            }
        )
