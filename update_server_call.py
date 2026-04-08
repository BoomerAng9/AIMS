import sys

with open('backend/ii-agent/src/ii_tool/mcp/server.py', 'r') as f:
    content = f.read()

search_block = """        # Check if the tool server is running
        tool_server_url_request = (await request.json()).get("tool_server_url")
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{tool_server_url_request}/health")
                response.raise_for_status()
        # TODO: add retry logic
        except Exception as e:
            return JSONResponse(
                {"status": "error", "message": f"Can't connect to tool server: {e}"},
                status_code=500,
            )"""

replace_block = """        # Check if the tool server is running
        tool_server_url_request = (await request.json()).get("tool_server_url")
        try:
            await check_tool_server_health(tool_server_url_request)
        except Exception as e:
            return JSONResponse(
                {"status": "error", "message": f"Can't connect to tool server: {e}"},
                status_code=500,
            )"""

if search_block in content:
    content = content.replace(search_block, replace_block)
    with open('backend/ii-agent/src/ii_tool/mcp/server.py', 'w') as f:
        f.write(content)
    print("Successfully replaced.")
else:
    print("Could not find the block to replace.")
