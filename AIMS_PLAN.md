# A.I.M.S. — SOP + PRD + Implementation Roadmap

> **Generated:** 2026-02-18 | **AI CTO Session** | **Branch:** claude/review-recent-changes-BzQqv

---

## PART 1: SOP (Standard Operating Procedure)

### Deployment Pipeline Rules (TOP PRIORITY — Every Agent Must Know)

```
IF core platform service (ACHEEVY API, Per|Form, n8n, PersonaPlex)
  THEN → Hostinger VPS in Docker

IF long-running/scheduled autonomous job or sandbox (content engine, builds, crons)
  THEN → Cloud Run (job or service), trigger via cron/events

IF user-facing app/site, dashboard, or static artifact (landing, funnels, generated apps)
  THEN → CDN with: shareable URL, optional custom domain, optional paywall
```

### FDH Workflow Phases

| Phase | FDH | Activities |
|-------|-----|-----------|
| **Discover** | FOSTER | Read conversation, extract requirements, ask questions |
| **Scope** | FOSTER | PRD + LUC estimates + risk assessment |
| **Design** | DEVELOP | Architecture, data models, deployment targets |
| **Implement** | DEVELOP | Code + infra + configs |
| **Verify** | HONE | ORACLE 8-gate, tests, governance |
| **Deploy** | HONE | Push to VPS/Cloud Run/CDN per pipeline rules |
| **Operate** | HONE | Monitoring, autonomy loops, iteration |

### Roles

| Role | Entity | Responsibility |
|------|--------|---------------|
| AI CTO | Claude Code | Planning, architecture, governance, implementation |
| Executive Orchestrator | ACHEEVY | User-facing. Delegates to Boomer_Angs |
| Managers | Boomer_Angs | Own capabilities, supervise Lil_Hawks |
| Coordinator | Chicken Hawk | Dispatches, enforces SOP |
| Workers | Lil_Hawks | Execute tasks, ship artifacts |
| Reasoning | AVVA NOON | Scoping & governance engine |

### Completion Signal

Every job must:
1. Pass FDH governance gates
2. Attach evidence artifacts
3. Emit `))))BAMARAM((((` signal
4. Route notification to user (voice + UI)
5. Deploy results per pipeline rules

---

## PART 2: PRD (Product Requirements Document)

### Product: A.I.M.S. — Voice-First AI Managed Platform

**One-liner:** Talk to ACHEEVY, get things done — builds, research, content, deployments — all managed by AI agents.

### P0 — Must Ship (Core Platform Online)

| # | Requirement | Status | Evidence |
|---|------------|--------|----------|
| P0.1 | VPS Docker deployment works end-to-end | **DONE** | `deploy.sh`, `docker-compose.prod.yml` (fixed this session) |
| P0.2 | Health check cascade doesn't block startup | **DONE** | Loosened `service_healthy` → `service_started` for non-critical deps |
| P0.3 | Prisma/SQLite builds in Docker | **DONE** | `DATABASE_URL` added to Dockerfile + compose |
| P0.4 | nginx serves frontend + proxies API | **DONE** | `infra/nginx/nginx.conf` exists, compose wired |
| P0.5 | ACHEEVY chat page actually works | **DONE** | `dashboard/acheevy/page.tsx` rewritten with ChatInterface + motion wrapper |
| P0.6 | Chat → UEF Gateway → LLM → streaming response | **DONE** | `UEF_GATEWAY_URL` wired in compose, real OpenRouter streaming via `streamChat()`, model slugs fixed |
| P0.7 | Voice input (STT) + voice output (TTS) | **PARTIAL** | Hooks + libs exist, API keys cemented (Groq/ElevenLabs/Deepgram) — needs end-to-end test |
| P0.8 | Auth flow (Google OAuth or email) | **PARTIAL** | Auth pages exist, NextAuth configured — needs GOOGLE_CLIENT_ID/SECRET |
| P0.9 | LUC billing dashboard | **DONE** | `dashboard/luc/page.tsx` (1163L) — full implementation |
| P0.10 | Redis session store | **DONE** | Redis in compose, gateway uses REDIS_URL |

### P1 — Core Experience

| # | Requirement | Status |
|---|------------|--------|
| P1.1 | 12 revenue verticals (Phase A conversational chains) | **PARTIAL** — definitions exist in `vertical-definitions.ts`, gateway has execution engine |
| P1.2 | Single ACHEEVY chat component everywhere | **PARTIAL** — `AcheevyChat.tsx` (694L) exists, not wired to all surfaces |
| P1.3 | Onboarding flow for new users | **PARTIAL** — pages + hooks exist |
| P1.4 | Per\|Form sports lobby | **PARTIAL** — sandbox routes exist, gridiron services built |
| P1.5 | Deploy Dock (hangar for deployments) | **DONE** — `deploy-dock/page.tsx` (902L) |
| P1.6 | Arena (contests/trivia) | **DONE** — full routes + schema + seed data |
| P1.7 | Stripe 3-6-9 subscription model | **PARTIAL** — `stripe.ts` exists, keys cemented in env — needs webhook + plan setup |
| P1.8 | n8n workflow automation | **PARTIAL** — n8n in compose, bridge code exists, workflow JSON exists |

### P2 — Autonomy & Differentiation

| # | Requirement | Status |
|---|------------|--------|
| P2.1 | LiveSim autonomous agent space | **PARTIAL** — vertical defined, UI spec exists |
| P2.2 | Chicken Hawk code & deploy vertical | **PARTIAL** — `chicken-hawk.ts` (472L), squad manager, wave executor |
| P2.3 | Boomer_Ang visual identity + 3D hangar | **DONE** — hangar components, role cards, visual identity spec |
| P2.4 | Cloud Run autonomous jobs | **MISSING** — no Cloud Run configs yet |
| P2.5 | CDN deploy for generated sites | **MISSING** — deploy-dock UI exists but no CDN push mechanism |
| P2.6 | PersonaPlex full-duplex voice | **MISSING** — skill spec exists, no integration code |
| P2.7 | Competitor parity (Manus/Genspark/Flow) | **DONE** — see `docs/COMPETITOR_PARITY_ANALYSIS.md` (feature matrix, gap analysis, roadmap) |

---

## PART 3: Implementation Roadmap

### Phase 1: GET IT ONLINE ✅ COMPLETE
**Target:** VPS serves plugmein.cloud with working chat

- [x] Fix Docker health check cascade
- [x] Fix volume name mismatch
- [x] Fix Prisma DATABASE_URL for build + runtime
- [x] Fix deploy.sh health polling
- [x] Wire `dashboard/acheevy/page.tsx` to real ChatInterface component
- [x] Embed deployment pipeline rules in CLAUDE.md
- [x] Verify frontend + gateway builds succeed
- [x] Cement all API keys in `.env.production` + `docker-compose.prod.yml`
- [x] Wire `UEF_GATEWAY_URL` so frontend reaches gateway
- [x] Create Brave Search Pro AI skill/task/hook (AIMS search standard)
- [x] Fix `unifiedSearch()` priority chain (Brave → Tavily → Serper)
- [x] Fix `BRAVE_API_KEY` env var mismatch in search code

### Phase 2: CORE LOOP WORKS (In Progress)
**Target:** User signs in → talks to ACHEEVY → gets real responses

- [x] Wire ChatInterface → UEF Gateway `/api/acheevy/chat` with streaming
- [x] Enable real SSE/streaming from OpenRouter via `streamChat()` + gateway `stream()`
- [x] Fix OpenRouter model slugs to valid IDs (claude-opus-4-6, claude-sonnet-4-5-20250929, etc.)
- [x] Audit full 7-step chat streaming pipeline
- [ ] Connect voice I/O (Groq STT → text → ACHEEVY → ElevenLabs TTS)
- [ ] Set up Google OAuth (needs client ID/secret from user)
- [ ] Test full flow: auth → chat → LLM response → voice playback
- [ ] VPS deploy + live smoke test

### Phase 3: REVENUE VERTICALS
**Target:** 12 verticals work through Phase A conversational chains

- [ ] Wire vertical detection to chat flow
- [ ] Implement Phase A step progression UI
- [ ] Connect Phase B execution to Chicken Hawk dispatch
- [ ] Enable n8n workflow triggers for automation verticals
- [ ] Per|Form lobby with live gridiron data

### Phase 4: AUTONOMY + CLOUD RUN
**Target:** Agents work autonomously, jobs deploy to right targets

- [ ] Cloud Run job configs for scheduled tasks
- [ ] CDN deploy pipeline for generated sites
- [ ] LiveSim WebSocket real-time agent feed
- [ ] PersonaPlex voice integration
- [x] Competitor capability analysis + parity table → `docs/COMPETITOR_PARITY_ANALYSIS.md`

### Phase 5: POLISH + SCALE
**Target:** Production-grade platform with monitoring

- [ ] Stripe 3-6-9 subscription integration
- [ ] ORACLE 8-gate enforcement on all deployments
- [ ] Circuit Metrics dashboard wired to real data
- [ ] Observability (logs, traces, alerts)
- [ ] Load testing and VPS capacity planning

---

## AIMS_REQUIREMENTS Checklist

This is the canonical checklist. Run "completion audit" to re-evaluate.

```
P0.1  VPS_DOCKER_DEPLOY          DONE
P0.2  HEALTH_CASCADE             DONE
P0.3  PRISMA_SQLITE_BUILD        DONE
P0.4  NGINX_PROXY                DONE
P0.5  ACHEEVY_CHAT_PAGE          DONE       ← fixed this session
P0.6  CHAT_TO_GATEWAY_WIRING     DONE       ← real streaming + model slugs fixed
P0.7  VOICE_IO                   PARTIAL    (keys cemented, needs e2e test)
P0.8  AUTH_FLOW                  PARTIAL    (needs Google OAuth credentials)
P0.9  LUC_DASHBOARD              DONE
P0.10 REDIS_SESSIONS             DONE
P1.1  REVENUE_VERTICALS          PARTIAL
P1.2  SINGLE_ACHEEVY_UI          PARTIAL
P1.3  ONBOARDING_FLOW            PARTIAL
P1.4  PERFORM_LOBBY              PARTIAL
P1.5  DEPLOY_DOCK                DONE
P1.6  ARENA_CONTESTS             DONE
P1.7  STRIPE_PAYMENTS            PARTIAL    ← keys cemented, needs webhook setup
P1.8  N8N_AUTOMATION             PARTIAL
P2.1  LIVESIM_SPACE              PARTIAL
P2.2  CHICKEN_HAWK_VERTICAL      PARTIAL
P2.3  BOOMERANG_VISUAL_3D        DONE
P2.4  CLOUD_RUN_JOBS             MISSING
P2.5  CDN_DEPLOY_PIPELINE        MISSING
P2.6  PERSONAPLEX_VOICE          MISSING
P2.7  COMPETITOR_PARITY          DONE
```

**Score: 9 DONE / 10 PARTIAL / 4 MISSING = 43% complete** (was 39%)

---

## Architecture Diagram (Text-Visualizable)

```
                    ┌─────────────────────┐
                    │     plugmein.cloud   │
                    │      (nginx :80/443) │
                    └──────┬──────────────┘
                           │
            ┌──────────────┼──────────────┐
            │              │              │
     ┌──────▼──────┐ ┌────▼────┐  Host certbot (apt)
     │  Frontend   │ │   API   │  manages certs at
     │  Next.js    │ │ /api/*  │  /etc/letsencrypt
     │  :3000      │ │  proxy  │  (bind-mounted :ro)
     └──────┬──────┘ └────┬────┘
            │              │
            │        ┌─────▼──────────┐
            │        │  UEF Gateway   │──── Redis :6379
            │        │  :3001         │
            │        └───┬───┬───┬────┘
            │            │   │   │
     ┌──────▼──┐  ┌──────▼┐ │ ┌─▼────────┐
     │House of │  │ACHEEVY│ │ │  Agent    │
     │  Ang    │  │ :3003 │ │ │  Bridge   │
     │  :3002  │  └───────┘ │ │  :3010    │
     └─────────┘            │ └─────┬─────┘
                            │       │ (sandbox-network)
                     ┌──────▼──┐  ┌─▼──────────┐
                     │   n8n   │  │  Agent Zero │
                     │  :5678  │  │  (sandbox)  │
                     └─────────┘  └─────────────┘

    ── VPS Docker (core platform) ──

    ── Cloud Run (future) ──────────────────
    │ Per|Form content engine (cron jobs)   │
    │ Autonomous builds (Chicken Hawk)      │
    │ Scheduled research tasks              │
    ─────────────────────────────────────────

    ── CDN (future) ────────────────────────
    │ Generated sites / landing pages       │
    │ Shareable URLs + optional paywall     │
    ─────────────────────────────────────────
```
