"""set subscription plan to free

Revision ID: d0f4db1e7c45
Revises: b6a3e2d4a1f1
Create Date: 2025-03-12 12:30:00
"""

from alembic import op


# revision identifiers, used by Alembic.
revision = "d0f4db1e7c45"
down_revision = "b6a3e2d4a1f1"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("UPDATE users SET subscription_plan = 'free' WHERE subscription_plan IS NULL")


def downgrade() -> None:
    op.execute("UPDATE users SET subscription_plan = NULL WHERE subscription_plan = 'free'")
