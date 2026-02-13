---
id: "docker-compose"
name: "Docker Compose Orchestration"
type: "hook"
status: "active"
triggers:
  - "docker"
  - "container"
  - "compose"
  - "service"
  - "infrastructure"
  - "provision"
  - "vps"
  - "hostinger"
description: "Manages Docker Compose services on Hostinger VPS for the A.I.M.S. Longshoremen layer."
execution:
  target: "cli"
  command: "docker compose -f infra/docker-compose.yml"
dependencies:
  env:
    - "VPS_IP"
    - "DB_USER"
    - "DB_PASSWORD"
    - "DATABASE_URL"
  files:
    - "infra/docker-compose.yml"
    - "infra/.env"
priority: "high"
---

# Docker Compose Orchestration Hook

## Available Services

| Service | Port | Status | Description |
|---------|------|--------|-------------|
| frontend | 3000 | Active | Next.js App Router |
| uef-gateway | 3001 | Active | Express orchestrator |
| postgres | 5432 | Active | PostgreSQL database |
| agent-zero | -- | Stubbed | Planning agent |
| chicken-hawk | -- | Stubbed | Execution agent |
| chicken-hawk | -- | Stubbed | Coding agent |
| n8n | 5678 | External | Workflow automation (on VPS directly) |

## Commands

```bash
# Bring up all services
docker compose -f infra/docker-compose.yml up -d

# Bring up specific service
docker compose -f infra/docker-compose.yml up -d frontend uef-gateway postgres

# View logs
docker compose -f infra/docker-compose.yml logs -f <service>

# Rebuild after code changes
docker compose -f infra/docker-compose.yml up -d --build <service>

# Tear down
docker compose -f infra/docker-compose.yml down
```

## Health Checks
- UEF Gateway: `GET http://localhost:3001/health`
- PostgreSQL: `pg_isready -U postgres`
- n8n: `GET http://76.13.96.107:5678/healthz`

## VPS Target
- IP: 76.13.96.107 (Hostinger KVM)
- SSH access required for remote deployment
