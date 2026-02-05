"""
Wishlist management API endpoints.
"""

import logging
from fastapi import APIRouter, HTTPException, status
from ii_agent.server.wishlist.models import (
    SessionWishlistResponse,
    SessionWishlistItem,
    WishlistActionResponse,
)
from ii_agent.server.api.deps import CurrentUser
from ii_agent.server.wishlist.service import session_wishlist_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/wishlist", tags=["Wishlist"])


@router.get("/sessions", response_model=SessionWishlistResponse)
async def get_wishlist_sessions(
    current_user: CurrentUser,
) -> SessionWishlistResponse:
    """Get all wishlist sessions for the current user.

    Args:
        current_user: The authenticated user

    Returns:
        List of wishlist sessions with details
    """
    try:
        sessions_data = await session_wishlist_service.get_user_wishlist(
            str(current_user.id)
        )

        sessions = [SessionWishlistItem(**session) for session in sessions_data]

        return SessionWishlistResponse(sessions=sessions, total=len(sessions))

    except Exception as e:
        logger.error(f"Error retrieving wishlist sessions: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving wishlist sessions: {str(e)}",
        )


@router.post("/sessions/{session_id}", response_model=WishlistActionResponse)
async def add_to_wishlist(
    session_id: str,
    current_user: CurrentUser,
) -> WishlistActionResponse:
    """Add a session to the current user's wishlist.

    Args:
        session_id: The session ID to add to wishlist
        current_user: The authenticated user

    Returns:
        Action response with success status

    Raises:
        HTTPException: If session not found or already in wishlist
    """
    try:
        success = await session_wishlist_service.add_to_wishlist(
            str(current_user.id), session_id
        )

        if not success:
            return WishlistActionResponse(
                success=False,
                message="Session already in wishlist",
                session_id=session_id,
            )

        return WishlistActionResponse(
            success=True, message="Session added to wishlist", session_id=session_id
        )

    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        logger.error(f"Error adding session to wishlist: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error adding session to wishlist: {str(e)}",
        )


@router.delete("/sessions/{session_id}", response_model=WishlistActionResponse)
async def remove_from_wishlist(
    session_id: str,
    current_user: CurrentUser,
) -> WishlistActionResponse:
    """Remove a session from the current user's wishlist.

    Args:
        session_id: The session ID to remove from wishlist
        current_user: The authenticated user

    Returns:
        Action response with success status
    """
    try:
        success = await session_wishlist_service.remove_from_wishlist(
            str(current_user.id), session_id
        )

        if not success:
            return WishlistActionResponse(
                success=False,
                message="Session not found in wishlist",
                session_id=session_id,
            )

        return WishlistActionResponse(
            success=True, message="Session removed from wishlist", session_id=session_id
        )

    except Exception as e:
        logger.error(f"Error removing session from wishlist: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error removing session from wishlist: {str(e)}",
        )
