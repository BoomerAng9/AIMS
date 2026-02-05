"""Helper script to load waitlist entries from a CSV file."""

from __future__ import annotations

import argparse
import asyncio
import csv
from datetime import datetime, timezone
import re
from pathlib import Path
from typing import Iterable

from sqlalchemy import select

from ii_agent.core.logger import logger
from ii_agent.db.manager import get_db_session_local
from ii_agent.db.models import WaitlistEntry

_TZ_SUFFIX_RE = re.compile(r"([+-]\d{2})(?![:\d])$")


def _normalise_tz_suffix(raw: str) -> str:
    """Ensure timezone offsets include minutes (e.g. '+00' -> '+0000')."""

    match = _TZ_SUFFIX_RE.search(raw)
    if match:
        hours = match.group(1)
        raw = _TZ_SUFFIX_RE.sub(f"{hours}00", raw)
    return raw


def _parse_created_at(value: str | None) -> datetime:
    """Parse timestamps from the CSV, normalising to UTC."""

    if not value:
        return datetime.now(timezone.utc)

    value = value.strip()
    if not value:
        return datetime.now(timezone.utc)

    normalised = _normalise_tz_suffix(value)

    try:
        parsed = datetime.fromisoformat(normalised)
    except ValueError:
        for pattern in ("%Y-%m-%d %H:%M:%S.%f%z", "%Y-%m-%d %H:%M:%S%z"):
            try:
                parsed = datetime.strptime(normalised, pattern)
                break
            except ValueError:
                continue
        else:
            raise ValueError(f"Unable to parse created_at value: {value!r}") from None

    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)

    return parsed.astimezone(timezone.utc)


def _normalise_email(email: str | None) -> str:
    if not email:
        raise ValueError("Email column is missing or empty")
    return email.strip().lower()


async def _existing_emails() -> set[str]:
    async with get_db_session_local() as db:
        result = await db.execute(select(WaitlistEntry.email))
        emails = {email.lower() for email in result.scalars()}
    return emails


async def import_waitlist(csv_path: Path) -> tuple[int, int]:
    """Import waitlist entries from the CSV file.

    Returns a tuple of (inserted_count, skipped_count).
    """

    if not csv_path.exists():
        raise FileNotFoundError(f"CSV file not found: {csv_path}")

    inserted = 0
    skipped = 0

    existing = await _existing_emails()

    async with get_db_session_local() as db:
        with csv_path.open(newline="", encoding="utf-8") as handle:
            reader = csv.DictReader(handle)
            required_columns = {"email", "created_at"}
            missing_columns = required_columns - set(reader.fieldnames or [])
            if missing_columns:
                raise ValueError(
                    f"CSV file missing required columns: {', '.join(sorted(missing_columns))}"
                )

            for row in reader:
                email = _normalise_email(row.get("email"))
                created_at = _parse_created_at(row.get("created_at"))

                if email in existing:
                    skipped += 1
                    continue

                entry = WaitlistEntry(email=email, created_at=created_at)
                db.add(entry)
                existing.add(email)
                inserted += 1

        await db.flush()

    return inserted, skipped


async def _main_async(csv_path: Path) -> None:
    inserted, skipped = await import_waitlist(csv_path)
    logger.info("Waitlist import finished: %s inserted, %s skipped", inserted, skipped)


def main(argv: Iterable[str] | None = None) -> None:
    parser = argparse.ArgumentParser(description="Import waitlist entries from CSV")
    parser.add_argument(
        "--csv",
        type=Path,
        required=True,
        help="Path to the CSV file containing waitlist data",
    )

    args = parser.parse_args(argv)

    asyncio.run(_main_async(args.csv))


if __name__ == "__main__":
    main()
