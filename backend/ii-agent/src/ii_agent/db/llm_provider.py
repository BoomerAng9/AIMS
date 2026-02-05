"""Database models for LLM provider-specific resources."""

from datetime import datetime, timezone
import uuid
from sqlalchemy import (
    UUID,
    Column,
    String,
    Boolean,
    Index,
    TIMESTAMP,
    UniqueConstraint,
    BigInteger
)
from sqlalchemy.dialects.postgresql import JSONB
from ii_agent.db.models import Base

# Use timezone-aware timestamps for PostgreSQL
TimestampColumn = TIMESTAMP(timezone=True)


class ProviderContainer(Base):
    """Database model for provider-specific containers (OpenAI, Anthropic, etc.)."""

    __tablename__ = "provider_containers"

    id = Column(UUID, primary_key=True, default=uuid.uuid4)
    session_id = Column(String, nullable=False)
    provider = Column(String, nullable=False)  # 'openai', 'anthropic', etc.
    container_id = Column(String, nullable=False)  # Provider's container ID
    name = Column(String, nullable=True)  # Container name
    expires_at = Column(TimestampColumn, nullable=True)
    raw_container_object = Column(JSONB, nullable=True)
    status = Column(String, nullable=True)
    created_at = Column(
        TimestampColumn,
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at = Column(
        TimestampColumn,
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    __table_args__ = (
        Index("idx_provider_containers_session_id", "session_id"),
        Index("idx_provider_containers_provider", "provider"),
        Index("idx_provider_containers_session_provider", "session_id", "provider"),
        Index("idx_provider_containers_expires_at", "expires_at"),
        UniqueConstraint(
            "container_id", "provider", name="uq_provider_containers_container_provider"
        ),
    )


class ProviderFile(Base):
    """Database model for provider-specific file uploads (OpenAI, Anthropic, etc.)."""

    __tablename__ = "provider_files"

    id = Column(UUID, primary_key=True, default=uuid.uuid4)
    file_id = Column(String, nullable=False)
    session_id = Column(String, nullable=False)
    provider = Column(String, nullable=False)  # 'openai', 'anthropic', 'gemini', etc.
    provider_file_id = Column(
        String, nullable=False
    )  # Provider's file ID (e.g., 'file-abc123')
    raw_file_object = Column(JSONB, nullable=True)  # Raw file object from provider API
    created_at = Column(
        TimestampColumn,
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at = Column(
        TimestampColumn,
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
    expires_at = Column(TimestampColumn, nullable=True)  # File expiration timestamp

    __table_args__ = (
        Index("idx_provider_files_file_id", "file_id"),
        Index("idx_provider_files_provider", "provider"),
        Index("idx_provider_files_file_provider", "file_id", "provider"),
        Index("idx_provider_files_expires_at", "expires_at"),
        UniqueConstraint(
            "provider_file_id",
            "provider",
            name="uq_provider_files_provider_file_provider",
        ),
    )


class ProviderVectorStore(Base):
    """Database model for provider-specific vector stores (OpenAI, Anthropic, etc.)."""

    __tablename__ = "provider_vector_stores"

    id = Column(UUID, primary_key=True, default=uuid.uuid4)
    user_id = Column(String, nullable=False)
    provider = Column(String, nullable=False)  # 'openai', 'anthropic', 'gemini', etc.
    vector_store_id = Column(String, nullable=False)  # Provider's vector store ID
    version = Column(BigInteger, default=0, nullable=False)
    raw_vector_object = Column(
        JSONB, nullable=True
    )  # Raw vector store object from provider API
    created_at = Column(
        TimestampColumn,
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at = Column(
        TimestampColumn,
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
    expires_at = Column(
        TimestampColumn, nullable=True
    )  # Vector store expiration timestamp
    __mapper_args__ = {"version_id_col": version}
    __table_args__ = (
        Index("idx_provider_vector_stores_user_id", "user_id"),
        Index("idx_provider_vector_stores_provider", "provider"),
        Index("idx_provider_vector_stores_vector_store_id", "vector_store_id"),
        Index("idx_provider_vector_stores_expires_at", "expires_at"),
        UniqueConstraint(
            "user_id",
            "provider",
            "vector_store_id",
            name="uq_provider_vector_stores_user_provider_vector",
        ),
    )
