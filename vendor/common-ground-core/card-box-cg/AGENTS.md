# Repository Guidelines

## Project Structure & Module Organization
- `card_box_core/`: core library modules (`structures`, `engine`, `strategies`, `services`, `api_client`, `config`, `adapters`, `external`).
- `tests/`: `unittest` test suite.
- `main.py`: minimal runnable demo for PostgreSQL persistence flow.
- `README.md`: primary and maintained documentation entry.
- `docs/`: deprecated directory (do not rely on it for current behavior).
- Build artifacts: `dist/`, `*.egg-info/` (do not edit).

## Build, Test, and Development Commands
- Create venv: `python -m venv .venv && source .venv/bin/activate`
- Install editable: `pip install -e .`
- Optional extras:
  - Test deps: `pip install -e .[test]`
  - Interactions backend deps: `pip install -e .[interactions]`
- Run demo: `python main.py` (requires `POSTGRES_STORAGE_ADAPTER_DSN` or `CARD_BOX_POSTGRES_DSN`).
- Run tests: `python -m unittest discover -s tests -p 'test_*.py' -v`

## Coding Style & Naming Conventions
- Python 3.12+.
- Follow PEP 8 with 4-space indentation and type hints.
- Naming: `snake_case` (functions/vars), `PascalCase` (classes), `UPPER_SNAKE_CASE` (constants).
- Add docstrings for public APIs.

## Testing Guidelines
- Framework: `unittest`. Place tests under `tests/` named `test_*.py`.
- Keep tests isolated; avoid real network I/O by default.
- `tests/test_llm_providers.py` is env-gated and may skip when credentials are unset.
- Add/adjust tests when behavior changes.

## Commit & Pull Request Guidelines
- Use Conventional Commits (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`).
- Keep subject imperative and <= 72 chars.
- PR should include summary, motivation, and test plan.

## Security & Configuration Tips
- Use environment variables for secrets:
  - `OPENAI_API_KEY`, `GOOGLE_API_KEY`, `ANTHROPIC_API_KEY`
  - `POSTGRES_STORAGE_ADAPTER_DSN` / `CARD_BOX_POSTGRES_DSN`
  - Optional S3 vars for local object-store testing: `AWS_ENDPOINT_URL_S3`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`
- Do not commit credentials.
