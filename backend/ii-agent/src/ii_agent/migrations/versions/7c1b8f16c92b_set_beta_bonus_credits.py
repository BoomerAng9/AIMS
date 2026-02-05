"""set beta bonus credits for existing users

Revision ID: 7c1b8f16c92b
Revises: d3561654b919
Create Date: 2025-01-06 00:00:00.000000

"""

from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = "7c1b8f16c92b"
down_revision: Union[str, None] = "d3561654b919"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Populate bonus credits for existing users."""
    op.execute(
        "UPDATE users SET bonus_credits = 2000.0 WHERE bonus_credits < 2000.0"
    )


def downgrade() -> None:
    """Revert bonus credits assigned in upgrade."""
    op.execute(
        "UPDATE users SET bonus_credits = 0.0 WHERE bonus_credits = 2000.0"
    )
