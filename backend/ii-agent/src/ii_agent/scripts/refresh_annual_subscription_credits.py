"""Daily cron helper to refresh monthly credits for annual subscribers.

This module can either run the refresh immediately or install a cron job
using ``python-crontab`` to execute the task on a schedule.
"""

from __future__ import annotations

import asyncio
import logging
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict

from sqlalchemy import select

from ii_agent.core.config.ii_agent_config import config
from ii_agent.core.logger import logger as app_logger
from ii_agent.db.manager import get_db_session_local
from ii_agent.db.models import User
from ii_agent.scripts.cron_manager import CronJobDefinition, CronManager

REFRESH_METADATA_KEY = "last_annual_credit_refresh"
ACTIVE_STATUSES = {"active", "trialing"}
DEFAULT_CRON_SCHEDULE = "0 0 * * *"


def _ensure_metadata_dict(metadata: Any | None) -> Dict[str, Any]:
    if isinstance(metadata, dict):
        return dict(metadata)
    return {}


def _parse_iso_date(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        parsed = datetime.fromisoformat(value)
    except ValueError:
        return None

    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)


def _as_utc(dt: datetime | None) -> datetime | None:
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


async def _refresh_user_credits(user: User, *, now: datetime) -> bool:
    plan_id = user.subscription_plan
    monthly_credits = config.default_plans_credits.get(plan_id or "")
    if monthly_credits is None:
        app_logger.warning(
            "Skipping annual credit refresh for user %s: plan '%s' has no default credits",
            user.id,
            plan_id,
        )
        return False

    subscription_period_end = _as_utc(user.subscription_current_period_end)
    if subscription_period_end and subscription_period_end < now:
        return False

    metadata = _ensure_metadata_dict(user.user_metadata)
    last_refresh = _parse_iso_date(str(metadata.get(REFRESH_METADATA_KEY)))
    if (
        last_refresh
        and last_refresh.year == now.year
        and last_refresh.month == now.month
    ):
        return False

    user.credits = monthly_credits
    metadata[REFRESH_METADATA_KEY] = now.isoformat()
    user.user_metadata = metadata
    return True


async def refresh_annual_subscription_credits() -> None:
    now = datetime.now(timezone.utc)
    refreshed = 0

    async with get_db_session_local() as db:
        result = await db.execute(
            select(User).where(
                User.is_active.is_(True),
                User.subscription_status.in_(ACTIVE_STATUSES),
                User.subscription_billing_cycle == "annually",
            )
        )
        users = result.scalars().all()

        for user in users:
            if await _refresh_user_credits(user, now=now):
                refreshed += 1

        await db.flush()

    app_logger.info(
        "Annual subscription credit refresh completed: %s users updated", refreshed
    )


def _project_root() -> Path:
    return Path(__file__).resolve().parents[3]


def _default_command() -> str:
    python_executable = sys.executable
    repo_root = _project_root()
    return (
        f"cd {repo_root} && {python_executable} -m "
        "ii_agent.scripts.refresh_annual_subscription_credits"
    )


def install_cron_job(
    *,
    schedule: str,
    dry_run: bool = False,
    manager: CronManager | None = None,
) -> None:
    """Install or update the cron job that runs the refresh task."""

    cron_manager = manager or CronManager()
    job = build_cron_job_definition(
        schedule=schedule,
    )
    cron_manager.install(job=job, dry_run=dry_run)


def build_cron_job_definition(
    *,
    schedule: str = DEFAULT_CRON_SCHEDULE,
) -> CronJobDefinition:
    """Return the cron job definition for annual credit refresh."""

    return CronJobDefinition(
        name="ii-agent-annual-credit-refresh",
        schedule=schedule,
        command=_default_command(),
    )


async def _main_async() -> None:
    await refresh_annual_subscription_credits()


def main() -> None:
    import argparse

    logging.basicConfig(level=logging.INFO)

    parser = argparse.ArgumentParser(
        description="Refresh credits for annual subscribers or install cron job"
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
