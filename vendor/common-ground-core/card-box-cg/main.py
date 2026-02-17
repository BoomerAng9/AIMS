import asyncio
import os
import uuid6

from card_box_core import AsyncPostgresStorageAdapter, Card, CardBox, TextContent
from card_box_core.config import PostgresStorageAdapterSettings


async def main() -> None:
    dsn = os.getenv("POSTGRES_STORAGE_ADAPTER_DSN") or os.getenv("CARD_BOX_POSTGRES_DSN")
    if not dsn:
        raise RuntimeError("POSTGRES_STORAGE_ADAPTER_DSN (or CARD_BOX_POSTGRES_DSN) must be set.")

    adapter = AsyncPostgresStorageAdapter(PostgresStorageAdapterSettings(dsn=dsn, auto_bootstrap=True))
    await adapter.open()

    try:
        tenant_id = "default-tenant"

        user_card = Card(
            card_id=uuid6.uuid7().hex,
            content=TextContent(text="Please write a Python function to calculate the Fibonacci sequence."),
            metadata={"role": "user"},
        )
        assistant_card = Card(
            card_id=uuid6.uuid7().hex,
            content=TextContent(text="def fib(n): ..."),
            metadata={"role": "assistant", "type": "task.deliverable"},
        )

        await adapter.add_card(user_card, tenant_id)
        await adapter.add_card(assistant_card, tenant_id)

        box = CardBox()
        box.card_ids = [user_card.card_id, assistant_card.card_id]
        box_id = await adapter.save_card_box(box, tenant_id)

        loaded_box = await adapter.load_card_box(box_id, tenant_id)
        loaded_cards = await adapter.list_cards_by_ids(
            tenant_id,
            card_ids=list(loaded_box.card_ids if loaded_box else []),
        )

        print(f"saved box_id={box_id}, cards={len(loaded_cards)}")
        for card in loaded_cards:
            role = (card.metadata or {}).get("role", "user")
            print(f"[{role}] {card.text()}")
    finally:
        await adapter.close()


if __name__ == "__main__":
    asyncio.run(main())
