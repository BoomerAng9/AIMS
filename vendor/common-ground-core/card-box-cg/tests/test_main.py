import io
import json
import unittest
import uuid6
from unittest.mock import patch

from card_box_core import (
    Card,
    CardBox,
    CardStore,
    ContextEngine,
    ExtractCodeStrategy,
    InlineTextFileContentStrategy,
    MultiFileContent,
    PdfFileContent,
    TextContent,
    TextFileContent,
    ToolContent,
    ToolResultContent,
)
from card_box_core.structures import InvalidCardContentError
from card_box_core.utils import FileReadError
from tests.support import build_test_storage_adapter


class TestCardCoreBasics(unittest.TestCase):
    def setUp(self) -> None:
        self.storage_adapter = build_test_storage_adapter()
        self.tenant_id = "tenant-core"
        self.card_store = CardStore(storage=self.storage_adapter, tenant_id=self.tenant_id)

    def test_card_creation_and_immutability(self) -> None:
        card1 = Card(
            card_id="fixed-id-1",
            content=TextContent(text="original content"),
            metadata={"role": "user", "tag": "v1"},
        )

        card2 = card1.update(
            content=TextContent(text="updated content"),
            metadata_update={"status": "processed", "tag": "v2"},
        )

        self.assertNotEqual(card1.card_id, card2.card_id)
        self.assertEqual(card1.text(), "original content")
        self.assertEqual(card1.metadata, {"role": "user", "tag": "v1"})

        self.assertEqual(card2.text(), "updated content")
        self.assertEqual(card2.metadata["role"], "user")
        self.assertEqual(card2.metadata["status"], "processed")
        self.assertEqual(card2.metadata["tag"], "v2")

    def test_card_store_add_and_get(self) -> None:
        card = Card(card_id="fixed-id-2", content=TextContent(text="some data"))
        self.card_store.add(card)
        retrieved = self.card_store.get(card.card_id)
        self.assertEqual(retrieved, card)

    def test_card_serialization_round_trip_with_multifile(self) -> None:
        original = Card(
            card_id="serialize-card-1",
            content=MultiFileContent(
                files=[
                    PdfFileContent(
                        uri="s3://demo-bucket/doc1.pdf",
                        checksum="sha256:111",
                        content_type="application/pdf",
                    ),
                    PdfFileContent(
                        uri="s3://demo-bucket/doc2.pdf",
                        checksum="sha256:222",
                        content_type="application/pdf",
                    ),
                ]
            ),
            metadata={"description": "multi-file"},
        )

        restored = Card.from_dict(original.to_dict())
        self.assertEqual(original.content, restored.content)
        self.assertEqual(original.metadata, restored.metadata)
        self.assertEqual(original.card_id, restored.card_id)

    def test_tool_result_validation(self) -> None:
        with self.assertRaises(InvalidCardContentError):
            ToolResultContent(
                status="failed",
                after_execution="suspend",
                result=None,
                error="not an envelope",
            )

        with self.assertRaises(InvalidCardContentError):
            ToolResultContent(
                status="success",
                after_execution="suspend",
                result={1, 2, 3},
                error=None,
            )

        with self.assertRaises(InvalidCardContentError):
            ToolResultContent(
                status="success",
                after_execution="suspend",
                result="ok",
                error={"code": "unexpected_error", "message": "should be None"},
            )


class TestContextEngine(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self) -> None:
        self.storage_adapter = build_test_storage_adapter()
        self.tenant_id = "tenant-engine"

    async def test_extract_code_strategy_transform(self) -> None:
        engine = ContextEngine(
            trace_id=str(uuid6.uuid7()),
            tenant_id=self.tenant_id,
            storage_adapter=self.storage_adapter,
            history_level="full",
        )

        source = Card(
            content=TextContent(
                text=(
                    "before\n"
                    "```python\n"
                    "def fibonacci(n):\n"
                    "    return n if n < 2 else fibonacci(n-1) + fibonacci(n-2)\n"
                    "```\n"
                    "after"
                )
            ),
            metadata={"role": "assistant"},
        )
        engine.card_store.add(source)

        box = CardBox(box_id="box-source", card_ids=[source.card_id])
        result_box = await engine.transform(box, strategy_input_pairs=[(ExtractCodeStrategy(), None)])

        cards = [engine.card_store.get(cid) for cid in result_box.card_ids]
        cards = [card for card in cards if card is not None]
        self.assertEqual(len(cards), 2)
        self.assertEqual(result_box.parent_ids, ["box-source"])

        code_cards = [card for card in cards if card.metadata.get("type") == "code"]
        text_cards = [card for card in cards if card.metadata.get("type") != "code"]
        self.assertEqual(len(code_cards), 1)
        self.assertEqual(len(text_cards), 1)
        self.assertIn("def fibonacci", code_cards[0].text())

    async def test_to_api_tool_and_tool_result_projection(self) -> None:
        engine = ContextEngine(
            trace_id=str(uuid6.uuid7()),
            tenant_id=self.tenant_id,
            storage_adapter=self.storage_adapter,
        )

        box = CardBox()

        tool_definition = {
            "type": "function",
            "function": {
                "name": "calculate_fibonacci",
                "description": "Calculates the nth Fibonacci number.",
                "parameters": {
                    "type": "object",
                    "properties": {"n": {"type": "integer"}},
                    "required": ["n"],
                },
            },
        }
        tool_def_card = Card(content=ToolContent(tools=[tool_definition]))
        user_card = Card(content=TextContent(text="what is fib(10)?"), metadata={"role": "user"})
        tool_result = Card(
            content=ToolResultContent(
                status="success",
                after_execution="suspend",
                result={"value": 55},
                error=None,
            ),
            tool_call_id="call-1",
            metadata={"role": "tool"},
        )

        for card in (tool_def_card, user_card, tool_result):
            engine.card_store.add(card)
            box.add(card.card_id)

        api_request, source_ids = await engine.to_api(box)

        self.assertEqual(source_ids, box.card_ids)
        self.assertIn("tools", api_request)
        self.assertEqual(api_request["tools"][0]["function"]["name"], "calculate_fibonacci")
        self.assertEqual(len(api_request["messages"]), 2)
        self.assertEqual(api_request["messages"][0]["role"], "user")
        self.assertEqual(json.loads(api_request["messages"][1]["content"]), {"value": 55})

    @patch("card_box_core.strategies.read_file_uri", side_effect=FileReadError("Failed to read from URI"))
    @patch("sys.stdout", new_callable=io.StringIO)
    async def test_transform_with_failing_strategy(self, mock_stdout, _mock_read) -> None:
        engine = ContextEngine(
            trace_id=str(uuid6.uuid7()),
            tenant_id=self.tenant_id,
            storage_adapter=self.storage_adapter,
            history_level="full",
        )

        failing_uri = "s3://non-existent-bucket/this-file-does-not-exist.txt"
        card = Card(
            content=TextFileContent(uri=failing_uri, checksum="sha256:dummy"),
            metadata={"role": "user"},
        )
        engine.card_store.add(card)

        box = CardBox(card_ids=[card.card_id])
        result_box = await engine.transform(box, [(InlineTextFileContentStrategy(), None)])

        output = mock_stdout.getvalue()
        self.assertIn("InlineTextFileContentStrategy", output)
        self.assertIn(card.card_id, output)
        self.assertEqual(result_box.card_ids, [card.card_id])


if __name__ == "__main__":
    unittest.main()
