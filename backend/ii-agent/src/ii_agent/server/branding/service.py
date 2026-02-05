"""M.I.M. Branding service for database operations."""

import logging
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from datetime import datetime, timezone

from .models import BrandingSettingsDB, BrandingSettings, BrandingUpdateRequest

logger = logging.getLogger(__name__)


class BrandingService:
    """Service for managing branding settings."""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def get_branding(self, user_id: Optional[str] = None) -> BrandingSettings:
        """Get branding settings.
        
        Returns user-specific branding if user_id provided and exists,
        otherwise returns default/global branding settings.
        """
        # First try user-specific branding
        if user_id:
            result = await self.db.execute(
                select(BrandingSettingsDB).where(
                    BrandingSettingsDB.user_id == user_id
                )
            )
            settings = result.scalar_one_or_none()
            if settings:
                return BrandingSettings.model_validate(settings)
        
        # Fall back to default branding
        result = await self.db.execute(
            select(BrandingSettingsDB).where(
                BrandingSettingsDB.id == "default"
            )
        )
        settings = result.scalar_one_or_none()
        
        if settings:
            return BrandingSettings.model_validate(settings)
        
        # Create default branding if none exists
        return await self._create_default_branding()
    
    async def _create_default_branding(self) -> BrandingSettings:
        """Create default branding settings."""
        default_settings = BrandingSettingsDB(
            id="default",
            user_id=None,
            app_name="ACHEEVY",
            tagline="Your AI-Powered Achievement Partner",
            primary_color="#f59e0b",
            secondary_color="#fbbf24",
            accent_color="#d97706",
            background_color="#0f172a",
            text_color="#f8fafc",
            show_powered_by=True,
        )
        
        self.db.add(default_settings)
        await self.db.commit()
        await self.db.refresh(default_settings)
        
        logger.info("Created default branding settings")
        return BrandingSettings.model_validate(default_settings)
    
    async def update_branding(
        self,
        update_data: BrandingUpdateRequest,
        user_id: Optional[str] = None,
        is_admin: bool = False
    ) -> BrandingSettings:
        """Update branding settings.
        
        Args:
            update_data: Fields to update
            user_id: User ID for user-specific branding
            is_admin: If True, updates global/default branding
            
        Returns:
            Updated branding settings
        """
        # Determine which settings to update
        if is_admin and not user_id:
            # Update default/global branding
            settings_id = "default"
            target_user_id = None
        else:
            # User-specific branding
            settings_id = f"user_{user_id}"
            target_user_id = user_id
        
        # Check if settings exist
        result = await self.db.execute(
            select(BrandingSettingsDB).where(
                BrandingSettingsDB.id == settings_id
            )
        )
        settings = result.scalar_one_or_none()
        
        if not settings:
            # Create new settings
            settings = BrandingSettingsDB(
                id=settings_id,
                user_id=target_user_id,
            )
            self.db.add(settings)
        
        # Apply updates
        update_dict = update_data.model_dump(exclude_unset=True, exclude_none=True)
        for field, value in update_dict.items():
            setattr(settings, field, value)
        
        settings.updated_at = datetime.now(timezone.utc)
        
        await self.db.commit()
        await self.db.refresh(settings)
        
        logger.info(f"Updated branding settings: {settings_id}")
        return BrandingSettings.model_validate(settings)
    
    async def reset_to_default(self, user_id: str) -> BrandingSettings:
        """Reset user's branding to default settings.
        
        Args:
            user_id: User ID whose branding to reset
            
        Returns:
            Default branding settings
        """
        # Delete user-specific branding
        settings_id = f"user_{user_id}"
        result = await self.db.execute(
            select(BrandingSettingsDB).where(
                BrandingSettingsDB.id == settings_id
            )
        )
        settings = result.scalar_one_or_none()
        
        if settings:
            await self.db.delete(settings)
            await self.db.commit()
            logger.info(f"Reset branding for user: {user_id}")
        
        # Return default branding
        return await self.get_branding()
    
    async def upload_logo(
        self,
        file_url: str,
        dark_mode: bool = False,
        user_id: Optional[str] = None,
        is_admin: bool = False
    ) -> BrandingSettings:
        """Update logo URL.
        
        Args:
            file_url: URL to the uploaded logo file
            dark_mode: If True, updates dark mode logo
            user_id: User ID for user-specific branding
            is_admin: If True, updates global branding
            
        Returns:
            Updated branding settings
        """
        field = "logo_dark_url" if dark_mode else "logo_url"
        update_data = BrandingUpdateRequest(**{field: file_url})
        
        return await self.update_branding(
            update_data=update_data,
            user_id=user_id,
            is_admin=is_admin
        )
    
    async def get_css_variables(self, user_id: Optional[str] = None) -> str:
        """Generate CSS custom properties for branding.
        
        Args:
            user_id: User ID for user-specific branding
            
        Returns:
            CSS string with custom properties
        """
        settings = await self.get_branding(user_id)
        
        css = f"""
:root {{
    --mim-primary: {settings.primary_color};
    --mim-secondary: {settings.secondary_color};
    --mim-accent: {settings.accent_color};
    --mim-background: {settings.background_color};
    --mim-text: {settings.text_color};
    --mim-app-name: "{settings.app_name}";
}}
"""
        
        if settings.custom_css:
            css += f"\n/* Custom CSS */\n{settings.custom_css}"
        
        return css
