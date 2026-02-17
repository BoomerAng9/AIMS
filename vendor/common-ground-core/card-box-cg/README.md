<p align="left">
    &nbspEnglish&nbsp | <a href="README_CN.md">中文</a>&nbsp 
</p>

# card-box-core

`card-box-core` is a data and context orchestration library centered around `Card` and `CardBox`.

## Core Design Principles

### 1. Immutable Core Data

- `Card` is the atomic unit of information.
- Logical "updates" are done by creating a new `Card` (for example, `Card.update(...)` returns a new object with a new `card_id`).
- This makes transformation flows traceable and auditable.

### 2. Linear Context Container

- `CardBox` is an ordered collection of `card_id`s.
- The main workflow processes context in linear order to keep complexity low.
- Multi-turn context and strategy transformations are all built around `CardBox`.

### 3. Centralized State Management

- `CardStore` is the read/write entry point for cards and delegates persistence to storage adapters.
- `CardBox` stores references only; actual card data is loaded from the storage layer.

### 4. Strategy-Based Extensibility

- Business logic is encapsulated in independent `Strategy` units.
- `ContextEngine.transform(...)` orchestrates strategy chains with low coupling between strategies.
- Built-in examples: `ExtractCodeStrategy`, `PdfToTextStrategy`, `InlineTextFileContentStrategy`.

### 5. Explicit Traceability

- `ContextEngine` can log `Card` and `CardBox` transformation history based on `history_level`.
- `trace_id` spans an entire processing flow for correlated auditing.

## Core Components

- `Card`: Supports text, JSON, tool calls, file references, and more.
- `CardBox`: Ordered sequence of context references.
- `ContextEngine`: Provides `transform`, `to_api`, and `call_model`.
- `AsyncPostgresStorageAdapter`: Async PostgreSQL persistence.
- `LLMAdapter`: Unified LLM access (LiteLLM / optional Interactions backend).

## Installation

```bash
python -m venv .venv
source .venv/bin/activate
pip install -e .
```

Optional extras:

```bash
pip install -e .[test]
pip install -e .[interactions]
```

## PostgreSQL Configuration

Set one of the following DSN environment variables:

```bash
export POSTGRES_STORAGE_ADAPTER_DSN="postgresql://user:pass@localhost:5432/cardbox_db"
# or
export CARD_BOX_POSTGRES_DSN="postgresql://user:pass@localhost:5432/cardbox_db"
```

## Run the Demo

`main.py` demonstrates a minimal end-to-end flow:

1. Initialize `AsyncPostgresStorageAdapter` (with optional auto bootstrap).
2. Create and persist `Card` instances.
3. Save and load a `CardBox`.
4. Print the loaded result.

Run:

```bash
python main.py
```

## Run Tests

```bash
python -m unittest discover -s tests -p 'test_*.py' -v
```

Notes:

- `tests/test_llm_providers.py` depends on external model environment variables and will be skipped when not configured.
- Other tests prefer local stubs and avoid real external services.

## Override Configuration

Use `configure` at startup to override default settings:

```python
from card_box_core.config import configure

configure({
    "POSTGRES_STORAGE_ADAPTER": {
        "dsn": "postgresql://user:pass@localhost:5432/cardbox_db",
        "auto_bootstrap": True,
    },
    "LLM_BACKEND": "litellm",
})
```
