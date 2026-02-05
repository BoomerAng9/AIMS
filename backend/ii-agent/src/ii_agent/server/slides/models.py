"""Slide management Pydantic models."""

from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime


class SlideContentBase(BaseModel):
    """Base model for slide content."""

    presentation_name: str = Field(..., description="Name of the presentation")
    slide_number: int = Field(..., description="Slide number", ge=1)
    slide_title: Optional[str] = Field(None, description="Title of the slide")
    slide_content: str = Field(..., description="HTML content of the slide")


class SlideContentCreate(SlideContentBase):
    """Model for creating slide content (used internally by database_subscriber)."""

    metadata: Optional[Dict[str, Any]] = Field(
        default_factory=dict, description="Additional metadata"
    )


class SlideContentInfo(SlideContentBase):
    """Model for slide content information (used internally)."""

    id: str
    session_id: str
    metadata: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime
    updated_at: Optional[datetime] = None


class SlideWriteRequest(BaseModel):
    """Request model for slide write operations."""

    presentation_name: str
    slide_number: int
    content: str
    title: str
    description: Optional[str] = None


class SlideWriteResponse(BaseModel):
    """Response model for slide write operations."""

    success: bool
    presentation_name: str
    slide_number: int
    error: Optional[str] = None
    error_code: Optional[str] = None


class PresentationInfo(BaseModel):
    """Model for presentation information from database."""

    name: str
    slide_count: int
    last_updated: Optional[datetime] = None
    slides: List["SlideContentInfo"] = Field(default_factory=list)


class PresentationListResponse(BaseModel):
    """Response model for list of presentations in session."""

    session_id: str
    presentations: List[PresentationInfo]
    total: int


class SlideTemplateBase(BaseModel):
    """Base model for slide templates."""

    slide_template_name: str = Field(..., description="Name of the template")
    slide_content: str = Field(..., description="String content holding template data")
    slide_template_images: Optional[List[str]] = Field(None, description="List of URLs or paths to template preview images")


class SlideTemplateCreate(SlideTemplateBase):
    """Model for creating a slide template."""
    pass


class SlideTemplateUpdate(BaseModel):
    """Model for updating a slide template."""

    slide_template_name: Optional[str] = None
    slide_content: Optional[str] = None
    slide_template_images: Optional[List[str]] = None


class SlideTemplateInfo(SlideTemplateBase):
    """Model for slide template with all information."""

    id: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class SlideTemplatesListResponse(BaseModel):
    """Response model for paginated slide templates."""

    templates: List[SlideTemplateInfo]
    total: int
    page: int = Field(..., ge=1)
    page_size: int = Field(..., ge=1, le=100)
    total_pages: int
