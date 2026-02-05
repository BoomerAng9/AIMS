"""Create provider_vector_stores table.

Revision ID: f7g8h9i0j1k2
Revises: a1b2c3d4e5f6
Create Date: 2025-01-13 10:00:00

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "f7g8h9i0j1k2"
down_revision: Union[str, None] = "9d6b8c8e1bf2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create provider_vector_stores table for provider-specific vector store management."""
    op.create_table(
        "provider_vector_stores",
        sa.Column("id", postgresql.UUID(), nullable=False),
        sa.Column("user_id", sa.String(), nullable=False),
        sa.Column("provider", sa.String(), nullable=False),
        sa.Column("vector_store_id", sa.String(), nullable=False),
        sa.Column("raw_vector_object", postgresql.JSONB(), nullable=True),
        sa.Column("version", sa.BigInteger(), nullable=False, default=0),
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
            "user_id",
            "provider",
            "vector_store_id",
            name="uq_provider_vector_stores_user_provider_vector",
        ),
    )

    # Create indexes
    op.create_index(
        "idx_provider_vector_stores_user_id",
        "provider_vector_stores",
        ["user_id"],
    )
    op.create_index(
        "idx_provider_vector_stores_provider",
        "provider_vector_stores",
        ["provider"],
    )
    op.create_index(
        "idx_provider_vector_stores_vector_store_id",
        "provider_vector_stores",
        ["vector_store_id"],
    )
    op.create_index(
        "idx_provider_vector_stores_expires_at",
        "provider_vector_stores",
        ["expires_at"],
    )


def downgrade() -> None:
    """Drop provider_vector_stores table."""
    # Drop indexes
    op.drop_index(
        "idx_provider_vector_stores_expires_at", table_name="provider_vector_stores"
    )
    op.drop_index(
        "idx_provider_vector_stores_vector_store_id",
        table_name="provider_vector_stores",
    )
    op.drop_index(
        "idx_provider_vector_stores_provider", table_name="provider_vector_stores"
    )
    op.drop_index(
        "idx_provider_vector_stores_user_id", table_name="provider_vector_stores"
    )

    # Drop unique constraint
    op.drop_constraint(
        "uq_provider_vector_stores_user_provider_vector",
        "provider_vector_stores",
        type_="unique",
    )

    # Drop table
    op.drop_table("provider_vector_stores")
