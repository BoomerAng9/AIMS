# A.I.M.S. — Master Plan (Feb 20, 2026)

> **The single source of truth.** What's built. What's ready. What needs work. What to build next.
>
> **Repo:** `BoomerAng9/AIMS` | **VPS:** `76.13.96.107` | **Domain:** `plugmein.cloud`

---

## Completion Scorecard

```
DONE:      9 / 23 requirements   (39%)
PARTIAL:  10 / 23 requirements   (43%)
MISSING:   4 / 23 requirements   (17%)

Frontend pages:     51 real page.tsx files (many are substantial, some are shells)
Backend modules:   103 TypeScript files in uef-gateway/src/
Skills engine:      20+ skills, 12 hooks, 19 tasks
API routes:          9 perform + 1 make-it-mine = 10 real API routes
Prisma models:      25+ models (Per|Form, Arena, Platform)
Docker services:    15 default + 3 profile groups (19 total)
Evidence artifacts:  8 files
Docs:               35+ markdown files
```

---

## SECTION 1: WHAT'S READY (Ship-Ready, Verified on Disk)

These are DONE — code exists, builds pass, wired end-to-end.

### Infrastructure (All Green)

| Item | Key File(s) | Status |
|------|------------|--------|
| VPS Docker deployment | `deploy.sh` (307L), `infra/docker-compose.prod.yml` (841L) | DONE |
| Health check cascade | Compose `service_started` for non-critical deps | DONE |
| Prisma/SQLite builds in Docker | `frontend/prisma/schema.prisma` (855L, 25+ models) | DONE |
| nginx proxy + SSL | `infra/nginx/nginx.conf`, host certbot bind-mounted | DONE |
| Redis session store | Redis in compose, gateway uses `REDIS_URL` | DONE |
| CI pipeline | `cloudbuild.yaml` (131L), `.github/workflows/deploy.yml` | DONE |

### Core Chat Loop (Working)

| Item | Key File(s) | Status |
|------|------------|--------|
| ACHEEVY chat page | `frontend/app/dashboard/acheevy/page.tsx` (29L stub → routes to ChatInterface) | DONE |
| Main chat page | `frontend/app/chat/page.tsx` (898L) | DONE |
| Chat → UEF Gateway streaming | `streamChat()` in gateway, OpenRouter SSE | DONE |
| Model slugs | claude-opus-4-6, claude-sonnet-4-5, etc. | DONE |

### Dashboard & Pages (Built)

| Page | Lines | Notes |
|------|-------|-------|
| Landing page (`app/page.tsx`) | 655 | Styled, conference cards, hero |
| LUC billing dashboard | 1,163 | Full implementation |
| Deploy Dock | 902 | Ship/deploy management |
| The Hangar | 1,358 | 3D Boomer_Ang visual identity |
| Circuit Box | 1,159 | Agent monitoring dashboard |
| Model Garden | 1,167 | LLM model browser/selector |
| Pricing page | 884 | 3-6-9 tiers |
| DIY page (M.I.M.) | 792 | Camera + mic + hands-free mode |
| Arena | 333 + contest pages | Contests, leaderboard, wallet |
| Build dashboard | 839 | Build management |
| Boost Bridge | 629 | Integration hub |
| Buy in Bulk | 610 | Bulk purchasing |
| Blockwise | 610 | Block-based workspace |
| Garage to Global | 695 | Startup pipeline |

### Per|Form / Gridiron (Substantial)

| Component | Files | Lines | Status |
|-----------|-------|-------|--------|
| UI pages | 8 pages in `sandbox/perform/` | 2,422 total | DONE |
| Library | 8 files in `lib/perform/` | 3,594 total | DONE |
| API routes | 8 routes in `api/perform/` | 722 total | DONE |
| Prisma models | 10 models (Conference → DraftPick) | In schema.prisma | DONE |
| Mock draft engine | `mock-draft-engine.ts` | 441 | DONE |
| Conference data | `conferences.ts` (131 teams) | 426 | DONE |
| Subscription tiers | `subscription-models.ts` | 496 | DONE |

### M.I.M. D.U.M.B. Pipeline (Core Built)

| Component | File | Lines | Status |
|-----------|------|-------|--------|
| Research pipeline | `frontend/app/api/make-it-mine/route.ts` | 351 | DONE |
| Clone & customize engine | `backend/uef-gateway/src/make-it-mine/index.ts` | 590 | DONE |
| Idea validation skill | `aims-skills/skills/idea-validation.skill.ts` | 258 | DONE |
| ORACLE verification | `backend/uef-gateway/src/oracle/index.ts` | 359 | DONE |
| LUC cost engine | `backend/uef-gateway/src/luc/index.ts` | 121 | DONE |
| Template library | `backend/uef-gateway/src/templates/index.ts` | 482 | DONE |
| 6 industry presets | In make-it-mine engine | — | DONE |
| Hub page | `dashboard/make-it-mine/page.tsx` | 99 | DONE |

### Skills Engine (Extensive)

| Category | Count | Key Items |
|----------|-------|-----------|
| Skills | 20+ | idea-validation, chicken-hawk (3 files), stitch-nano-design, brave-search, kimi-k2.5 |
| Hooks | 12 | chain-of-command, gateway-enforcement, identity-guard, onboarding-flow |
| Tasks | 19 | web-search, remotion, speech-to-text, text-to-speech, telegram, discord |
| Brains | 13 | Agent brain definitions |
| Verticals | Directory exists | Revenue vertical definitions |
| ACHEEVY Brain | 1,147L | Master behavior document |

### Other Verified Assets

| Item | Status |
|------|--------|
| Competitor parity analysis | `docs/COMPETITOR_PARITY_ANALYSIS.md` (294L) |
| Launch playbook | `docs/LAUNCH_PLAYBOOK.md` (279L) |
| Deep Scout manifest | `docs/mim-builds/SUPERAGENT_DUMB_MANIFEST.md` (413L) |
| M.I.M. scope doc | `docs/MIM_DUMB_SCOPE.md` (311L) |
| 8 evidence artifacts | `evidence/` directory |
| Design system skill | `stitch-nano-design.skill.md` |
| Motion/interaction skill | `ui-interaction-motion.skill.md` |

---

## SECTION 2: WHAT'S PARTIAL (Built but Not Wired End-to-End)

These have real code but need specific work to become functional.

### Voice I/O (P0.7) — 70% Done

**What exists:** Groq STT, ElevenLabs TTS, Deepgram hooks/tasks, API keys cemented
**What's missing:**
- [ ] End-to-end wire: mic button → Groq STT → text → ACHEEVY → ElevenLabs TTS → audio playback
- [ ] Test on VPS with real audio
**Effort:** 1 session, ~2 hours

### Auth Flow (P0.8) — 60% Done

**What exists:** Sign-in (224L), sign-up (407L), forgot-password (121L), NextAuth configured, onboarding pages
**What's missing:**
- [ ] Google OAuth client ID + secret (needs user to create in GCP console)
- [ ] Wire NextAuth session → ACHEEVY chat access control
- [ ] Test full flow: sign-up → onboarding → chat
**Effort:** 1 session once credentials are provided

### Revenue Verticals (P1.1) — 40% Done

**What exists:** `vertical-definitions.ts`, gateway execution engine, vertical sandbox page (177L)
**What's missing:**
- [ ] Wire vertical detection to ACHEEVY chat flow (intent → vertical trigger)
- [ ] Implement Phase A step progression UI in chat
- [ ] Connect Phase B execution to Chicken Hawk dispatch
**Effort:** 2-3 sessions

### Single ACHEEVY Chat UI (P1.2) — 50% Done

**What exists:** `AcheevyChat.tsx` component, main chat page (898L)
**What's missing:**
- [ ] Wire ACHEEVY chat into all surfaces (dashboard, hangar, etc.)
- [ ] Consistent chat drawer/modal across pages
**Effort:** 1 session

### Onboarding Flow (P1.3) — 60% Done

**What exists:** Onboarding page (152L), step page (109L), onboarding hook (333L)
**What's missing:**
- [ ] Connect to auth flow
- [ ] Persist onboarding state
- [ ] Route new users through flow before dashboard access
**Effort:** 1 session

### Per|Form Lobby (P1.4) — 75% Done

**What exists:** 8 UI pages, 8 API routes, 8 lib files, mock draft engine, Prisma models
**What's missing:**
- [ ] Replace CFBD client → ncaa-api + Kaggle (data source migration)
- [ ] Live game data feed (ncaa-api scoreboard)
- [ ] Real content feed (not stub data)
**Effort:** 2 sessions (see Phase 2 below)

### Stripe Payments (P1.7) — 30% Done

**What exists:** `stripe.ts` with keys cemented, pricing page (884L), Per|Form pricing (542L)
**What's missing:**
- [ ] Stripe webhook endpoint
- [ ] Plan/product creation in Stripe dashboard
- [ ] Subscription management UI (upgrade/downgrade/cancel)
- [ ] LUC billing integration with Stripe metered billing
**Effort:** 2 sessions

### n8n Automation (P1.8) — 40% Done

**What exists:** n8n container in compose, agent bridge (agent-bridge service), workflow JSON
**What's missing:**
- [ ] Wire n8n webhooks to UEF Gateway triggers
- [ ] Build starter workflow templates
- [ ] Connect n8n outputs to ACHEEVY chat notifications
**Effort:** 1-2 sessions

### LiveSim (P2.1) — 20% Done

**What exists:** Vertical defined, UI spec, task file (`wire-livesim-ui.md`, 91L)
**What's missing:**
- [ ] WebSocket real-time agent feed
- [ ] LiveSim dashboard page
- [ ] Agent activity visualization
**Effort:** 2-3 sessions

### Chicken Hawk Vertical (P2.2) — 50% Done

**What exists:** `chicken-hawk-executor.skill.md` (368L), `chickenhawk-core` Docker service, squad manager, wave executor
**What's missing:**
- [ ] Wire chat intent to Chicken Hawk build trigger
- [ ] ByteRover context tree for codebase awareness
- [ ] ORACLE gate runners in real build pipeline
**Effort:** 2 sessions

---

## SECTION 3: WHAT'S MISSING (No Code Yet)

### Cloud Run Jobs (P2.4)

**Need:** Cloud Run job configs for scheduled autonomous tasks (content engine, builds, cron research)
**Files to create:**
- `infra/cloudrun/` — Job YAML definitions
- Cloud Run service accounts + IAM in GCP
- Trigger configs (Cloud Scheduler or Eventarc)
**Effort:** 2 sessions

### CDN Deploy Pipeline (P2.5)

**Need:** Push generated sites/apps to CDN with custom domains
**Files to create:**
- CDN provider integration (Cloudflare Pages, Vercel, or GCS + Cloud CDN)
- Domain mapping + SSL provisioning
- Deploy Dock UI wiring (page exists at 902L, needs backend)
**Effort:** 2 sessions

### PersonaPlex Full-Duplex Voice (P2.6)

**Need:** NVIDIA Nemotron on Vertex AI with real-time voice pipeline
**Files to create:**
- Vertex AI endpoint deployment config
- WebSocket/WebRTC voice bridge
- PersonaPlex integration in UEF Gateway
**Effort:** 3+ sessions (GPU provisioning, model deployment, latency optimization)

### Deep Scout — Superagent Clone (First M.I.M. Product)

**Need:** Multi-agent research engine + scrollytelling reports
**Files to create:**
- `/dashboard/deep-scout/` — Research input page
- `/dashboard/deep-scout/[id]/` — Live agent stream (SSE)
- `/report/[id]/` — Scrollytelling report renderer
- Multi-agent orchestrator (PlannerAgent, WebSearchAgent, SynthesisAgent, etc.)
- Interactive slide deck generator
- `/discover/` — Public gallery
**Effort:** 4-5 sessions

---

## SECTION 4: THE BUILD PLAN

### Phase 2A: FINISH THE CORE LOOP (Next 2-3 sessions)

**Goal:** User signs in → talks to ACHEEVY → gets real responses → voice works

| # | Task | Blocks | Effort |
|---|------|--------|--------|
| 1 | **Voice I/O end-to-end** — mic → Groq STT → ACHEEVY → ElevenLabs TTS → playback | Nothing | 1 session |
| 2 | **Auth flow** — Google OAuth setup, NextAuth wiring, session gating | Needs GCP credentials from user | 1 session |
| 3 | **Onboarding → Chat** — new user flow into ACHEEVY chat | Auth must work first | 0.5 session |
| 4 | **VPS deploy + smoke test** — full stack on plugmein.cloud | Voice + auth done first | 0.5 session |

**Exit criteria:** A new user can sign up at plugmein.cloud, complete onboarding, talk to ACHEEVY by voice, and get a spoken response.

---

### Phase 2B: PER|FORM DATA MIGRATION (2 sessions)

**Goal:** Replace CFBD (1K req/mo cap) with ncaa-api + Kaggle (unlimited)

| # | Task | Details |
|---|------|---------|
| 1 | **Add ncaa-api container** | Add to `docker-compose.prod.yml`, port 3004 internal, NCAA_HEADER_KEY |
| 2 | **Create `scripts/fetch-kaggle-data.sh`** | Download 4 Kaggle datasets, store in `data/kaggle/` |
| 3 | **Write `ncaa-client.ts`** | Live data: scoreboard, boxscores, standings, rankings, stats, logos |
| 4 | **Write `kaggle-data.ts`** | Historical: draft picks (13K), combine, recruiting, team stats |
| 5 | **Update `data-service.ts`** | Replace CFBD calls with ncaa-client + kaggle-data |
| 6 | **Delete `cfbd-client.ts`** | Remove all imports |
| 7 | **Update API routes** | All 8 routes in `/api/perform/` use new sources |
| 8 | **Test seed pipeline** | Full seed without hitting any rate limits |

**Exit criteria:** `npm run build` passes, seed works, no CFBD dependency.

---

### Phase 3: REVENUE VERTICALS (2-3 sessions)

**Goal:** 12 verticals work through Phase A conversational chains in ACHEEVY chat

| # | Task | Details |
|---|------|---------|
| 1 | **Intent classification** | ACHEEVY detects which vertical user is asking about |
| 2 | **Phase A step UI** | Multi-step conversational chain in chat interface |
| 3 | **Phase B dispatch** | Connect to Chicken Hawk for execution |
| 4 | **n8n triggers** | Automation verticals trigger n8n workflows |
| 5 | **Wire ACHEEVY chat everywhere** | Single chat component on all surfaces |

**Exit criteria:** User says "I need a website for my dental practice" → ACHEEVY walks them through the healthcare vertical → hands off to M.I.M. pipeline.

---

### Phase 4: M.I.M. D.U.M.B. PRODUCT LAUNCH (3-4 sessions)

**Goal:** M.I.M. builds real products end-to-end, starting with Deep Scout

| # | Task | Details |
|---|------|---------|
| 1 | **Web App sub-route** | `/dashboard/make-it-mine/web-app/` — project config + build trigger |
| 2 | **Deep Scout research engine** | Multi-agent orchestrator with SSE streaming |
| 3 | **Scrollytelling report renderer** | Interactive scroll-driven reports (killer feature) |
| 4 | **ORACLE 7-gate enforcement** | Real gate runners in build pipeline |
| 5 | **CDN deployment** | Push generated sites to CDN with custom domains |
| 6 | **BAMARAM receipts** | Completion receipts with evidence artifacts |

**Exit criteria:** User asks ACHEEVY to research a topic → Deep Scout runs → generates interactive scrollytelling report → offers to build the product described in the research.

---

### Phase 5: AUTONOMY + SCALE (3+ sessions)

**Goal:** Platform runs autonomously, handles payments, monitors itself

| # | Task | Details |
|---|------|---------|
| 1 | **Stripe 3-6-9 integration** | Webhooks, plan management, metered billing |
| 2 | **Cloud Run jobs** | Scheduled content engine, autonomous builds, cron research |
| 3 | **LiveSim WebSocket feed** | Real-time agent activity visualization |
| 4 | **PersonaPlex voice** | Nemotron on Vertex AI, full-duplex voice |
| 5 | **Circuit Metrics real data** | Wire monitoring dashboard to actual metrics |
| 6 | **Observability** | Logs, traces, alerts |
| 7 | **Load testing** | VPS capacity planning |

---

## SECTION 5: FILE MAP (Quick Reference)

### Root Level

| File | What It Is |
|------|-----------|
| `CLAUDE.md` | Project instructions for Claude Code sessions |
| `AIMS_PLAN.md` | SOP + PRD + roadmap + checklist |
| `AIMS_MASTER_PLAN.md` | **THIS FILE** — the full verified plan |
| `ANTIGRAVITY_HANDOFF.md` | Platform state handoff for Antigravity sessions |
| `MIM_DUMB_HANDOFF.md` | M.I.M. pipeline handoff |
| `HANDOFF.md` | Frontend handoff (recent changes) |
| `deploy.sh` | VPS deployment script (307L) |
| `cloudbuild.yaml` | GCP Cloud Build config (131L) |

### Frontend

| Directory | Contents |
|-----------|---------|
| `frontend/app/page.tsx` | Landing page (655L) |
| `frontend/app/chat/` | Main chat page (898L) |
| `frontend/app/(auth)/` | Sign-in, sign-up, forgot-password |
| `frontend/app/dashboard/` | 41 dashboard pages |
| `frontend/app/sandbox/perform/` | 8 Per\|Form pages |
| `frontend/app/api/perform/` | 8 API routes |
| `frontend/app/api/make-it-mine/` | 1 API route (351L) |
| `frontend/lib/perform/` | 8 library files (3,594L total) |
| `frontend/prisma/schema.prisma` | 25+ models (855L) |

### Backend

| Directory | Contents |
|-----------|---------|
| `backend/uef-gateway/src/` | 103 TypeScript files — gateway, LLM, agents, M.I.M., ORACLE, LUC |
| `backend/acheevy/src/` | 7 files (998L) — orchestrator, intent analyzer, DIY handler, vision |
| `backend/ii-agent/` | Full-stack code gen agent |

### Skills Engine

| Directory | Contents |
|-----------|---------|
| `aims-skills/ACHEEVY_BRAIN.md` | Master behavior doc (1,147L) |
| `aims-skills/skills/` | 20+ skills including chicken-hawk, stitch-nano, brave-search |
| `aims-skills/hooks/` | 12 hooks (chain-of-command, gateway, identity, onboarding) |
| `aims-skills/tasks/` | 19 task definitions |
| `aims-skills/brains/` | 13 agent brain definitions |
| `aims-skills/acheevy-verticals/` | Vertical definitions |

### Infrastructure

| File | Contents |
|------|---------|
| `infra/docker-compose.prod.yml` | 15 default + 4 profile services (841L) |
| `infra/nginx/nginx.conf` | Proxy config |

### Docs

| File | Lines | What |
|------|-------|------|
| `docs/MIM_DUMB_SCOPE.md` | 311 | M.I.M. capability scope |
| `docs/mim-builds/SUPERAGENT_DUMB_MANIFEST.md` | 413 | Deep Scout clone plan |
| `docs/COMPETITOR_PARITY_ANALYSIS.md` | 294 | Manus/Genspark/Flow comparison |
| `docs/LAUNCH_PLAYBOOK.md` | 279 | Launch checklist |
| `docs/CHICKENHAWK_SPEC.md` | — | Chicken Hawk specification |
| `docs/boost-bridge-architecture.md` | — | Integration architecture |
| `docs/design/OPUS_4_6_BRAND_DESIGN_BIBLE.md` | — | Brand design system |

---

## SECTION 6: ENV VARS STATUS

| Var | Status | Where |
|-----|--------|-------|
| `OPENROUTER_API_KEY` | Wired | `docker-compose.prod.yml` |
| `BRAVE_API_KEY` | Wired | `frontend/.env.local`, compose |
| `GROQ_API_KEY` | Cemented | STT voice input |
| `ELEVENLABS_API_KEY` | Cemented | TTS voice output |
| `DEEPGRAM_API_KEY` | Cemented | Backup STT |
| `REDIS_URL` | Wired | Compose internal |
| `DATABASE_URL` | Wired | Prisma SQLite |
| `CFBD_API_KEY` | Wired | **BEING REPLACED** — 1K/mo cap |
| `GOOGLE_CLIENT_ID` | **NEEDS USER** | Google OAuth |
| `GOOGLE_CLIENT_SECRET` | **NEEDS USER** | Google OAuth |
| `TAVILY_API_KEY` | **NOT PROVISIONED** | Search fallback |
| `SERPER_API_KEY` | **NOT PROVISIONED** | Search fallback |
| `FIRECRAWL_API_KEY` | **NOT PROVISIONED** | Deep scraping (non-blocking) |
| `STRIPE_SECRET_KEY` | Cemented | Needs webhook setup |
| `NCAA_HEADER_KEY` | **TO ADD** | For ncaa-api container |
| `PERSONAPLEX_ENDPOINT` | **TO ADD** | Vertex AI (Phase 5) |

---

## SECTION 7: BUILD & TEST COMMANDS

```bash
# Frontend build check
cd frontend && npm run build

# Backend build check
cd backend/uef-gateway && npm run build

# Skills tests
cd aims-skills && npm test

# VPS deploy
./deploy.sh --domain plugmein.cloud --landing-domain aimanagedsolutions.cloud

# First-time cert
./deploy.sh --domain plugmein.cloud --landing-domain aimanagedsolutions.cloud --email admin@aimanagedsolutions.cloud
```

---

## SECTION 8: SESSION ASSIGNMENT GUIDE

When spinning up a new Claude Code session, point it here:

1. **Read `CLAUDE.md`** — deployment rules, architecture, key rules
2. **Read `AIMS_MASTER_PLAN.md`** — THIS FILE — what's done, what's next
3. **Read the specific handoff doc** for the work area:
   - Platform/infra → `ANTIGRAVITY_HANDOFF.md`
   - M.I.M./Deep Scout → `MIM_DUMB_HANDOFF.md`
   - Frontend → `HANDOFF.md`
   - ACHEEVY behavior → `aims-skills/ACHEEVY_BRAIN.md`
4. **Pick a phase** from Section 4 and assign tasks

---

*Last verified: Feb 20, 2026 — All file counts confirmed on disk.*
*— ACHIEVEMOR / A.I.M.S.*
