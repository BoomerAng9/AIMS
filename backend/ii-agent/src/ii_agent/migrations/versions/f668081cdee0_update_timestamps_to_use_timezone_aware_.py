"""Update timestamps to use timezone aware columns for PostgreSQL

Revision ID: f668081cdee0
Revises: b3a8e2e98a7b
Create Date: 2025-09-22 15:01:00.076478

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'f668081cdee0'
down_revision: Union[str, None] = 'b3a8e2e98a7b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Get the database dialect
    conn = op.get_bind()

    # Only apply changes if using PostgreSQL
    if conn.dialect.name == 'postgresql':
        # Update users table
        op.alter_column('users', 'created_at',
                       type_=sa.TIMESTAMP(timezone=True),
                       existing_type=sa.TIMESTAMP())
        op.alter_column('users', 'updated_at',
                       type_=sa.TIMESTAMP(timezone=True),
                       existing_type=sa.TIMESTAMP())
        op.alter_column('users', 'last_login_at',
                       type_=sa.TIMESTAMP(timezone=True),
                       existing_type=sa.TIMESTAMP())

        # Update llm_settings table
        op.alter_column('llm_settings', 'created_at',
                       type_=sa.TIMESTAMP(timezone=True),
                       existing_type=sa.TIMESTAMP())
        op.alter_column('llm_settings', 'updated_at',
                       type_=sa.TIMESTAMP(timezone=True),
                       existing_type=sa.TIMESTAMP())

        # Update mcp_settings table
        op.alter_column('mcp_settings', 'created_at',
                       type_=sa.TIMESTAMP(timezone=True),
                       existing_type=sa.TIMESTAMP())
        op.alter_column('mcp_settings', 'updated_at',
                       type_=sa.TIMESTAMP(timezone=True),
                       existing_type=sa.TIMESTAMP())

        # Update sessions table
        op.alter_column('sessions', 'last_message_at',
                       type_=sa.TIMESTAMP(timezone=True),
                       existing_type=sa.TIMESTAMP())
        op.alter_column('sessions', 'created_at',
                       type_=sa.TIMESTAMP(timezone=True),
                       existing_type=sa.TIMESTAMP())
        op.alter_column('sessions', 'updated_at',
                       type_=sa.TIMESTAMP(timezone=True),
                       existing_type=sa.TIMESTAMP())
        op.alter_column('sessions', 'deleted_at',
                       type_=sa.TIMESTAMP(timezone=True),
                       existing_type=sa.TIMESTAMP())

        # Update events table
        op.alter_column('events', 'created_at',
                       type_=sa.TIMESTAMP(timezone=True),
                       existing_type=sa.TIMESTAMP())

        # Update file_uploads table
        op.alter_column('file_uploads', 'created_at',
                       type_=sa.TIMESTAMP(timezone=True),
                       existing_type=sa.TIMESTAMP())

        # Update slide_contents table
        op.alter_column('slide_contents', 'created_at',
                       type_=sa.TIMESTAMP(timezone=True),
                       existing_type=sa.TIMESTAMP())
        op.alter_column('slide_contents', 'updated_at',
                       type_=sa.TIMESTAMP(timezone=True),
                       existing_type=sa.TIMESTAMP())

        # Update session_wishlists table
        op.alter_column('session_wishlists', 'created_at',
                       type_=sa.TIMESTAMP(timezone=True),
                       existing_type=sa.TIMESTAMP())

        # Update session_metrics table
        op.alter_column('session_metrics', 'created_at',
                       type_=sa.TIMESTAMP(timezone=True),
                       existing_type=sa.TIMESTAMP())
        op.alter_column('session_metrics', 'updated_at',
                       type_=sa.TIMESTAMP(timezone=True),
                       existing_type=sa.TIMESTAMP())

        # Update api_keys table
        op.alter_column('api_keys', 'created_at',
                       type_=sa.TIMESTAMP(timezone=True),
                       existing_type=sa.TIMESTAMP())
        op.alter_column('api_keys', 'updated_at',
                       type_=sa.TIMESTAMP(timezone=True),
                       existing_type=sa.TIMESTAMP())


def downgrade() -> None:
    """Downgrade schema."""
    # Get the database dialect
    conn = op.get_bind()

    # Only apply changes if using PostgreSQL
    if conn.dialect.name == 'postgresql':
        # Revert users table
        op.alter_column('users', 'created_at',
                       type_=sa.TIMESTAMP(),
                       existing_type=sa.TIMESTAMP(timezone=True))
        op.alter_column('users', 'updated_at',
                       type_=sa.TIMESTAMP(),
                       existing_type=sa.TIMESTAMP(timezone=True))
        op.alter_column('users', 'last_login_at',
                       type_=sa.TIMESTAMP(),
                       existing_type=sa.TIMESTAMP(timezone=True))

        # Revert llm_settings table
        op.alter_column('llm_settings', 'created_at',
                       type_=sa.TIMESTAMP(),
                       existing_type=sa.TIMESTAMP(timezone=True))
        op.alter_column('llm_settings', 'updated_at',
                       type_=sa.TIMESTAMP(),
                       existing_type=sa.TIMESTAMP(timezone=True))

        # Revert mcp_settings table
        op.alter_column('mcp_settings', 'created_at',
                       type_=sa.TIMESTAMP(),
                       existing_type=sa.TIMESTAMP(timezone=True))
        op.alter_column('mcp_settings', 'updated_at',
                       type_=sa.TIMESTAMP(),
                       existing_type=sa.TIMESTAMP(timezone=True))

        # Revert sessions table
        op.alter_column('sessions', 'last_message_at',
                       type_=sa.TIMESTAMP(),
                       existing_type=sa.TIMESTAMP(timezone=True))
        op.alter_column('sessions', 'created_at',
                       type_=sa.TIMESTAMP(),
                       existing_type=sa.TIMESTAMP(timezone=True))
        op.alter_column('sessions', 'updated_at',
                       type_=sa.TIMESTAMP(),
                       existing_type=sa.TIMESTAMP(timezone=True))
        op.alter_column('sessions', 'deleted_at',
                       type_=sa.TIMESTAMP(),
                       existing_type=sa.TIMESTAMP(timezone=True))

        # Revert events table
        op.alter_column('events', 'created_at',
                       type_=sa.TIMESTAMP(),
                       existing_type=sa.TIMESTAMP(timezone=True))

        # Revert file_uploads table
        op.alter_column('file_uploads', 'created_at',
                       type_=sa.TIMESTAMP(),
                       existing_type=sa.TIMESTAMP(timezone=True))

        # Revert slide_contents table
        op.alter_column('slide_contents', 'created_at',
                       type_=sa.TIMESTAMP(),
                       existing_type=sa.TIMESTAMP(timezone=True))
        op.alter_column('slide_contents', 'updated_at',
                       type_=sa.TIMESTAMP(),
                       existing_type=sa.TIMESTAMP(timezone=True))

        # Revert session_wishlists table
        op.alter_column('session_wishlists', 'created_at',
                       type_=sa.TIMESTAMP(),
                       existing_type=sa.TIMESTAMP(timezone=True))

        # Revert session_metrics table
        op.alter_column('session_metrics', 'created_at',
                       type_=sa.TIMESTAMP(),
                       existing_type=sa.TIMESTAMP(timezone=True))
        op.alter_column('session_metrics', 'updated_at',
                       type_=sa.TIMESTAMP(),
                       existing_type=sa.TIMESTAMP(timezone=True))

        # Revert api_keys table
        op.alter_column('api_keys', 'created_at',
                       type_=sa.TIMESTAMP(),
                       existing_type=sa.TIMESTAMP(timezone=True))
        op.alter_column('api_keys', 'updated_at',
                       type_=sa.TIMESTAMP(),
                       existing_type=sa.TIMESTAMP(timezone=True))