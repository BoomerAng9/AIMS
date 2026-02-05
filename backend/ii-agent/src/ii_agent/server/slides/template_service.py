"""Slide template service functions."""

from typing import Optional, Dict, Any, List
import uuid
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from ii_agent.server.api.deps import DBSession
from ii_agent.server.slides.models import SlideTemplateCreate, SlideTemplateInfo


async def get_slide_template_by_id(db: AsyncSession, template_id: str) -> Optional[Dict[str, Any]]:
    """
    Get slide template by ID from the database.

    Args:
        db: Database session
        template_id: The template ID to retrieve

    Returns:
        Template data with id, name, content, and images or None if not found
    """
    query = text("""
        SELECT id, slide_template_name, slide_content, slide_template_images
        FROM slide_templates
        WHERE id = :template_id
    """)

    result = await db.execute(query, {"template_id": template_id})
    row = result.fetchone()

    if row:
        return {
            "id": row.id,
            "slide_template_name": row.slide_template_name,
            "slide_content": row.slide_content,
            "slide_template_images": row.slide_template_images
        }

    return None


async def get_slide_template_content_by_id(db: AsyncSession, template_id: str) -> Optional[Dict[str, Any]]:
    """
    Get only the slide content for a template by ID.

    Args:
        db: Database session
        template_id: The template ID to retrieve

    Returns:
        Template content (JSONB data) or None if not found
    """
    template = await get_slide_template_by_id(db, template_id)
    return template["slide_content"] if template else None


async def get_slide_template_full_by_id(db: AsyncSession, template_id: str) -> Optional[SlideTemplateInfo]:
    """
    Get full slide template by ID including timestamps.

    Args:
        db: Database session
        template_id: The template ID to retrieve

    Returns:
        Full template info or None if not found
    """
    query = text("""
        SELECT id, slide_template_name, slide_content, slide_template_images,
               created_at, updated_at
        FROM slide_templates
        WHERE id = :template_id
    """)

    result = await db.execute(query, {"template_id": template_id})
    row = result.fetchone()

    if row:
        return SlideTemplateInfo(
            id=row.id,
            slide_template_name=row.slide_template_name,
            slide_content=row.slide_content,
            slide_template_images=row.slide_template_images,
            created_at=row.created_at,
            updated_at=row.updated_at
        )

    return None


async def list_slide_templates(
    db: AsyncSession,
    page: int = 1,
    page_size: int = 20,
    search: Optional[str] = None
) -> Dict[str, Any]:
    """
    Get paginated list of slide templates.

    Args:
        db: Database session
        page: Page number (1-based)
        page_size: Number of templates per page
        search: Optional search term for template names

    Returns:
        Dictionary with templates list, pagination info
    """
    # Calculate pagination
    offset = (page - 1) * page_size

    # Build queries based on whether search is provided
    if search:
        search_pattern = f"%{search}%"
        query = text("""
            SELECT id, slide_template_name, slide_template_images
            FROM slide_templates
            WHERE LOWER(slide_template_name) LIKE LOWER(:search_pattern)
            ORDER BY created_at DESC
            LIMIT :limit OFFSET :offset
        """)
        count_query = text("""
            SELECT COUNT(*) as total
            FROM slide_templates
            WHERE LOWER(slide_template_name) LIKE LOWER(:search_pattern)
        """)

        # Execute queries with search
        result = await db.execute(
            query,
            {
                "search_pattern": search_pattern,
                "limit": page_size,
                "offset": offset
            }
        )
        templates_rows = result.fetchall()

        count_result = await db.execute(
            count_query,
            {"search_pattern": search_pattern}
        )
        total_count = count_result.scalar()
    else:
        query = text("""
            SELECT id, slide_template_name, slide_template_images
            FROM slide_templates
            ORDER BY created_at DESC
            LIMIT :limit OFFSET :offset
        """)
        count_query = text("""
            SELECT COUNT(*) as total
            FROM slide_templates
        """)

        # Execute queries without search
        result = await db.execute(
            query,
            {
                "limit": page_size,
                "offset": offset
            }
        )
        templates_rows = result.fetchall()

        count_result = await db.execute(count_query)
        total_count = count_result.scalar()

    # Convert rows to dictionaries
    templates = []
    for row in templates_rows:
        templates.append({
            "id": row.id,
            "slide_template_name": row.slide_template_name,
            "slide_template_images": row.slide_template_images
        })

    # Calculate total pages
    total_pages = (total_count + page_size - 1) // page_size if total_count else 0

    return {
        "templates": templates,
        "total": total_count,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages
    }


async def create_slide_template(db: AsyncSession, template: SlideTemplateCreate) -> SlideTemplateInfo:
    """
    Create a new slide template.

    Args:
        db: Database session
        template: Template creation data

    Returns:
        Created template info
    """
    template_id = str(uuid.uuid4())

    query = text("""
        INSERT INTO slide_templates (id, slide_template_name, slide_content, slide_template_images, created_at)
        VALUES (:id, :name, :content, :images, NOW())
        RETURNING id, slide_template_name, slide_content, slide_template_images, created_at, updated_at
    """)

    result = await db.execute(
        query,
        {
            "id": template_id,
            "name": template.slide_template_name,
            "content": template.slide_content,
            "images": template.slide_template_images
        }
    )
    await db.commit()

    row = result.fetchone()

    return SlideTemplateInfo(
        id=row.id,
        slide_template_name=row.slide_template_name,
        slide_content=row.slide_content,
        slide_template_images=row.slide_template_images,
        created_at=row.created_at,
        updated_at=row.updated_at
    )