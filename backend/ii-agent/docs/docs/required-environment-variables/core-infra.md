---
id: core-infra
title: Core Infrastructure
slug: /required-environment-variables/core-infra
sidebar_position: 18
---

These variables cover databases, caches, and host port mappings used by the Docker stack. Most of them can stay at their defaults unless you have port conflicts or custom credentials.

## Postgres (`POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `POSTGRES_PORT`)

1. Pick credentials you are comfortable using for local development. Example:
   ```bash
   POSTGRES_USER=app
   POSTGRES_PASSWORD=changeme
   POSTGRES_DB=ii
   POSTGRES_PORT=5432
   ```
2. Update the same values anywhere else they appear (e.g., in Prisma configs or backend `.env` files) so services can authenticate.
3. If port `5432` conflicts with a local Postgres install, change `POSTGRES_PORT` to something else (like `55432`) and adjust your clients accordingly.

## `DATABASE_URL`

- Async connection string used by the backend (e.g., `postgresql+asyncpg://app:changeme@postgres:5432/ii`).
- Ensure the host matches the service name inside Docker (`postgres` by default) instead of `localhost`.

## Sandbox database (`SANDBOX_DB_NAME`, `SANDBOX_DATABASE_URL`)

- Only needed if your sandbox service uses a dedicated database.
- You can reuse the primary Postgres instance by pointing the URL at the same host but a different database name.

## Redis (`REDIS_PORT`)

- Defaults to `6379`. Change only when another local service already uses that port.
- Clients inside Docker talk to the service name `redis`, so you only need to update host mappings if you connect from the host machine.

## HTTP-facing ports

- `BACKEND_PORT`, `FRONTEND_PORT`, `SANDBOX_SERVER_PORT`, `TOOL_SERVER_PORT`, `NGROK_METRICS_PORT`, `MCP_PORT`
- Map each to a free host port. The defaults from `.stack.env.example` usually work (8000/3000/etc.).
- When a port collision occurs, bump the conflicting value and restart the stack. Remember to update any URLs (e.g., `VITE_API_URL`) that reference the old port.

## Validation Checklist

1. Run `./scripts/run_stack.sh --build` and verify each container starts without port binding errors.
2. Use `docker compose ps` to confirm Postgres and Redis listen on the expected ports.
3. From your host, connect to each service (`psql`, `redis-cli`, `curl http://localhost:<port>`) to ensure mappings work.
