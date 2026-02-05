"""Credit management service functions."""

import logging
from typing import Any, Dict, Optional
from datetime import datetime, timezone
from sqlalchemy import select, update, join, func, case
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession
from ii_agent.db.models import User, SessionMetrics, Session
from ii_agent.metrics.service import process_llm_metrics_event
from .models import CreditBalance

logger = logging.getLogger(__name__)


async def get_user_credits(
    *, db_session: AsyncSession, user_id: str
) -> Optional[CreditBalance]:
    """Get the current credit balance for a user.

    Args:
        db_session: Database session
        user_id: User ID to get credits for

    Returns:
        CreditBalance object or None if user not found
    """
    try:
        result = await db_session.execute(
            select(User.credits, User.bonus_credits, User.updated_at).where(
                User.id == user_id
            )
        )
        user_data = result.first()

        if user_data:
            return CreditBalance(
                user_id=user_id,
                credits=user_data.credits,
                bonus_credits=user_data.bonus_credits,
                updated_at=user_data.updated_at,
            )

        return None

    except Exception as e:
        logger.error(f"Error getting user credits for {user_id}: {e}", exc_info=True)
        raise


async def has_sufficient_credits(
    *, db_session: AsyncSession, user_id: str, amount: float
) -> bool:
    """Check if user has sufficient credits for a transaction.

    Args:
        db_session: Database session
        user_id: User ID to check
        amount: Amount of credits needed

    Returns:
        True if user has sufficient credits, False otherwise
    """
    try:
        credit_balance = await get_user_credits(db_session=db_session, user_id=user_id)
        if not credit_balance:
            return False

        # Check if total credits (regular + bonus) are sufficient
        total_credits = credit_balance.credits + credit_balance.bonus_credits
        return total_credits >= amount

    except Exception as e:
        logger.error(
            f"Error checking credit sufficiency for {user_id}: {e}", exc_info=True
        )
        return False


async def deduct_user_credits(
    *,
    db_session: AsyncSession,
    user_id: str,
    amount: float,
    description: Optional[str] = None,
) -> bool:
    """Deduct credits from a user's balance.

    Credits are deducted in the following order:
    1. First, deduct from bonus_credits
    2. If bonus_credits are insufficient, deduct remaining from regular credits
    3. Bonus credits never go below 0

    This operation is atomic - it uses a single SQL statement with CASE expressions
    to prevent race conditions.

    Args:
        db_session: Database session
        user_id: User ID to deduct credits from
        amount: Amount of credits to deduct (positive number)
        description: Optional description of the transaction

    Returns:
        True if deduction was successful, False otherwise
    """
    try:
        result = await db_session.execute(
            update(User)
            .where(
                (User.id == user_id)
                & (
                    (User.credits + User.bonus_credits) >= amount
                )  # Check sufficient total credits
            )
            .values(
                # If bonus_credits >= amount, deduct from bonus only
                # Otherwise, set bonus to 0 and deduct remaining from credits
                bonus_credits=case(
                    (User.bonus_credits >= amount, User.bonus_credits - amount),
                    else_=0.0,
                ),
                credits=case(
                    (
                        User.bonus_credits >= amount,
                        User.credits,
                    ),  # No change to regular credits
                    else_=User.credits
                    - (amount - User.bonus_credits),  # Deduct remaining
                ),
                updated_at=datetime.now(timezone.utc),
            )
            .returning(User.credits, User.bonus_credits)
        )

        updated_data = result.first()
        if updated_data:
            logger.info(
                f"Deducted {amount} credits from user {user_id}. "
                f"New balance: {updated_data.credits} (regular), "
                f"{updated_data.bonus_credits} (bonus)"
            )
            return True
        else:
            # Either user not found or insufficient credits
            # Check which one it is for better logging
            check_result = await db_session.execute(
                select(User.credits, User.bonus_credits).where(User.id == user_id)
            )
            user_data = check_result.first()

            if not user_data:
                logger.error(f"User {user_id} not found")
            else:
                total = user_data.credits + user_data.bonus_credits
                logger.warning(
                    f"Insufficient credits for user {user_id}: "
                    f"requested {amount}, available {total}"
                )
            return False

    except SQLAlchemyError as e:
        logger.error(
            f"Database error deducting credits for {user_id}: {e}", exc_info=True
        )
        await db_session.rollback()
        return False
    except Exception as e:
        logger.error(f"Error deducting credits for {user_id}: {e}", exc_info=True)
        return False


async def add_user_credits(
    *,
    db_session: AsyncSession,
    user_id: str,
    amount: float,
    description: Optional[str] = None,
    is_bonus: bool = False,
) -> bool:
    """Add credits to a user's balance.

    This operation is atomic - uses a single SQL statement to prevent race conditions.

    Args:
        db_session: Database session
        user_id: User ID to add credits to
        amount: Amount of credits to add (positive number)
        description: Optional description of the transaction
        is_bonus: If True, add to bonus_credits; if False, add to regular credits

    Returns:
        True if addition was successful, False otherwise
    """
    try:
        # Atomic update - single SQL statement
        if is_bonus:
            result = await db_session.execute(
                update(User)
                .where(User.id == user_id)
                .values(
                    bonus_credits=User.bonus_credits + amount,
                    updated_at=datetime.now(timezone.utc),
                )
                .returning(User.credits, User.bonus_credits)
            )
        else:
            result = await db_session.execute(
                update(User)
                .where(User.id == user_id)
                .values(
                    credits=User.credits + amount, updated_at=datetime.now(timezone.utc)
                )
                .returning(User.credits, User.bonus_credits)
            )

        updated_data = result.first()
        if updated_data:
            await db_session.commit()
            credit_type = "bonus" if is_bonus else "regular"
            logger.info(
                f"Added {amount} {credit_type} credits to user {user_id}. "
                f"New balance: {updated_data.credits} (regular), "
                f"{updated_data.bonus_credits} (bonus)"
            )
            return True
        else:
            logger.error(f"Failed to add credits for user {user_id} - user not found")
            return False

    except SQLAlchemyError as e:
        logger.error(f"Database error adding credits for {user_id}: {e}", exc_info=True)
        await db_session.rollback()
        return False
    except Exception as e:
        logger.error(f"Error adding credits for {user_id}: {e}", exc_info=True)
        return False


async def set_user_credits(
    *,
    db_session: AsyncSession,
    user_id: str,
    amount: float,
    bonus_amount: Optional[float] = None,
) -> bool:
    """Set user's credit balance to a specific amount.

    Args:
        db_session: Database session
        user_id: User ID to set credits for
        amount: Amount of regular credits to set
        bonus_amount: Amount of bonus credits to set (if None, bonus credits unchanged)

    Returns:
        True if update was successful, False otherwise
    """
    try:
        # Build update values
        update_values = {"credits": amount, "updated_at": datetime.now(timezone.utc)}

        # Only update bonus_credits if specified
        if bonus_amount is not None:
            update_values["bonus_credits"] = bonus_amount

        result = await db_session.execute(
            update(User)
            .where(User.id == user_id)
            .values(**update_values)
            .returning(User.credits, User.bonus_credits)
        )

        updated_data = result.first()
        if updated_data:
            await db_session.commit()
            logger.info(
                f"Set credits for user {user_id}. "
                f"New balance: {updated_data.credits} (regular), "
                f"{updated_data.bonus_credits} (bonus)"
            )
            return True
        else:
            logger.error(f"Failed to set credits for user {user_id}")
            return False

    except SQLAlchemyError as e:
        logger.error(
            f"Database error setting credits for {user_id}: {e}", exc_info=True
        )
        await db_session.rollback()
        return False
    except Exception as e:
        logger.error(f"Error setting credits for {user_id}: {e}", exc_info=True)
        return False


async def get_user_credit_history(
    *, db_session: AsyncSession, user_id: str, page: int = 1, per_page: int = 20
) -> tuple[list[dict], int]:
    """Get the credit usage history for a user by joining session_metrics with sessions.

    Args:
        db_session: Database session
        user_id: User ID to get credit history for
        page: Page number for pagination (1-indexed)
        per_page: Number of items per page

    Returns:
        Tuple of (list of session credit usage, total count)
    """
    try:
        # Base query for credit history
        base_query = (
            select(
                Session.id.label("session_id"),
                Session.name.label("session_title"),
                SessionMetrics.credits,
                SessionMetrics.updated_at,
            )
            .select_from(
                join(SessionMetrics, Session, SessionMetrics.session_id == Session.id)
            )
            .where(Session.user_id == user_id)
        )

        # Get total count
        count_query = (
            select(func.count())
            .select_from(
                join(SessionMetrics, Session, SessionMetrics.session_id == Session.id)
            )
            .where(Session.user_id == user_id)
        )

        count_result = await db_session.execute(count_query)
        total = count_result.scalar() or 0

        # Apply pagination
        offset = (page - 1) * per_page
        paginated_query = (
            base_query.order_by(SessionMetrics.updated_at.desc())
            .limit(per_page)
            .offset(offset)
        )

        result = await db_session.execute(paginated_query)

        history = []
        for row in result:
            history.append(
                {
                    "session_id": row.session_id,
                    "session_title": row.session_title or "Untitled Session",
                    "credits": row.credits,
                    "updated_at": row.updated_at,
                }
            )

        return history, total

    except Exception as e:
        logger.error(f"Error getting credit history for {user_id}: {e}", exc_info=True)
        raise



async def calculate_user_credits(
    *, db_session: AsyncSession, session_id: str, content: Dict[str, Any]
) -> float:
    """Calculate total credits used in a session.

    Args:
        db_session: Database session
        session_id: The session ID to calculate credits for

    Returns:
        Total credits used in the session
    """
    # TODO: read of cache
    active_session = (await db_session.execute(
        select(Session).where(Session.id == session_id)
    )).scalar_one_or_none()

    if not active_session:
        raise ValueError(f"Session with {session_id} not found")

    # Process metrics and get credits charged (or None if skipped)
    credits_charged = await process_llm_metrics_event(
        db_session=db_session, session=active_session, content=content
    )

    # If credits were charged, deduct from user's balance
    if credits_charged is not None and credits_charged > 0:
        
        await deduct_credits_from_user(
            db_session=db_session,
            session=active_session,
            credits_amount=credits_charged,
        )

    return credits_charged


async def deduct_credits_from_user(
    *, db_session: AsyncSession, session: Session, credits_amount: float
) -> bool:
    """Deduct credits from user's balance for LLM usage.

    Args:
        db_session: Database session
        session_id: The session ID to get user from
        credits_amount: Amount of credits to deduct

    Returns:
        True if deduction was successful, False otherwise
    """

    if credits_amount <= 0:
        return True

    success = await deduct_user_credits(
        db_session=db_session,
        user_id=session.user_id,
        amount=credits_amount,
        description=f"LLM usage for session {session.id}",
    )

    if success:
        logger.info(
            f"Deducted {credits_amount} credits from user {session.user_id} for session {session.id}"
        )
    else:
        logger.warning(
            f"Failed to deduct {credits_amount} credits from user {session.user_id} for session {session.id}"
        )

    return success