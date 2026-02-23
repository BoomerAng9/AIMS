# A.I.M.S. — Antigravity Handoff (Feb 23, 2026)

> **Repo:** `BoomerAng9/AIMS`
> **Branch:** `main` (feature branches merge via PR)
> **VPS:** `76.13.96.107` (`srv1328075.hstgr.cloud`)
> **Domains:** `plugmein.cloud` (lore) | `aimanagedsolutions.cloud` (functions)
> **GCP Project:** `ai-managed-services`

---

## Current Completion: 52%

```
DONE:    12 items  (P0.1-6, P0.9-10, P1.5-6, P2.3, P2.7, Antigravity tooling, Design alignment)
PARTIAL: 10 items  (P0.7-8, P1.1-4, P1.7-8, P2.1-2)
MISSING:  4 items  (P2.4-6)
```

---

## Recent Changes (This Session)

| Change | Files |
|--------|-------|
| **Antigravity Master Instructions** | `.gemini/antigravity/ANTIGRAVITY_MASTER.md` — unified Stitch + Nano Banana Pro + NtNtN pipeline |
| **Stitch Persona Alignment** | `.stitch/persona.md` — fully aligned with RESET UI spec (light #F8FAFC theme) |
| **Nano Banana Pro Skill Update** | `aims-skills/skills/nano-banana-pro.md` — light theme visual identity |
| **Landing Page Wiring Fixes** | `frontend/app/page.tsx` — fixed banned text sizes, broken auth links, unused imports |
| **Handoff Update** | This file — current completion state |

### Landing Page Fixes Detail
- `text-[10px]` → `text-xs` (StatusBadge, footer)
- `text-[11px]` → `text-xs` (nav link, experience card CTAs)
- `/(auth)/sign-in` → `/sign-in` (broken parenthesized URL)
- `/(auth)/sign-up` → `/sign-up` (broken parenthesized URL)
- Removed unused imports: `AnimatePresence`, `Sparkles`, `Users`, `Code2`

---

## Architecture Overview

```
plugmein.cloud → nginx (:80/443) → Frontend Next.js (:3000)
                                  → UEF Gateway (:3001) → ACHEEVY (:3003)
                                                        → Redis (:6379)
                                                        → Agent Bridge (:3010)
                                                        → n8n (:5678)
                                                        → House of Ang (:3002)

SSL: Host certbot (apt), certs at /etc/letsencrypt, bind-mounted into nginx
CI:  GitHub Actions → Cloud Build → Artifact Registry (build+push only, no Cloud Run)
GPU: Vertex AI Endpoints for PersonaPlex / Nemotron inference
```

**15 default containers:** nginx, frontend, demo-frontend, uef-gateway, house-of-ang, acheevy, redis, agent-bridge, chickenhawk-core, n8n, circuit-metrics, ii-agent, ii-agent-postgres, ii-agent-tools, ii-agent-sandbox

**Optional profiles:**
- `--profile tier1-agents` → research-ang, router-ang
- `--profile ii-agents` → agent-zero
- `--profile perform` → scout-hub, film-room, war-room

---

## Antigravity Tooling Status

### Three-Tool Pipeline: COMPLETE

| Tool | Status | Key Files |
|------|--------|-----------|
| **Stitch** (UI Design) | READY | `.stitch/persona.md`, `stitch.sh`, `stitch.ps1`, `.gemini/instructions/stitch-integration.md` |
| **Nano Banana Pro** (Image Gen) | READY | `.gemini/instructions/nano-banana-pro.md`, `aims-skills/skills/nano-banana-pro.md` |
| **Gemini 3.1 Pro** (Code Gen) | READY | `.gemini/GEMINI.md`, `.gemini/antigravity/ANTIGRAVITY_MASTER.md` |

### Supporting Infrastructure: COMPLETE

| Component | Status | Key Files |
|-----------|--------|-----------|
| **RESET UI Spec** | ACTIVE | `RESET-UI-SPEC.md`, `.gemini/instructions/reset-ui-spec.md` |
| **UI Archetypes** | ACTIVE | `.gemini/instructions/ui-archetypes.md` |
| **Gap Reporting** | ACTIVE | `.gemini/instructions/gap-reporting.md` |
| **NtNtN Engine** | ACTIVE | `aims-skills/ntntn-engine/NTNTN_ENGINE.md` + 10 category files |
| **n8n WBT Framework** | ACTIVE | `.gemini/instructions/n8n-wbt-framework.md` |
| **Stitch-Nano Design Plan** | ACTIVE | `aims-skills/skills/stitch-nano-design.skill.md` |
| **Full Spec for Stitch** | ACTIVE | `AIMS_FULL_SPEC_FOR_STITCH.md` |

### Design Alignment: DONE
- `.stitch/persona.md` now follows light theme (#F8FAFC)
- `nano-banana-pro.md` skill updated for light theme assets
- `ANTIGRAVITY_MASTER.md` is the unified reference
- All tools reference RESET-UI-SPEC.md as sole authority

---

## Per|Form / Gridiron — Full File Inventory

### UI Pages (`frontend/app/sandbox/perform/`)

| File | What it does |
|------|-------------|
| `page.tsx` | Per\|Form Hub — main sports landing |
| `big-board/page.tsx` | Big Board — ranked prospect list |
| `content/page.tsx` | Content Feed — articles, podcasts, debates |
| `directory/page.tsx` | Conference Directory — 131 CFB teams across 9 conferences |
| `draft/page.tsx` | NFL Draft Hub — landing page |
| `draft/mock/page.tsx` | Mock Draft Board — completed 7-round draft display |
| `draft/simulator/page.tsx` | Draft Simulator — interactive pick-by-pick |
| `prospects/[slug]/page.tsx` | Prospect Profile — P.A.I. grade, scouting, NIL |

### Library (`frontend/lib/perform/`)

| File | What it does |
|------|-------------|
| `cfbd-client.ts` | **CFBD API client** — BEING REPLACED (see Data Source Migration) |
| `conferences.ts` | Static conference/team data (131 teams) |
| `data-service.ts` | Core data service — seeds DB, enriches via Brave Search |
| `mock-draft-engine.ts` | Draft engine — 32 teams x 7 rounds |
| `seed-draft-data.ts` | Seed helpers for draft data |
| `seed-prospects.ts` | Curated prospect seed data |
| `subscription-models.ts` | Subscription tier definitions |
| `types.ts` | Shared types |

---

## Data Source Migration: CFBD → ncaa-api + Kaggle

CFBD API capped at 1,000 req/month. Current `cfbd-client.ts` burns the budget in a single seed.

### New Architecture
```
Per|Form Data Layer
├── LIVE DATA → ncaa-api (self-hosted Docker, port 3000)
├── HISTORICAL DATA → Kaggle CSVs (downloaded once, loaded at build)
└── cfbd-client.ts → DELETED (replaced by above)
```

**Status:** PLANNED — not yet implemented.

---

## What Still Needs Work (Priority Order)

### HIGH — In Progress

| Item | Status | What's Left |
|------|--------|-------------|
| **Data Source Migration** | PLANNED | Add ncaa-api container, create clients, delete cfbd |
| **Per\|Form Lobby** (P1.4) | PARTIAL | Draft hub + simulator built; need live data, real content |
| **Voice I/O** (P0.7) | PARTIAL | Keys cemented; needs end-to-end wiring |
| **Auth Flow** (P0.8) | PARTIAL | Pages exist; needs Google OAuth client ID/secret |

### HIGH — Landing Page Polish

| Item | Notes |
|------|-------|
| ~~Banned text sizes~~ | FIXED — all text-[10px]/text-[11px] replaced with text-xs |
| ~~Broken auth links~~ | FIXED — /(auth)/sign-in → /sign-in |
| Conference cards | Currently show team names + color dots — needs polish |
| Big Board mobile | Table needs responsive work |
| Hero images | Verify assets exist at expected paths |

### HIGH — Frontend Wiring (from deploy_dock_redesign_plan.md)

| Item | Status |
|------|--------|
| FloatingACHEEVY header text | Says "ACHEEVY" not "Chat w/ACHEEVY" |
| ChatInterface.tsx duplicate import | Duplicate `ChangeOrder` on line 24-25 |
| Model Selector bezel label | No header bar label |
| Voice Selector visibility | Not visible on chat bezel |
| Persona Selector persistence | Only shows on empty messages |
| "My account" button | Non-functional — no dropdown/signout |

### MEDIUM

| Item | Status |
|------|--------|
| Stripe 3-6-9 integration (P1.7) | Keys cemented, needs webhook + plan setup |
| n8n workflow automation (P1.8) | Container running, bridge exists, needs workflow JSON |
| Revenue verticals Phase A (P1.1) | Definitions exist, need chat flow wiring |
| Chat → UEF Gateway full loop | Streaming works, needs model selection + thread persistence |

### LOW / MISSING

| Item | Status |
|------|--------|
| Cloud Run jobs (P2.4) | MISSING — no configs |
| CDN deploy pipeline (P2.5) | MISSING — UI exists, no push mechanism |
| PersonaPlex voice (P2.6) | MISSING — skill spec only |
| Workshop pages | Placeholder shells |
| Dashboard sub-pages | Most are shells |
| P0-P3 RESET spec compliance | 60+ pages need responsive/typography audit |

---

## Key Files to Know

| File | Purpose |
|------|---------|
| `CLAUDE.md` | Project instructions for Claude Code |
| `AIMS_PLAN.md` | Full SOP + PRD + roadmap + requirements |
| `ANTIGRAVITY_HANDOFF.md` | This file — Antigravity handoff |
| `.gemini/antigravity/ANTIGRAVITY_MASTER.md` | **Master Antigravity instructions** (Stitch + NBP + NtNtN) |
| `.gemini/GEMINI.md` | Gemini CLI project instructions |
| `.stitch/persona.md` | Stitch design persona (light theme aligned) |
| `RESET-UI-SPEC.md` | Functional website spec (design authority) |
| `aims-skills/ACHEEVY_BRAIN.md` | ACHEEVY behavior, skills, hooks |
| `aims-skills/ntntn-engine/NTNTN_ENGINE.md` | Creative development library |
| `infra/docker-compose.prod.yml` | Production Docker Compose |
| `deploy.sh` | VPS deployment script |
| `frontend/prisma/schema.prisma` | Database schema |

---

## Design System Skills

Load these before making any UI changes:

| Skill | Covers |
|-------|--------|
| `aims-global-ui` | Global layout, responsiveness, typography |
| `aims-landing-ui` | Landing page layout |
| `aims-chat-ui` | Chat stream, input bar, onboarding gate |
| `aims-command-center-ui` | Agent control surfaces |
| `aims-crm-ui` | CRM sidebar, list/kanban views |
| `aims-finance-analytics-ui` | KPI strips, charts, dashboards |
| `aims-workflow-ui` | Workflow builder |
| `aims-content-tools-ui` | Content/research tools |
| `aims-auth-onboarding-ui` | Sign-in, sign-up, profile setup |

Also read: `aims-skills/skills/stitch-nano-design.skill.md` and `aims-skills/skills/nano-banana-pro.md`

---

## Build & Test

```bash
cd frontend && npm run build           # Frontend — must pass
cd ../backend/uef-gateway && npm run build  # Backend
cd ../../aims-skills && npm test        # Skills/hooks
```

## Deploy

```bash
# Standard deploy
./deploy.sh --domain plugmein.cloud --landing-domain aimanagedsolutions.cloud

# First-time cert
./deploy.sh --domain plugmein.cloud --landing-domain aimanagedsolutions.cloud --email admin@aimanagedsolutions.cloud
```

---

## Env Vars (Per|Form specific)

| Var | Where | Notes |
|-----|-------|-------|
| `CFBD_API_KEY` | `frontend/.env` | **Being replaced** — 1k req/mo cap |
| `BRAVE_API_KEY` | `frontend/.env` | Prospect enrichment via Brave Search |
| `NCAA_HEADER_KEY` | `docker-compose.prod.yml` | Will be added for ncaa-api container |
| `DATABASE_URL` | `frontend/.env` | `file:./dev.db` (SQLite via Prisma) |

---

## Next Session Priorities

1. **P0 frontend wiring** — Fix FloatingACHEEVY, ChatInterface, Model/Voice selectors
2. **Auth flow completion** — Google OAuth client ID/secret, session wiring
3. **Dashboard RESET compliance** — Run typography/responsive audit on P0-P1 pages
4. **Data Source Migration** — Add ncaa-api container, create clients
5. **Voice I/O wiring** — End-to-end Groq STT → ElevenLabs TTS pipeline
6. **Stripe integration** — Webhook + plan setup for 3-6-9 tiers
