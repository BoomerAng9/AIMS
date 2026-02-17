from __future__ import annotations

import json
import os
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone
from typing import Any, AsyncIterator, Dict, List, Optional

import uuid6
from psycopg.rows import dict_row
from psycopg_pool import AsyncConnectionPool

from card_box_core.config import PostgresStorageAdapterSettings, settings


class AsyncPostgresStorageAdapter:
    """Async PostgreSQL persistence adapter for card-box data.

    Designed to either:
    - own an internal AsyncConnectionPool, or
    - reuse an external shared AsyncConnectionPool from the host service.
    """

    def __init__(
        self,
        config: PostgresStorageAdapterSettings | None = None,
        *,
        pool: AsyncConnectionPool | None = None,
    ) -> None:
        self.config = config or settings.POSTGRES_STORAGE_ADAPTER
        if self.config is None:
            dsn = os.getenv("POSTGRES_STORAGE_ADAPTER_DSN") or os.getenv("CARD_BOX_POSTGRES_DSN")
            if dsn:
                self.config = PostgresStorageAdapterSettings(dsn=dsn)
            else:
                raise ValueError(
                    "AsyncPostgresStorageAdapter requires configuration. "
                    "Please set POSTGRES_STORAGE_ADAPTER_DSN (or CARD_BOX_POSTGRES_DSN) "
                    "or pass a config object."
                )

        if pool is not None:
            self.pool = pool
            self._owns_pool = False
        else:
            self.pool = AsyncConnectionPool(
                conninfo=self.config.dsn,
                min_size=self.config.min_size,
                max_size=self.config.max_size,
                open=False,
                kwargs={"row_factory": dict_row},
            )
            self._owns_pool = True

        self._schema_initialized = False

    async def open(self) -> None:
        if self._owns_pool:
            await self.pool.open()
        if self.config and self.config.auto_bootstrap:
            await self.setup_schema()

    async def close(self, *, timeout: Optional[float] = None) -> None:
        if not self._owns_pool:
            return
        if timeout is None:
            await self.pool.close()
        else:
            await self.pool.close(timeout=timeout)

    @asynccontextmanager
    async def _connection(self, conn: Any = None) -> AsyncIterator[Any]:
        if conn is not None:
            yield conn
            return
        async with self.pool.connection() as own_conn:
            yield own_conn

    @staticmethod
    def _parse_json_field(value: Any, default: Any) -> Any:
        if value is None:
            return default
        if isinstance(value, (dict, list)):
            return value
        if isinstance(value, str):
            try:
                return json.loads(value)
            except Exception:
                return default
        return default

    async def setup_schema(self, *, conn: Any = None) -> None:
        if self._schema_initialized:
            return
        schema_path = os.path.join(os.path.dirname(__file__), "postgres_schema.sql")
        with open(schema_path, "r") as f:
            schema_sql = f.read()

        async with self._connection(conn) as db_conn:
            await db_conn.execute(schema_sql)
        self._schema_initialized = True

    async def add_card(self, card: "Card", tenant_id: str, *, conn: Any = None) -> None:
        from card_box_core.structures import Content, TextContent, _serialize_content

        expires_at = None
        if card.ttl_seconds is not None:
            expires_at = datetime.now(timezone.utc) + timedelta(seconds=card.ttl_seconds)

        if isinstance(card.content, Content):
            content_dict = card.to_dict()["content"]
        else:
            content_dict = _serialize_content(TextContent(text=str(card.content)))

        content_json = json.dumps(content_dict)
        tool_calls_json = json.dumps(card.tool_calls) if card.tool_calls is not None else None
        metadata_json = json.dumps(card.metadata) if card.metadata else None

        async with self._connection(conn) as db_conn:
            await db_conn.execute(
                """
                INSERT INTO cards (card_id, tenant_id, content, tool_calls, tool_call_id, metadata, ttl_seconds, expires_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (card_id) DO UPDATE SET
                    content = EXCLUDED.content,
                    tool_calls = EXCLUDED.tool_calls,
                    tool_call_id = EXCLUDED.tool_call_id,
                    metadata = EXCLUDED.metadata,
                    ttl_seconds = EXCLUDED.ttl_seconds,
                    expires_at = EXCLUDED.expires_at,
                    deleted_at = NULL
                """,
                (
                    card.card_id,
                    tenant_id,
                    content_json,
                    tool_calls_json,
                    card.tool_call_id,
                    metadata_json,
                    card.ttl_seconds,
                    expires_at,
                ),
            )

    async def get_card(self, card_id: str, tenant_id: str, *, conn: Any = None) -> Optional["Card"]:
        from card_box_core.structures import Card, _deserialize_content

        async with self._connection(conn) as db_conn:
            result = await db_conn.execute(
                """
                SELECT content, tool_calls, tool_call_id, metadata, card_id, ttl_seconds
                FROM cards
                WHERE card_id = %s AND tenant_id = %s AND deleted_at IS NULL
                """,
                (card_id, tenant_id),
            )
            row = await result.fetchone()

        if not row:
            return None

        content_data = self._parse_json_field(row.get("content"), None)
        if content_data is None:
            raise ValueError(f"Card {card_id} has NULL content in database, which is not allowed.")
        content = _deserialize_content(content_data)

        tool_calls = self._parse_json_field(row.get("tool_calls"), None)
        metadata = self._parse_json_field(row.get("metadata"), {})

        return Card(
            content=content,
            tool_calls=tool_calls,
            tool_call_id=row.get("tool_call_id"),
            ttl_seconds=row.get("ttl_seconds"),
            metadata=metadata,
            card_id=row.get("card_id"),
        )

    async def list_cards(
        self,
        tenant_id: str,
        *,
        metadata_filters: Optional[Dict[str, Any]] = None,
        limit: Optional[int] = None,
        offset: int = 0,
        include_deleted: bool = False,
        conn: Any = None,
    ) -> List["Card"]:
        from card_box_core.structures import Card, _deserialize_content

        query = """
            SELECT content, tool_calls, tool_call_id, metadata, card_id, ttl_seconds
            FROM cards
            WHERE tenant_id = %s
        """
        params: List[Any] = [tenant_id]

        if not include_deleted:
            query += " AND deleted_at IS NULL"

        if metadata_filters:
            for key, value in metadata_filters.items():
                if value is None:
                    query += " AND metadata ->> %s IS NULL"
                    params.append(key)
                else:
                    query += " AND metadata ->> %s = %s"
                    params.extend([key, str(value)])

        query += " ORDER BY created_at DESC"

        if limit is not None:
            query += " LIMIT %s"
            params.append(limit)
        if offset:
            query += " OFFSET %s"
            params.append(offset)

        async with self._connection(conn) as db_conn:
            result = await db_conn.execute(query, tuple(params))
            rows = await result.fetchall()

        cards: List[Card] = []
        for row in rows:
            content_data = self._parse_json_field(row.get("content"), None)
            if content_data is None:
                continue
            cards.append(
                Card(
                    content=_deserialize_content(content_data),
                    tool_calls=self._parse_json_field(row.get("tool_calls"), None),
                    tool_call_id=row.get("tool_call_id"),
                    ttl_seconds=row.get("ttl_seconds"),
                    metadata=self._parse_json_field(row.get("metadata"), {}),
                    card_id=row.get("card_id"),
                )
            )
        return cards

    async def list_cards_by_tool_call_ids(
        self,
        tenant_id: str,
        *,
        tool_call_ids: List[str],
        metadata_filters: Optional[Dict[str, Any]] = None,
        limit: Optional[int] = None,
        include_deleted: bool = False,
        conn: Any = None,
    ) -> List["Card"]:
        from card_box_core.structures import Card, _deserialize_content

        if not tool_call_ids:
            return []

        query = """
            SELECT content, tool_calls, tool_call_id, metadata, card_id, ttl_seconds
            FROM cards
            WHERE tenant_id = %s AND tool_call_id = ANY(%s)
        """
        params: List[Any] = [tenant_id, tool_call_ids]

        if not include_deleted:
            query += " AND deleted_at IS NULL"

        if metadata_filters:
            for key, value in metadata_filters.items():
                if value is None:
                    query += " AND metadata ->> %s IS NULL"
                    params.append(key)
                else:
                    query += " AND metadata ->> %s = %s"
                    params.extend([key, str(value)])

        query += " ORDER BY created_at DESC"
        if limit is not None:
            query += " LIMIT %s"
            params.append(limit)

        async with self._connection(conn) as db_conn:
            result = await db_conn.execute(query, tuple(params))
            rows = await result.fetchall()

        cards: List[Card] = []
        for row in rows:
            content_data = self._parse_json_field(row.get("content"), None)
            if content_data is None:
                continue
            cards.append(
                Card(
                    content=_deserialize_content(content_data),
                    tool_calls=self._parse_json_field(row.get("tool_calls"), None),
                    tool_call_id=row.get("tool_call_id"),
                    ttl_seconds=row.get("ttl_seconds"),
                    metadata=self._parse_json_field(row.get("metadata"), {}),
                    card_id=row.get("card_id"),
                )
            )
        return cards

    async def list_cards_by_ids(
        self,
        tenant_id: str,
        *,
        card_ids: List[str],
        include_deleted: bool = False,
        conn: Any = None,
    ) -> List["Card"]:
        from card_box_core.structures import Card, _deserialize_content

        if not card_ids:
            return []

        query = """
            SELECT content, tool_calls, tool_call_id, metadata, card_id, ttl_seconds
            FROM cards
            WHERE tenant_id = %s AND card_id = ANY(%s)
        """
        params: List[Any] = [tenant_id, card_ids]

        if not include_deleted:
            query += " AND deleted_at IS NULL"

        async with self._connection(conn) as db_conn:
            result = await db_conn.execute(query, tuple(params))
            rows = await result.fetchall()

        cards: List[Card] = []
        for row in rows:
            content_data = self._parse_json_field(row.get("content"), None)
            if content_data is None:
                continue
            cards.append(
                Card(
                    content=_deserialize_content(content_data),
                    tool_calls=self._parse_json_field(row.get("tool_calls"), None),
                    tool_call_id=row.get("tool_call_id"),
                    ttl_seconds=row.get("ttl_seconds"),
                    metadata=self._parse_json_field(row.get("metadata"), {}),
                    card_id=row.get("card_id"),
                )
            )
        return cards

    async def save_card_box(self, box: "CardBox", tenant_id: str, *, conn: Any = None) -> str:
        card_ids_json = json.dumps(box.card_ids)
        parent_ids_json = json.dumps(box.parent_ids) if box.parent_ids is not None else None

        async with self._connection(conn) as db_conn:
            if box.box_id is None:
                box.box_id = str(uuid6.uuid7())
                result = await db_conn.execute(
                    """
                    INSERT INTO card_boxes (box_id, tenant_id, card_ids, parent_ids, updated_at)
                    VALUES (%s, %s, %s, %s, current_timestamp)
                    RETURNING box_id
                    """,
                    (box.box_id, tenant_id, card_ids_json, parent_ids_json),
                )
                row = await result.fetchone()
            else:
                result = await db_conn.execute(
                    """
                    UPDATE card_boxes
                    SET card_ids = %s, parent_ids = %s, updated_at = current_timestamp
                    WHERE box_id = %s AND tenant_id = %s
                    RETURNING box_id
                    """,
                    (card_ids_json, parent_ids_json, box.box_id, tenant_id),
                )
                row = await result.fetchone()
                if not row:
                    raise ValueError(f"card_box with id {box.box_id} not found for tenant {tenant_id}")

        box_id = str(row.get("box_id"))
        box.box_id = box_id
        return box_id

    async def append_to_box(self, box_id: str, tenant_id: str, card_ids: List[str], *, conn: Any = None) -> str:
        if not card_ids:
            box = await self.load_card_box(box_id, tenant_id, conn=conn)
            if not box:
                raise ValueError(f"card_box with id {box_id} not found for tenant {tenant_id}")
            return box.box_id

        card_ids_json = json.dumps(list(card_ids))
        async with self._connection(conn) as db_conn:
            result = await db_conn.execute(
                """
                UPDATE card_boxes
                SET card_ids = COALESCE(card_ids, '[]'::jsonb) || %s::jsonb,
                    updated_at = current_timestamp
                WHERE box_id = %s AND tenant_id = %s
                RETURNING box_id
                """,
                (card_ids_json, box_id, tenant_id),
            )
            row = await result.fetchone()
            if not row:
                raise ValueError(f"card_box with id {box_id} not found for tenant {tenant_id}")
        return str(row.get("box_id"))

    async def load_card_box(self, box_id: str, tenant_id: str, *, conn: Any = None) -> Optional["CardBox"]:
        from card_box_core.structures import CardBox

        async with self._connection(conn) as db_conn:
            result = await db_conn.execute(
                "SELECT card_ids, parent_ids FROM card_boxes WHERE box_id = %s AND tenant_id = %s",
                (box_id, tenant_id),
            )
            row = await result.fetchone()

        if not row:
            return None

        card_ids = self._parse_json_field(row.get("card_ids"), [])
        parent_ids = self._parse_json_field(row.get("parent_ids"), None)

        box = CardBox(box_id=box_id, parent_ids=parent_ids)
        box.card_ids = card_ids
        return box

    async def add_sync_task(self, card_id: str, tenant_id: str, operation: str, *, conn: Any = None) -> None:
        async with self._connection(conn) as db_conn:
            await db_conn.execute(
                """
                INSERT INTO sync_queue (card_id, tenant_id, operation)
                VALUES (%s, %s, %s)
                """,
                (card_id, tenant_id, operation),
            )

    async def get_source_cards(
        self,
        *,
        tenant_id: str,
        trace_id: str,
        card_id: str,
        conn: Any = None,
    ) -> List["Card"]:
        query = """
            SELECT t.source_card_id
            FROM card_transformations t
            JOIN card_operation_logs l ON t.operation_log_id = l.log_id
            WHERE l.tenant_id = %s AND l.trace_id = %s AND t.new_card_id = %s
        """
        async with self._connection(conn) as db_conn:
            result = await db_conn.execute(query, (tenant_id, trace_id, card_id))
            rows = await result.fetchall()

        source_cards: List["Card"] = []
        for row in rows:
            source_card_id = row.get("source_card_id")
            if not source_card_id:
                continue
            card = await self.get_card(str(source_card_id), tenant_id, conn=conn)
            if card is not None:
                source_cards.append(card)
        return source_cards
