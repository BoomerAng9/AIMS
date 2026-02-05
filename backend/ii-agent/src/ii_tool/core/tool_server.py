from __future__ import annotations

from dataclasses import dataclass
from threading import Lock
from typing import Optional


@dataclass
class _ToolServerState:
    url: Optional[str] = None


class ToolServerURLSingleton:
    """Thread-safe singleton to store the tool server URL."""

    _instance: Optional["ToolServerURLSingleton"] = None
    _lock: Lock = Lock()

    def __new__(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
                    cls._instance._state = _ToolServerState()
        return cls._instance

    def set_url(self, url: str) -> None:
        self._state.url = url

    def get_url(self) -> str:
        if not self._state.url:
            raise RuntimeError("Tool server URL is not configured")
        return self._state.url


def set_tool_server_url(url: str) -> None:
    ToolServerURLSingleton().set_url(url)


def get_tool_server_url() -> str:
    return ToolServerURLSingleton().get_url()
