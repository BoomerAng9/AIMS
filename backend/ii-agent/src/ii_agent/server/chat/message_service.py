import logging
import time
from typing import Dict, List, Optional
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, or_
from pydantic import TypeAdapter

from ii_agent.db.chat import ChatMessage
from ii_agent.db.models import FileUpload

from ii_agent.metrics.models import TokenUsage
from ii_agent.server.chat.models import (
    ContentPart,
    Message,
    MessageRole,
)

logger = logging.getLogger(__name__)


class MessageService:
    """Service for managing chat messages."""

    parts_adapter: TypeAdapter = TypeAdapter(List[ContentPart])

    @classmethod
    async def create_message(
        cls,
        db_session: AsyncSession,
        session_id: str,
        role: MessageRole,
        model_id: str,
        parts: List[ContentPart],
        parent_message_id: Optional[uuid.UUID] = None,
        usage: TokenUsage | None = None,
        tools: Optional[Dict[str, bool]] = None,
        provider: Optional[str] = None,
        file_ids: List[str] | None = None,
        provider_metadata: Optional[Dict] = None,
        finish_reason: Optional[str] = None,
    ) -> Message:
        """Create a new message with ContentParts."""
        now = int(time.time())

        parts_data = cls.parts_adapter.dump_python(parts, mode="json")

        # Update FileUpload records with null session_id
        if file_ids:
            result = await db_session.execute(
                select(FileUpload).where(FileUpload.id.in_(file_ids))
            )
            file_uploads = result.scalars().all()
            for file_upload in file_uploads:
                if file_upload.session_id is None:
                    file_upload.session_id = session_id

        db_message = ChatMessage(
            session_id=session_id,
            role=role.value,
            content=parts_data,
            model=model_id,
            is_finished=True,
            file_ids=file_ids,
            parent_message_id=parent_message_id,
            tools=tools,
            usage=usage.model_dump() if usage else None,
            tokens=usage.total_tokens if usage else None,
            provider_metadata=provider_metadata,
            finish_reason=finish_reason,
        )
        db_session.add(db_message)
        await db_session.commit()
        await db_session.refresh(db_message)

        return Message(
            id=db_message.id,
            role=role,
            session_id=session_id,
            parts=parts,
            model=model_id,
            provider=provider,
            created_at=now,
            tokens=db_message.tokens,
            updated_at=now,
            file_ids=file_ids,
            tools_enabled=tools,
            provider_metadata=provider_metadata,
            finish_reason=finish_reason,
        )

    @classmethod
    async def list_by_session(
        cls, db_session: AsyncSession, session_id: str, limit: int = 50
    ) -> List[Message]:
        """List messages for a session."""
        result = await db_session.execute(
            select(ChatMessage)
            .where(ChatMessage.session_id == session_id)
            .order_by(ChatMessage.created_at.asc())
            .limit(limit)
        )
        db_messages = result.scalars().all()

        messages = []
        for db_msg in db_messages:
            if db_msg.is_finished is False:
                logger.warning(
                    f"Skipping unfinished message {db_msg.id} in session {session_id}"
                )
                continue
            # Handle both old format {"parts": [...]} and new format [...]
            if isinstance(db_msg.content, dict) and "parts" in db_msg.content:
                parts_data = db_msg.content["parts"]
            elif isinstance(db_msg.content, list):
                parts_data = db_msg.content
            else:
                parts_data = []

            parts = cls.parts_adapter.validate_python(parts_data)

            messages.append(
                Message(
                    id=db_msg.id,
                    role=MessageRole(db_msg.role),
                    session_id=db_msg.session_id,
                    parts=parts,
                    model=db_msg.model,
                    tokens=db_msg.tokens,
                    created_at=int(db_msg.created_at.timestamp()),
                    updated_at=int(db_msg.updated_at.timestamp()),
                    file_ids=(
                        [str(fid) for fid in db_msg.file_ids]
                        if db_msg.file_ids
                        else None
                    ),
                    tools_enabled=db_msg.tools,
                    provider_metadata=db_msg.provider_metadata,
                    finish_reason=db_msg.finish_reason,
                )
            )

        return messages

    @classmethod
    async def mark_messages_incomplete(
        cls,
        db_session: AsyncSession,
        parent_message_id: uuid.UUID,
    ) -> None:
        """Mark messages as incomplete when errors occur during streaming.

        Marks both the user message and all its children as incomplete in one transaction.

        Args:
            db_session: Database session
            parent_message_id: Parent message ID (user message) to mark incomplete
        """
        try:
            await db_session.execute(
                update(ChatMessage)
                .where(
                    ChatMessage.parent_message_id == parent_message_id,
                )
                .values(is_finished=False)
            )
            await db_session.commit()
            logger.info(
                f"Marked user message and children as incomplete for message_id: {parent_message_id}"
            )
        except Exception as e:
            logger.error(f"Failed to mark messages as incomplete: {e}", exc_info=True)
            # Don't re-raise - this is best-effort cleanup
