from sqlalchemy import Column, String, TIMESTAMP, Index
from datetime import datetime, timezone
from sqlalchemy.ext.declarative import declarative_base
import uuid

Base = declarative_base()

# Use timezone-aware timestamps for PostgreSQL
TimestampColumn = TIMESTAMP(timezone=True)


class Sandbox(Base):
    """Database model for sandboxes."""

    __tablename__ = "sandboxes"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    provider = Column(String, default="e2b")
    provider_sandbox_id = Column(String, unique=True, nullable=False)
    user_id = Column(String, nullable=False)  # Remove FK constraint
    status = Column(String, default="initializing")

    # Timestamps
    created_at = Column(TimestampColumn, default=lambda: datetime.now(timezone.utc))
    started_at = Column(TimestampColumn, nullable=True)
    stopped_at = Column(TimestampColumn, nullable=True)
    deleted_at = Column(TimestampColumn, nullable=True)
    last_activity_at = Column(TimestampColumn, nullable=True)

    # Remove user relationship

    __table_args__ = (
        Index("idx_sandboxes_user_id", "user_id"),
        Index("idx_sandboxes_status", "status"),
        Index("idx_sandboxes_provider_sandbox_id", "provider_sandbox_id"),
    )
