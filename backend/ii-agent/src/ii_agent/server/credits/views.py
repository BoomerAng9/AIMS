"""Credit management API endpoints."""

from typing import Any
from fastapi import APIRouter, HTTPException, status, Query

from ii_agent.server.api.deps import DBSession, CurrentUser
from .models import CreditBalance, CreditHistory, SessionCreditHistory
from .service import get_user_credits, get_user_credit_history

router = APIRouter(prefix="/credits", tags=["Credits"])


@router.get("/balance", response_model=CreditBalance)
async def get_credit_balance(
    db: DBSession,
    current_user: CurrentUser,
) -> Any:
    """Get the current user's credit balance."""

    credit_balance = await get_user_credits(db_session=db, user_id=str(current_user.id))

    if not credit_balance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User credit balance not found",
        )

    return credit_balance


@router.get("/usage", response_model=CreditHistory)
async def get_credit_usage(
    db: DBSession,
    current_user: CurrentUser,
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(20, ge=1, le=100, description="Items per page"),
) -> Any:
    """Get the current user's credit usage by session with pagination.

    Args:
        current_user: The authenticated user
        db: Database session
        page: Page number for pagination (1-indexed)
        per_page: Number of items per page (max 100)

    Returns:
        Paginated credit usage history with session details
    """

    # Get current balance
    credit_balance = await get_user_credits(db_session=db, user_id=str(current_user.id))

    if not credit_balance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User credit balance not found",
        )

    # Get session-based credit history with pagination
    session_history, total = await get_user_credit_history(
        db_session=db,
        user_id=str(current_user.id),
        page=page,
        per_page=per_page,
    )

    # Convert to Pydantic models
    sessions = [
        SessionCreditHistory(
            session_id=session["session_id"],
            session_title=session["session_title"],
            credits=session["credits"],
            updated_at=session["updated_at"],
        )
        for session in session_history
    ]

    return CreditHistory(
        sessions=sessions,
        total=total,
    )
