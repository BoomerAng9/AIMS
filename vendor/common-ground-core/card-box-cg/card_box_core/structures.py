import json
import uuid6
from abc import ABC
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Union, TYPE_CHECKING, Tuple
from urllib.parse import urlparse

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator, ValidationError

from card_box_core.config import settings


if TYPE_CHECKING:  # pragma: no cover - only used for type checking
    from card_box_core.services import CardStore


class InvalidCardContentError(ValueError):
    """Raised when card content violates external storage constraints."""


def _allowed_uri_schemes() -> List[str]:
    schemes = settings.EXTERNAL_STORAGE_ALLOWED_URI_SCHEMES or []
    # Normalize to lowercase unique list while preserving order
    seen = set()
    normalized: List[str] = []
    for scheme in schemes:
        lower = scheme.lower()
        if lower and lower not in seen:
            seen.add(lower)
            normalized.append(lower)
    return normalized or ["s3", "https"]


def validate_external_uri(uri: str) -> None:
    """
    Validate that the provided URI adheres to supported external storage schemes.
    Currently supports S3 URIs (including localhost form) and HTTPS presigned URLs.
    """
    if not uri or not isinstance(uri, str):
        raise InvalidCardContentError("FileContent.uri must be a non-empty string.")

    parsed = urlparse(uri)
    scheme = parsed.scheme.lower()
    allowed = _allowed_uri_schemes()
    if scheme not in allowed:
        raise InvalidCardContentError(
            f"Unsupported URI scheme '{parsed.scheme}'. Allowed schemes: {', '.join(allowed)}."
        )

    if scheme == "s3":
        netloc = parsed.netloc
        if not netloc:
            raise InvalidCardContentError(f"S3 URI missing bucket segment: {uri!r}")
        path = parsed.path.lstrip("/")
        if netloc == "localhost":
            # Expect bucket/key encoded inside path
            if not path or "/" not in path:
                raise InvalidCardContentError(f"S3 localhost URI must include bucket and key: {uri!r}")
            bucket, key = path.split("/", 1)
            if not bucket or not key:
                raise InvalidCardContentError(f"S3 localhost URI must include bucket and key: {uri!r}")
        else:
            if not path:
                raise InvalidCardContentError(f"S3 URI missing object key: {uri!r}")
    elif scheme in ("https", "http"):
        # For presigned URLs we require host + path
        if not parsed.netloc:
            raise InvalidCardContentError(f"HTTPS URI must include host: {uri!r}")
        if not parsed.path or parsed.path == "/":
            raise InvalidCardContentError(f"HTTPS URI must include path component: {uri!r}")
    else:
        raise InvalidCardContentError(
            f"Unsupported URI scheme '{parsed.scheme}'. Allowed schemes: {', '.join(allowed)}."
        )


def _normalize_datetime(value: Optional[datetime]) -> Optional[datetime]:
    if value is None:
        return None
    if not isinstance(value, datetime):
        raise InvalidCardContentError("expires_at must be a datetime instance when provided.")
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


def _to_serializable(value: Any) -> Any:
    if isinstance(value, datetime):
        dt_value = _normalize_datetime(value)
        assert dt_value is not None
        return dt_value.isoformat()
    if isinstance(value, list):
        return [_to_serializable(v) for v in value]
    if isinstance(value, dict):
        return {k: _to_serializable(v) for k, v in value.items()}
    return value


class PreviewImage(BaseModel):
    """Represents a generated preview image for any FileContent."""

    model_config = ConfigDict(frozen=True, extra="forbid")

    uri: str
    content_type: Optional[str] = None
    width: Optional[int] = None
    height: Optional[int] = None
    size: Optional[int] = None
    checksum: Optional[str] = None
    etag: Optional[str] = None
    source_frame_ts: Optional[float] = None

    def __init__(self, **data: Any) -> None:
        try:
            super().__init__(**data)
        except ValidationError as exc:
            raise InvalidCardContentError(str(exc)) from exc

    @model_validator(mode="after")
    def _validate_preview(self) -> "PreviewImage":
        _validate_preview_image(self)
        return self


def _validate_preview_image(preview: "PreviewImage") -> None:
    validate_external_uri(preview.uri)
    for dim_name, value in (("width", preview.width), ("height", preview.height)):
        if value is not None and value <= 0:
            raise InvalidCardContentError(f"PreviewImage.{dim_name} must be positive when provided.")
    if preview.size is not None and preview.size < 0:
        raise InvalidCardContentError("PreviewImage.size cannot be negative.")
    if preview.source_frame_ts is not None and preview.source_frame_ts < 0:
        raise InvalidCardContentError("PreviewImage.source_frame_ts cannot be negative.")
    if preview.checksum is not None and not isinstance(preview.checksum, str):
        raise InvalidCardContentError("PreviewImage.checksum must be a string when provided.")


def _validate_card_content(content: Any) -> None:
    if isinstance(content, FileContent):
        if not content.checksum or not isinstance(content.checksum, str):
            raise InvalidCardContentError("FileContent.checksum must be a non-empty string.")
        validate_external_uri(content.uri)
        if content.size is not None and content.size < 0:
            raise InvalidCardContentError("FileContent.size cannot be negative.")
        if content.preview is not None:
            _validate_preview_image(content.preview)
        if isinstance(content, PdfFileContent):
            if content.page_count is not None and content.page_count < 0:
                raise InvalidCardContentError("PdfFileContent.page_count cannot be negative.")
        if isinstance(content, ImageFileContent):
            for dim_name, value in (("width", content.width), ("height", content.height)):
                if value is not None and value <= 0:
                    raise InvalidCardContentError(f"ImageFileContent.{dim_name} must be positive when provided.")
        if isinstance(content, VideoFileContent):
            if content.duration_seconds is not None and content.duration_seconds <= 0:
                raise InvalidCardContentError("VideoFileContent.duration_seconds must be positive when provided.")
            for dim_name, value in (("width", content.width), ("height", content.height)):
                if value is not None and value <= 0:
                    raise InvalidCardContentError(f"VideoFileContent.{dim_name} must be positive when provided.")
            if content.bitrate is not None and content.bitrate <= 0:
                raise InvalidCardContentError("VideoFileContent.bitrate must be positive when provided.")
        if isinstance(content, AudioFileContent):
            if content.duration_seconds is not None and content.duration_seconds <= 0:
                raise InvalidCardContentError("AudioFileContent.duration_seconds must be positive when provided.")
            if content.bitrate is not None and content.bitrate <= 0:
                raise InvalidCardContentError("AudioFileContent.bitrate must be positive when provided.")
    elif isinstance(content, MultiFileContent):
        if not content.files:
            raise InvalidCardContentError("MultiFileContent.files cannot be empty.")
        for item in content.files:
            if not isinstance(item, FileContent):
                raise InvalidCardContentError("MultiFileContent requires FileContent entries.")
            _validate_card_content(item)
    elif isinstance(content, Content):
        # Other content types currently do not need extra validation.
        return
    else:
        raise InvalidCardContentError("Card content must be a Content subtype.")


class Content(BaseModel, ABC):
    """Abstract base class for all content types."""

    model_config = ConfigDict(frozen=True, extra="forbid")

    def __init__(self, **data: Any) -> None:
        try:
            super().__init__(**data)
        except ValidationError as exc:
            raise InvalidCardContentError(str(exc)) from exc

    @model_validator(mode="after")
    def _validate_content(self) -> "Content":
        _validate_card_content(self)
        return self


class TextContent(Content):
    """Represents plain text content."""

    text: str


class JsonContent(Content):
    """Represents structured JSON content (dict/list)."""

    data: Union[Dict[str, Any], List[Any]]

    @field_validator("data")
    @classmethod
    def _validate_json_data(cls, value: Any) -> Any:
        if not isinstance(value, (dict, list)):
            raise InvalidCardContentError("JsonContent.data must be a dict or list.")
        return value


class FieldSchema(BaseModel):
    """Represents a single field in a schema."""

    model_config = ConfigDict(frozen=True, extra="forbid")

    name: str
    description: str = ""

    def __init__(self, **data: Any) -> None:
        try:
            super().__init__(**data)
        except ValidationError as exc:
            raise InvalidCardContentError(str(exc)) from exc

    @field_validator("name")
    @classmethod
    def _normalize_name(cls, value: str) -> str:
        name = value.strip() if isinstance(value, str) else ""
        if not name:
            raise InvalidCardContentError("FieldSchema.name must be a non-empty string.")
        return name

    @field_validator("description")
    @classmethod
    def _normalize_description(cls, value: Any) -> str:
        return value.strip() if isinstance(value, str) else str(value)


class FieldsSchemaContent(Content):
    """Represents a list of schema field definitions."""

    fields: List[FieldSchema]


class FileContent(Content):
    """Base class for all file-based content represented by URI.
    It can be used for generic files without a dedicated subtype."""

    uri: str
    checksum: str
    etag: Optional[str] = None
    size: Optional[int] = None
    content_type: Optional[str] = None
    expires_at: Optional[datetime] = None
    preview: Optional[PreviewImage] = None

    @field_validator("expires_at")
    @classmethod
    def _normalize_expires_at(cls, value: Optional[datetime]) -> Optional[datetime]:
        return _normalize_datetime(value)


class ImageFileContent(FileContent):
    """Represents an image file with optional intrinsic metadata."""

    width: Optional[int] = None
    height: Optional[int] = None
    format: Optional[str] = None


class PdfFileContent(FileContent):
    """Represents a PDF file."""

    page_count: Optional[int] = None


class TextFileContent(FileContent):
    """Represents a text file referenced by a URI."""

    pass


class VideoFileContent(FileContent):
    """Represents a video file with optional metadata."""

    duration_seconds: Optional[float] = None
    width: Optional[int] = None
    height: Optional[int] = None
    codec: Optional[str] = None
    bitrate: Optional[int] = None


class AudioFileContent(FileContent):
    """Represents an audio file with optional metadata."""

    duration_seconds: Optional[float] = None
    codec: Optional[str] = None
    bitrate: Optional[int] = None


class ToolContent(Content):
    """Represents a list of tool definitions for an LLM."""

    tools: List[Dict[str, Any]]


class ToolCallContent(Content):
    """Represents a request to call a tool."""

    tool_name: str
    arguments: Dict[str, Any]
    status: str
    target_subject: Optional[str] = None


class ToolResultContent(Content):
    """Represents the result of a tool execution."""

    status: str
    after_execution: str
    result: Optional[Any] = None
    error: Optional[Any] = None

    @field_validator("status")
    @classmethod
    def _normalize_status(cls, value: Any) -> str:
        text = value.strip() if isinstance(value, str) else ""
        if not text:
            raise InvalidCardContentError("ToolResultContent.status must be a non-empty string.")
        return text

    @field_validator("after_execution")
    @classmethod
    def _normalize_after_execution(cls, value: Any) -> str:
        text = value.strip() if isinstance(value, str) else ""
        if text not in ("suspend", "terminate"):
            raise InvalidCardContentError(
                "ToolResultContent.after_execution must be 'suspend' or 'terminate'."
            )
        return text

    @model_validator(mode="after")
    def _validate_result_and_error(self) -> "ToolResultContent":
        # Ensure result is JSON-serializable when provided.
        if self.result is not None:
            try:
                json.dumps(self.result, ensure_ascii=False)
            except Exception as exc:
                raise InvalidCardContentError("ToolResultContent.result must be JSON-serializable.") from exc

        status_value = self.status
        if status_value != "success":
            if not isinstance(self.error, dict):
                raise InvalidCardContentError(
                    "ToolResultContent.error must be a structured envelope when status != success."
                )
            if not self.error.get("code") or not self.error.get("message"):
                raise InvalidCardContentError(
                    "ToolResultContent.error must include 'code' and 'message'."
                )
            try:
                json.dumps(self.error, ensure_ascii=False)
            except Exception as exc:
                raise InvalidCardContentError("ToolResultContent.error must be JSON-serializable.") from exc
        elif self.error is not None:
            raise InvalidCardContentError(
                "ToolResultContent.error must be None when status == success."
            )

        return self


class MultiFileContent(Content):
    """Represents content that consists of multiple files."""

    files: List[FileContent]


def _serialize_content(content: Content) -> Dict[str, Any]:
    payload = content.model_dump(mode="json")
    payload["__type__"] = content.__class__.__name__
    if isinstance(content, MultiFileContent):
        payload["files"] = [_serialize_content(f) for f in content.files]
    return payload


def _deserialize_content(content_data: Any) -> Content:
    """Helper to deserialize content dict to a Content object."""
    if not isinstance(content_data, dict) or "__type__" not in content_data:
        raise TypeError(
            f"Content data must be a dictionary with a '__type__' key, but got {type(content_data)}"
        )

    content_type_name = content_data.get("__type__")
    payload = {k: v for k, v in content_data.items() if k != "__type__"}

    content_classes = {
        "TextContent": TextContent,
        "FileContent": FileContent,
        "ImageFileContent": ImageFileContent,
        "PdfFileContent": PdfFileContent,
        "TextFileContent": TextFileContent,
        "VideoFileContent": VideoFileContent,
        "AudioFileContent": AudioFileContent,
        "JsonContent": JsonContent,
        "FieldsSchemaContent": FieldsSchemaContent,
        "ToolContent": ToolContent,
        "ToolCallContent": ToolCallContent,
        "ToolResultContent": ToolResultContent,
        "MultiFileContent": MultiFileContent,
    }
    content_class = content_classes.get(content_type_name)

    if content_class:
        if content_class is MultiFileContent:
            files = payload.get("files")
            if isinstance(files, list):
                payload["files"] = [
                    _deserialize_content(item) if isinstance(item, dict) else item
                    for item in files
                ]
        if issubclass(content_class, FileContent):
            expires = payload.get("expires_at")
            if isinstance(expires, str):
                payload["expires_at"] = datetime.fromisoformat(expires)
            size_value = payload.get("size")
            if isinstance(size_value, float) and size_value.is_integer():
                payload["size"] = int(size_value)
            preview_data = payload.get("preview")
            if isinstance(preview_data, dict):
                try:
                    payload["preview"] = PreviewImage.model_validate(preview_data)
                except ValidationError as exc:
                    raise InvalidCardContentError(str(exc)) from exc
        try:
            return content_class.model_validate(payload)
        except ValidationError as exc:
            raise InvalidCardContentError(str(exc)) from exc

    raise TypeError(f"Unknown content type '{content_type_name}' for deserialization.")


class Card(BaseModel):
    """
    Card is the core information unit in the system and is designed to be immutable.
    """

    model_config = ConfigDict(frozen=True, extra="forbid")

    content: Content
    tool_calls: Optional[List[Dict]] = None  # Tool calls generated by LLM.
    tool_call_id: Optional[str] = None       # ID associated with tool call result.
    ttl_seconds: Optional[int] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)
    card_id: str = Field(default_factory=lambda: str(uuid6.uuid7()))

    @model_validator(mode="after")
    def _validate_card(self) -> "Card":
        _validate_card_content(self.content)
        return self

    def update(
        self,
        content: Optional[Content] = None,
        tool_calls: Optional[List[Dict]] = None,
        tool_call_id: Optional[str] = None,
        ttl_seconds: Optional[int] = None,
        metadata_update: Optional[Dict[str, Any]] = None,
    ) -> "Card":
        """
        Create a new Card instance with provided changes and merged metadata.

        This follows Card immutability: it does not mutate the original Card,
        but returns a new instance with a new card_id.
        """
        new_content = self.content if content is None else content
        _validate_card_content(new_content)
        new_tool_calls = self.tool_calls if tool_calls is None else tool_calls
        new_tool_call_id = self.tool_call_id if tool_call_id is None else tool_call_id
        new_ttl_seconds = self.ttl_seconds if ttl_seconds is None else ttl_seconds

        new_metadata = self.metadata.copy()
        if metadata_update:
            new_metadata.update(metadata_update)

        return Card(
            content=new_content,
            tool_calls=new_tool_calls,
            tool_call_id=new_tool_call_id,
            ttl_seconds=new_ttl_seconds,
            metadata=new_metadata,
        )

    def validate_for_storage(self) -> None:
        """Explicit validation hook for downstream stores."""
        _validate_card_content(self.content)

    def text(self) -> str:
        """
        Return a textual representation of card content.
        For TextContent, returns text. For other types, returns a descriptive
        representation such as URI.
        """
        if isinstance(self.content, TextContent):
            return self.content.text
        if isinstance(self.content, JsonContent):
            try:
                return json.dumps(self.content.data, ensure_ascii=False)
            except Exception:
                return str(self.content.data)
        if isinstance(self.content, FieldsSchemaContent):
            try:
                payload = [field.model_dump(mode="json") for field in self.content.fields]
                return json.dumps(payload, ensure_ascii=False)
            except Exception:
                return str(self.content.fields)
        if isinstance(self.content, MultiFileContent):
            return ", ".join([f.uri for f in self.content.files])
        if isinstance(self.content, FileContent):
            return self.content.uri
        return str(self.content)

    def to_dict(self) -> Dict[str, Any]:
        """
        Convert Card instance to dictionary form and attach content type metadata
        for polymorphic deserialization.
        """
        card_dict = self.model_dump(mode="json")
        if isinstance(self.content, Content):
            card_dict["content"] = _serialize_content(self.content)
        return _to_serializable(card_dict)

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "Card":
        """
        Create a Card from dictionary data, with proper polymorphic content handling.
        """
        payload = dict(data)
        if "content" in payload:
            payload["content"] = _deserialize_content(payload["content"])
        return cls(**payload)


class CardBox(BaseModel):
    """
    CardBox is an ordered collection of Card references (card_id).
    box_id is the unique identifier in storage; it can be empty for transient boxes.
    parent_ids records direct upstream CardBox IDs for one-hop lineage tracking.
    """

    model_config = ConfigDict(extra="forbid")

    box_id: Optional[str] = None
    parent_ids: Optional[List[str]] = None
    card_ids: List[str] = Field(default_factory=list)

    @staticmethod
    def _normalize_parent_ids(parent_ids: Optional[List[str]]) -> Optional[List[str]]:
        """Remove nulls/dupes and ensure string types."""
        if parent_ids is None:
            return None
        normalized: List[str] = []
        seen = set()
        for pid in parent_ids:
            if pid is None:
                continue
            pid_str = str(pid)
            if pid_str and pid_str not in seen:
                seen.add(pid_str)
                normalized.append(pid_str)
        return normalized if normalized else None

    @model_validator(mode="before")
    @classmethod
    def _normalize_input(cls, data: Any) -> Any:
        if isinstance(data, dict):
            data = dict(data)
            data["parent_ids"] = cls._normalize_parent_ids(data.get("parent_ids"))
            if data.get("card_ids") is None:
                data["card_ids"] = []
        return data

    def add(self, card_id: str):
        """Append one card_id to the end of the list."""
        self.card_ids.append(card_id)

    def insert(self, index: int, card_ids: Union[str, List[str]]):
        """
        Insert one or more card_ids at the given position.
        """
        if isinstance(card_ids, str):
            self.card_ids.insert(index, card_ids)
        else:
            # Slicing assignment to insert multiple items
            self.card_ids[index:index] = card_ids

    def swap(self, index1: int, index2: int):
        """Swap card_ids at two specified indices."""
        self.card_ids[index1], self.card_ids[index2] = self.card_ids[index2], self.card_ids[index1]

    def delete(self, card_id: str):
        """
        Delete one card reference by card_id.
        """
        self.card_ids.remove(card_id)

    def replace(self, old_card_id: str, new_card_id: str):
        """
        Replace an existing card_id with a new card_id.
        """
        index = self.card_ids.index(old_card_id)
        self.card_ids[index] = new_card_id

    def concat(self, other_box: "CardBox") -> "CardBox":
        """
        Concatenate this CardBox with another one and return a new CardBox.
        """
        new_box = CardBox()
        new_box.card_ids = self.card_ids + other_box.card_ids

        def _parents_for(box: "CardBox") -> List[str]:
            if box.box_id:
                return [box.box_id]
            if box.parent_ids:
                return box.parent_ids
            return []

        combined_parents = _parents_for(self) + _parents_for(other_box)
        new_box.parent_ids = CardBox._normalize_parent_ids(combined_parents)
        return new_box

    def to_dict(self) -> Dict[str, Any]:
        """
        Convert CardBox instance to dictionary format.
        """
        result: Dict[str, Any] = {"card_ids": self.card_ids}
        if self.box_id is not None:
            result["box_id"] = self.box_id
        if self.parent_ids is not None:
            result["parent_ids"] = self.parent_ids
        return result

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "CardBox":
        """
        Create CardBox instance from dictionary data.
        """
        instance = cls.model_validate(data)
        instance.card_ids = list(instance.card_ids or [])
        return instance

    def get_hydrated_cards(self, card_store: "CardStore") -> List["Card"]:
        """
        Retrieve all Card objects referenced by this CardBox.
        """
        cards = []
        for card_id in self.card_ids:
            card = card_store.get(card_id)
            if card:
                cards.append(card)
        return cards

    def clone(self) -> "CardBox":
        """
        Creates a new CardBox instance that is a shallow copy of this one.
        """
        cloned = CardBox(box_id=self.box_id, parent_ids=self.parent_ids)
        cloned.card_ids = self.card_ids[:]
        return cloned

    def deep_to_dict(self, card_store: "CardStore") -> Dict[str, Any]:
        """
        Serializes the CardBox and all its referenced Card objects into a single dictionary.
        """
        hydrated_cards = self.get_hydrated_cards(card_store)
        return {
            "hydrated_cards": [card.to_dict() for card in hydrated_cards]
        }

    @classmethod
    def deep_from_dict(cls, data: Dict[str, Any]) -> "Tuple[CardBox, List[Card]]":
        """
        Deserializes a CardBox and its full Card objects from a dictionary.
        """
        hydrated_cards_data = data.get("hydrated_cards", [])
        if not isinstance(hydrated_cards_data, list):
            raise ValueError("Invalid data format: 'hydrated_cards' must be a list.")

        reconstructed_cards = [Card.from_dict(card_data) for card_data in hydrated_cards_data]

        new_box = cls.model_validate({"box_id": data.get("box_id"), "parent_ids": data.get("parent_ids")})
        new_box.card_ids = [card.card_id for card in reconstructed_cards]

        return new_box, reconstructed_cards
