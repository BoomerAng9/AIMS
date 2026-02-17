from __future__ import annotations

import itertools
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

from card_box_core.structures import Card, CardBox


class InMemoryStorageAdapter:
    """Minimal synchronous storage adapter used by unit tests."""

    def __init__(self) -> None:
        self._id_gen = itertools.count(1)
        self._cards: Dict[str, Dict[str, Dict[str, Any]]] = {}
        self._boxes: Dict[str, Dict[str, CardBox]] = {}

        self.sync_tasks: List[Dict[str, Any]] = []
        self.operation_logs: List[Dict[str, Any]] = []
        self.transformations: List[Dict[str, Any]] = []
        self.card_box_logs: List[Dict[str, Any]] = []
        self.api_logs: List[Dict[str, Any]] = []

    def _tenant_cards(self, tenant_id: str) -> Dict[str, Dict[str, Any]]:
        if tenant_id not in self._cards:
            self._cards[tenant_id] = {}
        return self._cards[tenant_id]

    def _tenant_boxes(self, tenant_id: str) -> Dict[str, CardBox]:
        if tenant_id not in self._boxes:
            self._boxes[tenant_id] = {}
        return self._boxes[tenant_id]

    def _new_id(self) -> int:
        return next(self._id_gen)

    def add_card(self, card: Card, tenant_id: str) -> None:
        expires_at = None
        if card.ttl_seconds is not None:
            expires_at = datetime.now(timezone.utc) + timedelta(seconds=card.ttl_seconds)
        self._tenant_cards(tenant_id)[card.card_id] = {
            "card": card,
            "created_seq": self._new_id(),
            "deleted": False,
            "expires_at": expires_at,
        }

    def get_card(self, card_id: str, tenant_id: str) -> Optional[Card]:
        row = self._tenant_cards(tenant_id).get(card_id)
        if row is None or row["deleted"]:
            return None
        return row["card"]

    def list_cards(
        self,
        tenant_id: str,
        *,
        metadata_filters: Optional[Dict[str, Any]] = None,
        limit: Optional[int] = None,
        offset: int = 0,
        include_deleted: bool = False,
    ) -> List[Card]:
        rows = list(self._tenant_cards(tenant_id).values())
        rows.sort(key=lambda item: item["created_seq"], reverse=True)

        result: List[Card] = []
        for row in rows:
            if row["deleted"] and not include_deleted:
                continue
            card = row["card"]
            if metadata_filters and not self._match_metadata(card, metadata_filters):
                continue
            result.append(card)

        if offset:
            result = result[offset:]
        if limit is not None:
            result = result[:limit]
        return result

    def list_cards_by_tool_call_ids(
        self,
        tenant_id: str,
        *,
        tool_call_ids: List[str],
        metadata_filters: Optional[Dict[str, Any]] = None,
        limit: Optional[int] = None,
        include_deleted: bool = False,
    ) -> List[Card]:
        if not tool_call_ids:
            return []
        cards = self.list_cards(
            tenant_id,
            metadata_filters=metadata_filters,
            include_deleted=include_deleted,
        )
        filtered = [card for card in cards if card.tool_call_id in set(tool_call_ids)]
        if limit is not None:
            filtered = filtered[:limit]
        return filtered

    def list_cards_by_ids(
        self,
        tenant_id: str,
        *,
        card_ids: List[str],
        include_deleted: bool = False,
    ) -> List[Card]:
        if not card_ids:
            return []
        result: List[Card] = []
        for card_id in card_ids:
            row = self._tenant_cards(tenant_id).get(card_id)
            if row is None:
                continue
            if row["deleted"] and not include_deleted:
                continue
            result.append(row["card"])
        return result

    def mark_expired_cards_as_deleted(self, tenant_id: str) -> List[Dict[str, Any]]:
        now = datetime.now(timezone.utc)
        deleted: List[Dict[str, Any]] = []
        for card_id, row in self._tenant_cards(tenant_id).items():
            expires_at = row["expires_at"]
            if row["deleted"] or expires_at is None:
                continue
            if expires_at <= now:
                row["deleted"] = True
                deleted.append({"card_id": card_id})
        return deleted

    def add_sync_task(self, card_id: str, tenant_id: str, operation: str) -> None:
        self.sync_tasks.append(
            {
                "task_id": self._new_id(),
                "card_id": card_id,
                "tenant_id": tenant_id,
                "operation": operation,
            }
        )

    def add_operation_log(self, *, tenant_id: str, trace_id: str, strategy_name: str) -> int:
        log_id = self._new_id()
        self.operation_logs.append(
            {
                "log_id": log_id,
                "tenant_id": tenant_id,
                "trace_id": trace_id,
                "strategy_name": strategy_name,
            }
        )
        return log_id

    def add_transformation(self, operation_log_id: int, source_card_id: str, new_card_id: str) -> None:
        self.transformations.append(
            {
                "operation_log_id": operation_log_id,
                "source_card_id": source_card_id,
                "new_card_id": new_card_id,
            }
        )

    def add_card_box_log(
        self,
        *,
        tenant_id: str,
        trace_id: str,
        strategy_name: str,
        strategy_input: Optional[str],
        input_box_snapshot: str,
        output_box_snapshot: str,
    ) -> int:
        box_log_id = self._new_id()
        self.card_box_logs.append(
            {
                "box_log_id": box_log_id,
                "tenant_id": tenant_id,
                "trace_id": trace_id,
                "strategy_name": strategy_name,
                "strategy_input": strategy_input,
                "input_box_snapshot": input_box_snapshot,
                "output_box_snapshot": output_box_snapshot,
            }
        )
        return box_log_id

    def add_api_log(
        self,
        *,
        trace_id: str,
        tenant_id: str,
        api_type: str,
        endpoint: str,
        request_data: Optional[str],
        response_data: Optional[str],
    ) -> int:
        api_log_id = self._new_id()
        self.api_logs.append(
            {
                "api_log_id": api_log_id,
                "trace_id": trace_id,
                "tenant_id": tenant_id,
                "api_type": api_type,
                "endpoint": endpoint,
                "request_data": request_data,
                "response_data": response_data,
            }
        )
        return api_log_id

    def list_api_logs(self, tenant_id: str, *, trace_id: Optional[str] = None) -> List[Dict[str, Any]]:
        rows = [row for row in self.api_logs if row["tenant_id"] == tenant_id]
        if trace_id is not None:
            rows = [row for row in rows if row["trace_id"] == trace_id]
        return sorted(rows, key=lambda item: item["api_log_id"], reverse=True)

    def get_source_cards(self, *, tenant_id: str, trace_id: str, card_id: str) -> List[Card]:
        log_ids = {
            log["log_id"]
            for log in self.operation_logs
            if log["tenant_id"] == tenant_id and log["trace_id"] == trace_id
        }
        source_ids = [
            rel["source_card_id"]
            for rel in self.transformations
            if rel["operation_log_id"] in log_ids and rel["new_card_id"] == card_id
        ]
        source_cards: List[Card] = []
        for source_id in source_ids:
            card = self.get_card(source_id, tenant_id)
            if card is not None:
                source_cards.append(card)
        return source_cards

    def save_card_box(self, box: CardBox, tenant_id: str) -> str:
        if box.box_id is None:
            box.box_id = f"box-{self._new_id()}"
        self._tenant_boxes(tenant_id)[box.box_id] = box.clone()
        return box.box_id

    def load_card_box(self, box_id: str, tenant_id: str) -> Optional[CardBox]:
        box = self._tenant_boxes(tenant_id).get(box_id)
        return box.clone() if box is not None else None

    @staticmethod
    def _match_metadata(card: Card, metadata_filters: Dict[str, Any]) -> bool:
        for key, value in metadata_filters.items():
            actual = card.metadata.get(key)
            if value is None:
                if actual is not None:
                    return False
            elif str(actual) != str(value):
                return False
        return True


def build_test_storage_adapter() -> InMemoryStorageAdapter:
    return InMemoryStorageAdapter()
