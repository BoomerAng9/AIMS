"""M.I.M. Branding Pydantic models and database schema."""

from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel, Field, field_validator
import re
from sqlalchemy import Column, String, TIMESTAMP, Text, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB
from ii_agent.db.models import Base, TimestampColumn


class BrandingSettingsDB(Base):
    """Database model for branding settings."""
    
    __tablename__ = "branding_settings"
    
    id = Column(String, primary_key=True, default="default")
    user_id = Column(String, ForeignKey("users.id"), nullable=True, index=True)
    
    # App identity
    app_name = Column(String(100), nullable=False, default="ACHEEVY")
    tagline = Column(String(200), nullable=True)
    
    # Color scheme
    primary_color = Column(String(7), nullable=False, default="#f59e0b")  # amber-500
    secondary_color = Column(String(7), nullable=False, default="#fbbf24")  # amber-400
    accent_color = Column(String(7), nullable=False, default="#d97706")  # amber-600
    background_color = Column(String(7), nullable=False, default="#0f172a")  # slate-900
    text_color = Column(String(7), nullable=False, default="#f8fafc")  # slate-50
    
    # Logo and assets
    logo_url = Column(Text, nullable=True)
    logo_dark_url = Column(Text, nullable=True)  # For dark mode
    favicon_url = Column(Text, nullable=True)
    
    # Custom CSS
    custom_css = Column(Text, nullable=True)
    
    # Feature flags
    show_powered_by = Column(Boolean, default=True)
    custom_footer_text = Column(String(500), nullable=True)
    
    # Metadata
    metadata = Column(JSONB, nullable=True)
    
    # Timestamps
    created_at = Column(TimestampColumn, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        TimestampColumn,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )


class BrandingSettings(BaseModel):
    """Pydantic schema for branding settings response."""
    
    id: str = Field(default="default")
    user_id: Optional[str] = None
    
    # App identity
    app_name: str = Field(default="ACHEEVY", max_length=100)
    tagline: Optional[str] = Field(default=None, max_length=200)
    
    # Color scheme
    primary_color: str = Field(default="#f59e0b", description="Primary brand color (hex)")
    secondary_color: str = Field(default="#fbbf24", description="Secondary color (hex)")
    accent_color: str = Field(default="#d97706", description="Accent color (hex)")
    background_color: str = Field(default="#0f172a", description="Background color (hex)")
    text_color: str = Field(default="#f8fafc", description="Text color (hex)")
    
    # Logo and assets
    logo_url: Optional[str] = None
    logo_dark_url: Optional[str] = None
    favicon_url: Optional[str] = None
    
    # Custom CSS
    custom_css: Optional[str] = None
    
    # Feature flags
    show_powered_by: bool = True
    custom_footer_text: Optional[str] = Field(default=None, max_length=500)
    
    # Timestamps
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    @field_validator("primary_color", "secondary_color", "accent_color", "background_color", "text_color")
    @classmethod
    def validate_hex_color(cls, v: str) -> str:
        """Validate hex color format."""
        if not re.match(r"^#[0-9A-Fa-f]{6}$", v):
            raise ValueError(f"Invalid hex color format: {v}. Expected format: #RRGGBB")
        return v.lower()
    
    class Config:
        from_attributes = True


class BrandingUpdateRequest(BaseModel):
    """Request schema for updating branding settings."""
    
    app_name: Optional[str] = Field(default=None, max_length=100)
    tagline: Optional[str] = Field(default=None, max_length=200)
    
    primary_color: Optional[str] = None
    secondary_color: Optional[str] = None
    accent_color: Optional[str] = None
    background_color: Optional[str] = None
    text_color: Optional[str] = None
    
    logo_url: Optional[str] = None
    logo_dark_url: Optional[str] = None
    favicon_url: Optional[str] = None
    
    custom_css: Optional[str] = None
    show_powered_by: Optional[bool] = None
    custom_footer_text: Optional[str] = Field(default=None, max_length=500)

    @field_validator("primary_color", "secondary_color", "accent_color", "background_color", "text_color")
    @classmethod
    def validate_hex_color(cls, v: Optional[str]) -> Optional[str]:
        """Validate hex color format if provided."""
        if v is None:
            return v
        if not re.match(r"^#[0-9A-Fa-f]{6}$", v):
            raise ValueError(f"Invalid hex color format: {v}. Expected format: #RRGGBB")
        return v.lower()


class BrandingPreview(BaseModel):
    """Preview model for real-time branding changes."""
    
    app_name: str
    primary_color: str
    secondary_color: str
    accent_color: str
    background_color: str
    text_color: str
    logo_url: Optional[str] = None
    
    def to_css_variables(self) -> str:
        """Generate CSS custom properties for preview."""
        return f"""
:root {{
    --mim-primary: {self.primary_color};
    --mim-secondary: {self.secondary_color};
    --mim-accent: {self.accent_color};
    --mim-background: {self.background_color};
    --mim-text: {self.text_color};
}}
"""
