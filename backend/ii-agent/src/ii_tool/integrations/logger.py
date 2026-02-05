"""Centralized logging helpers for ii_tool."""

from __future__ import annotations

import logging
import os
import sys
from pathlib import Path
from typing import Optional

LOG_FILE_PATH = Path(
    os.environ.get("II_TOOL_LOG_FILE", "/app/log/sandbox.log")
)
LOG_FORMAT = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"


def _configure_logger(logger: logging.Logger, level: int, fmt: str) -> logging.Logger:
    if getattr(logger, "_ii_tool_logger_configured", False):
        return logger

    formatter = logging.Formatter(fmt)
    handlers: list[logging.Handler] = []

    try:
        LOG_FILE_PATH.parent.mkdir(parents=True, exist_ok=True)
        file_handler = logging.FileHandler(LOG_FILE_PATH, encoding="utf-8")
        file_handler.setFormatter(formatter)
        handlers.append(file_handler)
    except OSError as exc:
        # Fall back to stdout if we cannot use the requested log file.
        print(
            f"[ii_tool] Failed to initialize file logging at {LOG_FILE_PATH}: {exc}. "
            "Falling back to stdout.",
            file=sys.stderr,
        )
        stream_handler = logging.StreamHandler(sys.stdout)
        stream_handler.setFormatter(formatter)
        handlers.append(stream_handler)

    for handler in handlers:
        logger.addHandler(handler)

    logger.setLevel(level)
    logger.propagate = False
    logger._ii_tool_logger_configured = True  # type: ignore[attr-defined]
    return logger


def get_logger(
    name: Optional[str] = None,
    level: int = logging.INFO,
    format: str = LOG_FORMAT,
) -> logging.Logger:
    """Return a shared logger that writes to /app/log/sandbox.log."""

    logger_name = name or "ii_tool"
    logger = logging.getLogger(logger_name)
    return _configure_logger(logger, level, format)


__all__ = ["get_logger", "LOG_FILE_PATH"]
