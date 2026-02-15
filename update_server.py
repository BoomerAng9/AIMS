import sys

with open('backend/ii-agent/src/ii_tool/mcp/server.py', 'r') as f:
    lines = f.readlines()

new_func = """
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


"""

# Find `async def create_mcp`
idx = -1
for i, line in enumerate(lines):
    if "async def create_mcp" in line:
        idx = i
        break

if idx != -1:
    lines.insert(idx, new_func)

with open('backend/ii-agent/src/ii_tool/mcp/server.py', 'w') as f:
    f.writelines(lines)
