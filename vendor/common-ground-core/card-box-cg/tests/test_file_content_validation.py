import datetime as dt
import unittest

from card_box_core.services import CardStore
from card_box_core.structures import (
    Card,
    FileContent,
    ImageFileContent,
    InvalidCardContentError,
    MultiFileContent,
    PreviewImage,
)
from tests.support import build_test_storage_adapter


class FileContentValidationTests(unittest.TestCase):
    def test_rejects_local_file_uri(self) -> None:
        with self.assertRaises(InvalidCardContentError):
            FileContent(uri="file:///tmp/demo.pdf", checksum="sha256:deadbeef")

    def test_requires_checksum(self) -> None:
        with self.assertRaises(InvalidCardContentError):
            FileContent(uri="s3://bucket/key", checksum="")

    def test_negative_size_rejected(self) -> None:
        with self.assertRaises(InvalidCardContentError):
            FileContent(uri="s3://bucket/key", checksum="sha256:dead", size=-10)

    def test_multifile_requires_non_empty(self) -> None:
        with self.assertRaises(InvalidCardContentError):
            MultiFileContent(files=[])

    def test_serializes_and_restores_expiry(self) -> None:
        expires = dt.datetime.now(dt.timezone.utc).replace(microsecond=0)
        content = FileContent(
            uri="s3://bucket/demo.txt",
            checksum="sha256:abc123",
            content_type="text/plain",
            expires_at=expires,
        )
        card = Card(content=content)
        payload = card.to_dict()
        self.assertIsInstance(payload["content"]["expires_at"], str)
        restored = Card.from_dict(payload)
        self.assertIsInstance(restored.content, FileContent)
        self.assertEqual(restored.content.expires_at, expires)

    def test_card_store_validates_before_persist(self) -> None:
        adapter = build_test_storage_adapter()
        store = CardStore(storage=adapter, tenant_id="validator")
        content = FileContent(uri="s3://bucket/key", checksum="sha256:1234")
        card = Card(content=content)

        # Mutate frozen object intentionally to emulate data drift.
        object.__setattr__(content, "uri", "file:///tmp/hacked.pdf")

        with self.assertRaises(InvalidCardContentError):
            store.add(card)

    def test_https_presigned_uri_allowed(self) -> None:
        content = FileContent(
            uri="https://example.com/object?token=123",
            checksum="sha256:feedface",
            content_type="application/octet-stream",
        )
        card = Card(content=content)
        self.assertEqual(card.content.uri, content.uri)

    def test_preview_round_trip_serialization(self) -> None:
        preview = PreviewImage(
            uri="s3://bucket/previews/demo.png",
            content_type="image/png",
            width=320,
            height=200,
            size=2048,
            checksum="sha256:preview",
        )
        content = ImageFileContent(
            uri="s3://bucket/originals/demo.png",
            checksum="sha256:orig",
            width=1024,
            height=768,
            preview=preview,
        )
        restored = Card.from_dict(Card(content=content).to_dict())
        self.assertIsInstance(restored.content, ImageFileContent)
        self.assertIsNotNone(restored.content.preview)
        assert restored.content.preview is not None
        self.assertEqual(restored.content.preview.width, 320)
        self.assertEqual(restored.content.preview.uri, preview.uri)

    def test_preview_validation_rejects_invalid_uri(self) -> None:
        with self.assertRaises(InvalidCardContentError):
            PreviewImage(uri="file:///tmp/preview.png", width=100, height=100)


if __name__ == "__main__":
    unittest.main()
