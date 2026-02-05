"""Context window management for chat sessions."""

import logging
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession

from ii_agent.server.chat.models import Message, TextContent, MessageRole
from ii_agent.server.chat.message_service import MessageService
from ii_agent.db.models import Session

logger = logging.getLogger(__name__)


# Model context window limits
CONTEXT_WINDOWS = {
    # TODO: Populate with actual model context windows
}


class ContextWindowManager:
    """Manages context window and auto-summarization."""

    SUMMARIZATION_THRESHOLD = 0.95  # 95% of context window

    @classmethod
    async def check_and_summarize(
        cls, *, db_session: AsyncSession, session: Session, model_id: str
    ) -> Optional[str]:
        """
        Check if summarization is needed and create summary if so.

        Args:
            db_session: Database session
            session: Session object
            model_id: Model ID for context window lookup

        Returns:
            Summary message ID if created, None otherwise
        """
        # Get context window for model
        context_window = CONTEXT_WINDOWS.get(model_id, 128_000)
        threshold = int(context_window * cls.SUMMARIZATION_THRESHOLD)

        # Check if we're at threshold
        total_tokens = session.prompt_tokens + session.completion_tokens
        if total_tokens < threshold:
            return None

        logger.info(
            f"Context window threshold reached ({total_tokens}/{context_window}). "
            f"Creating summary for session {session.id}"
        )

        # Get all messages
        messages = await MessageService.list_by_session(
            db_session=db_session,
            session_id=session.id,
            limit=1000,  # Get all messages
        )

        # Build summarization prompt
        # conversation_text = cls._build_conversation_text(messages)
        # TODO: Integrate with LLM to generate actual summary using conversation_text
        # summary_prompt = f"""Please provide a concise summary of the following conversation,
        # focusing on key points, decisions, and context that would be important to continue the conversation.
        # Conversation: {conversation_text}
        # Summary:"""

        # Create summary message (simplified - in real implementation, call LLM)
        # For now, create a placeholder summary
        summary_text = f"[Summary of {len(messages)} messages, {total_tokens} tokens]"

        summary_message = await MessageService.create_message(
            db_session=db_session,
            session_id=session.id,
            role=MessageRole.ASSISTANT,
            model_id=model_id,
            parts=[TextContent(text=summary_text)],
        )

        # Update session with summary_message_id
        session.summary_message_id = str(summary_message.id)
        await db_session.commit()

        logger.info(f"Created summary message {summary_message.id}")
        return summary_message.id

    @classmethod
    def _build_conversation_text(cls, messages: List[Message]) -> str:
        """Build text representation of conversation."""
        lines = []
        for msg in messages:
            text_part = msg.content()
            if text_part:
                lines.append(f"{msg.role.value}: {text_part.text}")
        return "\n\n".join(lines)

    @classmethod
    async def get_messages_with_summary(
        cls,
        *,
        db_session: AsyncSession,
        session_id: str,
        summary_message_id: Optional[str],
    ) -> List[Message]:
        """
        Get messages filtered from summary point.

        Args:
            db_session: Database session
            session_id: Session ID
            summary_message_id: Summary message ID (filter point)

        Returns:
            Messages from summary onward, with summary role changed to USER
        """
        messages = await MessageService.list_by_session(
            db_session=db_session, session_id=session_id, limit=1000
        )

        if not summary_message_id:
            return messages

        # Find summary message index
        summary_index = -1
        for i, msg in enumerate(messages):
            if msg.id == summary_message_id:
                summary_index = i
                break

        if summary_index == -1:
            logger.warning(
                f"Summary message {summary_message_id} not found, returning all messages"
            )
            return messages

        # Keep messages from summary onward
        filtered_messages = messages[summary_index:]

        # Change summary message role to USER so LLM sees it as context
        if filtered_messages:
            filtered_messages[0].role = MessageRole.USER

        logger.info(
            f"Filtered history from {len(messages)} to {len(filtered_messages)} messages using summary"
        )
        return filtered_messages


    @classmethod
    def reduce_message_tokens(cls, messages: List[Message]) -> List[Message]:
        """
        Reduce message list if total tokens >= 90% of 128k context window.
        Removes oldest messages until reaching a user message with remaining tokens < threshold.

        Args:
            messages: List of messages to potentially reduce (must be in chronological order)

        Returns:
            Reduced list of messages starting from a user message (or original if under threshold)
        """
        MAX_CONTEXT = 128_000
        REDUCTION_THRESHOLD = int(MAX_CONTEXT * 0.9)  # 115,200 tokens

        # Calculate total tokens
        total_tokens = sum(msg.tokens or 0 for msg in messages)

        # If under threshold, return original list
        if total_tokens < REDUCTION_THRESHOLD:
            logger.debug(
                f"Messages under threshold: {total_tokens}/{REDUCTION_THRESHOLD} tokens"
            )
            return messages

        logger.info(
            f"Reducing messages: {total_tokens} tokens >= {REDUCTION_THRESHOLD} threshold"
        )

        # Remove messages from beginning until we hit a user message and are under threshold
        current_tokens = total_tokens
        start_index = 0

        for i, msg in enumerate(messages):
            # Subtract current message tokens
            current_tokens -= msg.tokens or 0

            # Check if this is a user message AND we're now under threshold
            if msg.role == MessageRole.USER and current_tokens < REDUCTION_THRESHOLD:
                start_index = i
                break

        if start_index >= len(messages):
            return messages
        
        # Return messages starting from the found user message
        reduced_messages = messages[start_index:]

        final_tokens = sum(msg.tokens or 0 for msg in reduced_messages)
        logger.info(
            f"Reduced from {len(messages)} to {len(reduced_messages)} messages "
            f"({total_tokens} -> {final_tokens} tokens)"
        )

        return reduced_messages
