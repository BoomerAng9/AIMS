import json
from typing import Dict, List, Optional, Any

from card_box_core.structures import Card, CardBox

class CardStore:
    """
    CardStore acts as the storage-facing interface.
    It keeps no internal state and delegates operations to a storage adapter.
    """
    def __init__(self, storage: Any, tenant_id: str):
        self.storage = storage
        self.tenant_id = tenant_id

    def add(self, card: Card):
        """Persist a Card object through the storage adapter."""
        card.validate_for_storage()
        self.storage.add_card(card, self.tenant_id)
        if card.metadata.get("indexable"):
            self.storage.add_sync_task(card.card_id, self.tenant_id, "index")

    def get(self, card_id: str) -> Optional[Card]:
        """Fetch a Card by card_id."""
        return self.storage.get_card(card_id, self.tenant_id)

    def list(
        self,
        *,
        metadata_filters: Optional[Dict[str, Any]] = None,
        limit: Optional[int] = None,
        offset: int = 0,
        include_deleted: bool = False,
    ) -> List[Card]:
        """List cards with optional filtering and pagination."""
        return self.storage.list_cards(
            self.tenant_id,
            metadata_filters=metadata_filters,
            limit=limit,
            offset=offset,
            include_deleted=include_deleted,
        )

    def get_latest_by_step_and_type(
        self,
        *,
        step_id: str,
        card_type: str,
        include_deleted: bool = False,
    ) -> Optional[Card]:
        """Fetch the most recent card matching step_id + type."""
        if not step_id or not card_type:
            return None
        cards = self.list(
            metadata_filters={"step_id": str(step_id), "type": str(card_type)},
            limit=1,
            include_deleted=include_deleted,
        )
        return cards[0] if cards else None

    def list_tool_results_by_step_and_call_ids(
        self,
        *,
        step_id: str,
        tool_call_ids: List[str],
        include_deleted: bool = False,
    ) -> List[Card]:
        """Fetch tool.result cards by dispatch step_id + tool_call_id list."""
        if not step_id or not tool_call_ids:
            return []
        return self.storage.list_cards_by_tool_call_ids(
            self.tenant_id,
            tool_call_ids=list(tool_call_ids),
            metadata_filters={"step_id": str(step_id), "type": "tool.result"},
            include_deleted=include_deleted,
        )


class CardHistory:
    """Manage card lineage logs via the storage adapter."""
    def __init__(self, storage: Any, tenant_id: str, trace_id: str):
        self.storage = storage
        self.tenant_id = tenant_id
        self.trace_id = trace_id

    def log_operation(self, relationship_map: Dict[str, List[str]], strategy_name: str):
        """
        Persist operation logs and transformation relationships.
        """
        if not relationship_map:
            # Don't log empty transformations
            return

        # 1. Write operation log and get its ID.
        log_id = self.storage.add_operation_log(
            tenant_id=self.tenant_id,
            trace_id=self.trace_id,
            strategy_name=strategy_name
        )

        # 2. Persist each concrete transformation relationship.
        for source_id, new_id_list in relationship_map.items():
            for new_id in new_id_list:
                self.storage.add_transformation(log_id, source_id, new_id)
        
        try:
            from card_box_core.config import settings
            if settings.VERBOSE_LOGS:
                # Print a brief summary only (avoid dumping card contents)
                total_pairs = sum(len(v or []) for v in relationship_map.values())
                print(f"CardHistory: Logged operation by {strategy_name} with log_id {log_id}. transformations={total_pairs}")
        except Exception:
            pass


class CardBoxHistory:
    """Manage CardBox transformation history logs."""
    def __init__(self, storage: Any, tenant_id: str, trace_id: str):
        self.storage = storage
        self.tenant_id = tenant_id
        self.trace_id = trace_id

    def log_box_transformation(
        self,
        strategy_name: str,
        strategy_input: Optional[str],
        input_box: 'CardBox',
        output_box: 'CardBox',
    ):
        """Record one CardBox transformation."""
        input_snapshot = json.dumps(input_box.to_dict())
        output_snapshot = json.dumps(output_box.to_dict())

        self.storage.add_card_box_log(
            tenant_id=self.tenant_id,
            trace_id=self.trace_id,
            strategy_name=strategy_name,
            strategy_input=strategy_input,
            input_box_snapshot=input_snapshot,
            output_box_snapshot=output_snapshot,
        )
        try:
            from card_box_core.config import settings
            if settings.VERBOSE_LOGS:
                print(f"CardBoxHistory: Logged transformation by {strategy_name}.")
        except Exception:
            pass


class ApiHistory:
    """Manage API call history logs."""
    def __init__(self, storage: Any, tenant_id: str, trace_id: str):
        self.storage = storage
        self.tenant_id = tenant_id
        self.trace_id = trace_id

    def log_api_call(
        self,
        api_type: str,
        endpoint: str,
        request_data: Optional[Dict[str, Any]] = None,
        response_data: Optional[str] = None,
        log_level: str = "full"
    ) -> int:
        """
        Record one API call.

        Args:
            api_type: API type (for example, 'llm', 'search').
            endpoint: Endpoint path or URL.
            request_data: Request payload sent to the API.
            response_data: Response payload string from the API.
            log_level: Logging level ('full' or 'brief').

        Returns:
            The ID of the newly created API log entry.
        """
        req_str = None
        resp_str = None
        if log_level == "full":
            if request_data:
                req_str = json.dumps(request_data, ensure_ascii=False)
            resp_str = response_data

        return self.storage.add_api_log(
            trace_id=self.trace_id,
            tenant_id=self.tenant_id,
            api_type=api_type,
            endpoint=endpoint,
            request_data=req_str,
            response_data=resp_str
        )
