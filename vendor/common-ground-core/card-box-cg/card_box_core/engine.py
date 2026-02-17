import json
import inspect
from typing import List, Dict, Any, Tuple, Optional, Callable, TYPE_CHECKING
import copy
import uuid6

from card_box_core.structures import (
    Card,
    CardBox,
    ToolContent,
    ToolCallContent,
    FileContent,
    MultiFileContent,
    TextContent,
    ToolResultContent,
)
from card_box_core.services import CardStore, CardHistory, CardBoxHistory, ApiHistory
from card_box_core.adapters import LocalFileStorageAdapter, FileStorageAdapter
from card_box_core.strategies import Strategy, Input
from card_box_core.config import settings

if TYPE_CHECKING:
    from card_box_core.api_client import LLMAdapter


class ContextEngine:
    """
    ContextEngine is the core orchestrator responsible for running workflows.
    """
    def __init__(self, trace_id: str, tenant_id: str, storage_adapter: Any, history_level: Optional[str] = None, fs_adapter: Optional[FileStorageAdapter] = None):
        self.trace_id = trace_id
        self.tenant_id = tenant_id
        self.history_level = history_level if history_level is not None else settings.DEFAULT_HISTORY_LEVEL
        self.storage_adapter = storage_adapter
        self.card_store = CardStore(storage=storage_adapter, tenant_id=self.tenant_id)
        self.fs_adapter = fs_adapter if fs_adapter is not None else LocalFileStorageAdapter()
        self.card_history = CardHistory(storage=storage_adapter, tenant_id=self.tenant_id, trace_id=self.trace_id)
        self.api_history = ApiHistory(storage=storage_adapter, tenant_id=self.tenant_id, trace_id=self.trace_id)
        if self.history_level == "full":
            self.card_box_history = CardBoxHistory(storage=storage_adapter, tenant_id=self.tenant_id, trace_id=self.trace_id)
        else:
            self.card_box_history = None

    async def transform(self, card_box: CardBox, strategy_input_pairs: List[Tuple[Strategy, Optional['Input']]]) -> CardBox:
        """
        Execute a sequence of transformations over a CardBox using strategy/input pairs.
        """
        try:
            from card_box_core.config import settings
            if settings.VERBOSE_LOGS:
                print(f"[Trace ID: {self.trace_id}] Running transform with {len(strategy_input_pairs)} strategies...")
        except Exception:
            pass
        
        current_box = card_box
        for strategy, strategy_input in strategy_input_pairs:
            input_box_snapshot = None
            if self.history_level == "full":
                # Clone input state for logging.
                input_box_snapshot = current_box.clone()

            result = await strategy.apply(current_box, self.card_store, input=strategy_input, fs=self.fs_adapter)

            # Auto-fill direct parent lineage for the new CardBox (single hop).
            if result.new_card_box.parent_ids is None:
                if current_box.box_id:
                    result.new_card_box.parent_ids = [current_box.box_id]
                elif current_box.parent_ids:
                    result.new_card_box.parent_ids = current_box.parent_ids

            if result.errors:
                error_summary = "; ".join([f"Card '{e.source_card_id}': {e.message}" for e in result.errors])
                print(f"Warning: Strategy '{strategy.__class__.__name__}' encountered errors: {error_summary}")

            # Create 'delete' sync tasks for cards replaced during transformation.
            for source_card_id in result.relationship_map.keys():
                # We need the pre-transform card state.
                # The card may be removed from the box but should still exist in the store.
                source_card = self.card_store.get(source_card_id)
                if source_card and source_card.metadata.get("indexable"):
                    self.card_store.storage.add_sync_task(source_card_id, self.tenant_id, "delete")
            
            strategy_name = strategy.__class__.__name__

            # Record history according to log level.
            if self.history_level in ["full", "card_only"]:
                self.card_history.log_operation(
                    relationship_map=result.relationship_map,
                    strategy_name=strategy_name
                )
            
            if self.history_level == "full" and self.card_box_history and input_box_snapshot:
                self.card_box_history.log_box_transformation(
                    strategy_name=strategy_name,
                    strategy_input=strategy_input.to_string() if strategy_input else None,
                    input_box=input_box_snapshot,
                    output_box=result.new_card_box
                )

            current_box = result.new_card_box

        return current_box

    async def to_api(self, card_box: CardBox, modifier: Optional[Callable[..., Dict[str, Any]]] = None, modifier_kwargs: Optional[Dict[str, Any]] = None) -> Tuple[Dict[str, Any], List[str]]:
        """
        Convert a CardBox into model API input payload and return source Card IDs.
        Handles messages, tool definitions, tool calls, and tool results.

        Args:
            card_box: CardBox to convert.
            modifier: Optional function to mutate the final API request dict before return.
                The first argument to this function is the API request dict.
            modifier_kwargs: Extra keyword arguments passed to `modifier`.

        Returns:
            A tuple containing:
            - API request dictionary.
            - Source Card ID list used to build this request.
        """
        if settings.VERBOSE_LOGS:
            print(f"[Trace ID: {self.trace_id}] Running to_api conversion...")
        messages = []
        tools = []
        source_card_ids = []
        interaction_input: List[Dict[str, Any]] = []
        use_interactions_backend = settings.LLM_BACKEND == "interactions"
        interactions_store = getattr(settings.INTERACTIONS_API, "store", False) if use_interactions_backend else False
        interaction_turns: Dict[str, Dict[str, Any]] = {}
        interaction_order: List[str] = []
        tool_call_name_map: Dict[str, Optional[str]] = {}

        def _interaction_role(meta_role: str) -> str:
            role_map = {
                "assistant": "model",
                "tool": "function",
                "system": "system",
                "user": "user",
            }
            return role_map.get(meta_role, meta_role or "user")

        def _register_segment(group_id: Optional[str], fallback_id: str, role: Optional[str], segment: Dict[str, Any], index: Optional[int]) -> None:
            gid = group_id or fallback_id
            if gid not in interaction_turns:
                interaction_turns[gid] = {"role": role or "user", "segments": {}}
                interaction_order.append(gid)
            if role:
                interaction_turns[gid]["role"] = role
            turn = interaction_turns[gid]
            seg_index = index if isinstance(index, int) else len(turn["segments"])
            turn["segments"][seg_index] = segment

        def _project_tool_result_for_llm(card: Card) -> str:
            content = card.content
            if isinstance(content, ToolResultContent):
                status_value = str(content.status or "")
                result_value = content.result
                if status_value == "success":
                    if isinstance(result_value, str):
                        return result_value
                    if result_value is None:
                        return ""
                    try:
                        return json.dumps(result_value, ensure_ascii=False)
                    except Exception:
                        return str(result_value)
                error_payload = content.error
                if error_payload is None:
                    error_payload = {"code": "unknown_error", "message": "unknown error"}
                try:
                    return json.dumps({"error": error_payload}, ensure_ascii=False)
                except Exception:
                    return str({"error": error_payload})
            return card.text()

        def _extract_reasoning_content_for_message(card: Card) -> Optional[str]:
            meta = card.metadata or {}
            if not isinstance(meta, dict):
                return None
            value = meta.get("reasoning_content")
            if value is None:
                return None
            if isinstance(value, str):
                return value
            if isinstance(value, list):
                parts: List[str] = []
                for item in value:
                    if isinstance(item, str):
                        parts.append(item)
                    elif isinstance(item, dict):
                        text = item.get("text")
                        if text is None:
                            text = item.get("content")
                        if text is not None:
                            parts.append(str(text))
                    else:
                        text = getattr(item, "text", None)
                        if text is None:
                            text = getattr(item, "content", None)
                        if text is not None:
                            parts.append(str(text))
                return "".join(parts) if parts else None
            if isinstance(value, dict):
                text = value.get("text")
                if text is None:
                    text = value.get("content")
                if text is not None:
                    return str(text)
                return None
            return str(value)
        
        for card_id in card_box.card_ids:
            source_card_ids.append(card_id)
            card = self.card_store.get(card_id)
            if inspect.isawaitable(card):
                card = await card

            if not card:
                continue

            # Handle tool definition cards.
            if isinstance(card.content, ToolContent):
                tools.extend(card.content.tools)
                continue  # Tool definitions do not go into messages.

            # Build messages by card type.
            if card.tool_calls:
                # LLM tool-call response.
                msg = {
                    'role': card.metadata.get('role', 'assistant'),  # Usually 'assistant'.
                    'content': card.text(),  # Can be None.
                    'tool_calls': card.tool_calls
                }
                if msg.get("role") == "assistant":
                    reasoning_content = _extract_reasoning_content_for_message(card)
                    if reasoning_content:
                        msg["reasoning_content"] = reasoning_content
                messages.append(msg)
                if use_interactions_backend and not interactions_store:
                    for call in card.tool_calls:
                        call_id = call.get("id")
                        function_name = (call.get("function") or {}).get("name") if isinstance(call, dict) else None
                        if call_id and function_name:
                            tool_call_name_map[call_id] = function_name
                    segment = card.metadata.get("interaction_segment") if card.metadata else None
                    if segment is not None:
                        _register_segment(
                            card.metadata.get("interaction_group_id") if card.metadata else None,
                            card.card_id,
                            card.metadata.get("interaction_role") if card.metadata else None,
                            segment,
                            card.metadata.get("interaction_segment_index") if card.metadata else None,
                        )
                    else:
                        call_text = json.dumps(card.tool_calls, ensure_ascii=False)
                        _register_segment(
                            card.metadata.get("interaction_group_id") if card.metadata else None,
                            card.card_id,
                            _interaction_role(card.metadata.get('role', 'assistant')),
                            {"type": "text", "text": call_text},
                            None,
                        )
            elif card.tool_call_id and not isinstance(card.content, ToolCallContent):
                # Only project tool.result into tool messages; skip tool.call for LLM messages.
                tool_result_payload = _project_tool_result_for_llm(card)
                messages.append({
                    'role': card.metadata.get('role', 'tool'),  # Usually 'tool'.
                    'tool_call_id': card.tool_call_id,
                    'content': tool_result_payload
                })
                if use_interactions_backend and not interactions_store:
                    segment = card.metadata.get("interaction_segment") if card.metadata else None
                    function_name = card.metadata.get("function_name") if card and card.metadata else None
                    if not function_name:
                        function_name = tool_call_name_map.get(card.tool_call_id)
                    if isinstance(segment, dict) and segment.get("type") == "function_result" and "call_id" not in segment:
                        segment = {**segment, "call_id": card.tool_call_id}
                    if segment is None:
                        segment = {
                            "type": "function_result",
                            "name": function_name or card.tool_call_id,
                            "call_id": card.tool_call_id,
                            "result": tool_result_payload,
                        }
                    _register_segment(
                        card.metadata.get("interaction_group_id") if card and card.metadata else None,
                        card.card_id,
                        card.metadata.get("interaction_role") if card and card.metadata else "user",
                        segment,
                        card.metadata.get("interaction_segment_index") if card and card.metadata else None,
                    )
            elif isinstance(card.content, ToolCallContent):
                # tool.call is for internal scheduling/audit only, not LLM messages.
                continue

            else:
                # Regular or multimodal messages.
                role = card.metadata.get('role', 'user')

                # Unified handling for FileContent and MultiFileContent.
                if isinstance(card.content, (FileContent, MultiFileContent)):
                    parts: List[Dict[str, Any]] = []
                    accompanying_text = card.metadata.get('text')
                    if accompanying_text:
                        parts.append({"type": "text", "text": str(accompanying_text)})

                    files_to_process = []
                    if isinstance(card.content, FileContent):
                        files_to_process.append(card.content)
                    else: # MultiFileContent
                        files_to_process.extend(card.content.files)
                    
                    for file_content in files_to_process:
                        file_part = {
                            "type": "file",
                            "file": {
                                "file_id": file_content.uri,
                                "format": file_content.content_type
                            }
                        }
                        parts.append(file_part)
                    
                    messages.append({'role': role, 'content': parts})

                    if use_interactions_backend and not interactions_store:
                        text_parts = [str(accompanying_text)] if accompanying_text else []
                        for file_content in files_to_process:
                            text_parts.append(str(file_content.uri))
                        _register_segment(
                            card.metadata.get("interaction_group_id") if card.metadata else None,
                            card.card_id,
                            _interaction_role(role),
                            {"type": "text", "text": "\n".join(text_parts)},
                            card.metadata.get("interaction_segment_index") if card.metadata else None,
                        )
                else:
                    mime_type = card.metadata.get("mime_type") if card.metadata else None
                    encoding = card.metadata.get("encoding") if card.metadata else None
                    if mime_type and encoding in {"base64", "uri"}:
                        parts: List[Dict[str, Any]] = []
                        accompanying_text = card.metadata.get("text") if card.metadata else None
                        if accompanying_text:
                            parts.append({"type": "text", "text": str(accompanying_text)})
                        parts.append({
                            "type": "media_placeholder",
                            "media_info": {
                                "mime_type": mime_type,
                                "encoding": encoding,
                                "content": card.text(),
                            },
                        })
                        messages.append({"role": role, "content": parts})
                        if use_interactions_backend and not interactions_store:
                            text_parts = [str(accompanying_text)] if accompanying_text else []
                            text_parts.append(card.text())
                            _register_segment(
                                card.metadata.get("interaction_group_id") if card and card.metadata else None,
                                card.card_id,
                                card.metadata.get("interaction_role") if card and card.metadata else _interaction_role(role),
                                {"type": "text", "text": "\n".join([p for p in text_parts if p])},
                                card.metadata.get("interaction_segment_index") if card and card.metadata else None,
                            )
                    else:
                        # Plain text message.
                        content = card.text()
                        msg = {'role': role, 'content': content}
                        if role == "assistant":
                            reasoning_content = _extract_reasoning_content_for_message(card)
                            if reasoning_content:
                                msg["reasoning_content"] = reasoning_content
                        messages.append(msg)
                        if use_interactions_backend and not interactions_store:
                            segment = card.metadata.get("interaction_segment") if card.metadata else None
                            _register_segment(
                                card.metadata.get("interaction_group_id") if card and card.metadata else None,
                                card.card_id,
                                card.metadata.get("interaction_role") if card and card.metadata else _interaction_role(role),
                                segment if segment is not None else {"type": "text", "text": content},
                                card.metadata.get("interaction_segment_index") if card and card.metadata else None,
                            )

        api_request: Dict[str, Any] = {"messages": messages}
        if tools:
            api_request["tools"] = tools
        if use_interactions_backend and not interactions_store:
            if interaction_order:
                interaction_input = []
                for group_id in interaction_order:
                    turn = interaction_turns[group_id]
                    ordered_segments = [turn["segments"][i] for i in sorted(turn["segments"].keys())]
                    interaction_input.append({"role": turn["role"], "content": ordered_segments})
                if interaction_input:
                    api_request["interaction_input"] = interaction_input

        if modifier:
            api_request = modifier(api_request, **(modifier_kwargs or {}))
            
        return api_request, source_card_ids

    async def call_model(
        self,
        card_box: CardBox,
        adapter: "LLMAdapter",
        model: str,
        **kwargs: Any,
    ) -> CardBox:
        """Call the configured LLM using the provided CardBox context."""

        api_request, source_card_ids = await self.to_api(card_box)

        request_kwargs: Dict[str, Any] = {**kwargs}
        interaction_input = api_request.get("interaction_input")
        tools = api_request.get("tools")

        is_interactions_backend = getattr(adapter, "backend", "litellm") == "interactions"
        if is_interactions_backend:
            if interaction_input is not None:
                request_kwargs["interaction_input"] = interaction_input
        messages = api_request.get("messages", [])
        if tools:
            request_kwargs["tools"] = tools
        response = await adapter.get_completion(
            messages=messages,
            model=model,
            **request_kwargs,
        )

        new_box = CardBox()
        metadata_base = {
            "interaction_id": getattr(response, "interaction_id", None),
            "interaction_status": getattr(response, "status", None),
            "role": "assistant",
        }

        cards_to_create: List[Card] = []
        outputs = getattr(response, "outputs", []) or []
        if is_interactions_backend and outputs:
            group_id = metadata_base["interaction_id"] or str(uuid6.uuid7())
            segment_index = 0
            for output in outputs:
                output_type = getattr(output, "type", None)

                if output_type == "function_call":
                    arguments = getattr(output, "arguments", None)
                    if isinstance(arguments, (dict, list)):
                        arguments_for_segment = arguments
                        arguments_for_tool_call = json.dumps(arguments, ensure_ascii=False)
                    else:
                        arguments_for_segment = arguments
                        arguments_for_tool_call = arguments

                    call_id = getattr(output, "id", None) or f"{getattr(output, 'name', 'tool_call')}_{segment_index}"
                    segment = {
                        "type": "function_call",
                        "name": getattr(output, "name", None),
                        "id": call_id,
                        "arguments": arguments_for_segment,
                    }
                    tool_call_metadata = copy.deepcopy(metadata_base)
                    tool_call_metadata.update({
                        "stage": "tool_call",
                        "interaction_segment": segment,
                        "interaction_segment_index": segment_index,
                        "interaction_group_id": group_id,
                        "interaction_role": "model",
                    })
                    card = Card(
                        content=TextContent(text=""),
                        tool_calls=[{
                            "id": call_id,
                            "type": "function",
                            "function": {
                                "name": getattr(output, "name", None),
                                "arguments": arguments_for_tool_call,
                            },
                        }],
                        metadata={k: v for k, v in tool_call_metadata.items() if v is not None},
                    )
                    cards_to_create.append(card)
                    segment_index += 1
                    continue

                text_value = getattr(output, "text", None)
                if text_value:
                    segment = {
                        "type": "text",
                        "text": str(text_value),
                    }
                    text_metadata = copy.deepcopy(metadata_base)
                    text_metadata.update({
                        "stage": "model_text",
                        "interaction_segment": segment,
                        "interaction_segment_index": segment_index,
                        "interaction_group_id": group_id,
                        "interaction_role": "model",
                    })
                    card = Card(
                        content=TextContent(text=str(text_value)),
                        metadata={k: v for k, v in text_metadata.items() if v is not None},
                    )
                    cards_to_create.append(card)
                    segment_index += 1

        if not cards_to_create and hasattr(response, "choices") and response.choices:
            message = getattr(response.choices[0], "message", None)
            if message is not None:
                content = getattr(message, "content", None)
                tool_calls = getattr(message, "tool_calls", None)

                if tool_calls:
                    tool_call_metadata = copy.deepcopy(metadata_base)
                    tool_call_metadata["stage"] = "tool_call"
                    card = Card(
                        content=TextContent(text=""),
                        tool_calls=tool_calls,
                        metadata={k: v for k, v in tool_call_metadata.items() if v is not None},
                    )
                    cards_to_create.append(card)

                text_payload: Optional[str] = None
                if isinstance(content, str):
                    text_payload = content.strip()
                elif isinstance(content, list):
                    text_parts: List[str] = []
                    for part in content:
                        if isinstance(part, dict) and part.get("type") == "text" and part.get("text"):
                            text_parts.append(str(part["text"]))
                    if text_parts:
                        text_payload = "\n".join(text_parts).strip()

                if text_payload:
                    text_metadata = copy.deepcopy(metadata_base)
                    text_metadata["stage"] = "model_text"
                    card = Card(
                        content=TextContent(text=text_payload),
                        metadata={k: v for k, v in text_metadata.items() if v is not None},
                    )
                    cards_to_create.append(card)

        if not cards_to_create and hasattr(response, "choices") and response.choices:
            raw_text = getattr(response.choices[0].message, "content", None)
            if isinstance(raw_text, str) and raw_text.strip():
                fallback_metadata = copy.deepcopy(metadata_base)
                fallback_metadata["stage"] = "model_text"
                card = Card(
                    content=TextContent(text=raw_text.strip()),
                    metadata={k: v for k, v in fallback_metadata.items() if v is not None},
                )
                cards_to_create.append(card)

        for card in cards_to_create:
            self.card_store.add(card)
            new_box.add(card.card_id)

        return new_box
