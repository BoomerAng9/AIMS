"""add-agent-run-task-table

Revision ID: 1c77501fee34
Revises: 4d383c356547
Create Date: 2025-10-14 23:34:17.523211

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = "1c77501fee34"
down_revision: Union[str, None] = "4d383c356547"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Create agent_run_tasks table
    op.create_table(
        "agent_run_tasks",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("session_id", sa.String(), nullable=False),
        sa.Column("version", sa.BigInteger(), nullable=False, default=0),
        sa.Column("status", sa.String(), nullable=False),
        sa.Column("user_message_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("created_at", sa.TIMESTAMP(timezone=True), nullable=True),
        sa.Column("updated_at", sa.TIMESTAMP(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(
            ["session_id"], ["sessions.id"], name="fk_agent_run_tasks_session_id"
        ),
        sa.PrimaryKeyConstraint("id", name="pk_agent_run_tasks"),
    )

    # Create index on session_id for better query performance
    op.create_index("ix_agent_run_tasks_session_id", "agent_run_tasks", ["session_id"])

    # Create index on status for filtering
    op.create_index("ix_agent_run_tasks_status", "agent_run_tasks", ["status"])

    # Create composite index for session_id and status queries
    op.create_index(
        "ix_agent_run_tasks_session_status", "agent_run_tasks", ["session_id", "status"]
    )

    # Create index on created_at for ordering
    op.create_index("ix_agent_run_tasks_created_at", "agent_run_tasks", ["created_at"])

    # Add version column to sessions table with server default value
    op.add_column(
        "sessions",
        sa.Column("version", sa.BigInteger(), nullable=False, server_default="0"),
    )

    # Add version column to sessions table with server default value
    op.add_column(
        "events",
        sa.Column("run_id", postgresql.UUID(as_uuid=True), nullable=True),
    )

def downgrade() -> None:
    """Downgrade schema."""
    # Drop indexes
    op.drop_index("ix_agent_run_tasks_created_at", table_name="agent_run_tasks")
    op.drop_index("ix_agent_run_tasks_session_status", table_name="agent_run_tasks")
    op.drop_index("ix_agent_run_tasks_status", table_name="agent_run_tasks")
    op.drop_index("ix_agent_run_tasks_session_id", table_name="agent_run_tasks")

    # Drop table
    op.drop_table("agent_run_tasks")

    # Drop sessions table version
    op.drop_column("sessions", "version")
    op.drop_column("events", "run_id")