from datetime import datetime, timezone
from typing import Optional
import uuid
from enum import Enum
from sqlalchemy import BigInteger, ForeignKey, String, select
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.ext.asyncio.session import AsyncSession
from sqlalchemy.types import UUID
from ii_agent.db.models import Base, TimestampColumn


class RunStatus(str, Enum):
    ABORTED = "aborted"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    SYSTEM_INTERRUPTED = "system_interrupted"


class AgentRunTask(Base):
    __tablename__ = "agent_run_tasks"
    id: Mapped[uuid.UUID] = mapped_column(
        UUID, primary_key=True, default=lambda: uuid.uuid4()
    )
    session_id: Mapped[str] = mapped_column(
        String, ForeignKey("sessions.id"), nullable=False
    )
    version: Mapped[int] = mapped_column(BigInteger, default=0, nullable=False)
    user_message_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID, nullable=True)
    status: Mapped[RunStatus] = mapped_column(String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        TimestampColumn, default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        TimestampColumn,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Optimistic locking configuration
    __mapper_args__ = {"version_id_col": version}

    @classmethod
    async def create(
        cls,
        *,
        db: AsyncSession,
        session_id: uuid.UUID,
        user_message_id: Optional[uuid.UUID] = None,
        status: RunStatus = RunStatus.RUNNING,
    ) -> "AgentRunTask":
        """Create a new agent run task."""
        agent_run = cls(
            session_id=str(session_id), status=status, user_message_id=user_message_id
        )
        db.add(agent_run)
        await db.flush()
        await db.refresh(agent_run)
        return agent_run

    @classmethod
    async def get_by_id(
        cls, *, db: AsyncSession, task_id: uuid.UUID
    ) -> Optional["AgentRunTask"]:
        """Get agent run task by ID."""
        result = await db.execute(
            select(AgentRunTask).where(AgentRunTask.id == task_id)
        )
        return result.scalar_one_or_none()

    @classmethod
    async def get_by_session_id(
        cls, *, db: AsyncSession, session_id: uuid.UUID
    ) -> list["AgentRunTask"]:
        """Get all agent run tasks for a session."""
        result = await db.execute(
            select(AgentRunTask)
            .where(AgentRunTask.session_id == str(session_id))
            .order_by(AgentRunTask.created_at.desc())
        )
        return list(result.scalars().all())

    @classmethod
    async def find_last_by_session_id_and_status(
        cls, *, db: AsyncSession, session_id: uuid.UUID, status: str
    ) -> Optional["AgentRunTask"]:
        """Find the most recent agent run task for a session."""
        result = await db.execute(
            select(AgentRunTask)
            .where(AgentRunTask.session_id == str(session_id))
            .where(AgentRunTask.status == status)
            .order_by(AgentRunTask.created_at.desc())
        )

        return result.scalar_one_or_none()

    @classmethod
    async def find_last_by_session(
        cls, *, db: AsyncSession, session_id: uuid.UUID
    ) -> Optional["AgentRunTask"]:
        """Find the most recent agent run task for a session."""
        result = await db.execute(
            select(AgentRunTask)
            .where(AgentRunTask.session_id == str(session_id))
            .order_by(AgentRunTask.created_at.desc())
        )

        return result.scalar_one_or_none()

    @classmethod
    async def find_last_by_session_id(
        cls, *, db: AsyncSession, session_id: uuid.UUID
    ) -> Optional["AgentRunTask"]:
        """Find the most recent agent run task for a session."""
        result = await db.execute(
            select(AgentRunTask)
            .where(AgentRunTask.session_id == str(session_id))
            .order_by(AgentRunTask.created_at.desc())
        )

        return result.scalar_one_or_none()

    def is_running(self) -> bool:
        """Check if task is running."""
        return bool(self.status == RunStatus.RUNNING)
