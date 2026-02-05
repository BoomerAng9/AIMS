

from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple, Union

from pydantic import BaseModel, field_validator, model_validator


class Image(BaseModel):
    url: Optional[str] = None  # Remote location for image
    filepath: Optional[Union[Path, str]] = None  # Absolute local location for image
    content: Optional[Any] = None  # Actual image bytes content
    format: Optional[str] = None  # E.g. `png`, `jpeg`, `webp`, `gif`
    detail: Optional[str] = (
        None  # low, medium, high or auto (per OpenAI spec https://platform.openai.com/docs/guides/vision?lang=node#low-or-high-fidelity-image-understanding)
    )
    id: Optional[str] = None

    @property
    def image_url_content(self) -> Optional[bytes]:
        import httpx

        if self.url:
            return httpx.get(self.url).content
        else:
            return None

    @model_validator(mode="before")
    def validate_data(cls, data: Any):
        """
        Ensure that exactly one of `url`, `filepath`, or `content` is provided.
        Also converts content to bytes if it's a string.
        """
        # Extract the values from the input data
        url = data.get("url")
        filepath = data.get("filepath")
        content = data.get("content")

        # Convert and decompress content to bytes if it's a string
        if content and isinstance(content, str):
            import base64

            try:
                import zlib

                decoded_content = base64.b64decode(content)
                content = zlib.decompress(decoded_content)
            except Exception:
                content = base64.b64decode(content).decode("utf-8")
        data["content"] = content

        # Count how many fields are set (not None)
        count = len([field for field in [url, filepath, content] if field is not None])

        if count == 0:
            raise ValueError("One of `url`, `filepath`, or `content` must be provided.")
        elif count > 1:
            raise ValueError("Only one of `url`, `filepath`, or `content` should be provided.")

        return data

    def to_dict(self) -> Dict[str, Any]:
        import base64
        import zlib

        response_dict = {
            "content": base64.b64encode(
                zlib.compress(self.content) if isinstance(self.content, bytes) else self.content.encode("utf-8")
            ).decode("utf-8")
            if self.content
            else None,
            "filepath": self.filepath,
            "url": self.url,
            "detail": self.detail,
        }

        return {k: v for k, v in response_dict.items() if v is not None}


class File(BaseModel):
    url: Optional[str] = None
    filepath: Optional[Union[Path, str]] = None
    # Raw bytes content of a file
    content: Optional[Any] = None
    mime_type: Optional[str] = None
    # External file object (e.g. GeminiFile, must be a valid object as expected by the model you are using)
    external: Optional[Any] = None

    @model_validator(mode="before")
    @classmethod
    def check_at_least_one_source(cls, data):
        """Ensure at least one of url, filepath, or content is provided."""
        if isinstance(data, dict) and not any(data.get(field) for field in ["url", "filepath", "content", "external"]):
            raise ValueError("At least one of url, filepath, content or external must be provided")
        return data

    @field_validator("mime_type")
    @classmethod
    def validate_mime_type(cls, v):
        """Validate that the mime_type is one of the allowed types."""
        if v is not None and v not in cls.valid_mime_types():
            raise ValueError(f"Invalid MIME type: {v}. Must be one of: {cls.valid_mime_types()}")
        return v

    @classmethod
    def valid_mime_types(cls) -> List[str]:
        return [
            "application/pdf",
            "application/x-javascript",
            "text/javascript",
            "application/x-python",
            "text/x-python",
            "text/plain",
            "text/html",
            "text/css",
            "text/md",
            "text/csv",
            "text/xml",
            "text/rtf",
        ]

    @property
    def file_url_content(self) -> Optional[Tuple[bytes, str]]:
        import httpx

        if self.url:
            response = httpx.get(self.url)
            content = response.content
            mime_type = response.headers.get("Content-Type", "").split(";")[0]
            return content, mime_type
        else:
            return None
