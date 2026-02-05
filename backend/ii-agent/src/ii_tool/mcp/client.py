import httpx
from fastmcp.client import Client
from typing import Dict, Any

from ii_agent.core.logger import logger

DEFAULT_TIMEOUT = 1800


class MCPClient(Client):
    def __init__(self, server_url: str, **args):
        logger.info(f"Initializing MCPClient with server URL: {server_url}")
        self.server_url = server_url
        self.http_session = None
        mcp_url = server_url + "/mcp/"
        super().__init__(mcp_url, **args)

    async def __aenter__(self):
        self.http_session = httpx.AsyncClient()
        return await super().__aenter__()  # Initialize the parent class

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.http_session:
            await self.http_session.aclose()  # httpx uses aclose()
        await super().__aexit__(exc_type, exc_val, exc_tb)  # Clean up the parent class

    async def register_custom_mcp(self, mcp_config: Dict[str, Any]) -> Dict[str, Any]:
        # Use the existing session - no nested async with needed!
        if not self.http_session:
            raise Exception("MCPClient is not initialized")

        response = await self.http_session.post(
            self.server_url + "/custom-mcp", json=mcp_config
        )
        if response.status_code != 200:
            raise Exception(f"Failed to register custom mcp: {response.text}")
        return response.json()

    async def register_codex(self):
        response = await self.http_session.post(self.server_url + "/register-codex")
        if response.status_code != 200:
            raise Exception(f"Failed to register codex: {response.text}")
        return response.json()

    async def set_tool_server_url(self, tool_server_url: str) -> Dict[str, Any]:
        response = await self.http_session.post(
            self.server_url + "/tool-server-url",
            json={"tool_server_url": tool_server_url},
        )
        if response.status_code != 200:
            raise Exception(f"Failed to set tool server url: {response.text}")
        return response.json()

    async def set_credential(self, credential: Dict[str, Any]) -> Dict[str, Any]:
        response = await self.http_session.post(
            self.server_url + "/credential", json=credential
        )
        if response.status_code != 200:
            raise Exception(f"Failed to set credential: {response.text}")
        return response.json()
