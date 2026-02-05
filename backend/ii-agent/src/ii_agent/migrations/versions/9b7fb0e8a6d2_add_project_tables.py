"""Add project resource tables.

Revision ID: 9b7fb0e8a6d2
Revises: e8a173c69670
Create Date: 2025-02-12 00:00:00

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from sqlalchemy.exc import NoSuchTableError

# revision identifiers, used by Alembic.
revision: str = "9b7fb0e8a6d2"
down_revision: Union[str, None] = "e8a173c69670"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _get_inspector():
    return sa.inspect(op.get_bind())


def _table_exists(inspector, table_name: str) -> bool:
    return table_name in inspector.get_table_names()


def _index_exists(inspector, table_name: str, index_name: str) -> bool:
    try:
        indexes = inspector.get_indexes(table_name)
    except NoSuchTableError:
        return False
    return any(index["name"] == index_name for index in indexes)


def _foreign_key_exists(inspector, table_name: str, fk_name: str) -> bool:
    try:
        foreign_keys = inspector.get_foreign_keys(table_name)
    except NoSuchTableError:
        return False
    return any(fk["name"] == fk_name for fk in foreign_keys)


def upgrade() -> None:
    """Create project resource tables."""

    inspector = _get_inspector()

    created_projects_table = False
    if not _table_exists(inspector, "projects"):
        op.create_table(
            "projects",
            sa.Column("id", sa.String(), nullable=False),
            sa.Column("user_id", sa.String(), nullable=False),
            sa.Column("session_id", sa.String(), nullable=True),
            sa.Column("name", sa.String(), nullable=True),
            sa.Column("description", sa.Text(), nullable=True),
            sa.Column(
                "status",
                sa.String(),
                nullable=False,
                server_default="active",
            ),
            sa.Column(
                "current_build_status",
                sa.String(),
                nullable=False,
                server_default="pending",
            ),
            sa.Column("framework", sa.String(), nullable=True),
            sa.Column("project_path", sa.String(), nullable=True),
            sa.Column("database_json", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
            sa.Column("storage_json", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
            sa.Column("secrets_json", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
            sa.Column("current_production_deployment_id", sa.String(), nullable=True),
            sa.Column(
                "created_at",
                sa.TIMESTAMP(timezone=True),
                nullable=False,
                server_default=sa.text("now()"),
            ),
            sa.Column(
                "updated_at",
                sa.TIMESTAMP(timezone=True),
                nullable=False,
                server_default=sa.text("now()"),
            ),
            sa.Column("deleted_at", sa.TIMESTAMP(timezone=True), nullable=True),
            sa.ForeignKeyConstraint([
                "user_id"
            ], ["users.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint([
                "session_id"
            ], ["sessions.id"], ondelete="SET NULL"),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("user_id", "name", name="uq_projects_user_id_name"),
        )
        created_projects_table = True

    inspector = _get_inspector()
    if created_projects_table or not _index_exists(
        inspector, "projects", "idx_projects_user_id"
    ):
        op.create_index("idx_projects_user_id", "projects", ["user_id"])
    if created_projects_table or not _index_exists(
        inspector, "projects", "idx_projects_status"
    ):
        op.create_index("idx_projects_status", "projects", ["status"])
    if created_projects_table or not _index_exists(
        inspector, "projects", "idx_projects_session_id"
    ):
        op.create_index("idx_projects_session_id", "projects", ["session_id"])

    # Legacy per-resource tables removed in favor of JSON blobs on projects

    inspector = _get_inspector()
    created_project_deployments = False
    if not _table_exists(inspector, "project_deployments"):
        op.create_table(
            "project_deployments",
            sa.Column("id", sa.String(), nullable=False),
            sa.Column("project_id", sa.String(), nullable=False),
            sa.Column("snapshot_id", sa.String(), nullable=False),
            sa.Column("environment", sa.String(), nullable=False),
            sa.Column(
                "deployment_status",
                sa.String(),
                nullable=False,
                server_default="pending",
            ),
            sa.Column(
                "is_active",
                sa.Boolean(),
                nullable=False,
                server_default=sa.text("false"),
            ),
            sa.Column("deployment_url", sa.String(), nullable=True),
            sa.Column("started_at", sa.TIMESTAMP(timezone=True), nullable=True),
            sa.Column("deployed_at", sa.TIMESTAMP(timezone=True), nullable=True),
            sa.Column("finished_at", sa.TIMESTAMP(timezone=True), nullable=True),
            sa.Column("deploy_duration_ms", sa.BigInteger(), nullable=True),
            sa.Column("error_message", sa.Text(), nullable=True),
            sa.Column("deployed_by_user_id", sa.String(), nullable=True),
            sa.Column(
                "created_at",
                sa.TIMESTAMP(timezone=True),
                nullable=False,
                server_default=sa.text("now()"),
            ),
            sa.Column(
                "updated_at",
                sa.TIMESTAMP(timezone=True),
                nullable=False,
                server_default=sa.text("now()"),
            ),
            sa.ForeignKeyConstraint(
                ["project_id"], ["projects.id"], ondelete="CASCADE"
            ),
            sa.ForeignKeyConstraint(
                ["deployed_by_user_id"], ["users.id"], ondelete="SET NULL"
            ),
            sa.PrimaryKeyConstraint("id"),
        )
        created_project_deployments = True

    inspector = _get_inspector()
    if created_project_deployments or not _index_exists(
        inspector, "project_deployments", "idx_project_deployments_project_id"
    ):
        op.create_index(
            "idx_project_deployments_project_id",
            "project_deployments",
            ["project_id"],
        )
    if created_project_deployments or not _index_exists(
        inspector, "project_deployments", "idx_project_deployments_environment"
    ):
        op.create_index(
            "idx_project_deployments_environment",
            "project_deployments",
            ["environment"],
        )

    inspector = _get_inspector()
    if not _foreign_key_exists(
        inspector, "projects", "fk_projects_current_production_deployment"
    ):
        op.create_foreign_key(
            "fk_projects_current_production_deployment",
            "projects",
            "project_deployments",
            ["current_production_deployment_id"],
            ["id"],
            ondelete="SET NULL",
        )

def downgrade() -> None:
    """Drop project resource tables."""

    op.drop_constraint(
        "fk_projects_current_production_deployment",
        "projects",
        type_="foreignkey",
    )

    op.drop_index(
        "idx_project_deployments_environment", table_name="project_deployments"
    )
    op.drop_index(
        "idx_project_deployments_project_id", table_name="project_deployments"
    )
    op.drop_table("project_deployments")

    op.drop_index("idx_projects_session_id", table_name="projects")
    op.drop_index("idx_projects_status", table_name="projects")
    op.drop_index("idx_projects_user_id", table_name="projects")
    op.drop_table("projects")
