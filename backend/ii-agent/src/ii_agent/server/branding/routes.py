"""M.I.M. Branding API routes."""

import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from fastapi.responses import PlainTextResponse
from sqlalchemy.ext.asyncio import AsyncSession

from ii_agent.server.api.deps import get_db, get_current_user_optional, get_current_user
from ii_agent.db.models import User
from .models import BrandingSettings, BrandingUpdateRequest
from .service import BrandingService

logger = logging.getLogger(__name__)

branding_router = APIRouter(prefix="/branding", tags=["branding"])


@branding_router.get("", response_model=BrandingSettings)
async def get_branding(
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
) -> BrandingSettings:
    """Get current branding settings.
    
    Returns user-specific branding if authenticated and configured,
    otherwise returns default branding.
    """
    service = BrandingService(db)
    user_id = current_user.id if current_user else None
    return await service.get_branding(user_id)


@branding_router.put("", response_model=BrandingSettings)
async def update_branding(
    update_data: BrandingUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> BrandingSettings:
    """Update branding settings.
    
    Regular users can only update their own branding.
    Admins can update global branding by not providing user_id.
    """
    service = BrandingService(db)
    is_admin = current_user.role == "admin"
    
    return await service.update_branding(
        update_data=update_data,
        user_id=current_user.id,
        is_admin=is_admin
    )


@branding_router.put("/global", response_model=BrandingSettings)
async def update_global_branding(
    update_data: BrandingUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> BrandingSettings:
    """Update global/default branding settings.
    
    Requires admin privileges.
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required to update global branding"
        )
    
    service = BrandingService(db)
    return await service.update_branding(
        update_data=update_data,
        user_id=None,
        is_admin=True
    )


@branding_router.post("/reset", response_model=BrandingSettings)
async def reset_branding(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> BrandingSettings:
    """Reset user's branding to default settings."""
    service = BrandingService(db)
    return await service.reset_to_default(current_user.id)


@branding_router.get("/css", response_class=PlainTextResponse)
async def get_branding_css(
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
) -> str:
    """Get CSS custom properties for current branding.
    
    Returns CSS that can be injected into the page.
    """
    service = BrandingService(db)
    user_id = current_user.id if current_user else None
    return await service.get_css_variables(user_id)


@branding_router.post("/logo", response_model=BrandingSettings)
async def upload_logo(
    file: UploadFile = File(...),
    dark_mode: bool = False,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> BrandingSettings:
    """Upload a custom logo.
    
    Args:
        file: Logo image file (PNG, JPG, SVG)
        dark_mode: If True, sets as dark mode logo
        
    Returns:
        Updated branding settings
    """
    # Validate file type
    allowed_types = ["image/png", "image/jpeg", "image/svg+xml", "image/webp"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type. Allowed: PNG, JPG, SVG, WebP"
        )
    
    # Validate file size (max 5MB)
    max_size = 5 * 1024 * 1024
    content = await file.read()
    if len(content) > max_size:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File too large. Maximum size is 5MB"
        )
    
    # TODO: Upload to GCS and get URL
    # For now, we'll use a placeholder that stores locally or uses GCS
    # This should be integrated with the existing file upload service
    
    from ii_agent.storage.factory import create_storage
    from ii_agent.core.config.ii_agent_config import config
    import uuid
    import io
    
    try:
        storage = create_storage()
        file_ext = file.filename.split(".")[-1] if "." in file.filename else "png"
        unique_filename = f"{uuid.uuid4()}.{file_ext}"
        path = f"branding/{current_user.id}/{unique_filename}"
        
        file_stream = io.BytesIO(content)
        file_url = storage.upload_and_get_permanent_url(
            content=file_stream,
            path=path,
            content_type=file.content_type
        )
    except Exception as e:
        logger.error(f"Failed to upload logo: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to upload logo"
        )
    
    service = BrandingService(db)
    is_admin = current_user.role == "admin"
    
    return await service.upload_logo(
        file_url=file_url,
        dark_mode=dark_mode,
        user_id=current_user.id,
        is_admin=is_admin
    )


@branding_router.get("/preview")
async def preview_branding(
    app_name: str = "ACHEEVY",
    primary_color: str = "#f59e0b",
    secondary_color: str = "#fbbf24",
    accent_color: str = "#d97706",
    background_color: str = "#0f172a",
    text_color: str = "#f8fafc",
) -> dict:
    """Preview branding changes without saving.
    
    Returns a preview object with CSS variables for real-time preview.
    """
    from .models import BrandingPreview
    
    preview = BrandingPreview(
        app_name=app_name,
        primary_color=primary_color,
        secondary_color=secondary_color,
        accent_color=accent_color,
        background_color=background_color,
        text_color=text_color,
    )
    
    return {
        "preview": preview.model_dump(),
        "css": preview.to_css_variables()
    }
