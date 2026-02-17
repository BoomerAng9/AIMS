from __future__ import annotations

import datetime as dt
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
import hashlib
from typing import Any, BinaryIO, Dict, Optional, Tuple
from urllib.parse import urlparse


class ExternalObjectError(RuntimeError):
    """Base exception for external object access failures."""


class InvalidExternalURIError(ExternalObjectError):
    """Raised when a supplied external URI is malformed or unsupported."""


class ExternalObjectNotFoundError(ExternalObjectError):
    """Raised when the target object cannot be located."""


@dataclass(frozen=True)
class ExternalObjectPointer:
    """
    Metadata describing an immutable external object (S3 object).

    Fields:
        uri: Fully-qualified object URI (e.g., s3://bucket/key).
        checksum: Content checksum string (e.g., "md5:<hex>" or "sha256:<hex>").
        content_type: MIME type of the object.
        size: Object size in bytes.
        etag: ETag reported by the storage service.
        expires_at: Optional expiry timestamp for temporary pointers (UTC).
        version_id: Optional version identifier for versioned buckets.
        metadata: Additional provider-specific metadata.
    """

    uri: str
    checksum: str
    content_type: Optional[str] = None
    size: Optional[int] = None
    etag: Optional[str] = None
    expires_at: Optional[dt.datetime] = None
    version_id: Optional[str] = None
    metadata: Dict[str, str] = field(default_factory=dict)

    def is_expired(self, now: Optional[dt.datetime] = None) -> bool:
        if self.expires_at is None:
            return False
        if now is None:
            now = dt.datetime.now(dt.timezone.utc)
        if self.expires_at.tzinfo is None:
            # Assume stored timestamp is UTC if naive.
            expires = self.expires_at.replace(tzinfo=dt.timezone.utc)
        else:
            expires = self.expires_at.astimezone(dt.timezone.utc)
        return now >= expires

    def to_payload(self) -> Dict[str, Any]:
        """
        Convert pointer metadata into a JSON-serialisable dictionary.
        """
        payload: Dict[str, Any] = {
            "uri": self.uri,
            "checksum": self.checksum,
        }
        if self.content_type:
            payload["content_type"] = self.content_type
        if self.size is not None:
            payload["size"] = self.size
        if self.etag:
            payload["etag"] = self.etag
        if self.expires_at:
            expires = self.expires_at
            if expires.tzinfo is None:
                expires = expires.replace(tzinfo=dt.timezone.utc)
            payload["expires_at"] = expires.isoformat()
        if self.version_id:
            payload["version_id"] = self.version_id
        if self.metadata:
            payload["metadata"] = dict(self.metadata)
        return payload


class ExternalObjectReader(ABC):
    """
    Abstract interface for retrieving bytes from external object storage.
    """

    @abstractmethod
    def read_bytes(self, uri: str, *, range_bytes: Optional[Tuple[int, int]] = None) -> bytes:
        """
        Read the entire object (or byte range) into memory and return as bytes.
        Args:
            uri: External object URI.
            range_bytes: Optional tuple ``(start, end)`` inclusive range.
        Raises:
            ExternalObjectError subclasses on failures.
        """

    @abstractmethod
    def open_stream(self, uri: str) -> BinaryIO:
        """
        Open a streaming binary handle for the object.
        Caller is responsible for closing the handle.
        """

    def head(self, uri: str) -> ExternalObjectPointer:
        """
        Retrieve metadata describing the object without downloading it.
        Default implementation downloads the full object to derive metadata,
        subclasses should override with efficient HEAD operations.
        """
        data = self.read_bytes(uri)
        digest = hashlib.sha256(data).hexdigest()
        return ExternalObjectPointer(
            uri=uri,
            checksum=f"sha256:{digest}",
            size=len(data),
        )


def _parse_s3_uri(uri: str) -> Tuple[str, str, str]:
    parsed = urlparse(uri)
    if parsed.scheme != "s3":
        raise InvalidExternalURIError(f"Unsupported URI scheme: {parsed.scheme!r}")
    netloc = parsed.netloc
    if not netloc:
        raise InvalidExternalURIError(f"S3 URI missing bucket: {uri!r}")
    key = parsed.path.lstrip("/")
    if not key:
        raise InvalidExternalURIError(f"S3 URI missing key: {uri!r}")
    bucket = netloc
    return parsed.netloc, bucket, key


class S3ObjectReader(ExternalObjectReader):
    """
    Reader backed by boto3 S3 client. Requires boto3 to be installed.
    """

    def __init__(
        self,
        *,
        session_kwargs: Optional[Dict[str, str]] = None,
        client_kwargs: Optional[Dict[str, str]] = None,
    ) -> None:
        self._session_kwargs = session_kwargs or {}
        self._client_kwargs = client_kwargs or {}
        try:
            import boto3  # type: ignore
        except ImportError as exc:  # pragma: no cover - optional dependency
            raise ExternalObjectError(
                "boto3 is required for S3ObjectReader. Install boto3 to enable external object access."
            ) from exc
        self._boto3 = boto3
        session = boto3.session.Session(**self._session_kwargs)
        self._client = session.client("s3", **self._client_kwargs)

    def read_bytes(self, uri: str, *, range_bytes: Optional[Tuple[int, int]] = None) -> bytes:
        netloc, bucket, key = _parse_s3_uri(uri)
        params = {"Bucket": bucket, "Key": key}
        if range_bytes is not None:
            start, end = range_bytes
            params["Range"] = f"bytes={start}-{end}"
        try:
            response = self._client.get_object(**params)
        except self._client.exceptions.NoSuchKey as exc:
            raise ExternalObjectNotFoundError(f"S3 object not found: {uri}") from exc
        except Exception as exc:
            raise ExternalObjectError(f"Failed to fetch {uri}: {exc}") from exc
        body = response["Body"]
        data = body.read()
        return data

    def open_stream(self, uri: str) -> BinaryIO:
        netloc, bucket, key = _parse_s3_uri(uri)
        try:
            response = self._client.get_object(Bucket=bucket, Key=key)
        except self._client.exceptions.NoSuchKey as exc:
            raise ExternalObjectNotFoundError(f"S3 object not found: {uri}") from exc
        except Exception as exc:
            raise ExternalObjectError(f"Failed to open stream for {uri}: {exc}") from exc
        return response["Body"]

    def head(self, uri: str) -> ExternalObjectPointer:
        netloc, bucket, key = _parse_s3_uri(uri)
        try:
            response = self._client.head_object(Bucket=bucket, Key=key)
        except self._client.exceptions.NoSuchKey as exc:
            raise ExternalObjectNotFoundError(f"S3 object not found: {uri}") from exc
        except Exception as exc:
            raise ExternalObjectError(f"Failed to head {uri}: {exc}") from exc
        metadata = {
            **{k: str(v) for k, v in response.get("Metadata", {}).items()},
        }
        etag = response.get("ETag")
        size = response.get("ContentLength")
        checksum = metadata.get("checksum") or ""
        content_type = response.get("ContentType")
        version_id = response.get("VersionId")
        return ExternalObjectPointer(
            uri=uri,
            checksum=checksum,
            content_type=content_type,
            size=size,
            etag=etag.strip('"') if isinstance(etag, str) else etag,
            version_id=version_id,
            metadata=metadata,
        )
