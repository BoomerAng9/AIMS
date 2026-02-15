import os
import json
import httpx
import asyncio
import subprocess
from typing import Dict, Optional
from mcp.types import ToolAnnotations
from fastmcp import FastMCP
from fastmcp.server.proxy import ProxyClient
from argparse import ArgumentParser
from starlette.responses import JSONResponse
from ii_tool.tools.manager import get_sandbox_tools
from ii_tool.mcp_integrations.manager import get_mcp_integrations
from ii_tool.core.tool_server import (
    set_tool_server_url as set_tool_server_url_singleton,
)
from dotenv import load_dotenv
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

load_dotenv()
_credential = None
_codex_process: Optional[subprocess.Popen] = None
_codex_url = "http://0.0.0.0:1324"


def get_current_credential():
    return _credential


def set_current_credential(credential: Dict):
    global _credential
    _credential = credential


def get_codex_process():
    return _codex_process


def set_codex_process(process: subprocess.Popen):
    global _codex_process
    _codex_process = process


def get_codex_url():
    return _codex_url



@retry(
    stop=stop_after_attempt(5),
    wait=wait_exponential(multiplier=1, min=1, max=10),
    retry=retry_if_exception_type((httpx.RequestError, httpx.HTTPStatusError)),
    reraise=True,
)
async def check_tool_server_health(url: str):
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{url}/health")
        response.raise_for_status()


async def create_mcp(workspace_dir: str, custom_mcp_config: Dict = None):
    main_server = FastMCP()

    @main_server.custom_route("/health", methods=["GET"])
    async def health(request):
        return JSONResponse({"status": "ok"}, status_code=200)

    @main_server.custom_route("/custom-mcp", methods=["POST"])
    async def add_mcp_config(request):
        if not await request.json():
            return JSONResponse({"error": "Invalid request"}, status_code=400)
        main_server.mount(
            FastMCP.as_proxy(ProxyClient(await request.json())), prefix="mcp"
        )
        return JSONResponse({"status": "success"}, status_code=200)

    @main_server.custom_route("/register-codex", methods=["POST"])
    async def register_codex(request):
        """Start the Codex SSE HTTP server subprocess"""
        # Check if Codex is already running
        if get_codex_process() is not None:
            process = get_codex_process()
            if process.poll() is None:  # Process is still running
                return JSONResponse(
                    {"status": "already_running", "url": get_codex_url()},
                    status_code=200,
                )

        try:
            # Start the sse-http-server subprocess
            process = subprocess.Popen(
                ["sse-http-server", "--addr", get_codex_url().replace("http://", "")],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
            )
            set_codex_process(process)

            # Check if the process started successfully
            if process.poll() is not None:
                # Process terminated already
                stdout, stderr = process.communicate()
                return JSONResponse(
                    {
                        "status": "error",
                        "message": f"Codex server failed to start: {stderr}",
                    },
                    status_code=500,
                )

            # Verify the server is responding
            try:
                async with httpx.AsyncClient() as client:
                    response = await client.get(
                        f"{get_codex_url()}/health", timeout=5.0
                    )
                    response.raise_for_status()
            except Exception:
                # Server might not have health endpoint, that's ok
                pass

            return JSONResponse(
                {"status": "success", "url": get_codex_url()}, status_code=200
            )

        except FileNotFoundError:
            return JSONResponse(
                {
                    "status": "error",
                    "message": "sse-http-server executable not found. Make sure it's installed and in PATH.",
                },
                status_code=500,
            )
        except Exception as e:
            return JSONResponse(
                {"status": "error", "message": f"Failed to start Codex server: {e}"},
                status_code=500,
            )

    @main_server.custom_route("/credential", methods=["POST"])
    async def set_credential(request):
        if not await request.json():
            return JSONResponse({"error": "Invalid request"}, status_code=400)
        credential = await request.json()
        if not credential.get("user_api_key") or not credential.get("session_id"):
            return JSONResponse(
                {
                    "error": "user_api_key or session_id is not set in the credential file"
                },
                status_code=400,
            )
        set_current_credential(credential)
        return JSONResponse({"status": "success"}, status_code=200)

    @main_server.custom_route("/tool-server-url", methods=["POST"])
    async def set_tool_server_url(request):
        if get_current_credential() is None:
            return JSONResponse(
                {"error": "Credential must be set before setting tool server url"},
                status_code=400,
            )

        if not await request.json():
            return JSONResponse({"error": "Invalid request"}, status_code=400)

        # Check if the tool server is running
        tool_server_url_request = (await request.json()).get("tool_server_url")
        try:
            await check_tool_server_health(tool_server_url_request)
        except Exception as e:
            return JSONResponse(
                {"status": "error", "message": f"Can't connect to tool server: {e}"},
                status_code=500,
            )

        set_tool_server_url_singleton(tool_server_url_request)

        # Start registering tools
        tools = get_sandbox_tools(
            workspace_path=workspace_dir,
            credential=get_current_credential(),
        )
        for tool in tools:
            main_server.tool(
                tool.execute_mcp_wrapper,
                name=tool.name,
                description=tool.description,
                annotations=ToolAnnotations(
                    title=tool.display_name,
                    readOnlyHint=tool.read_only,
                ),
            )

            # NOTE: this is a temporary fix to set the parameters of the tool
            _mcp_tool = await main_server._tool_manager.get_tool(tool.name)
            _mcp_tool.parameters = tool.input_schema

            print(f"Registered tool: {tool.name}")

        return JSONResponse({"status": "success"}, status_code=200)

    # Our system defined MCP integrations
    mcp_integrations = get_mcp_integrations(workspace_dir)
    for mcp_integration in mcp_integrations:
        proxy = FastMCP.as_proxy(ProxyClient(mcp_integration.config))
        for tool_name in mcp_integration.selected_tool_names:
            mirrored_tool = await proxy.get_tool(tool_name)
            local_tool = mirrored_tool.copy()
            main_server.add_tool(local_tool)

    # User customized MCP integrations
    if custom_mcp_config:
        print(custom_mcp_config)
        proxy = FastMCP.as_proxy(ProxyClient(custom_mcp_config))
        main_server.mount(proxy, prefix="mcp")

    return main_server


async def main():
    parser = ArgumentParser()
    parser.add_argument("--workspace_dir", type=str, default=None)
    parser.add_argument("--custom_mcp_config", type=str, default=None)
    parser.add_argument("--port", type=int, default=6060)

    args = parser.parse_args()

    workspace_dir = os.getenv("WORKSPACE_DIR")
    if args.workspace_dir:
        workspace_dir = args.workspace_dir

    if not workspace_dir:
        raise ValueError(
            "workspace_dir is not set. Please set the WORKSPACE_DIR environment variable or pass it as an argument --workspace_dir"
        )

    os.makedirs(workspace_dir, exist_ok=True)
    custom_mcp_config = args.custom_mcp_config
    if custom_mcp_config:
        with open(custom_mcp_config, "r") as f:
            custom_mcp_config = json.load(f)

    mcp = await create_mcp(
        workspace_dir=workspace_dir, custom_mcp_config=custom_mcp_config
    )
    await mcp.run_async(transport="http", host="0.0.0.0", port=args.port)


if __name__ == "__main__":
    import asyncio

    asyncio.run(main())
