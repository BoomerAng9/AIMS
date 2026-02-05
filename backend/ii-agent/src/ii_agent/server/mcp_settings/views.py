"""MCP settings management API endpoints."""

from fastapi import APIRouter, Depends, HTTPException
from typing import Optional
import httpx

from ii_agent.db.models import User
from ii_agent.server.api.deps import DBSession, get_db_session
from ii_agent.server.api.deps import CurrentUser, get_current_user
from ii_agent.server.mcp_settings.models import (
    CodexMetadata,
    ClaudeCodeMetadata,
    CodexConfigConfigure,
    ClaudeCodeConfigConfigure,
    MCPSettingCreate,
    MCPSettingUpdate,
    MCPSettingInfo,
    MCPSettingList,
    MCPServersConfig,
)
from ii_agent.server.mcp_settings.service import (
    create_mcp_settings,
    update_mcp_settings,
    get_mcp_settings,
    list_mcp_settings,
    delete_mcp_settings,
)


router = APIRouter(prefix="/user-settings/mcp", tags=["User MCP Settings Management"])


# TODO: Change this to something like /{tool_type} and dynamically choose type, when we have more specific tools
@router.get("/codex", response_model=Optional[MCPSettingInfo])
async def get_codex_settings(
    db: DBSession, current_user: User = Depends(get_current_user)
):
    """
    Get current Codex MCP settings for the user.
    Returns None if no Codex settings exist.
    """

    # Get all MCP settings for the user
    existing_settings = await list_mcp_settings(
        db_session=db,
        user_id=str(current_user.id),
        only_active=False,
    )

    # Find Codex-specific settings
    for setting in existing_settings.settings:
        if setting.metadata and isinstance(setting.metadata, CodexMetadata):
            return setting

    return None


# TODO: Change this to something like /{tool_type} and dynamically choose type, when we have more specific tools
@router.post("/codex", response_model=MCPSettingInfo)
async def configure_codex_mcp(
    request: CodexConfigConfigure, current_user: CurrentUser, db: DBSession
):
    """
    Configure Codex MCP with authentication.
    This endpoint handles the specific configuration for Codex MCP tool.
    """

    # Validate auth_json has required fields
    auth_json = request.auth_json
    apikey = request.apikey
    model = request.model
    reasoning_effort = request.model_reasoning_effort
    search = request.search

    if not auth_json and not apikey:
        raise HTTPException(
            status_code=400, detail="Authentication JSON or API Key is required"
        )
    elif not auth_json and apikey:
        auth_json = {"OPENAI_API_KEY": apikey}
    elif auth_json and apikey:
        auth_json["OPENAI_API_KEY"] = apikey

    # uvx arguments for package installation and execution
    uvx_args = [
        "--from",
        "git+https://github.com/Intelligent-Internet/codex-as-mcp.git@main",
        "codex-as-mcp",
    ]

    # codex-as-mcp server arguments
    server_args = ["--yolo"]

    if model:
        server_args.append(f"--model={model}")

    if reasoning_effort:
        server_args.append(f"--model_reasoning_effort={reasoning_effort}")

    if search:
        server_args.append("--search")

    # Combine uvx args with server args
    args = uvx_args + server_args

    mcp_json_config = {
        "mcpServers": {
            "codex-as-mcp": {
                "command": "uvx",
                "type": "stdio",
                "args": args,
            }
        }
    }
    mcp_config = MCPServersConfig.model_validate(mcp_json_config)

    # Prepare metadata with auth info and server-controlled store path
    # Generalize this if we have more metadata type, validate from the tool_type sent from frontend
    metadata = CodexMetadata(
        auth_json=auth_json,  # pyright: ignore
        store_path="",
    )

    # Check if there's an existing Codex configuration
    existing_settings = await list_mcp_settings(
        db_session=db, user_id=str(current_user.id), only_active=False
    )

    codex_setting = None
    for setting in existing_settings.settings:
        if setting.metadata and isinstance(setting.metadata, CodexMetadata):
            codex_setting = setting
            break

    if codex_setting:
        # Update existing Codex configuration
        result = await update_mcp_settings(
            db_session=db,
            setting_id=codex_setting.id,
            setting_update=MCPSettingUpdate(
                mcp_config=mcp_config, metadata=metadata, is_active=True
            ),
            user_id=str(current_user.id),
        )
    else:
        # Create new Codex configuration
        result = await create_mcp_settings(
            db_session=db,
            mcp_setting_in=MCPSettingCreate(
                mcp_config=mcp_config,
                metadata=metadata,
            ),
            user_id=str(current_user.id),
        )

    return result


@router.get("/claude-code", response_model=Optional[MCPSettingInfo])
async def get_claude_code_settings(
    db: DBSession, current_user: User = Depends(get_current_user)
):
    """
    Get current Claude Code MCP settings for the user.
    Returns None if no Claude Code settings exist.
    """

    # Get all MCP settings for the user
    existing_settings = await list_mcp_settings(
        db_session=db,
        user_id=str(current_user.id),
        only_active=False,
    )

    # Find Claude Code-specific settings
    for setting in existing_settings.settings:
        if setting.metadata and isinstance(setting.metadata, ClaudeCodeMetadata):
            return setting

    return None


async def exchange_code_for_tokens(code: str, verifier: str) -> dict:
    """
    Exchange authorization code for access and refresh tokens.

    Args:
        code: Authorization code from Claude OAuth (may include state after #)
        verifier: PKCE code verifier

    Returns:
        dict with access_token, refresh_token, and expires_in

    Raises:
        HTTPException: If token exchange fails
    """
    # Split the code to handle state
    splits = code.split("#")

    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://console.anthropic.com/v1/oauth/token",
            headers={"Content-Type": "application/json"},
            json={
                "code": splits[0],
                "state": splits[1] if len(splits) > 1 else verifier,
                "grant_type": "authorization_code",
                "client_id": "9d1c250a-e61b-44d9-88ed-5944d1962f5e",
                "redirect_uri": "https://console.anthropic.com/oauth/code/callback",
                "code_verifier": verifier,
            },
        )

    if not response.is_success:
        raise HTTPException(
            status_code=400,
            detail=f"Failed to exchange authorization code for tokens: {response.text}",
        )

    json_response = response.json()
    return {
        "access_token": json_response["access_token"],
        "refresh_token": json_response["refresh_token"],
        "expires_in": json_response["expires_in"],
    }


@router.post("/claude-code", response_model=MCPSettingInfo)
async def configure_claude_code_mcp(
    request: ClaudeCodeConfigConfigure,
    current_user: CurrentUser,
    db: DBSession,
):
    """
    Configure Claude Code MCP with OAuth authentication.
    This endpoint handles the specific configuration for Claude Code MCP tool.
    """

    authorization_code = request.authorization_code
    # The authorization code should be in format: code#state
    # where state is the PKCE verifier
    splits = authorization_code.split("#")
    if len(splits) != 2:
        raise HTTPException(
            status_code=400,
            detail="Invalid authorization code format. Expected format: code#verifier",
        )

    code = splits[0]
    verifier = splits[1]

    # Exchange code for tokens
    tokens = await exchange_code_for_tokens(code, verifier)

    # Store tokens in auth_json format
    import time

    auth_json = {
        "claudeAiOauth": {
            "accessToken": tokens["access_token"],
            "refreshToken": tokens["refresh_token"],
            "expiresAt": int(time.time() * 1000) + tokens["expires_in"] * 1000,
            "scopes": ["user:inference", "user:profile"],
        }
    }

    # Prepare metadata
    metadata = ClaudeCodeMetadata(
        auth_json=auth_json,  # pyright: ignore
        store_path="",
    )

    # For now, we'll create a minimal MCP config for Claude Code
    # This can be expanded later when we know the actual MCP server configuration
    mcp_json_config = {
        "mcpServers": {
            "claude-code-mcp": {
                "command": "npx",
                "args": ["-y", "@steipete/claude-code-mcp@latest"],
            },
        }
    }
    mcp_config = MCPServersConfig.model_validate(mcp_json_config)

    # Check if there's an existing Claude Code configuration
    existing_settings = await list_mcp_settings(
        db_session=db, user_id=str(current_user.id), only_active=False
    )

    claude_code_setting = None
    for setting in existing_settings.settings:
        if setting.metadata and isinstance(setting.metadata, ClaudeCodeMetadata):
            claude_code_setting = setting
            break

    if claude_code_setting:
        # Update existing Claude Code configuration
        result = await update_mcp_settings(
            db_session=db,
            setting_id=claude_code_setting.id,
            setting_update=MCPSettingUpdate(
                mcp_config=mcp_config, metadata=metadata, is_active=True
            ),
            user_id=str(current_user.id),
        )
    else:
        # Create new Claude Code configuration
        result = await create_mcp_settings(
            db_session=db,
            mcp_setting_in=MCPSettingCreate(
                mcp_config=mcp_config,
                metadata=metadata,
            ),
            user_id=str(current_user.id),
        )

    return result


@router.post("", response_model=MCPSettingInfo)
async def create_mcp_setting(
    setting: MCPSettingCreate,
    current_user: CurrentUser,
    db: DBSession,
):
    """Create new MCP settings for the current user. This will deactivate any existing active settings."""

    result = await create_mcp_settings(
        db_session=db,
        mcp_setting_in=setting,
        user_id=str(current_user.id),
    )

    return result


@router.get("", response_model=MCPSettingList)
async def list_user_mcp_settings(
    db: DBSession,
    only_active: bool = False,
    current_user: User = Depends(get_current_user),
):
    """List all MCP settings for the current user."""

    return await list_mcp_settings(
        db_session=db,
        user_id=str(current_user.id),
        only_active=only_active,
        no_metadata=True,
    )


@router.get("/{setting_id}", response_model=MCPSettingInfo)
async def get_mcp_setting(
    db: DBSession,
    setting_id: str,
    current_user: User = Depends(get_current_user),
):
    """Get specific MCP settings by ID."""

    mcp_setting = await get_mcp_settings(
        db_session=db,
        setting_id=setting_id,
        user_id=str(current_user.id),
    )

    if not mcp_setting:
        raise HTTPException(status_code=404, detail="MCP settings not found")

    return mcp_setting


@router.put("/{setting_id}", response_model=MCPSettingInfo)
async def update_mcp_setting(
    db: DBSession,
    setting_id: str,
    setting_update: MCPSettingUpdate,
    current_user: User = Depends(get_current_user),
):
    """Update existing MCP settings."""

    updated_setting = await update_mcp_settings(
        db_session=db,
        setting_id=setting_id,
        setting_update=setting_update,
        user_id=str(current_user.id),
    )

    if not updated_setting:
        raise HTTPException(status_code=404, detail="MCP settings not found")

    return updated_setting


@router.delete("/{setting_id}")
async def delete_mcp_setting(
    db: DBSession,
    setting_id: str,
    current_user: User = Depends(get_current_user),
):
    """Delete MCP settings by ID."""

    deleted = await delete_mcp_settings(
        db_session=db,
        setting_id=setting_id,
        user_id=str(current_user.id),
    )

    if not deleted:
        raise HTTPException(status_code=404, detail="MCP settings not found")

    return {"message": "MCP settings deleted successfully"}
