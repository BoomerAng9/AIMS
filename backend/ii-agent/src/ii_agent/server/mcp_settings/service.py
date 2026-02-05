"""MCP settings service layer."""

from datetime import datetime, timezone
from typing import Optional
import uuid
from sqlalchemy import select
import sqlalchemy
from ii_agent.db.models import MCPSetting
from ii_agent.server.api.deps import DBSession
from ii_agent.server.mcp_settings.models import (
    MCPSettingCreate,
    MCPSettingUpdate,
    MCPSettingInfo,
    MCPSettingList,
    MCPServersConfig,
)
from ii_agent.server.mcp_settings.models import validate_metadata


async def create_mcp_settings(
    *, db_session: DBSession, mcp_setting_in: MCPSettingCreate, user_id: str
) -> MCPSettingInfo:
    """Create new MCP settings for a user."""

    # Deactivate any existing active settings for this user
    existing_active_settings = (
        (
            await db_session.execute(
                select(MCPSetting).filter(
                    MCPSetting.user_id == user_id,
                    MCPSetting.is_active,
                )
            )
        )
        .scalars()
        .all()
    )

    for setting in existing_active_settings:
        setting.is_active = False
        setting.updated_at = datetime.now(timezone.utc)

    # Create new settings (always create, never update)
    new_setting = MCPSetting(
        id=str(uuid.uuid4()),
        user_id=user_id,
        mcp_config=mcp_setting_in.mcp_config.model_dump(exclude_none=True),
        mcp_metadata=None if not mcp_setting_in.metadata else mcp_setting_in.metadata.model_dump(exclude_none=True),
        is_active=True,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )

    db_session.add(new_setting)
    await db_session.commit()
    await db_session.refresh(new_setting)

    return _to_mcp_setting_info(new_setting)


async def update_mcp_settings(
    *,
    db_session: DBSession,
    setting_id: str,
    setting_update: MCPSettingUpdate,
    user_id: str,
) -> Optional[MCPSettingInfo]:
    """Update existing MCP settings."""

    setting = (
        await db_session.execute(
            select(MCPSetting).filter(
                MCPSetting.id == setting_id,
                MCPSetting.user_id == user_id,
            )
        )
    ).scalar_one_or_none()

    if not setting:
        return None

    # Update only provided fields
    if setting_update.mcp_config is not None:
        setting.mcp_config = setting_update.mcp_config.model_dump(exclude_none=True)
    if setting_update.metadata is not None:
        setting.mcp_metadata = setting_update.metadata.model_dump(exclude_none=True)
    if setting_update.is_active is not None:
        setting.is_active = setting_update.is_active

    setting.updated_at = datetime.now(timezone.utc)

    await db_session.commit()
    await db_session.refresh(setting)

    return _to_mcp_setting_info(setting)


async def get_mcp_settings(
    *, db_session: DBSession, setting_id: str, user_id: str
) -> Optional[MCPSettingInfo]:
    """Get MCP settings by ID."""

    setting = (
        await db_session.execute(
            select(MCPSetting).filter(
                MCPSetting.id == setting_id,
                MCPSetting.user_id == user_id,
            )
        )
    ).scalar_one_or_none()

    if not setting:
        return None

    return _to_mcp_setting_info(setting)


async def list_mcp_settings(
    *, db_session: DBSession, user_id: str, only_active: bool = False, no_metadata : bool = False
) -> MCPSettingList:
    """List all MCP settings for a user."""

    query = select(MCPSetting).filter(MCPSetting.user_id == user_id)

    if only_active:
        query = query.filter(MCPSetting.is_active)
    

    if no_metadata:
        # Check for both NULL and empty JSONB values
        query = query.filter(
            sqlalchemy.or_(
                MCPSetting.mcp_metadata.is_(None),
                MCPSetting.mcp_metadata == {}
            )
        )
    query = query.order_by(MCPSetting.created_at.desc())

    settings = (await db_session.execute(query)).scalars().all()

    settings_list = [_to_mcp_setting_info(setting) for setting in settings]

    return MCPSettingList(settings=settings_list)


async def delete_mcp_settings(
    *, db_session: DBSession, setting_id: str, user_id: str
) -> bool:
    """Delete MCP settings by ID."""

    setting = (
        await db_session.execute(
            select(MCPSetting).filter(
                MCPSetting.id == setting_id,
                MCPSetting.user_id == user_id,
            )
        )
    ).scalar_one_or_none()

    if not setting:
        return False

    await db_session.delete(setting)
    await db_session.commit()

    return True


# Helper functions
def _to_mcp_setting_info(setting: MCPSetting) -> MCPSettingInfo:
    """Convert database model to Pydantic model."""
    # Convert dict back to MCPServersConfig when reading from database
    mcp_config = setting.mcp_config or {}
    if isinstance(mcp_config, dict):
        mcp_config = MCPServersConfig(**mcp_config)
    
    metadata = None
    if setting.mcp_metadata is not None and isinstance(setting.mcp_metadata, dict):
        try:
            metadata = validate_metadata(setting.mcp_metadata)
            print("Validated Metadata: ", type(metadata))
        except (ValueError, TypeError) as e:
            # Log error but don't fail the entire operation
            print(f"Warning: Failed to validate metadata for setting {setting.id}: {e}")
            # Return raw metadata as fallback for backward compatibility

    return MCPSettingInfo(
        id=setting.id,
        mcp_config=mcp_config,
        is_active=setting.is_active,
        metadata=metadata,
        created_at=setting.created_at.isoformat() if setting.created_at else "",
        updated_at=setting.updated_at.isoformat() if setting.updated_at else None,
    )
