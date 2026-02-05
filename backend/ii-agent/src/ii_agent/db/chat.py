"""Database models for chat mode."""

from datetime import datetime, timezone
from typing import Optional
import uuid

from sqlalchemy import ARRAY, BigInteger, Boolean, Index, String
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import JSONB, UUID

from ii_agent.db.models import Base, TimestampColumn


class ChatMessage(Base):
    """Chat messages for chat mode conversations.

    Stores messages with structured ContentPart list:
    - content: List of ContentPart objects (text, reasoning, tool_call, tool_result, etc.)
    - usage: Token usage statistics from LLM response
    - tokens: Accumulated total tokens
    """

    __tablename__ = "chat_messages"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    session_id: Mapped[str] = mapped_column(String, nullable=False)
    role: Mapped[str] = mapped_column(
        String, nullable=False
    )  # "user", "assistant", "system", or "tool"
    content: Mapped[dict] = mapped_column(
        JSONB, nullable=False
    )  # List of ContentPart objects
    usage: Mapped[Optional[dict]] = mapped_column(
        JSONB, nullable=True
    )  # Usage statistics (prompt_tokens, completion_tokens, etc.)
    tokens: Mapped[Optional[int]] = mapped_column(
        BigInteger, nullable=True
    )  # Total accumulated tokens
    model: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    tools: Mapped[Optional[dict]] = mapped_column(
        JSONB, nullable=True
    )  # Tools used in the message
    provider_metadata: Mapped[Optional[dict]] = mapped_column(
        JSONB, nullable=True
    )  # Provider-specific metadata
    file_ids: Mapped[Optional[list[uuid.UUID]]] = mapped_column(
        ARRAY(UUID), nullable=True
    )  # Array of file IDs associated with the message
    created_at: Mapped[datetime] = mapped_column(
        TimestampColumn, default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        TimestampColumn,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
    parent_message_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        nullable=True,
    )  # Link to parent message (user message for assistant responses)
    is_finished: Mapped[Optional[bool]] = mapped_column(
        Boolean, nullable=True, default=True
    )  # Indicates if message is complete
    finish_reason: Mapped[Optional[str]] = mapped_column(
        String, nullable=True
    )  # Reason why message generation finished (for assistant messages)

    __table_args__ = (
        Index("idx_chat_messages_session", "session_id"),
        Index("idx_chat_messages_created", "created_at"),
        Index("idx_chat_messages_parent", "parent_message_id"),
        Index("idx_chat_messages_session_created", "session_id", "created_at"),
    )
