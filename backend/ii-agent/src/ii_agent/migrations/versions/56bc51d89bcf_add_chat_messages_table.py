"""add_chat_messages_table

Revision ID: 56bc51d89bcf
Revises: 1c77501fee34
Create Date: 2025-10-22 14:00:29.451894

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB, UUID

# revision identifiers, used by Alembic.
revision: str = '56bc51d89bcf'
down_revision: Union[str, None] = '1c77501fee34'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        'chat_messages',
        sa.Column('id', UUID(as_uuid=True), nullable=False),
        sa.Column('session_id', sa.String(), nullable=False),
        sa.Column('role', sa.String(), nullable=False),
        sa.Column('content', JSONB, nullable=False),  # Full message object from LLM response
        sa.Column('usage', JSONB, nullable=True),  # Usage statistics from LLM response
        sa.Column('tokens', sa.BigInteger(), nullable=True),  # Total tokens (accumulated)
        sa.Column('model', sa.String(), nullable=True),
        sa.Column('tools', JSONB, nullable=True),  # Tools used in the message
        sa.Column('file_ids', sa.ARRAY(UUID(as_uuid=True)), nullable=True),  # Array of file IDs
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), nullable=True),
        sa.Column('updated_at', sa.TIMESTAMP(timezone=True), nullable=True),
        sa.Column('parent_message_id', UUID(as_uuid=True), nullable=True),  # Link to parent message
        sa.Column('is_finished', sa.Boolean(), nullable=True, default=True),  # Completion status
        sa.PrimaryKeyConstraint('id')
    )

    # Create indexes
    op.create_index('idx_chat_messages_session', 'chat_messages', ['session_id'])
    op.create_index('idx_chat_messages_created', 'chat_messages', ['created_at'])
    op.create_index('idx_chat_messages_session_created', 'chat_messages', ['session_id', 'created_at'])


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index('idx_chat_messages_session_created', table_name='chat_messages')
    op.drop_index('idx_chat_messages_created', table_name='chat_messages')
    op.drop_index('idx_chat_messages_session', table_name='chat_messages')
    op.drop_table('chat_messages')
