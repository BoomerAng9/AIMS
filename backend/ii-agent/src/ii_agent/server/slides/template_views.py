"""Slide template API endpoints."""

from fastapi import APIRouter, Depends, Query, HTTPException
from typing import Optional

from ii_agent.server.api.deps import get_db_session, DBSession
from ii_agent.server.api.deps import CurrentUser
from ii_agent.server.slides.models import (
    SlideTemplateCreate,
    SlideTemplateInfo,
)
from ii_agent.server.slides import template_service

router = APIRouter(prefix="/slide-templates", tags=["Slide Templates"])


@router.get("")
async def list_slide_templates(
    db: DBSession,
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(
        20, ge=1, le=100, description="Number of templates per page"
    ),
    search: Optional[str] = Query(None, description="Search in template names"),
):
    """Get paginated list of slide templates."""
    return await template_service.list_slide_templates(db, page, page_size, search)


@router.get("/{template_id}", response_model=SlideTemplateInfo)
async def get_slide_template(
    template_id: str,
    db: DBSession,
):
    """Get a specific slide template by ID."""
    template = await template_service.get_slide_template_full_by_id(db, template_id)

    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    return template


@router.post("", response_model=SlideTemplateInfo)
async def create_slide_template(
    template: SlideTemplateCreate,
    current_user: CurrentUser,
    db: DBSession,
):
    """Create a new slide template (admin only)."""
    return await template_service.create_slide_template(db, template)
