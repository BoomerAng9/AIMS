"""Add M.I.M. branding_settings table

Revision ID: m1m_branding_001
Revises: ff19b82b7805
Create Date: 2025-02-05

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'm1m_branding_001'
down_revision: Union[str, None] = 'ff19b82b7805'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create branding_settings table for M.I.M. customization."""
    op.create_table(
        'branding_settings',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=True),
        
        # App identity
        sa.Column('app_name', sa.String(100), nullable=False, server_default='ACHEEVY'),
        sa.Column('tagline', sa.String(200), nullable=True),
        
        # Color scheme
        sa.Column('primary_color', sa.String(7), nullable=False, server_default='#f59e0b'),
        sa.Column('secondary_color', sa.String(7), nullable=False, server_default='#fbbf24'),
        sa.Column('accent_color', sa.String(7), nullable=False, server_default='#d97706'),
        sa.Column('background_color', sa.String(7), nullable=False, server_default='#0f172a'),
        sa.Column('text_color', sa.String(7), nullable=False, server_default='#f8fafc'),
        
        # Logo and assets
        sa.Column('logo_url', sa.Text(), nullable=True),
        sa.Column('logo_dark_url', sa.Text(), nullable=True),
        sa.Column('favicon_url', sa.Text(), nullable=True),
        
        # Custom CSS
        sa.Column('custom_css', sa.Text(), nullable=True),
        
        # Feature flags
        sa.Column('show_powered_by', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('custom_footer_text', sa.String(500), nullable=True),
        
        # Metadata
        sa.Column('metadata', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        
        # Timestamps
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
        
        # Constraints
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
    )
    
    # Create index on user_id for faster lookups
    op.create_index('ix_branding_settings_user_id', 'branding_settings', ['user_id'])
    
    # Insert default branding settings
    op.execute("""
        INSERT INTO branding_settings (id, app_name, tagline, primary_color, secondary_color, accent_color, background_color, text_color, show_powered_by)
        VALUES ('default', 'ACHEEVY', 'Your AI-Powered Achievement Partner', '#f59e0b', '#fbbf24', '#d97706', '#0f172a', '#f8fafc', true)
    """)


def downgrade() -> None:
    """Remove branding_settings table."""
    op.drop_index('ix_branding_settings_user_id', table_name='branding_settings')
    op.drop_table('branding_settings')
