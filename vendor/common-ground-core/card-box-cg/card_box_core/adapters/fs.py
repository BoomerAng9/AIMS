from __future__ import annotations

import os
from abc import ABC, abstractmethod
from typing import Final, Dict
from urllib.parse import urlsplit, unquote


class FileStorageAdapter(ABC):
    """
    Abstract interface for reading file bytes from a URI.

    Implementations may support different schemes (e.g., file://, s3://).
    Implementations should raise:
    - FileNotFoundError: when a referenced file does not exist
    - IsADirectoryError: when the target is a directory
    - ValueError: for unsupported schemes or malformed inputs
    """

    @abstractmethod
    def read_file(self, uri: str) -> bytes:
        """Read file content as bytes from a URI or path."""
        raise NotImplementedError


_FILE_SCHEME: Final[str] = "file"


def _resolve_local_path(uri_or_path: str) -> str:
    """
    Resolve a local filesystem path from a plain path or file:// URI.

    Rules:
    - If input starts with 'file://', treat as file URI and decode percent-encoding.
    - If input contains '://', but is not a file URI, raise ValueError (unsupported scheme).
    - Otherwise, treat as a normal local path (handles Windows drive letters like 'C:\\...').
    - Always expand ~ and env vars; return absolute, normalized path.
    """
    if not uri_or_path:
        raise ValueError("Empty path/URI provided")

    s = uri_or_path
    if s.startswith("file://"):
        parsed = urlsplit(s)
        raw_path = unquote(parsed.path)
        # On Windows, urlsplit('file:///C:/x') yields '/C:/x' — strip leading slash when present.
        if os.name == "nt" and raw_path.startswith("/") and len(raw_path) > 3 and raw_path[2] == ":":
            raw_path = raw_path[1:]
    else:
        # Any other scheme is unsupported (e.g., s3://, http://)
        if "://" in s:
            scheme = s.split("://", 1)[0]
            if scheme.lower() != _FILE_SCHEME:
                raise ValueError(f"Unsupported URI scheme: {scheme}")
        raw_path = s

    expanded = os.path.expandvars(os.path.expanduser(raw_path))
    abspath = os.path.abspath(expanded)
    norm = os.path.normpath(abspath)
    return norm


class LocalFileStorageAdapter(FileStorageAdapter):
    """
    File storage adapter that reads from the local filesystem.

    Supports plain paths and file:// URIs. Returns file bytes.
    """

    def read_file(self, uri: str) -> bytes:
        path = _resolve_local_path(uri)

        if not os.path.exists(path):
            raise FileNotFoundError(path)
        if os.path.isdir(path):
            raise IsADirectoryError(path)

        with open(path, "rb") as f:
            return f.read()


class InMemoryMappingAdapter(FileStorageAdapter):
    """
    File adapter backed by an in-memory mapping from URI -> bytes.

    Intended for use with deserialized transport packages where file bytes are
    shipped alongside a Card and keyed by their original URIs.
    """

    def __init__(self, attachments: Dict[str, bytes] | None = None):
        self._attachments: Dict[str, bytes] = attachments or {}

    def read_file(self, uri: str) -> bytes:
        try:
            return self._attachments[uri]
        except KeyError:
            raise FileNotFoundError(uri)
