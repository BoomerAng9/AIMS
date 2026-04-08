# Chicken Hawk Go-Live — Design Document

**Date:** 2026-03-01
**Status:** Approved
**Tracks:** Stack Update + Security Hardening + Admin UI Polish

---

## Context

Chicken Hawk is the secure, production-hardened version of OpenClaw. It inherits OpenClaw's 5 core security layers and adds 3 more (AppArmor, read-only root FS, ORACLE gates). Lil_Hawks are little Chicken Hawks that grow to maturity upon task completion, supervised by Betty-Ann_Ang from the HR PMO Office.

The Chicken Hawk service is substantially built (~2,500 LOC across 3 Docker services) but needs security hardening and UI polish to go live.

---

## Track 1: Stack Update (infra/docker-compose.prod.yml)

### Changes

1. **Rename agent-zero to AVVA NOON** — update service name, container name, environment, and integrate into NtNtN Engine references
2. **Harden Chicken Hawk containers** — add security options (see Track 2)
3. **Clean dangling references** — voice-router.ts was deleted, verify no orphaned config
4. **Verify Chicken Hawk wiring** — confirm chickenhawk-core → chickenhawk-policy → chickenhawk-audit dependency chain is correct and healthy

### Services After Update (Default — 12 containers)

| Service | Port | Role |
|---------|------|------|
| nginx | 80/443 | Reverse proxy, SSL |
| frontend | 3000 | Next.js 14 |
| demo-frontend | 3000 | Sandbox demo |
| uef-gateway | 3001 | Hono.js gateway |
| house-of-ang | 3002 | Boomer_Ang registry |
| acheevy | 3003 | Executive orchestrator |
| redis | 6379 | Cache/sessions |
| agent-bridge | 3010 | Security gateway |
| chickenhawk-core | 4001 | Execution engine |
| chickenhawk-policy | 4002 | Circuit Box |
| chickenhawk-audit | 4003 | Evidence locker |
| circuit-metrics | 9090 | Health dashboard |

---

## Track 2: Chicken Hawk Security Hardening

### Inherited from OpenClaw (5 layers — already implemented)

1. **Network isolation** — loopback-only default, sandbox-network (internal: true)
2. **Gateway token auth** — agent-bridge validates all cross-network requests
3. **Channel ACL** — DM/phone allowlists for multi-channel
4. **Docker sandboxing** — isolated containers, resource limits
5. **Prompt injection defense** — context isolation in LLM calls

### Chicken Hawk Additions (3 layers — to implement)

6. **AppArmor + capability stripping**
   - `cap_drop: ALL` on all 3 Chicken Hawk containers
   - `security_opt: no-new-privileges:true`
   - Custom AppArmor profile for chickenhawk-core (restrict syscalls)

7. **Read-only root filesystem**
   - `read_only: true` on all 3 containers
   - `tmpfs: /tmp:size=100M` for temporary workspace
   - `tmpfs: /app/workspace:size=500M` for execution workspace
   - Named volumes remain for persistent data (chickenhawk-data, chickenhawk-evidence)

8. **ORACLE gate enforcement**
   - 7 verification gates before any output leaves the system
   - Gates 1 (Technical), 2 (Security), 5 (GDPR/CCPA) are **blocking**
   - Gates 3 (UX), 4 (Performance), 6 (Strategy), 7 (Docs) are **advisory**
   - Implementation: new `src/core/oracle.ts` module in chickenhawk-core

### Docker Secrets Migration

Move sensitive values from environment variables to Docker secrets:
- `OPENROUTER_API_KEY` → `/run/secrets/openrouter_api_key`
- `GEMINI_API_KEY` → `/run/secrets/gemini_api_key`
- `REDIS_PASSWORD` → `/run/secrets/redis_password`

Read secrets from file in code: `fs.readFileSync('/run/secrets/<name>', 'utf8').trim()`

---

## Track 3: Admin UI Polish

### Current State

The admin page at `/dashboard/admin/chicken-hawk/` has:
- Health monitoring (standalone + in-process connection status)
- Status cards (uptime, active squads, completed manifests, audit buffer)
- Capabilities display (8 weighted skills)
- Registered adapters list
- Active squads with expandable Lil_Hawk details
- Direct execution textarea with JSON output
- Emergency stop (kill switch)

### Changes

1. **SSE real-time feed** — Replace 30-second polling with EventSource connection to `/events` endpoint via a Next.js API proxy route. Squad spawns, task completions, and audit events appear instantly.

2. **Structured execution output** — Replace raw JSON dump with:
   - Wave progress cards showing sequential wave execution
   - Per-task status badges (pending → running → success/failed)
   - Lil_Hawk activity indicators (spawning → ready → executing → reporting → terminated)
   - Cost accumulator showing LUC spend in real-time

3. **Betty-Ann_Ang review visibility** — Show job count toward the 100-job review cycle for each Lil_Hawk. Simple progress indicator: "47/100 jobs until next review."

4. **Policy snapshot panel** — Show current Circuit Box lever states inline (autonomy level, budget cap, emergency stop status, concurrency limit) so the operator doesn't have to check a separate page.

### New API Route

`/api/admin/chicken-hawk/events` — SSE proxy that connects to `chickenhawk-core:4001/events` and forwards the stream to the browser. Owner-gated.

---

## Files to Create/Modify

### New Files
- `services/chicken-hawk/src/core/oracle.ts` — ORACLE 7-gate verification module
- `frontend/app/api/admin/chicken-hawk/events/route.ts` — SSE proxy endpoint

### Modified Files
- `infra/docker-compose.prod.yml` — Security hardening, secrets, AVVA NOON rename
- `services/chicken-hawk/src/index.ts` — Secret file reading, ORACLE integration
- `services/chicken-hawk/src/core/engine.ts` — ORACLE gate checks before output
- `frontend/app/dashboard/admin/chicken-hawk/page.tsx` — SSE feed, structured output, policy panel

---

## Success Criteria

- [ ] All 3 Chicken Hawk containers start with `read_only: true`, `cap_drop: ALL`, `no-new-privileges`
- [ ] Secrets read from files, not environment variables
- [ ] ORACLE gates 1, 2, 5 block bad output; gates 3, 4, 6, 7 log warnings
- [ ] Admin UI shows real-time squad/task updates via SSE (no polling)
- [ ] Execution output renders as structured cards, not raw JSON
- [ ] `npm run build` passes for frontend
- [ ] Stack update reflects current state (AVVA NOON, clean references)
