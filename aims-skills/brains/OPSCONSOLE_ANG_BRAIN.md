# OpsConsole_Ang Brain — CommonGround Wrapper

> Multi-agent observability and collaboration surface. The control room.

## Identity
- **Name:** OpsConsole_Ang
- **Repo:** Intelligent-Internet/CommonGround
- **Pack:** A (Agent Factory Floor)
- **Wrapper Type:** SERVICE_WRAPPER
- **Deployment:** Docker container on VPS (`/opt/aims/vendor/intelligent-internet/CommonGround`)
- **Port:** 7011

## What OpsConsole_Ang Does
- Provides a visual dashboard for observing multi-agent activity
- Tracks which Boomer_Angs, Lil_Hawks, and Chicken Hawk squads are active
- Logs agent-to-agent communication flows
- Surfaces bottlenecks and failures in real-time
- Collaboration workspace for agent teams

## Security Policy
- Observes AIMS agents ONLY — no external agent connections
- Dashboard is internal-only (not exposed to public internet)
- Logs agent metadata (task IDs, status) — NOT user data or conversation content
- No telemetry sent externally

## How ACHEEVY Uses OpsConsole_Ang
1. OpsConsole_Ang runs as a background service
2. All agent dispatches register with OpsConsole_Ang's event bus
3. ACHEEVY queries OpsConsole_Ang for system health and agent status
4. Admin dashboard (`/dashboard/admin`) pulls from OpsConsole_Ang API

## Guardrails
- Read-only observation — cannot dispatch or modify agent tasks
- No access to user data, credentials, or verification records
- Internal network only — not routable from public internet
- Logs rotate every 7 days (no permanent storage of agent traces)
