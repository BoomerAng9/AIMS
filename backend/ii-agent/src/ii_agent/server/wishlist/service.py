"""Service for managing session wishlists."""

import logging
from typing import List, Optional
from sqlalchemy import select, and_, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ii_agent.db.models import SessionWishlist, Session
from ii_agent.db.manager import get_db_session_local

logger = logging.getLogger(__name__)


class SessionWishlistService:
    """Service for managing session wishlists."""

    @staticmethod
    async def get_user_wishlist(user_id: str) -> List[dict]:
        """Get all wishlist sessions for a user.

        Args:
            user_id: The user ID

        Returns:
            List of wishlist sessions with details
        """
        async with get_db_session_local() as db:
            result = await db.execute(
                select(SessionWishlist)
                .options(selectinload(SessionWishlist.session))
                .where(SessionWishlist.user_id == user_id)
                .order_by(SessionWishlist.created_at.desc())
            )
            wishlists = result.scalars().all()

            return [
                {
                    "id": w.id,
                    "session_id": w.session_id,
                    "session_name": w.session.name if w.session else None,
                    "created_at": w.created_at,
                    "last_message_at": w.session.last_message_at if w.session else None,
                }
                for w in wishlists
            ]

    @staticmethod
    async def add_to_wishlist(user_id: str, session_id: str) -> bool:
        """Add a session to user's wishlist.

        Args:
            user_id: The user ID
            session_id: The session ID to add

        Returns:
            True if added successfully, False if already exists

        Raises:
            ValueError: If session doesn't exist or user doesn't have access
        """
        async with get_db_session_local() as db:
            # First check if the session exists and user has access
            session_result = await db.execute(
                select(Session).where(
                    and_(Session.id == session_id, Session.user_id == user_id)
                )
            )
            session = session_result.scalar_one_or_none()

            if not session:
                raise ValueError(f"Session {session_id} not found or access denied")

            # Check if already in wishlist
            existing_result = await db.execute(
                select(SessionWishlist).where(
                    and_(
                        SessionWishlist.user_id == user_id,
                        SessionWishlist.session_id == session_id,
                    )
                )
            )

            if existing_result.scalar_one_or_none():
                return False  # Already exists

            # Add to wishlist
            wishlist_item = SessionWishlist(user_id=user_id, session_id=session_id)
            db.add(wishlist_item)
            await db.commit()

            return True

    @staticmethod
    async def remove_from_wishlist(user_id: str, session_id: str) -> bool:
        """Remove a session from user's wishlist.

        Args:
            user_id: The user ID
            session_id: The session ID to remove

        Returns:
            True if removed successfully, False if not found
        """
        async with get_db_session_local() as db:
            result = await db.execute(
                delete(SessionWishlist).where(
                    and_(
                        SessionWishlist.user_id == user_id,
                        SessionWishlist.session_id == session_id,
                    )
                )
            )
            await db.commit()

            return result.rowcount > 0

    @staticmethod
    async def is_in_wishlist(user_id: str, session_id: str) -> bool:
        """Check if a session is in user's wishlist.

        Args:
            user_id: The user ID
            session_id: The session ID to check

        Returns:
            True if in wishlist, False otherwise
        """
        async with get_db_session_local() as db:
            result = await db.execute(
                select(SessionWishlist).where(
                    and_(
                        SessionWishlist.user_id == user_id,
                        SessionWishlist.session_id == session_id,
                    )
                )
            )

            return result.scalar_one_or_none() is not None


# Create a singleton instance
session_wishlist_service = SessionWishlistService()
