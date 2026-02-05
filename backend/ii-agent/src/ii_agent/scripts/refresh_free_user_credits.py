"""Monthly cron helper to refresh credits for free-plan users."""

from __future__ import annotations

import asyncio
import logging
import sys
from pathlib import Path

from sqlalchemy import or_, select

from ii_agent.core.config.ii_agent_config import config
from ii_agent.core.logger import logger as app_logger
from ii_agent.db.manager import get_db_session_local
from ii_agent.db.models import User
from ii_agent.scripts.cron_manager import CronJobDefinition, CronManager

FREE_PLAN_ID = "free"
DEFAULT_CRON_SCHEDULE = "0 0 1 * *"


def _monthly_free_credit_allowance() -> float:
    """Return the configured monthly credit allowance for free users."""

    allowance = config.default_plans_credits.get(FREE_PLAN_ID)
    if allowance is None:
        allowance = config.default_user_credits
        app_logger.warning(
            "No configured credit allowance for free plan; falling back to default_user_credits=%s",
            allowance,
        )
    return allowance


async def refresh_free_user_credits() -> None:
    """Reset credits for free users to the configured monthly allowance."""

    monthly_credits = _monthly_free_credit_allowance()
    updated_users = 0

    async with get_db_session_local() as db:
        result = await db.execute(
            select(User).where(
                User.is_active.is_(True),
                or_(
                    User.subscription_plan.is_(None),
                    User.subscription_plan == FREE_PLAN_ID,
                ),
            )
        )
        users = result.scalars().all()

        for user in users:
            changed = False
            if user.subscription_plan != FREE_PLAN_ID:
                user.subscription_plan = FREE_PLAN_ID
                changed = True
            if user.credits != monthly_credits:
                user.credits = monthly_credits
                changed = True
            if changed:
                updated_users += 1

        await db.flush()

    app_logger.info(
        "Free user credit refresh completed: %s users updated", updated_users
    )


def _project_root() -> Path:
    return Path(__file__).resolve().parents[3]


def _default_command() -> str:
    python_executable = sys.executable
    repo_root = _project_root()
    return (
        f"cd {repo_root} && {python_executable} -m "
        "ii_agent.scripts.refresh_free_user_credits"
    )


def install_cron_job(
    *,
    schedule: str = DEFAULT_CRON_SCHEDULE,
    dry_run: bool = False,
    manager: CronManager | None = None,
) -> None:
    """Install or update the cron job that runs the free-plan refresh task."""

    cron_manager = manager or CronManager()
    job = build_cron_job_definition(schedule=schedule)
    cron_manager.install(job=job, dry_run=dry_run)


def build_cron_job_definition(
    *,
    schedule: str = DEFAULT_CRON_SCHEDULE,
) -> CronJobDefinition:
    """Return the cron job definition for the free-plan credit refresh."""

    return CronJobDefinition(
        name="ii-agent-free-credit-refresh",
        schedule=schedule,
        command=_default_command(),
    )


async def _main_async() -> None:
    await refresh_free_user_credits()


def main() -> None:
    import argparse

    logging.basicConfig(level=logging.INFO)

    parser = argparse.ArgumentParser(
        description="Refresh credits for free-plan users or install the cron job"
    )
    parser.add_argument(
        "--install-cron",
        action="store_true",
        help="Install the cron job instead of running the refresh now",
    )
    parser.add_argument(
        "--schedule",
        default=DEFAULT_CRON_SCHEDULE,
        help=f"Cron schedule in crontab format (default: '{DEFAULT_CRON_SCHEDULE}')",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Show the cron job that would be installed without writing it",
    )

    args = parser.parse_args()

    if args.install_cron:
        install_cron_job(
            schedule=args.schedule,
            dry_run=args.dry_run,
        )
    else:
        asyncio.run(_main_async())


if __name__ == "__main__":
    main()
