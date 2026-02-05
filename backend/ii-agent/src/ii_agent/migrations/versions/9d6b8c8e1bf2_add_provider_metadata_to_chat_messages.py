"""add provider_metadata to chat_messages

Revision ID: 9d6b8c8e1bf2
Revises: e8a173c69670
Create Date: 2025-11-10 15:45:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "9d6b8c8e1bf2"
down_revision: Union[str, None] = "9b7fb0e8a6d2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add provider_metadata column to chat_messages table."""
    op.add_column(
        "chat_messages",
        sa.Column(
            "provider_metadata", postgresql.JSONB(astext_type=sa.Text()), nullable=True
        ),
    )

    op.add_column(
        "chat_messages",
        sa.Column("finish_reason", sa.String(), nullable=True),
    )


def downgrade() -> None:
    """Remove provider_metadata column from chat_messages table."""
    op.drop_column("chat_messages", "provider_metadata")
    op.drop_column("chat_messages", "finish_reason")
