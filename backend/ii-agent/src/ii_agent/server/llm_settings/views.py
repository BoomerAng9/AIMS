"""Enhanced settings management API endpoints."""

from fastapi import APIRouter, Depends, HTTPException

from ii_agent.db.models import User
from ii_agent.server.api.deps import DBSession, get_db_session, DBSession
from ii_agent.server.api.deps import CurrentUser, get_current_user
from ii_agent.server.llm_settings.models import (
    ModelSettingCreate,
    ModelSettingUpdate,
    ModelSettingInfo,
    LLMModelList,
)
from ii_agent.server.llm_settings.service import (
    create_model_settings,
    update_model_settings,
    get_model_settings,
    delete_model_settings,
    get_all_available_models,
)


router = APIRouter(
    prefix="/user-settings/models", tags=["User LLM Settings Management"]
)


@router.post("", response_model=ModelSettingInfo)
async def create_model_setting(
    setting: ModelSettingCreate,
    current_user: CurrentUser,
    db: DBSession,
):
    """Create or update model settings for a specific model."""

    result = await create_model_settings(
        db_session=db,
        setting_model_in=setting,
        user_id=current_user.id,
    )

    return result


@router.get("", response_model=LLMModelList)
async def list_available_models(
    db: DBSession, current_user: User = Depends(get_current_user)
):
    """List all available models for the current user."""

    return await get_all_available_models(
        user_id=current_user.id,
        db_session=db,
    )


@router.get("/{model_id}", response_model=ModelSettingInfo)
async def get_model_setting(
    model_id: str, db: DBSession, current_user: User = Depends(get_current_user)
):
    """Get specific model settings by ID (includes API key)."""

    model_setting = await get_model_settings(
        db_session=db,
        model_id=model_id,
        user_id=current_user.id,
        include_key=True,
    )

    if not model_setting:
        raise HTTPException(status_code=404, detail="Model settings not found")

    return model_setting


@router.put("/{model_id}", response_model=ModelSettingInfo)
async def update_model_setting(
    db: DBSession,
    model_id: str,
    setting_update: ModelSettingUpdate,
    current_user: User = Depends(get_current_user),
):
    """Update existing model settings."""

    updated_setting = await update_model_settings(
        db_session=db,
        model_id=model_id,
        setting_update=setting_update,
        user_id=current_user.id,
    )

    if not updated_setting:
        raise HTTPException(status_code=404, detail="Model settings not found")

    return updated_setting


@router.delete("/{model_id}")
async def delete_model_setting(
    model_id: str, db: DBSession, current_user: User = Depends(get_current_user)
):
    """Delete model settings by ID."""

    deleted = await delete_model_settings(
        db_session=db,
        model_id=model_id,
        user_id=current_user.id,
    )

    if not deleted:
        raise HTTPException(status_code=404, detail="Model settings not found")

    return {"message": "Model settings deleted successfully"}
