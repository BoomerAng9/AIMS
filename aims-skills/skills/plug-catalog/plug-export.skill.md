---
name: plug-export
type: skill
triggers:
  - "export"
  - "self-host"
  - "ship it"
  - "docker export"
  - "download compose"
  - "take it with me"
execution:
  target: backend
  module: plug-catalog/deploy-engine
  method: export
---

# Plug Export Skill

## Purpose
Package a configured plug instance as a self-hosting bundle that the
client can deploy on their own infrastructure. The structure is always
the same — only the plug content changes.

## Export Bundle Contents

```
bundle/
  docker-compose.yml     # Full compose with service, health check, networking
  .env.example           # Environment template with descriptions
  nginx.conf             # Reverse proxy config
  setup.sh               # Automated setup script (check deps, validate env, deploy)
  healthcheck.sh         # Health check script
  README.md              # Full documentation with commands and config
```

## MIM (Make It Mind) Principle
The bundle structure is IDENTICAL for every plug. The only thing that
changes is the plug-specific content inside. This means:
- Same setup flow for OpenClaw, DeerFlow, n8n, or any tool
- Same security hardening patterns
- Same health check methodology
- Same nginx reverse proxy pattern

## Setup Script Behavior
1. Check Docker + Docker Compose installed
2. Create .env from .env.example if missing
3. Validate required env vars (warn if empty)
4. Pull/build images
5. Start containers
6. Wait for health check (30 retries, 2s interval)
7. Print success message with URL

## Export Formats (Future)
- `docker-compose` — Default, always available
- `helm-chart` — Kubernetes deployment (planned)
- `terraform` — Cloud infrastructure (planned)

## Behavioral Rules
- ALWAYS include .env.example with descriptions
- NEVER include actual API keys in the export
- ALWAYS include health check verification
- README must be self-sufficient (no AIMS account needed to run)
- Sensitive env vars use ${VAR} syntax in compose (loaded from .env)
