"""M.I.M. (Make It Mine) Branding System.

Provides customization capabilities for ACHEEVY branding including:
- App name customization
- Color theme (primary, accent, background)
- Logo upload and management
- Favicon customization
"""

from .routes import branding_router
from .models import BrandingSettings, BrandingUpdateRequest
from .service import BrandingService

__all__ = [
    "branding_router",
    "BrandingSettings",
    "BrandingUpdateRequest",
    "BrandingService",
]
