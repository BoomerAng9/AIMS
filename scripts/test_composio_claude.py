import asyncio
from composio import Composio
from composio_claude_agent_sdk import ClaudeAgentSDKProvider
from claude_agent_sdk import ClaudeSDKClient, ClaudeAgentOptions, create_sdk_mcp_server

# Initialize Composio
composio = Composio(
    api_key="ak_HY7IkVH1uuCPf6kGv5pa",
    provider=ClaudeAgentSDKProvider()
)

external_user_id = "pg-test-d922cf51-cce6-42f7-a736-de3138a8826f"

# Create a tool router session (manage_connections=False lets us handle auth manually)
session = composio.create(
    user_id=external_user_id,
    manage_connections=False,
)

# Get tools from the session (native)
tools = session.tools()
custom_server = create_sdk_mcp_server(name="composio", version="1.0.0", tools=tools)

# Query Claude with MCP tools
async def main():
    
    # 1. Manually authorize the user to use the Gmail API if needed
    print("Checking connection status/requesting authorization...")
    
    # Check if we should authorize (this will prompt a URL if not already connected)
    try:
        connection_request = session.authorize(
            toolkit='gmail',
            callback_url='https://aimanagedsolutions.cloud/api/composio/callback'
        )
        
        if hasattr(connection_request, 'redirect_url') and connection_request.redirect_url:
            print(f"Please authorize the app by visiting this URL: {connection_request.redirect_url}")
            print("Waiting for connection...")
            connected_account = connection_request.wait_for_connection()
            print(f"Connection established successfully! Connected account id: {connected_account.id}")
    except Exception as e:
        print(f"Connection logic notice: {e}")

    # 2. Run the Claude Agent
    print("\nInitializing Claude Agent...")
    options = ClaudeAgentOptions(
        system_prompt="You are a helpful assistant.",
        permission_mode="bypassPermissions",
        mcp_servers={
            "composio": custom_server,
        },
    )

    async with ClaudeSDKClient(options=options) as client:
        print("Sending request to Claude: 'Send an email to asg@achievemor.io with the subject 'Hello from Composio'...'")
        await client.query("Send an email to asg@achievemor.io with the subject 'Hello from Composio' and the body 'This is a test email!'")
        
        # Extract and print response
        async for msg in client.receive_response():
            print(msg)

if __name__ == "__main__":
    asyncio.run(main())
