"""Slide service layer functions."""

import logging
import uuid
import base64
from datetime import datetime, timezone
from typing import Optional, AsyncGenerator, Dict, Any
from sqlalchemy import select, and_, func
from ii_agent.server.api.deps import DBSession

from ii_agent.db.models import SlideContent, Session
from ii_agent.server.slides.models import (
    SlideWriteRequest,
    SlideWriteResponse,
    SlideContentInfo,
    PresentationInfo,
    PresentationListResponse,
)
from ii_agent.server.slides.pdf_service import convert_slides_to_pdf, convert_slides_to_pdf_with_progress

logger = logging.getLogger(__name__)


async def execute_slide_write(
    *,
    db_session: DBSession,
    write_request: SlideWriteRequest,
    session_id: str,
    user_id: str,
) -> SlideWriteResponse:
    """Execute slide write by saving directly to database."""
    try:
        # Validate session ownership
        if not await _validate_session_ownership(db_session, session_id, user_id):
            return SlideWriteResponse(
                success=False,
                presentation_name=write_request.presentation_name,
                slide_number=write_request.slide_number,
                error="Session not found or access denied",
                error_code="SESSION_ACCESS_DENIED",
            )

        # Save to database
        await _save_slide_to_db(
            db_session=db_session,
            session_id=session_id,
            presentation_name=write_request.presentation_name,
            slide_number=write_request.slide_number,
            slide_title=write_request.title,
            slide_content=write_request.content,
            tool_name="SlideWrite",
        )

        return SlideWriteResponse(
            success=True,
            presentation_name=write_request.presentation_name,
            slide_number=write_request.slide_number,
        )

    except Exception as e:
        logger.error(f"Slide write request failed: {e}")
        return SlideWriteResponse(
            success=False,
            presentation_name=write_request.presentation_name,
            slide_number=write_request.slide_number,
            error=str(e),
            error_code="INTERNAL_ERROR",
        )


async def get_session_presentations(
    *, db_session: DBSession, session_id: str, user_id: str
) -> PresentationListResponse:
    """Get list of presentations with all slide content in session from database."""
    try:
        # Validate session ownership
        if not await _validate_session_ownership(db_session, session_id, user_id):
            return PresentationListResponse(
                session_id=session_id,
                presentations=[],
                total=0,
            )

        # Query distinct presentations in session
        result = await db_session.execute(
            select(
                SlideContent.presentation_name,
                func.count(SlideContent.id).label("slide_count"),
                func.max(SlideContent.updated_at).label("last_updated"),
            )
            .where(SlideContent.session_id == session_id)
            .group_by(SlideContent.presentation_name)
            .order_by(func.max(SlideContent.updated_at).desc())
        )

        presentations = []
        for row in result:
            # Get all slides for this presentation
            slides = (
                (
                    await db_session.execute(
                        select(SlideContent)
                        .where(
                            and_(
                                SlideContent.session_id == session_id,
                                SlideContent.presentation_name == row.presentation_name,
                            )
                        )
                        .order_by(SlideContent.slide_number)
                    )
                )
                .scalars()
                .all()
            )

            slide_infos = [_to_slide_content_info(slide) for slide in slides]

            presentations.append(
                PresentationInfo(
                    name=row.presentation_name,
                    slide_count=row.slide_count,
                    last_updated=row.last_updated,
                    slides=slide_infos,
                )
            )

        return PresentationListResponse(
            session_id=session_id,
            presentations=presentations,
            total=len(presentations),
        )

    except Exception as e:
        logger.error(f"Failed to get session presentations: {e}")
        return PresentationListResponse(
            session_id=session_id,
            presentations=[],
            total=0,
        )


async def get_public_session_presentations(
    *, db_session: DBSession, session_id: str
) -> PresentationListResponse:
    """Get list of presentations from a public session (no auth required)."""
    try:
        if not await _validate_session_is_public(db_session, session_id):
            return PresentationListResponse(
                session_id=session_id,
                presentations=[],
                total=0,
            )

        result = await db_session.execute(
            select(
                SlideContent.presentation_name,
                func.count(SlideContent.id).label("slide_count"),
                func.max(SlideContent.updated_at).label("last_updated"),
            )
            .where(SlideContent.session_id == session_id)
            .group_by(SlideContent.presentation_name)
            .order_by(func.max(SlideContent.updated_at).desc())
        )

        presentations = []
        for row in result:
            slides = (
                (
                    await db_session.execute(
                        select(SlideContent)
                        .where(
                            and_(
                                SlideContent.session_id == session_id,
                                SlideContent.presentation_name == row.presentation_name,
                            )
                        )
                        .order_by(SlideContent.slide_number)
                    )
                )
                .scalars()
                .all()
            )

            slide_infos = [_to_slide_content_info(slide) for slide in slides]

            presentations.append(
                PresentationInfo(
                    name=row.presentation_name,
                    slide_count=row.slide_count,
                    last_updated=row.last_updated,
                    slides=slide_infos,
                )
            )

        return PresentationListResponse(
            session_id=session_id,
            presentations=presentations,
            total=len(presentations),
        )

    except Exception as e:
        logger.error(f"Failed to get public session presentations: {e}")
        return PresentationListResponse(
            session_id=session_id,
            presentations=[],
            total=0,
        )


# Helper functions
async def _validate_session_ownership(
    db_session: DBSession, session_id: str, user_id: str
) -> bool:
    """Validate that session belongs to the user."""
    session = (
        await db_session.execute(
            select(Session).where(
                and_(
                    Session.id == session_id,
                    Session.user_id == user_id,
                )
            )
        )
    ).scalar_one_or_none()

    return session is not None


async def _validate_session_is_public(
    db_session: DBSession, session_id: str
) -> bool:
    """Validate that session is public."""
    session = (
        await db_session.execute(
            select(Session).where(
                and_(
                    Session.id == session_id,
                    Session.is_public == True,
                )
            )
        )
    ).scalar_one_or_none()

    return session is not None


async def _save_slide_to_db(
    *,
    db_session: DBSession,
    session_id: str,
    presentation_name: str,
    slide_number: int,
    slide_title: str,
    slide_content: str,
    tool_name: str,
) -> str:
    """Save slide content to database."""
    # Check if slide already exists
    existing_slide = (
        await db_session.execute(
            select(SlideContent).where(
                and_(
                    SlideContent.session_id == session_id,
                    SlideContent.presentation_name == presentation_name,
                    SlideContent.slide_number == slide_number,
                )
            )
        )
    ).scalar_one_or_none()

    if existing_slide:
        # Update existing slide
        existing_slide.slide_title = slide_title
        existing_slide.slide_content = slide_content
        existing_slide.slide_metadata = {
            "tool_name": tool_name,
            "last_tool_execution": datetime.now(timezone.utc).isoformat(),
        }
        existing_slide.updated_at = datetime.now(timezone.utc)

        await db_session.commit()
        return existing_slide.id
    else:
        # Create new slide
        new_slide = SlideContent(
            id=str(uuid.uuid4()),
            session_id=session_id,
            presentation_name=presentation_name,
            slide_number=slide_number,
            slide_title=slide_title,
            slide_content=slide_content,
            slide_metadata={
                "tool_name": tool_name,
                "last_tool_execution": datetime.now(timezone.utc).isoformat(),
            },
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )

        db_session.add(new_slide)
        await db_session.commit()
        return new_slide.id


def _to_slide_content_info(slide: SlideContent) -> SlideContentInfo:
    """Convert database model to Pydantic model."""
    # Get slide content as string
    slide_content = slide.slide_content if slide.slide_content else ""

    return SlideContentInfo(
        id=slide.id,
        session_id=slide.session_id,
        presentation_name=slide.presentation_name,
        slide_number=slide.slide_number,
        slide_title=slide.slide_title or "",
        slide_content=slide_content,
        metadata=slide.slide_metadata or {},
        created_at=slide.created_at,
        updated_at=slide.updated_at,
    )


async def download_session_slides_as_pdf(
    *,
    db_session: DBSession,
    session_id: str,
    user_id: str,
    presentation_name: Optional[str] = None
) -> Optional[bytes]:
    """Download slides from session as PDF for authenticated users.

    Args:
        db_session: Database session
        session_id: Session ID
        user_id: User ID
        presentation_name: Optional specific presentation name to download

    Returns:
        bytes: PDF document or None if no slides found
    """
    try:
        # Validate session ownership
        if not await _validate_session_ownership(db_session, session_id, user_id):
            logger.error(f"Session {session_id} not found or access denied for user {user_id}")
            return None

        # Build query for slides
        query = select(SlideContent).where(SlideContent.session_id == session_id)

        if presentation_name:
            query = query.where(SlideContent.presentation_name == presentation_name)

        query = query.order_by(
            SlideContent.presentation_name,
            SlideContent.slide_number
        )

        # Get slides
        result = await db_session.execute(query)
        slides = result.scalars().all()

        if not slides:
            logger.warning(f"No slides found for session {session_id}")
            return None

        # Convert to SlideContentInfo objects
        slide_infos = [_to_slide_content_info(slide) for slide in slides]

        # Convert to PDF
        pdf_bytes = await convert_slides_to_pdf(slide_infos)

        return pdf_bytes

    except Exception as e:
        logger.error(f"Failed to download slides as PDF: {e}")
        return None


async def download_public_session_slides_as_pdf(
    *,
    db_session: DBSession,
    session_id: str,
    presentation_name: Optional[str] = None
) -> Optional[bytes]:
    """Download slides from public session as PDF.

    Args:
        db_session: Database session
        session_id: Session ID
        presentation_name: Optional specific presentation name to download

    Returns:
        bytes: PDF document or None if no slides found
    """
    try:
        # Validate session is public
        if not await _validate_session_is_public(db_session, session_id):
            logger.error(f"Session {session_id} not found or not public")
            return None

        # Build query for slides
        query = select(SlideContent).where(SlideContent.session_id == session_id)

        if presentation_name:
            query = query.where(SlideContent.presentation_name == presentation_name)

        query = query.order_by(
            SlideContent.presentation_name,
            SlideContent.slide_number
        )

        # Get slides
        result = await db_session.execute(query)
        slides = result.scalars().all()

        if not slides:
            logger.warning(f"No slides found for session {session_id}")
            return None

        # Convert to SlideContentInfo objects
        slide_infos = [_to_slide_content_info(slide) for slide in slides]

        # Convert to PDF
        pdf_bytes = await convert_slides_to_pdf(slide_infos)

        return pdf_bytes

    except Exception as e:
        logger.error(f"Failed to download public slides as PDF: {e}")
        return None


async def download_session_slides_as_pdf_with_progress(
    *,
    db_session: DBSession,
    session_id: str,
    user_id: str,
    presentation_name: Optional[str] = None
) -> AsyncGenerator[Dict[str, Any], None]:
    """Download slides from session as PDF with progress updates for authenticated users.

    Args:
        db_session: Database session
        session_id: Session ID
        user_id: User ID
        presentation_name: Optional specific presentation name to download

    Yields:
        Dict with progress updates and final PDF data
    """
    try:
        # Validate session ownership
        if not await _validate_session_ownership(db_session, session_id, user_id):
            yield {
                "type": "error",
                "message": f"Session {session_id} not found or access denied for user {user_id}"
            }
            return

        # Build query for slides
        query = select(SlideContent).where(SlideContent.session_id == session_id)

        if presentation_name:
            query = query.where(SlideContent.presentation_name == presentation_name)

        query = query.order_by(
            SlideContent.presentation_name,
            SlideContent.slide_number
        )

        # Get slides
        result = await db_session.execute(query)
        slides = result.scalars().all()

        if not slides:
            yield {
                "type": "error",
                "message": f"No slides found for session {session_id}"
            }
            return

        # Convert to SlideContentInfo objects
        slide_infos = [_to_slide_content_info(slide) for slide in slides]

        # Generate filename
        filename = f"slides_{session_id}"
        if presentation_name:
            filename = f"{presentation_name}_{session_id}"
        filename += ".pdf"

        # Convert to PDF with progress
        async for progress_data in convert_slides_to_pdf_with_progress(slide_infos):
            if progress_data["type"] == "complete":
                # Encode PDF as base64 for final response
                pdf_base64 = base64.b64encode(progress_data["pdf_bytes"]).decode("utf-8")
                yield {
                    "type": "complete",
                    "filename": filename,
                    "pdf_base64": pdf_base64,
                    "total_pages": progress_data["total_pages"]
                }
            else:
                yield progress_data

    except Exception as e:
        logger.error(f"Failed to download slides as PDF with progress: {e}")
        yield {
            "type": "error",
            "message": str(e)
        }


async def download_public_session_slides_as_pdf_with_progress(
    *,
    db_session: DBSession,
    session_id: str,
    presentation_name: Optional[str] = None
) -> AsyncGenerator[Dict[str, Any], None]:
    """Download slides from public session as PDF with progress updates.

    Args:
        db_session: Database session
        session_id: Session ID
        presentation_name: Optional specific presentation name to download

    Yields:
        Dict with progress updates and final PDF data
    """
    try:
        # Validate session is public
        if not await _validate_session_is_public(db_session, session_id):
            yield {
                "type": "error",
                "message": f"Session {session_id} not found or not public"
            }
            return

        # Build query for slides
        query = select(SlideContent).where(SlideContent.session_id == session_id)

        if presentation_name:
            query = query.where(SlideContent.presentation_name == presentation_name)

        query = query.order_by(
            SlideContent.presentation_name,
            SlideContent.slide_number
        )

        # Get slides
        result = await db_session.execute(query)
        slides = result.scalars().all()

        if not slides:
            yield {
                "type": "error",
                "message": f"No slides found for session {session_id}"
            }
            return

        # Convert to SlideContentInfo objects
        slide_infos = [_to_slide_content_info(slide) for slide in slides]

        # Generate filename
        filename = f"slides_{session_id}"
        if presentation_name:
            filename = f"{presentation_name}_{session_id}"
        filename += ".pdf"

        # Convert to PDF with progress
        async for progress_data in convert_slides_to_pdf_with_progress(slide_infos):
            if progress_data["type"] == "complete":
                # Encode PDF as base64 for final response
                pdf_base64 = base64.b64encode(progress_data["pdf_bytes"]).decode("utf-8")
                yield {
                    "type": "complete",
                    "filename": filename,
                    "pdf_base64": pdf_base64,
                    "total_pages": progress_data["total_pages"]
                }
            else:
                yield progress_data

    except Exception as e:
        logger.error(f"Failed to download public slides as PDF with progress: {e}")
        yield {
            "type": "error",
            "message": str(e)
        }
