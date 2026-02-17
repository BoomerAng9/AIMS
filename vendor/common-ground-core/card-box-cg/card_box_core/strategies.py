from abc import ABC, abstractmethod
import base64
import re
from typing import Any, Dict, NamedTuple, List, Optional
from urllib.parse import urlparse

from card_box_core.structures import Card, CardBox, TextContent, PdfFileContent, TextFileContent
from card_box_core.services import CardStore
from card_box_core.adapters import FileStorageAdapter
from card_box_core.a2aclient import A2AHelperClient
from card_box_core.config import PdfToTextStrategySettings, settings
from card_box_core.external.object_store import (
    ExternalObjectPointer,
    ExternalObjectReader,
    ExternalObjectError,
)
from card_box_core.utils import read_file_uri, FileReadError


class Input(ABC):
    """
    Abstract base class for optional external inputs used by strategies.
    """
    @abstractmethod
    def to_string(self) -> str:
        """Convert an Input object to string form for logging or debugging."""
        pass


class TransformationError(NamedTuple):
    source_card_id: str
    message: str


class TransformationResult(NamedTuple):
    new_card_box: 'CardBox'
    relationship_map: Dict[str, List[str]]
    errors: List[TransformationError]


class Strategy(ABC):
    """
    Abstract base class for all strategies.
    """
    @abstractmethod
    async def apply(self, card_box: CardBox, card_store: CardStore, input: Optional['Input'] = None, fs: Optional[FileStorageAdapter] = None) -> "TransformationResult":
        """
        Apply a strategy to a CardBox and return a TransformationResult.

        Args:
            card_box: Input CardBox.
            card_store: CardStore instance used to access Card objects.
            input: Optional Input object for strategy-specific parameters.

        Returns:
            A TransformationResult including a new CardBox and relationship map.
        """
        pass


class ExtractCodeStrategy(Strategy):
    """
    Strategy that extracts code blocks from card text and creates new cards.
    """
    async def apply(self, card_box: CardBox, card_store: CardStore, input: Optional['Input'] = None, fs: Optional[FileStorageAdapter] = None) -> "TransformationResult":
        """
        Iterate through CardBox items and extract code blocks from text cards.
        The original card is replaced by a text-only card plus one card per code block.
        """
        print("ExtractCodeStrategy: Applying strategy...")
        new_card_box = CardBox()
        relationship_map: Dict[str, List[str]] = {}
        errors: List[TransformationError] = []
        
        for card_id in card_box.card_ids:
            original_card = card_store.get(card_id)
            if not original_card:
                errors.append(TransformationError(source_card_id=card_id, message="Card not found in CardStore"))
                continue
            
            if not isinstance(original_card.content, TextContent):
                new_card_box.add(card_id)
                relationship_map[original_card.card_id] = [original_card.card_id]
                continue

            content = original_card.text()
            code_blocks = re.findall(r"```python\n(.*?)\n```", content, re.DOTALL)
            
            if not code_blocks:
                new_card_box.add(card_id)
                relationship_map[original_card.card_id] = [original_card.card_id]
                continue

            new_cards_for_source: List[str] = []
            remaining_text = re.sub(r"```python\n.*?\n```", "", content, flags=re.DOTALL).strip()
            
            if remaining_text:
                text_card = original_card.update(content=TextContent(text=remaining_text))
                card_store.add(text_card)
                new_card_box.add(text_card.card_id)
                new_cards_for_source.append(text_card.card_id)

            for code in code_blocks:
                code_card = Card(
                    content=TextContent(text=code.strip()),
                    metadata={'type': 'code', 'language': 'python', 'source_card_id': original_card.card_id}
                )
                card_store.add(code_card)
                new_card_box.add(code_card.card_id)
                new_cards_for_source.append(code_card.card_id)
            
            relationship_map[original_card.card_id] = new_cards_for_source
        
        return TransformationResult(new_card_box=new_card_box, relationship_map=relationship_map, errors=errors)


class PdfToTextStrategyInput(Input):
    """
    Concrete input model for PdfToTextStrategy.
    """
    def __init__(self, max_tokens: int):
        self.max_tokens = max_tokens

    def to_string(self) -> str:
        return f"PdfToTextStrategyInput(max_tokens={self.max_tokens})"


class PdfToTextStrategy(Strategy):
    """
    Strategy that sends PDF cards to an A2A pdf-to-text service
    and converts the returned text into a new Card.
    """
    def __init__(
        self,
        config: PdfToTextStrategySettings = settings.PDF_TO_TEXT_STRATEGY,
        *,
        object_reader: Optional[ExternalObjectReader] = None,
        a2a_client: Optional[A2AHelperClient] = None,
    ):
        self.object_reader = object_reader
        self.a2a_client = a2a_client or A2AHelperClient(base_url=config.a2a_base_url)

    async def apply(
        self,
        card_box: CardBox,
        card_store: CardStore,
        input: Optional['Input'] = None,
        fs: Optional[FileStorageAdapter] = None,
    ) -> "TransformationResult":
        new_card_box = CardBox()
        relationship_map: Dict[str, List[str]] = {}
        errors: List[TransformationError] = []
        strategy_input = input if isinstance(input, PdfToTextStrategyInput) else None

        for card_id in card_box.card_ids:
            original_card = card_store.get(card_id)
            if not original_card:
                errors.append(TransformationError(source_card_id=card_id, message="Card not found in CardStore"))
                continue

            if self._is_pdf_card(original_card):
                try:
                    extracted = await self._extract_pdf_card(original_card, strategy_input)
                    if extracted is None:
                        raise Exception("PDF text extraction returned None")

                    text_card = original_card.update(
                        content=TextContent(text=extracted),
                        metadata_update={
                            "mime_type": "text/plain",
                            "source_strategy": "PdfToTextStrategy",
                            "source_card_id": original_card.card_id,
                        },
                    )
                    card_store.add(text_card)
                    new_card_box.add(text_card.card_id)
                    relationship_map[original_card.card_id] = [text_card.card_id]
                except Exception as e:
                    errors.append(TransformationError(source_card_id=card_id, message=f"PDF extraction failed: {e}"))
                    new_card_box.add(card_id)
                    relationship_map[card_id] = [card_id]
            else:
                new_card_box.add(card_id)
                relationship_map[card_id] = [card_id]

        return TransformationResult(new_card_box=new_card_box, relationship_map=relationship_map, errors=errors)

    def _is_pdf_card(self, card: Card) -> bool:
        if isinstance(card.content, PdfFileContent):
            return True
        mime = card.metadata.get("mime_type")
        return isinstance(card.content, TextContent) and mime == "application/pdf" and card.metadata.get("encoding") == "base64"

    async def _extract_pdf_card(
        self,
        card: Card,
        strategy_input: Optional[PdfToTextStrategyInput],
    ) -> Optional[str]:
        # ... (implementation remains the same, but now it can raise exceptions)
        inline_objects: List[Dict[str, Any]] = []
        pointers: List[ExternalObjectPointer] = []

        if isinstance(card.content, PdfFileContent):
            pointer = ExternalObjectPointer(
                uri=card.content.uri,
                checksum=card.content.checksum,
                content_type=card.content.content_type,
                size=card.content.size,
                etag=card.content.etag,
                expires_at=card.content.expires_at,
            )
            reader = self.object_reader
            if reader is None:
                raise RuntimeError("PdfToTextStrategy requires an ExternalObjectReader when processing FileContent cards.")
            pdf_bytes = reader.read_bytes(pointer.uri)
            inline_objects.append(
                {
                    "uri": pointer.uri,
                    "encoding": "base64",
                    "mime_type": pointer.content_type or card.metadata.get("mime_type") or "application/pdf",
                    "content": base64.b64encode(pdf_bytes).decode("ascii"),
                }
            )
            pointers.append(pointer)
        else:
            raw = card.text()
            base64.b64decode(raw)
            inline_objects.append(
                {
                    "uri": f"inline://{card.card_id}",
                    "encoding": "base64",
                    "mime_type": card.metadata.get("mime_type") or "application/pdf",
                    "content": card.text(),
                }
            )

        metadata: Dict[str, Any] = {"source_card_id": card.card_id}
        if strategy_input:
            metadata["max_tokens"] = strategy_input.max_tokens

        return await self.a2a_client.send_card(
            card=card,
            pointers=pointers,
            inline_objects=inline_objects,
            metadata=metadata,
        )


class InlineTextFileContentStrategy(Strategy):
    """
    A strategy to convert TextFileContent cards into TextContent cards
    by downloading the content from the URI.
    """

    def __init__(self):
        pass

    async def apply(
        self,
        card_box: CardBox,
        card_store: CardStore,
        input: Optional["Input"] = None,
        fs: Optional[FileStorageAdapter] = None,
    ) -> "TransformationResult":
        new_card_box = CardBox()
        relationship_map: Dict[str, List[str]] = {}
        errors: List[TransformationError] = []

        for card_id in card_box.card_ids:
            original_card = card_store.get(card_id)
            if not original_card:
                errors.append(TransformationError(source_card_id=card_id, message="Card not found in CardStore"))
                continue

            if isinstance(original_card.content, TextFileContent):
                try:
                    text_content = self._inline_text_file_card(original_card)
                    new_card = original_card.update(
                        content=TextContent(text=text_content),
                        metadata_update={
                            "source_strategy": "InlineTextFileContentStrategy",
                            "source_card_id": original_card.card_id,
                        },
                    )
                    card_store.add(new_card)
                    new_card_box.add(new_card.card_id)
                    relationship_map[original_card.card_id] = [new_card.card_id]
                except (FileReadError, UnicodeDecodeError) as e:
                    errors.append(TransformationError(source_card_id=card_id, message=str(e)))
                    new_card_box.add(card_id)
                    relationship_map[card_id] = [card_id]
            else:
                new_card_box.add(card_id)
                relationship_map[card_id] = [card_id]

        return TransformationResult(new_card_box=new_card_box, relationship_map=relationship_map, errors=errors)

    def _inline_text_file_card(self, card: Card) -> str:
        """
        Reads the content of a TextFileContent card from its URI.
        Raises FileReadError or UnicodeDecodeError on failure.
        """
        if not isinstance(card.content, TextFileContent):
            raise TypeError("Card content is not TextFileContent")

        uri = card.content.uri
        content_bytes = read_file_uri(uri)
        return content_bytes.decode("utf-8")
