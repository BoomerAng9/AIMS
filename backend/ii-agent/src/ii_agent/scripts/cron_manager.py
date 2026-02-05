"""Utility helpers for managing recurring cron jobs for ii-agent."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Iterable, Iterator

from crontab import CronTab

from ii_agent.core.logger import logger as app_logger


@dataclass(slots=True)
class CronJobDefinition:
    """Configuration container for a cron job."""

    name: str
    schedule: str
    command: str

    def render_command(self) -> str:
        """Return the shell command for the cron entry."""

        return self.command


class CronManager:
    """Thin wrapper around ``python-crontab`` to manage ii-agent cron jobs."""

    def __init__(self, *, user: bool = True, tab: CronTab | None = None) -> None:
        self._cron = tab or CronTab(user=user)

    def install(self, *, job: CronJobDefinition, dry_run: bool = False) -> None:
        """Create or update a cron job based on its ``name`` comment."""

        command = job.render_command()
        existing = [scheduled for scheduled in self._cron if scheduled.comment == job.name]

        for scheduled in existing:
            self._cron.remove(scheduled)

        scheduled_job = self._cron.new(command=command, comment=job.name)
        scheduled_job.setall(job.schedule)

        if dry_run:
            for entry in self._cron:
                app_logger.info("Cron job (dry-run): %s", entry)
            return

        self._cron.write()
        app_logger.info("Installed cron job '%s' with schedule '%s'", job.name, job.schedule)

    def remove(self, *, name: str, dry_run: bool = False) -> bool:
        """Remove a cron job matching ``name``. Returns True when removed."""

        removed = False
        for scheduled in list(self._cron):
            if scheduled.comment == name:
                self._cron.remove(scheduled)
                removed = True

        if dry_run:
            app_logger.info("Dry-run removal for cron job '%s'", name)
            return removed

        if removed:
            self._cron.write()
            app_logger.info("Removed cron job '%s'", name)
        else:
            app_logger.info("No cron job named '%s' found", name)

        return removed

    def iter_jobs(self) -> Iterator[str]:
        """Yield cron job string representations."""

        yield from (str(entry) for entry in self._cron)

    def list_jobs(self) -> list[str]:
        """Return cron job string representations."""

        return list(self.iter_jobs())

    def sync(self, *, jobs: Iterable[CronJobDefinition], dry_run: bool = False) -> None:
        """Replace managed cron jobs with provided definitions."""

        managed_names = {job.name for job in jobs}
        for existing in list(self._cron):
            if existing.comment in managed_names:
                self._cron.remove(existing)

        for job in jobs:
            scheduled_job = self._cron.new(command=job.render_command(), comment=job.name)
            scheduled_job.setall(job.schedule)

        if dry_run:
            for entry in self._cron:
                app_logger.info("Cron job (dry-run sync): %s", entry)
            return

        self._cron.write()
        app_logger.info("Synchronized %d cron job(s)", len(managed_names))


__all__ = ["CronJobDefinition", "CronManager"]
