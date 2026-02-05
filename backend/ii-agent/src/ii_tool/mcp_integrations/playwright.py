from ii_tool.mcp_integrations.base import BaseMCPIntegration


SELECTED_TOOLS = [
    # core automation
    "browser_click",
    "browser_close",
    "browser_console_messages",
    "browser_drag",
    "browser_evaluate",
    # "browser_file_upload",
    "browser_handle_dialog",
    "browser_hover",
    "browser_navigate",
    # "browser_navigate_back",
    # "browser_navigate_forward",
    "browser_network_requests",
    "browser_press_key",
    # "browser_resize",
    "browser_select_option",
    "browser_snapshot",
    "browser_take_screenshot",
    "browser_type",
    "browser_wait_for",

    # tabs management
    "browser_tab_close",
    "browser_tab_list",
    "browser_tab_new",
    "browser_tab_select",

    # install
    # "browser_install",

    # vision
    "browser_mouse_click_xy",
    "browser_mouse_drag_xy",
    "browser_mouse_move_xy",
]

class PlaywrightMCP(BaseMCPIntegration):
    
    def __init__(self, workspace_dir: str, viewport_height: int = 720, viewport_width: int = 1280, vision: bool = True):
        self.workspace_dir = workspace_dir
        self.viewport_height = viewport_height
        self.viewport_width = viewport_width
        self.vision = vision


    @property
    def selected_tool_names(self) -> list[str]:
        return SELECTED_TOOLS

    @property
    def config(self) -> dict:
        base_config = {
            "mcpServers": {
                "playwright": {
                "command": "npx",
                "args": [
                    "@playwright/mcp@v0.0.32", # Lastest (v0.0.34) is not working - 19/08/2025
                    "--viewport-size",
                    f"{self.viewport_width}, {self.viewport_height}",
                    "--output-dir",
                    f"{self.workspace_dir}/browser_screenshots",
                    "--isolated",
                    "--no-sandbox",
                ]
                }
            }
        }

        if self.vision:
            base_config["mcpServers"]["playwright"]["args"].append("--caps")
            base_config["mcpServers"]["playwright"]["args"].append("vision")

        return base_config