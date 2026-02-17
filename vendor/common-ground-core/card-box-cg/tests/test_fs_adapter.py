import os
import tempfile
import unittest
from pathlib import Path

from card_box_core.adapters import LocalFileStorageAdapter


class TestLocalFileStorageAdapter(unittest.TestCase):
    def setUp(self):
        self.adapter = LocalFileStorageAdapter()

    def test_read_plain_path(self):
        with tempfile.TemporaryDirectory() as tmp:
            p = Path(tmp) / "sample.bin"
            data = b"hello\x00world"
            p.write_bytes(data)

            out = self.adapter.read_file(str(p))
            self.assertEqual(out, data)

    def test_read_file_uri(self):
        with tempfile.TemporaryDirectory() as tmp:
            p = Path(tmp) / "file with space.txt"
            data = b"abc123\n"
            p.write_bytes(data)

            uri = p.as_uri()  # file:// URI with percent-encoding
            out = self.adapter.read_file(uri)
            self.assertEqual(out, data)

    def test_nonexistent_path_raises(self):
        with tempfile.TemporaryDirectory() as tmp:
            missing = Path(tmp) / "nope.bin"
            with self.assertRaises(FileNotFoundError):
                self.adapter.read_file(str(missing))

    def test_directory_path_raises(self):
        with tempfile.TemporaryDirectory() as tmp:
            # Passing the directory itself should raise
            with self.assertRaises(IsADirectoryError):
                self.adapter.read_file(tmp)

    def test_unsupported_scheme_raises(self):
        with self.assertRaises(ValueError):
            self.adapter.read_file("s3://bucket/key")


if __name__ == "__main__":
    unittest.main()

