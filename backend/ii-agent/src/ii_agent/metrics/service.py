"""Service layer for metrics database operations."""

import logging
from typing import Optional, Dict, Any
from datetime import datetime, timezone
from ii_agent.db.models import LLMSetting, SessionMetrics, Session
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from ii_agent.metrics.models import LLMMetrics, TokenUsage

logger = logging.getLogger(__name__)


async def accumulate_session_metrics(
    *, db_session: AsyncSession, session_id: str, credits: float
) -> SessionMetrics | None:
    """Accumulate credits for a session by adding to existing total.

    NOTE: Credits should be passed as NEGATIVE values to represent consumption.
    The function uses += operator, so negative values will decrease the session total.
    For example: passing credits=-5.0 will reduce the session's credit balance by 5.

    Args:
        db_session: Database session
        session_id: The session ID to accumulate credits for
        credits: Number of credits to add to the session (pass negative values for consumption)
    """
    try:
        # Import here to avoid circular dependencies

        # Check if metrics record exists
        metrics_record = (
            await db_session.execute(
                select(SessionMetrics).where(SessionMetrics.session_id == session_id)
            )
        ).scalar_one_or_none()

        if metrics_record:
            # Accumulate to existing record
            metrics_record.credits += credits
            metrics_record.updated_at = datetime.utcnow()
        else:
            # Create new record with initial credits
            metrics_record = SessionMetrics(
                session_id=session_id,
                credits=credits,
            )
            db_session.add(metrics_record)
            await db_session.flush()
            await db_session.refresh(metrics_record)

        logger.debug(f"Accumulated credits in database for session {session_id}")
        return metrics_record
    except ImportError:
        # SessionMetrics model doesn't exist yet
        logger.debug("SessionMetrics model not yet available in database")
        return None
    except Exception as e:
        logger.error(f"Error accumulating metrics in database: {e}", exc_info=True)
        raise


async def get_session_metrics(
    *, db_session: AsyncSession, session_id: str
) -> Optional[Dict[str, Any]]:
    """Get credits metrics for a specific session.

    Args:
        db_session: Database session
        session_id: The session ID to get credits for

    Returns:
        Dictionary containing session credits or None if not found
    """
    try:
        # Import here to avoid circular dependencies
        from ii_agent.db.models import SessionMetrics
        from sqlalchemy import select

        metrics = (
            await db_session.execute(
                select(SessionMetrics).where(SessionMetrics.session_id == session_id)
            )
        ).scalar_one_or_none()

        if metrics:
            return {
                "session_id": metrics.session_id,
                "credits": metrics.credits,
                "created_at": metrics.created_at,
                "updated_at": metrics.updated_at,
            }

        return None

    except ImportError:
        # SessionMetrics model doesn't exist yet
        logger.debug("SessionMetrics model not yet available in database")
        return None
    except Exception as e:
        logger.error(f"Error getting metrics from database: {e}", exc_info=True)
        raise


async def is_user_provided_model(*, db_session: AsyncSession, session_id: str) -> bool:
    """Check if session uses user-provided model configuration.

    Args:
        db_session: Database session
        session_id: The session ID to check

    Returns:
        True if session uses user-provided model (has llm_setting_id), False otherwise
    """
    try:
        result = await db_session.execute(
            select(Session.llm_setting_id).where(Session.id == session_id)
        )
        llm_setting_id = result.scalar_one_or_none()

        user_id = (
            await db_session.execute(
                select(LLMSetting.user_id).where(LLMSetting.id == llm_setting_id)
            )
        ).scalar_one_or_none()
        is_user_model = user_id != "admin"

        logger.debug(
            f"Session {session_id} model source: "
            f"{'user-provided' if is_user_model else 'system-provided'}"
        )

        return is_user_model

    except Exception as e:
        logger.error(
            f"Error checking model source for session {session_id}: {e}", exc_info=True
        )
        # Default to system model on error (safer to charge than not charge)
        return False


async def get_llm_settings(
    *, db_session: AsyncSession, llm_setting_id: str
) -> LLMSetting:
    if llm_setting_id is None:
        return None

    llm_settings = (
        await db_session.execute(
            select(LLMSetting).where(LLMSetting.id == llm_setting_id)
        )
    ).scalar_one_or_none()

    return llm_settings


async def process_llm_metrics_event(
    *, db_session: AsyncSession, session: Session, content: Dict[str, Any]
) -> Optional[float]:
    """Process LLM metrics event and handle charging.

    This is the main business logic for processing METRICS_UPDATE events.
    It checks if the model is user-provided, calculates credits, and handles charging.

    Args:
        db_session: Database session
        session_id: The session ID
        content: The event content containing token usage data

    Returns:
        Credits charged, or 0 if skipped (user-provided model)
    """

    llm_settings = await get_llm_settings(
        db_session=db_session, llm_setting_id=session.llm_setting_id
    )

    if llm_settings and llm_settings.user_id != "admin":
        logger.debug(
            f"Skipping LLM credits for user-provided, session={session.id}, user_id={llm_settings.user_id} (user-provided)"
        )
        return 0.0

    # Parse token usage and calculate credits
    token_usage = TokenUsage(**content)

    metrics = LLMMetrics(
        token_usage=token_usage,
        timestamp=datetime.now(timezone.utc),
        session_id=session.id,
    )

    # Log metrics
    logger.info(
        f"Metrics updated for session {session.id}: "
        f"prompt_tokens={metrics.token_usage.prompt_tokens}, "
        f"completion_tokens={metrics.token_usage.completion_tokens}, "
        f"cache_read_tokens={metrics.token_usage.cache_read_tokens}, "
        f"cache_write_tokens={metrics.token_usage.cache_write_tokens}, "
        f"credits={metrics.calculate_credits()}, "
        f"model={metrics.token_usage.model_name}"
    )

    # Update session metrics in database
    credits_to_charge = metrics.credits if metrics.credits else 0.0

    if credits_to_charge > 0:
        await accumulate_session_metrics(
            db_session=db_session,
            session_id=session.id,
            credits=-credits_to_charge,  # Negative = consumption
        )

    return credits_to_charge
