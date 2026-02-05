"""Subscriber that tracks LLM metrics per session."""

import logging

from ii_agent.core.event import RealtimeEvent, EventType
from ii_agent.db.manager import get_db_session_local
from ii_agent.server.credits.service import calculate_user_credits
from ii_agent.subscribers.subscriber import EventSubscriber

logger = logging.getLogger(__name__)


class MetricsSubscriber(EventSubscriber):
    """Subscriber that handles metrics updates for sessions.

    This is a thin orchestration layer that delegates all business logic
    to the metrics service layer.
    """

    def __init__(self):
        super().__init__()

    async def handle_event(self, event: RealtimeEvent) -> None:
        """Handle an event, specifically looking for METRICS_UPDATE and TOOL_RESULT events."""
        if event.session_id is None:
            return

        if not await self.should_handle(event):
            return

        try:
            if event.type == EventType.METRICS_UPDATE:
                await self._handle_metrics_update(event)
            elif event.type == EventType.TOOL_RESULT:
                await self._handle_tool_result(event)

        except Exception as e:
            logger.error(f"Error processing event {event.type}: {e}", exc_info=True)

    async def _handle_metrics_update(self, event: RealtimeEvent) -> None:
        """Handle METRICS_UPDATE events for LLM token usage.

        Delegates all business logic to the service layer.
        """
        if not event.session_id:
            return

        session_id = str(event.session_id)

        async with get_db_session_local() as db_session, db_session.begin():
            # Process metrics and get credits charged (or None if skipped)
            credits_charged = await calculate_user_credits(
                db_session=db_session, session_id=session_id, content=event.content
            )
            # Commit all changes
            await db_session.commit()

        logger.debug(
            f"Processed METRICS_UPDATE for session {session_id}, "
            f"credits charged: {credits_charged}"
        )
        
    async def _handle_tool_result(self, event: RealtimeEvent) -> None:
        """Handle TOOL_RESULT events for tool usage tracking."""
        pass
