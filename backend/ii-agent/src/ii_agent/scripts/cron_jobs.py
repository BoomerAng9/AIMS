"""Automatically install and run ii-agent cron jobs."""

from __future__ import annotations

import asyncio
import inspect
from dataclasses import dataclass
from typing import Awaitable, Callable, Literal, Sequence

from ii_agent.core.logger import logger as app_logger
from ii_agent.scripts import refresh_annual_subscription_credits as annual_refresh
from ii_agent.scripts import refresh_free_user_credits as free_refresh
from ii_agent.scripts.cron_manager import CronJobDefinition, CronManager

CronJobRunner = Callable[[], Awaitable[None] | None]
CronJobStatus = Literal["active", "inactive"]


@dataclass(slots=True)
class CronJobSpec:
    name: str
    schedule: str
    task: CronJobRunner
    command: str
    status: CronJobStatus = "active"


_ANNUAL_REFRESH_DEFINITION = annual_refresh.build_cron_job_definition(
    schedule=annual_refresh.DEFAULT_CRON_SCHEDULE
)

_FREE_REFRESH_DEFINITION = free_refresh.build_cron_job_definition(
    schedule=free_refresh.DEFAULT_CRON_SCHEDULE
)

CRON_JOBS: Sequence[CronJobSpec] = (
    CronJobSpec(
        name=_ANNUAL_REFRESH_DEFINITION.name,
        schedule=_ANNUAL_REFRESH_DEFINITION.schedule,
        task=annual_refresh.refresh_annual_subscription_credits,
        command=_ANNUAL_REFRESH_DEFINITION.command,
        status="inactive",
    ),
    CronJobSpec(
        name=_FREE_REFRESH_DEFINITION.name,
        schedule=_FREE_REFRESH_DEFINITION.schedule,
        task=free_refresh.refresh_free_user_credits,
        command=_FREE_REFRESH_DEFINITION.command,
        status="active",
    ),
)


async def _run_job(job: CronJobSpec) -> None:
    try:
        result = job.task()
        if inspect.isawaitable(result):
            await result
    except Exception:  # noqa: BLE001 - log and propagate
        app_logger.exception("Cron job '%s' failed", job.name)
        raise


async def run_all_jobs() -> None:
    failures: list[str] = []
    executed_jobs = 0
    for job in CRON_JOBS:
        if job.status != "active":
            app_logger.info("Skipping cron job '%s' because status is '%s'", job.name, job.status)
            continue
        app_logger.info("Running cron job '%s'", job.name)
        try:
            await _run_job(job)
            executed_jobs += 1
        except Exception:
            failures.append(job.name)

    if failures:
        joined = ", ".join(failures)
        raise SystemExit(f"Failed cron job(s): {joined}")

    app_logger.info("Completed cron job run: %d job(s)", executed_jobs)


def install_all_jobs() -> None:
    manager = CronManager()
    definitions = [
        CronJobDefinition(name=job.name, schedule=job.schedule, command=job.command)
        for job in CRON_JOBS
        if job.status == "active"
    ]
    manager.sync(jobs=definitions, dry_run=False)


def main() -> None:
    install_all_jobs()
    asyncio.run(run_all_jobs())


if __name__ == "__main__":
    main()
