"""Pydantic models for wishlist API."""

from datetime import datetime
from typing import List
from pydantic import BaseModel


class SessionWishlistItem(BaseModel):
    """Model for a wishlist item."""
    
    id: str
    session_id: str
    session_name: str | None
    created_at: datetime
    last_message_at: datetime | None
    
    class Config:
        from_attributes = True


class SessionWishlistResponse(BaseModel):
    """Response model for wishlist sessions."""
    
    sessions: List[SessionWishlistItem]
    total: int


class WishlistActionResponse(BaseModel):
    """Response model for wishlist actions."""
    
    success: bool
    message: str
    session_id: str