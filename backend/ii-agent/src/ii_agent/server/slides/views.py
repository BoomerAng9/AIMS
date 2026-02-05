"""Slide management API endpoints."""

from typing import Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from fastapi.responses import Response, StreamingResponse
import json

from ii_agent.server.api.deps import get_db_session, DBSession
from ii_agent.server.api.deps import CurrentUser
from ii_agent.server.slides.models import (
    SlideWriteRequest,
    SlideWriteResponse,
    PresentationListResponse,
)
from ii_agent.server.slides import service

router = APIRouter(prefix="/slides", tags=["Slide Management"])


@router.post("", response_model=SlideWriteResponse)
async def write_slide(
    write_request: SlideWriteRequest,
    current_user: CurrentUser,
    db: DBSession,
    session_id: str = Query(..., description="Session ID"),
):
    """Create or overwrite slide content. Updates filesystem and database."""

    result = await service.execute_slide_write(
        db_session=db,
        write_request=write_request,
        session_id=session_id,
        user_id=current_user.id,
    )

    return result


@router.get("", response_model=PresentationListResponse)
async def list_presentations(
    current_user: CurrentUser,
    db: DBSession,
    session_id: str = Query(..., description="Session ID"),
):
    """Get list of presentations in session from database."""

    result = await service.get_session_presentations(
        db_session=db,
        session_id=session_id,
        user_id=current_user.id,
    )

    return result


@router.get("/public", response_model=PresentationListResponse)
async def list_public_presentations(
    db: DBSession,
    session_id: str = Query(..., description="Session ID"),
):
    """Get list of presentations from a public session."""

    result = await service.get_public_session_presentations(
        db_session=db,
        session_id=session_id,
    )

    return result


@router.get("/download")
async def download_slides(
    db: DBSession,
    current_user: CurrentUser,
    session_id: str = Query(..., description="Session ID"),
    presentation_name: Optional[str] = Query(
        None, description="Specific presentation to download"
    ),
):
    """Download slides as PDF for authenticated users.

    Args:
        session_id: Session ID to download slides from
        presentation_name: Optional specific presentation name to download

    Returns:
        PDF file containing the slides
    """

    pdf_bytes = await service.download_session_slides_as_pdf(
        db_session=db,
        session_id=session_id,
        user_id=current_user.id,
        presentation_name=presentation_name,
    )

    if not pdf_bytes:
        raise HTTPException(status_code=404, detail="No slides found or access denied")

    # Generate filename
    filename = f"slides_{session_id}"
    if presentation_name:
        filename = f"{presentation_name}_{session_id}"
    filename += ".pdf"

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/download/stream")
async def download_slides_with_progress(
    db: DBSession,
    current_user: CurrentUser,
    session_id: str = Query(..., description="Session ID"),
    presentation_name: Optional[str] = Query(
        None, description="Specific presentation to download"
    ),
):
    """Download slides as PDF with progress updates via Server-Sent Events.

    Returns:
        SSE stream with progress updates, final event contains the PDF as base64
    """

    async def generate_progress():
        try:
            # Yield progress updates and get final PDF
            async for (
                progress_data
            ) in service.download_session_slides_as_pdf_with_progress(
                db_session=db,
                session_id=session_id,
                user_id=current_user.id,
                presentation_name=presentation_name,
            ):
                # Send Server-Sent Events format
                yield f"data: {json.dumps(progress_data)}\n\n"

        except Exception as e:
            error_data = {"type": "error", "message": str(e)}
            yield f"data: {json.dumps(error_data)}\n\n"

    return StreamingResponse(
        generate_progress(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    )


@router.get("/public/download")
async def download_public_slides(
    db: DBSession,
    session_id: str = Query(..., description="Session ID"),
    presentation_name: Optional[str] = Query(
        None, description="Specific presentation to download"
    ),
):
    """Download slides as PDF from a public session.

    Args:
        session_id: Session ID to download slides from
        presentation_name: Optional specific presentation name to download

    Returns:
        PDF file containing the slides
    """

    pdf_bytes = await service.download_public_session_slides_as_pdf(
        db_session=db, session_id=session_id, presentation_name=presentation_name
    )

    if not pdf_bytes:
        raise HTTPException(
            status_code=404, detail="No slides found or session is not public"
        )

    # Generate filename
    filename = f"slides_{session_id}"
    if presentation_name:
        filename = f"{presentation_name}_{session_id}"
    filename += ".pdf"

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/public/download/stream")
async def download_public_slides_with_progress(
    db: DBSession,
    session_id: str = Query(..., description="Session ID"),
    presentation_name: Optional[str] = Query(
        None, description="Specific presentation to download"
    ),
):
    """Download public slides as PDF with progress updates via Server-Sent Events.

    Returns:
        SSE stream with progress updates, final event contains the PDF as base64
    """

    async def generate_progress():
        try:
            # Yield progress updates and get final PDF
            async for (
                progress_data
            ) in service.download_public_session_slides_as_pdf_with_progress(
                db_session=db,
                session_id=session_id,
                presentation_name=presentation_name,
            ):
                # Send Server-Sent Events format
                yield f"data: {json.dumps(progress_data)}"

        except Exception as e:
            error_data = {"type": "error", "message": str(e)}
            yield f"data: {json.dumps(error_data)}"

    return StreamingResponse(
        generate_progress(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    )
