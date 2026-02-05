"""Create provider_containers table.

Revision ID: a1b2c3d4e5f6
Revises: 46528d78fcbb
Create Date: 2025-01-26 10:00:00

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, None] = "46528d78fcbb"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create provider_containers table for provider-specific container management."""
    op.create_table(
        "provider_containers",
        sa.Column("id", postgresql.UUID(), nullable=False),
        sa.Column("session_id", sa.String(), nullable=False),
        sa.Column("provider", sa.String(), nullable=False),
        sa.Column("container_id", sa.String(), nullable=False),
        sa.Column("name", sa.String(), nullable=True),
        sa.Column("status", sa.String(), nullable=True),
        sa.Column("raw_container_object", postgresql.JSONB(), nullable=True),
        sa.Column(
            "created_at",
            sa.TIMESTAMP(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column("expires_at", sa.TIMESTAMP(timezone=True), nullable=False),
        sa.Column(
            "updated_at",
            sa.TIMESTAMP(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "container_id",
            "provider",
            name="uq_provider_containers_container_provider",
        ),
    )

    # Create indexes
    op.create_index(
        "idx_provider_containers_session_id",
        "provider_containers",
        ["session_id"],
    )
    op.create_index(
        "idx_provider_containers_provider",
        "provider_containers",
        ["provider"],
    )
    op.create_index(
        "idx_provider_containers_session_provider",
        "provider_containers",
        ["session_id", "provider"],
        unique=False,
    )
    op.create_index(
        "idx_provider_containers_expires_at",
        "provider_containers",
        ["expires_at"],
    )

    op.create_index(
        "idx_provider_containers_created_at",
        "provider_containers",
        ["created_at"],
    )

    """Create provider_files table for provider-specific file upload management."""
    op.create_table(
        "provider_files",
        sa.Column("id", postgresql.UUID(), nullable=False),
        sa.Column("file_id", sa.String(), nullable=False),
        sa.Column("session_id", sa.String(), nullable=False),
        sa.Column("provider", sa.String(), nullable=False),
        sa.Column("provider_file_id", sa.String(), nullable=False),
        sa.Column("raw_file_object", postgresql.JSONB(), nullable=True),
        sa.Column(
            "created_at",
            sa.TIMESTAMP(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column(
            "updated_at",
            sa.TIMESTAMP(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column("expires_at", sa.TIMESTAMP(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "provider_file_id",
            "provider",
            name="uq_provider_files_provider_file_provider",
        ),
    )

    # Create indexes
    op.create_index(
        "idx_provider_files_file_id",
        "provider_files",
        ["file_id"],
    )
    op.create_index(
        "idx_provider_files_provider",
        "provider_files",
        ["provider"],
    )
    op.create_index(
        "idx_provider_files_file_provider",
        "provider_files",
        ["file_id", "provider"],
        unique=False,
    )
    op.create_index(
        "idx_provider_files_expires_at",
        "provider_files",
        ["expires_at"],
    )

    op.create_index(
        "idx_provider_files_created_at",
        "provider_files",
        ["created_at"],
    )


def downgrade() -> None:
    # Drop provider_containers table.
    op.drop_constraint(
        "uq_provider_containers_container_provider",
        "provider_containers",
        type_="unique",
    )
    op.drop_index(
        "idx_provider_containers_expires_at", table_name="provider_containers"
    )
    op.drop_index(
        "idx_provider_containers_session_provider", table_name="provider_containers"
    )
    op.drop_index("idx_provider_containers_provider", table_name="provider_containers")
    op.drop_index(
        "idx_provider_containers_session_id", table_name="provider_containers"
    )
    op.drop_index(
        "idx_provider_containers_created_at", table_name="provider_containers"
    )
    op.drop_table("provider_containers")

    # Drop provider_files table
    op.drop_constraint(
        "uq_provider_files_provider_file_provider",
        "provider_files",
        type_="unique",
    )
    op.drop_index("idx_provider_files_expires_at", table_name="provider_files")
    op.drop_index("idx_provider_files_file_provider", table_name="provider_files")
    op.drop_index("idx_provider_files_provider", table_name="provider_files")
    op.drop_index("idx_provider_files_file_id", table_name="provider_files")
    op.drop_index("idx_provider_files_created_at", table_name="provider_files")
    op.drop_table("provider_files")
