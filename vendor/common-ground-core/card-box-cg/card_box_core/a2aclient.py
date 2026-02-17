from __future__ import annotations

import httpx
from typing import Any, Dict, List, Optional

from card_box_core.structures import Card
from card_box_core.external.object_store import ExternalObjectPointer


class A2AHelperClient:
    """
    Minimal JSON-based A2A helper that posts Card payloads and pointer metadata.
    """

    def __init__(self, base_url: str, *, timeout: float = 600.0):
        self.base_url = base_url
        self.timeout = timeout

    async def send_card(
        self,
        *,
        card: Card,
        pointers: List[ExternalObjectPointer],
        inline_objects: Optional[List[Dict[str, Any]]] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Optional[str]:
        """
        Send a card alongside external pointer metadata to the helper service.

        Args:
            card: The Card object to serialise and transmit.
            pointers: External object pointers associated with the card content.
            inline_objects: Optional inlined payloads (e.g., base64 bytes) for services
                that cannot fetch objects directly.
            metadata: Extra metadata to include in the request body.

        Returns:
            Extracted text returned by the helper service, or None on failure.
        """
        payload: Dict[str, Any] = {
            "card": card.to_dict(),
            "external_objects": [ptr.to_payload() for ptr in pointers],
        }
        if inline_objects:
            payload["inline_objects"] = inline_objects
        if metadata:
            payload["metadata"] = metadata

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    self.base_url,
                    json=payload,
                    headers={"Content-Type": "application/json"},
                )
                response.raise_for_status()
        except Exception as exc:
            print(f"A2AHelperClient: request failed: {exc}")
            return None

        try:
            data = response.json()
        except ValueError:
            print("A2AHelperClient: response was not valid JSON.")
            return None

        if not isinstance(data, dict):
            print("A2AHelperClient: unexpected JSON payload.")
            return None

        # Common response shapes: {"text": "..."} or {"result": {"text": "..."}}
        text = data.get("text") or data.get("content")
        if text is None:
            result = data.get("result")
            if isinstance(result, dict):
                text = result.get("text") or result.get("content")

        if not text:
            print("A2AHelperClient: no text in response.")
            return None

        return str(text)
