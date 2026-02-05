"""add_slide_templates_table_with_images_array

Revision ID: 4d383c356547
Revises: 0e4d284c9df2
Create Date: 2025-10-03 17:05:21.144402

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = '4d383c356547'
down_revision: Union[str, None] = '0e4d284c9df2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "slide_templates",
        sa.Column("id", sa.String(), primary_key=True, nullable=False),
        sa.Column("slide_template_name", sa.String(), nullable=False),
        sa.Column("slide_content", sa.String(), nullable=False),
        sa.Column("slide_template_images", sa.ARRAY(sa.String()), nullable=True),
        sa.Column(
            "created_at",
            sa.TIMESTAMP(timezone=True),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
        sa.Column(
            "updated_at",
            sa.TIMESTAMP(timezone=True),
            nullable=True,
            onupdate=sa.text("CURRENT_TIMESTAMP"),
        ),
    )

    # Create index on template name for faster lookups
    op.create_index(
        "idx_slide_templates_name",
        "slide_templates",
        ["slide_template_name"],
        unique=False,
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index("idx_slide_templates_name", table_name="slide_templates")
    op.drop_table("slide_templates")
