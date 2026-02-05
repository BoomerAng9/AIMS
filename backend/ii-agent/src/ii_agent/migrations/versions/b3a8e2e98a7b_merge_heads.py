"""Merge heads

Revision ID: b3a8e2e98a7b
Revises: 5748a2cbf33f, 5794bd91f5ac
Create Date: 2025-09-17 20:45:00

"""
from typing import Sequence, Union

# revision identifiers, used by Alembic.
revision: str = "b3a8e2e98a7b"
down_revision: Union[str, Sequence[str], None] = ("5748a2cbf33f", "5794bd91f5ac")
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """No-op merge upgrade."""
    pass


def downgrade() -> None:
    """No-op merge downgrade."""
    pass

