"""add connectors table

Revision ID: e8a173c69670
Revises: a1b2c3d4e5f6
Create Date: 2025-11-06 00:00:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

revision: str = "e8a173c69670"
down_revision: Union[str, None] = "a1b2c3d4e5f6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "connectors",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("user_id", sa.String(), nullable=False),
        sa.Column("connector_type", sa.String(), nullable=False),
        sa.Column("access_token", sa.String(), nullable=False),
        sa.Column("refresh_token", sa.String(), nullable=True),
        sa.Column("token_expiry", sa.TIMESTAMP(timezone=True), nullable=True),
        sa.Column("metadata", JSONB, nullable=True),
        sa.Column("created_at", sa.TIMESTAMP(timezone=True), nullable=True),
        sa.Column("updated_at", sa.TIMESTAMP(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "connector_type", name="uq_user_connector_type"),
    )
    op.create_index("idx_connectors_user_id", "connectors", ["user_id"], unique=False)
    op.create_index("idx_connectors_type", "connectors", ["connector_type"], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index("idx_connectors_type", table_name="connectors")
    op.drop_index("idx_connectors_user_id", table_name="connectors")
    op.drop_table("connectors")
