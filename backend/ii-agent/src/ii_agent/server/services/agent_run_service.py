# pyright: ignore
"""
Agent Run Service

Service layer for complex business logic related to agent run tasks.
Handles complex operations that go beyond simple CRUD operations.
"""

import logging
import uuid
from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio.session import AsyncSession
from ii_agent.db.agent import AgentRunTask, RunStatus
from ii_agent.server.cache import entity_cache

logger = logging.getLogger(__name__)


KEY_PATTERN = "agent_task:{task_id}"


class AgentRunTaskResponse(BaseModel):
    """Pydantic model for AgentRunTask serialization."""

    id: UUID
    session_id: str
    version: int = Field(default=0)
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        """Pydantic configuration."""

        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat(),
            UUID: lambda v: str(v),
        }


class AgentRunService:
    """Service for managing agent run tasks with complex business logic."""

    @classmethod
    async def get_last_or_create_new_run(
        cls, db: AsyncSession, *, session_id: uuid.UUID
    ) -> AgentRunTask:
        current_task: AgentRunTask | None = await AgentRunTask.find_last_by_session_id(
            db=db, session_id=session_id
        )
        if current_task is None:
            current_task = AgentRunTask(
                session_id=str(session_id),
                status=RunStatus.RUNNING,
            )
            db.add(current_task)
            await db.flush()
            await db.refresh(current_task)
        return current_task

    @classmethod
    async def get_task_by_id(
        cls, db: AsyncSession, *, task_id: uuid.UUID
    ) -> Optional[AgentRunTaskResponse]:
        """Get an agent run task by its ID.

        Args:
            db: Database session
            task_id: ID of the task to retrieve

        Returns:
            AgentRunTask or None if not found
        """

        _cached_key = KEY_PATTERN.format(task_id=str(task_id))

        entity = await entity_cache.get(_cached_key)
        if entity:
            return AgentRunTaskResponse(**entity)

        task_run = await AgentRunTask.get_by_id(db=db, task_id=task_id)

        # Return None if task not found in database
        if task_run is None:
            return None

        res = AgentRunTaskResponse(
            id=task_run.id,
            session_id=task_run.session_id,
            version=task_run.version,
            status=task_run.status,
            created_at=task_run.created_at,
            updated_at=task_run.updated_at,
        )

        await entity_cache.set(_cached_key, res.model_dump_json())

        return res

    @classmethod
    async def update_task_status(
        cls, db: AsyncSession, *, task_id: uuid.UUID, status: str
    ) -> AgentRunTaskResponse | None:
        """Update the status of an agent run task.

        Args:
            db: Database session
            task_id: ID of the task to update
            status: New status for the task

        Returns:
            Updated AgentRunTask or None if not found
        """

        result = await db.execute(
            select(AgentRunTask).where(AgentRunTask.id == task_id)
        )

        task_to_update = result.scalar_one_or_none()

        if not task_to_update:
            return None

        task_to_update.status = status  # pyright: ignore
        db.add(task_to_update)
        await db.flush()
        await db.refresh(task_to_update)

        _cached_key = KEY_PATTERN.format(task_id=str(task_to_update.id))

        await entity_cache.evict(_cached_key)

        return AgentRunTaskResponse(
            id=task_to_update.id,
            session_id=task_to_update.session_id,
            version=task_to_update.version,
            status=task_to_update.status,
            created_at=task_to_update.created_at,
            updated_at=task_to_update.updated_at,
        )

    @classmethod
    async def get_running_task(
        cls, session_id: uuid.UUID, db: AsyncSession
    ) -> AgentRunTask | None:
        return await AgentRunTask.find_last_by_session_id_and_status(
            db=db, session_id=session_id, status=RunStatus.RUNNING
        )

    @classmethod
    async def get_last_by_session_id(
        cls, session_id: uuid.UUID, db: AsyncSession
    ) -> AgentRunTask | None:
        return await AgentRunTask.find_last_by_session_id_and_status(
            db=db, session_id=session_id, status=RunStatus.RUNNING
        )
