"""add subscription billing cycle column

Revision ID: ea3f7c9d1254
Revises: d0f4db1e7c45
Create Date: 2025-03-12 13:00:00
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "ea3f7c9d1254"
down_revision = "d0f4db1e7c45"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("subscription_billing_cycle", sa.String(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("users", "subscription_billing_cycle")
