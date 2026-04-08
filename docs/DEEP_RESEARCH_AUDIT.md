# A.I.M.S. Deep Research Audit — February 2026

## Purpose

This document is the single source of truth for **what is built, what works, what doesn't,
and what needs to be done** across the entire A.I.M.S. platform. It is designed to:

1. Prevent duplicate work by future Claude sessions or human engineers
2. Provide an honest assessment so we never claim something works when it doesn't
3. Serve as the engineering roadmap for continuous development
4. Enable fast onboarding of any new AI agent or human developer

---

## Architecture Overview

```
User → Frontend (Next.js 14) → UEF Gateway (Express) → Execution Engines
                                     ↓                        ↓
                              ACHEEVY Orchestrator    II-Agent (Socket.IO)
                                     ↓                 Chicken Hawk (HTTP)
                              House of Ang              Research-Ang (A2A)
                              Boomer_Ang Registry       Router-Ang (A2A)
                                     ↓
                              Per|Form Services (Gridiron)
                              Scout Hub / Film Room / War Room
```

### Deployment Targets

| Component | Where | Status |
|---|---|---|
| Frontend (Next.js) | VPS Docker | Deployed |
| UEF Gateway | VPS Docker | Deployed |
| ACHEEVY Service | VPS Docker | Deployed |
| House of Ang | VPS Docker | Deployed |
| Agent Bridge | VPS Docker | Deployed |
| Redis | VPS Docker | Deployed |
| n8n | VPS Docker | Deployed |
| Chicken Hawk | VPS Docker | **NEW — added to docker-compose** |
| II-Agent Stack | VPS Docker | **NEW — added to docker-compose** |
| Per|Form (scout/film/war) | VPS Docker | Profile `perform` (not active) |
| Research-Ang | VPS Docker | Profile `tier1-agents` |
| Router-Ang | VPS Docker | Profile `tier1-agents` |
| PersonaPlex (Nemotron) | GCP Cloud Run w/ GPU | Not deployed |
| SAM 2 Film Analysis | GCP Vertex AI | Not deployed |

---

## What Works (Verified February 2026)

### Frontend — 7 Real Pages (of 24 total)

| Page | Status | What It Does |
|---|---|---|
| `/sign-in` | REAL | Google + Discord + email auth via next-auth |
| `/sign-up` | REAL | 3-step registration with region picker |
| `/forgot-password` | REAL | Password reset email flow |
| `/chat` | REAL | Full LLM streaming, voice (ElevenLabs), file attachments, model selector |
| `/arena` | REAL | Fetches `/api/arena/contests`, renders contests with timers |
| `/dashboard` | REAL | Health polling every 30s, onboarding banner |
| `/integrations` | REAL | Live test panel for Groq, Brave, TTS, E2B, video analysis |

### Frontend — 11 Shell Pages (static, no API)

| Page | What It Shows |
|---|---|
| `/` (landing) | **Rebuilt** — now honest: shows what's live + roadmap |
| `/about` | Static lore/marketing |
| `/discover` | Static verticals showcase |
| `/gallery` | Static character lore from local constants |
| `/pricing` | Complex pricing UI, all local data, no Stripe |
| `/sandbox` | Nav hub to sub-projects |
| `/sandbox/perform` | Per|Form hub (seed data fallback) |
| `/sandbox/perform/big-board` | Per|Form rankings (seed data fallback) |
| `/sandbox/perform/content` | Per|Form content feed (seed data fallback) |
| `/sandbox/perform/directory` | Conference directory (static local data) |
| `/sandbox/perform/prospects/[slug]` | Prospect profile (seed data fallback) |

### Frontend — 5 Placeholder Pages

| Page | Issue |
|---|---|
| `/hangar` | Hardcoded `mode="demo"` — 3D screensaver |
| `/mission-control` | Demo code commented out, hardcoded agent names |
| `/onboarding` | Form with no submit handler, hardcoded email |
| `/your-space` | All mock data, `console.log()` stubs |
| `/new` | Just a hero image + one link |

### Frontend — Pages That 404

| Path | Issue |
|---|---|
| `/terms` | No `page.tsx` (only `terms/savings-plan/` exists) |

### Backend — UEF Gateway Routes (All Verified)

| Route | Method | Status | Purpose |
|---|---|---|---|
| `/health` | GET | REAL | Health check for Docker probes |
| `/agents` | GET | REAL | List registered agents |
| `/acheevy/execute` | POST | REAL | Main orchestration endpoint |
| `/acheevy/classify` | POST | REAL | Intent classification (regex) |
| `/llm/chat` | POST | REAL | LLM completion via OpenRouter |
| `/llm/stream` | POST | REAL | LLM streaming via OpenRouter |
| `/llm/models` | GET | REAL | Available model list |
| `/llm/usage` | GET | REAL | Token usage stats |
| `/chickenhawk/manifest` | POST | **NEW** | Dispatch manifest to Chicken Hawk |
| `/chickenhawk/status` | GET | **NEW** | Chicken Hawk execution status |
| `/chickenhawk/health` | GET | **NEW** | Chicken Hawk health check |
| `/chickenhawk/squads` | GET | **NEW** | Active squads |
| `/chickenhawk/emergency-stop` | POST | **NEW** | Kill switch |
| `/ii-agent/execute` | POST | **UPDATED** | Execute via ii-agent (Socket.IO) |
| `/ii-agent/research` | POST | **UPDATED** | Research via ii-agent |
| `/ii-agent/build` | POST | **UPDATED** | Build via ii-agent (SSE) |
| `/ii-agent/slides` | POST | **UPDATED** | Slides via ii-agent |
| `/ii-agent/health` | GET | **UPDATED** | ii-agent health check |
| `/ii-agent/cancel/:taskId` | POST | **UPDATED** | Cancel task |
| `/perform/styles` | GET | REAL | Card style registry |
| `/perform/athlete` | POST | REAL | Athlete page factory pipeline |
| `/api/perform/scout-hub/*` | ALL | PROXY | → Scout Hub (port 5001) |
| `/api/perform/film-room/*` | ALL | PROXY | → Film Room (port 5002) |
| `/api/perform/war-room/*` | ALL | PROXY | → War Room (port 5003) |
| `/pmo` | GET | REAL | PMO office list |
| `/house-of-ang` | GET | REAL | Boomer_Ang registry |
| `/house-of-ang/forge` | POST | REAL | Forge Boomer_Ang for task |
| `/templates` | GET | REAL | App template library |
| `/projects` | GET/POST | REAL | Project CRUD (in-memory) |
| `/plugs` | GET | REAL | Built plug artifacts |
| `/scaffold` | POST | REAL | Generate project files |
| `/deploy` | POST | REAL | Multi-tenant deploy |
| `/billing/tiers` | GET | REAL | 3-6-9 pricing tiers |
| `/lil-hawks` | GET | REAL | Squad profiles |
| `/luc/project` | POST | REAL | LUC cost estimation |
| `/ingress/acp` | POST | REAL | Full ACP pipeline (prep squad + oracle) |
| Plus 30+ more | Various | REAL | Auth, secrets, security, backup, incidents, etc. |

### Backend — Execution Chain (Updated)

```
Old:  ACHEEVY → iiAgent.executeTask() → ws://localhost:4001/ws → CONNECTION REFUSED → "queued"
New:  ACHEEVY → iiAgent.executeTask() → Socket.IO to ii-agent:8000 → execute task
      ↓ (fallback if ii-agent offline)
      ACHEEVY → buildManifest() → dispatchToChickenHawk() → POST http://chickenhawk-core:4001/api/manifest
      ↓ (fallback if both offline)
      "queued" message (last resort only)
```

---

## What Was Fixed in This Session

### 1. Chicken Hawk Wired Into Production
- **Added** `chickenhawk-core` service to `docker-compose.prod.yml`
- **Added** gateway routes: `/chickenhawk/manifest`, `/chickenhawk/status`, `/chickenhawk/health`, `/chickenhawk/squads`, `/chickenhawk/emergency-stop`
- **Added** env vars to UEF Gateway: `CHICKENHAWK_URL`

### 2. II-Agent Wired Into Production
- **Added** `ii-agent`, `ii-agent-postgres`, `ii-agent-tools`, `ii-agent-sandbox` to `docker-compose.prod.yml`
- **Rewrote** `IIAgentClient` to speak Socket.IO (ii-agent's native protocol) instead of raw WebSocket
- **Added** env vars to UEF Gateway: `II_AGENT_HTTP_URL`, `II_AGENT_WS_URL`
- **Installed** `socket.io-client` dependency in UEF Gateway

### 3. Orchestrator Rebuilt with Fallback Chain
- **Every intent handler** now follows: II-Agent → Chicken Hawk → queued
- **No more dead-end `status: 'queued'`** for any handler when either engine is online
- Clean handler separation: plugFabrication, performStack, skillExecution, pmoRouting, verticalExecution, deploymentHub, conversation

### 4. Landing Page Rebuilt
- **Honest** — only links to working features
- **"Live Now"** section with 5 verified working features
- **"Roadmap"** section with 8 items and honest ETAs
- No fake stats, no broken links

---

## Remaining Work — Prioritized Engineering Roadmap

### P0: Critical Path to Revenue (Q1 2026)

| Task | Files to Change | Effort | Dependency |
|---|---|---|---|
| Deploy Chicken Hawk to VPS | `deploy.sh` | 1 day | None |
| Deploy II-Agent stack to VPS | `deploy.sh`, `.env.production` | 2 days | Postgres, Redis |
| Configure Google OAuth | `.env.production`, Google Cloud Console | 1 day | None |
| Wire Stripe webhooks | `backend/uef-gateway/src/billing/`, frontend | 3 days | Stripe account |
| Gate features behind subscription | Frontend middleware, gateway billing checks | 2 days | Stripe |
| First Boomer_Ang worker (coder_ang) | `backend/boomer-angs/coder-ang/` | 5 days | Chicken Hawk deployed |

### P1: Per|Form Go-Live (Q1 2026)

| Task | Files to Change | Effort |
|---|---|---|
| Activate `--profile perform` in deploy | `deploy.sh` | 1 hour |
| Set BRAVE_API_KEY for real search | `.env.production` | 5 min |
| Frontend proxy routes for war-room | `frontend/app/api/gridiron/` | 2 hours |
| Persist rankings to Firebase/Redis | `services/gridiron/war-room/` | 1 day |
| Connect nightly cron for scout runs | `docker-compose.prod.yml` cron service | 1 day |

### P2: Platform Completeness (Q1-Q2 2026)

| Task | Effort |
|---|---|
| Build 5 more Boomer_Ang workers | 2 weeks |
| Add autonomous cron scheduling | 3 days |
| Wire PersonaPlex to GCP Cloud Run | 3 days |
| Deploy SAM 2 to Vertex AI | 2 days |
| Build Plug Marketplace frontend | 5 days |
| CDN deploy for generated sites | 3 days |
| ElevenLabs TTS for podcast generation | 1 day |
| Film upload infrastructure | 3 days |

### P3: Scale (Q2 2026)

| Task | Effort |
|---|---|
| Multi-sport expansion (basketball, baseball, soccer, track) | 2 weeks per sport |
| Cloud Run jobs for long-running tasks | 1 week |
| Full ORACLE 8-gate production enforcement | 1 week |
| LiveSim real-time agent visualization | 2 weeks |
| Firestore persistence for all stores | 1 week |

---

## Key Endpoints Reference (for Future Agents/Builds)

### Chicken Hawk Manifest Format

```json
{
  "manifest_id": "uuid",
  "requested_by": "ACHEEVY:userId",
  "approved_by": "ACHEEVY",
  "shift_id": "shift_timestamp_random",
  "plan": {
    "waves": [{
      "wave_id": 1,
      "tasks": [{
        "task_id": "task_uuid_1",
        "function": "fullstack|research|code|browser",
        "crew_role": "executor",
        "target": "sitebuilder_ang|researcher_ang",
        "params": { "prompt": "...", "userId": "..." },
        "badge_level": "green|amber|red",
        "wrapper_type": "SERVICE_WRAPPER",
        "estimated_cost_usd": 0.10,
        "timeout_seconds": 300
      }],
      "concurrency": 1,
      "gate": "all_pass"
    }]
  },
  "budget_limit_usd": 5.0,
  "timeout_seconds": 600,
  "created_at": "ISO-8601"
}
```

### II-Agent Socket.IO Protocol

```
Connect: io(url, { auth: { token, session_uuid } })
Join:    emit('join_session', { session_uuid })
Query:   emit('chat_message', { session_uuid, type: 'query', content: { text, agent_type, ... } })
Cancel:  emit('chat_message', { session_uuid, type: 'cancel', content: {} })
Events:  on('chat_event', { type: 'agent_response|complete|error|...', content: {...} })
```

### ACHEEVY Orchestrator Execution Flow

```
1. Frontend POSTs to /acheevy/execute with { userId, message, intent }
2. Orchestrator routes by intent prefix:
   - plug-factory:* → handlePlugFabrication (II-Agent fullstack → CH fallback)
   - perform-stack  → handlePerformStack (II-Agent research → CH fallback)
   - skill:*        → handleSkillExecution (II-Agent code/research → CH fallback)
   - vertical:*     → handleVerticalExecution (executeVertical → CH fallback)
   - pmo-route      → handlePmoRouting (n8n workflow → CH fallback)
   - spawn:*        → handleDeploymentHub (spawn Boomer_Ang)
   - default        → handleConversation (II-Agent → CH → LLM direct)
3. Every handler tries: II-Agent → Chicken Hawk → graceful fallback
```

---

## Docker Services Map

### Default Profile (11 containers)
nginx, certbot, frontend, demo-frontend, uef-gateway, house-of-ang, acheevy, redis, agent-bridge, n8n, circuit-metrics

### New Core Services (added this session)
chickenhawk-core, ii-agent, ii-agent-postgres, ii-agent-tools, ii-agent-sandbox

### Profile: `tier1-agents`
research-ang, router-ang

### Profile: `perform`
scout-hub, film-room, war-room

### Profile: `ii-agents` (legacy, replaced by new ii-agent stack)
agent-zero

---

## File Index for Quick Navigation

| What | Path |
|---|---|
| Docker Compose (prod) | `infra/docker-compose.prod.yml` |
| Deploy Script | `deploy.sh` |
| UEF Gateway entry | `backend/uef-gateway/src/index.ts` |
| ACHEEVY Orchestrator | `backend/uef-gateway/src/acheevy/orchestrator.ts` |
| II-Agent Client | `backend/uef-gateway/src/ii-agent/client.ts` |
| II-Agent Router | `backend/uef-gateway/src/ii-agent/router.ts` |
| Chicken Hawk Engine | `services/chicken-hawk/src/core/engine.ts` |
| Chicken Hawk Types | `services/chicken-hawk/src/types/manifest.ts` |
| Per|Form Contracts | `backend/uef-gateway/src/perform/contracts/index.ts` |
| Scout Hub | `services/gridiron/scout-hub/src/server.ts` |
| Film Room | `services/gridiron/film-room/src/server.ts` |
| War Room | `services/gridiron/war-room/src/server.ts` |
| Boomer_Ang Registry | `infra/boomerangs/registry.json` |
| ACHEEVY Brain | `aims-skills/ACHEEVY_BRAIN.md` |
| Skills (TS) | `aims-skills/` (47 .ts files) |
| Frontend Landing | `frontend/app/page.tsx` |
| Frontend Chat | `frontend/app/chat/page.tsx` |
| Frontend Per|Form Hub | `frontend/app/sandbox/perform/page.tsx` |

---

*Last updated: February 2026 by Claude Code audit session*
*Session: claude/review-recent-changes-BzQqv*
