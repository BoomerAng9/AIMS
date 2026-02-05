from .base import BaseMCPIntegration
from .playwright import PlaywrightMCP

def get_mcp_integrations(workspace_path: str) -> list[BaseMCPIntegration]:
    return [
        # PlaywrightMCP(workspace_dir=workspace_path),
    ]