"""add_session_tracking_fields

Revision ID: 46528d78fcbb
Revises: 56bc51d89bcf
Create Date: 2025-10-29 10:25:15.256309

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "46528d78fcbb"
down_revision: Union[str, None] = "56bc51d89bcf"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add new session tracking fields
    with op.batch_alter_table("sessions", schema=None) as batch_op:
        # Token tracking - useful for both chat and agent modes
        batch_op.add_column(
            sa.Column(
                "prompt_tokens", sa.BigInteger(), nullable=False, server_default="0"
            )
        )
        batch_op.add_column(
            sa.Column(
                "completion_tokens", sa.BigInteger(), nullable=False, server_default="0"
            )
        )

        # Summary tracking - ONLY for chat mode (agent_type='chat')
        # References chat_messages table which doesn't exist for agent mode
        # Will be NULL for all agent mode sessions
        batch_op.add_column(sa.Column("summary_message_id", sa.String(), nullable=True))

        # Cost tracking - useful for both modes
        batch_op.add_column(
            sa.Column("cost", sa.Float(), nullable=False, server_default="0.0")
        )

    # Note: chat_messages.content already stores JSONB, so no schema change needed
    # The serialization format change will be handled in the application layer

    # Note: summary_message_id is chat-mode specific
    # Agent mode sessions will always have summary_message_id = NULL


def downgrade() -> None:
    """Downgrade schema."""
    # Remove session tracking fields
    with op.batch_alter_table("sessions", schema=None) as batch_op:
        batch_op.drop_column("cost")
        batch_op.drop_column("summary_message_id")
        batch_op.drop_column("completion_tokens")
        batch_op.drop_column("prompt_tokens")
