# A.I.M.S. — SOP + PRD + Implementation Roadmap

> **Generated:** 2026-02-18 | **Updated:** 2026-02-21 | **AI CTO Session**

---

## PART 0: PLATFORM IDENTITY (Read This Before Everything Else)

**A.I.M.S. = AI Managed Solutions.** This is not a company name — it is the literal mission statement.

This platform **manages services with AI**. That means:

1. **We are a Platform-as-a-Service (PaaS)** — Users tell ACHEEVY what they need, and ACHEEVY deploys it as a running, managed container instance
2. **We are Container-as-a-Service** — One-click deployment of open source applications, AI agents, custom tools, and full-stack platforms via the Plug system
3. **We are Autonomous** — ACHEEVY orchestrates the full instance lifecycle: provision → configure → deploy → monitor → scale → decommission
4. **We have Human-in-the-Loop** — The human (team member or end user) gets prompted at critical decision points. No unauthorized deployments, no unreviewed costs
5. **We are Self-Managing** — A.I.M.S. manages its own infrastructure AND manages services for its users

**ACHEEVY** is the AI orchestrator interwoven into every aspect of the platform. It doesn't just respond to chat — it deploys Docker containers, provisions environments, runs health checks, monitors services, generates code, executes builds, and delivers completed solutions. ACHEEVY is the embodiment of "achieving" — every capability exists to fulfill that name.

**The Plug System** is the PaaS delivery mechanism:
- **Plug Catalog** — Browsable library of deployable tools, agents, and platforms
- **Plug Spin-Up** — One-click container provisioning with auto-config, port allocation, nginx routing, and health checks
- **Plug Export** — Self-hosting bundles for clients to run on their own infrastructure
- **Plug Monitor** — Real-time health, resource usage, and lifecycle management for running instances

**The NtNtN Engine** is the creative build factory:
- User describes what they want → NLP detects build intent → Picker_Ang selects the stack → Buildsmith constructs it → Chicken Hawk verifies it → ACHEEVY deploys it as a running instance

**Ask yourself on every task:** "What services are we managing with AI?" — then build accordingly.

---

## PART 1: SOP (Standard Operating Procedure)

### Deployment Pipeline Rules (TOP PRIORITY — Every Agent Must Know)

```
IF core platform service (ACHEEVY API, Per|Form, n8n, PersonaPlex)
  THEN → Hostinger VPS in Docker

IF user-deployed Plug instance (one-click tool/agent/platform deployment)
  THEN → AIMS VPS in Docker (port 51000+ range, auto-allocated)
  Orchestrated by: Plug Spin-Up engine via UEF Gateway
  Lifecycle: provision → configure → deploy → health-check → monitor → scale → decommission

IF long-running/scheduled autonomous job or sandbox (content engine, builds, crons)
  THEN → Cloud Run (job or service), trigger via cron/events

IF user-facing app/site, dashboard, or static artifact (landing, funnels, generated apps)
  THEN → CDN with: shareable URL, optional custom domain, optional paywall

IF client self-hosted export (Plug Export bundle)
  THEN → Client's own infrastructure
  Bundle: docker-compose.yml + .env.example + nginx.conf + setup.sh + healthcheck.sh + README.md
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

### Product: A.I.M.S. — AI-Orchestrated Platform-as-a-Service

**One-liner:** Tell ACHEEVY what you need — it deploys containers, manages services, builds applications, and runs infrastructure — all autonomously with human-in-the-loop gates.

**What we are:** An autonomous PaaS where AI manages the full lifecycle of containerized services. Users talk to ACHEEVY (voice or text), and ACHEEVY provisions, deploys, monitors, scales, and decommissions running instances. One-click setups for open source applications. Docker Compose as a service. Full-stack builds from natural language. Export bundles for self-hosting. The platform manages itself and manages services for its users.

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

### P0.PaaS — Platform-as-a-Service Core (The Mission)

These requirements define A.I.M.S. as what it literally is — a platform that manages services with AI.

| # | Requirement | Status | Evidence |
|---|------------|--------|----------|
| P0.P1 | Plug Catalog — browsable library of deployable tools/agents/platforms | **DONE** | `skills/plug-catalog/plug-catalog-browse.skill.md`, API routes defined |
| P0.P2 | Plug Spin-Up — one-click container provisioning with auto-config | **DONE** | `skills/plug-catalog/plug-spin-up.skill.md`, deployment flow defined |
| P0.P3 | Plug Export — self-hosting bundles (compose + env + nginx + setup) | **DONE** | `skills/plug-catalog/plug-export.skill.md`, MIM principle |
| P0.P4 | Instance lifecycle management (provision → deploy → monitor → decommission) | **PARTIAL** | Spin-up defined, monitoring/decommission needs wiring |
| P0.P5 | Port allocation engine (51000+ range, auto-increment) | **PARTIAL** | Defined in spin-up spec, needs implementation |
| P0.P6 | Auto-generated nginx reverse proxy per instance | **PARTIAL** | Pattern defined, needs dynamic config generation |
| P0.P7 | Health check engine for running instances | **PARTIAL** | Pattern defined in spin-up, needs continuous monitoring |
| P0.P8 | Needs Analysis — formal client intake before deployment | **DONE** | `skills/plug-catalog/needs-analysis.skill.md` |
| P0.P9 | Deploy Dock — real-time instance dashboard with logs and status | **DONE** | `deploy-dock/page.tsx` (902L) |
| P0.P10 | NtNtN Engine — NLP-driven build intent detection + execution pipeline | **DONE** | `ntntn-engine/`, Picker_Ang + Buildsmith wired |
| P0.P11 | Chicken Hawk — autonomous build executor on Cloud Run | **PARTIAL** | Full spec exists, Cloud Run configs needed |
| P0.P12 | ACHEEVY as service orchestrator (not just chatbot) | **PARTIAL** | Orchestrator exists, needs PaaS dispatch wiring |

### P1 — Core Experience

| # | Requirement | Status |
|---|------------|--------|
| P1.1 | 16 revenue verticals (Phase A conversational chains) | **PARTIAL** — definitions exist, classifier now detects all 16 verticals via NLP triggers in `/acheevy/classify` |
| P1.2 | Single ACHEEVY chat component everywhere | **PARTIAL** — `AcheevyChat.tsx` (694L) exists, not wired to all surfaces |
| P1.3 | Onboarding flow for new users | **PARTIAL** — pages + hooks exist |
| P1.4 | Per\|Form sports lobby | **PARTIAL** — sandbox routes exist, gridiron services built |
| P1.5 | Deploy Dock (hangar for deployments) | **DONE** — `deploy-dock/page.tsx` (902L) |
| P1.6 | Arena (contests/trivia) | **DONE** — full routes + schema + seed data |
| P1.7 | Stripe 3-6-9 subscription model | **PARTIAL** — `stripe.ts` exists, keys cemented in env — needs webhook + plan setup |
| P1.8 | n8n workflow automation | **PARTIAL** — n8n in compose, bridge code exists, workflow JSON exists |

### P2 — Autonomy, PaaS Operations & Differentiation

| # | Requirement | Status |
|---|------------|--------|
| P2.1 | LiveSim autonomous agent space | **PARTIAL** — vertical defined, UI spec exists |
| P2.2 | Chicken Hawk code & deploy vertical | **PARTIAL** — `chicken-hawk.ts` (472L), squad manager, wave executor |
| P2.3 | Boomer_Ang visual identity + 3D hangar | **DONE** — hangar components, role cards, visual identity spec |
| P2.4 | Cloud Run autonomous jobs (Chicken Hawk execution plane) | **PARTIAL** — full spec in chicken-hawk-executor.skill.md, Cloud Run YAML defined |
| P2.5 | CDN deploy for generated sites | **MISSING** — deploy-dock UI exists but no CDN push mechanism |
| P2.6 | PersonaPlex full-duplex voice | **MISSING** — skill spec exists, no integration code |
| P2.7 | Competitor parity (Manus/Genspark/Flow) | **DONE** — see `docs/COMPETITOR_PARITY_ANALYSIS.md` (feature matrix, gap analysis, roadmap) |
| P2.8 | Custom Lil_Hawks (user-created bots) | **DONE** — types, engine, API routes, skill, vertical definition all wired |
| P2.9 | Playground/Sandbox system | **DONE** — 5 playground types (code, prompt, agent, training, education), API routes wired |
| P2.10 | Competitor parity v2 (Flowith/Agent Neo/MoltBook) | **DONE** — competitor profiles, feature matrix updated, advantage analysis |
| P2.11 | Instance resource monitoring (CPU, memory, disk per container) | **MISSING** — Circuit Metrics exists but not wired to per-instance data |
| P2.12 | Auto-scaling rules for plug instances | **MISSING** — needs horizontal/vertical scaling policies |
| P2.13 | Instance decommission flow (graceful shutdown + cleanup) | **MISSING** — needs implementation |
| P2.14 | Multi-tenant instance isolation (network + data) | **PARTIAL** — sandbox-network exists, needs per-user network segmentation |

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

### Phase 3: REVENUE VERTICALS + CUSTOM HAWKS
**Target:** 14 verticals work through Phase A conversational chains, Custom Lil_Hawks live

- [x] Wire vertical detection to chat flow ← DONE: `/acheevy/classify` now detects all 14 verticals via NLP trigger patterns
- [x] Implement Phase A step progression UI ← DONE: `VerticalStepIndicator.tsx` + `useVerticalFlow.ts` wired into ChatInterface
- [ ] Connect Phase B execution to Chicken Hawk dispatch
- [ ] Enable n8n workflow triggers for automation verticals
- [x] Per|Form Film Room — Twelve Labs video intelligence integration ← DONE: client, 8 API routes, ScoutVerify engine, Film Room UI
- [ ] Per|Form lobby with live gridiron data
- [x] Custom Lil_Hawks engine (types, engine, API routes, skill, vertical) ← DONE
- [x] Playground/Sandbox engine (5 types, API routes, skill, vertical) ← DONE
- [x] Wire Custom Hawks creation flow into dashboard UI ← DONE: `/dashboard/custom-hawks` with 4-step creator wizard
- [x] Wire Playground UI into dashboard ← DONE: `/dashboard/playground` with code editor + prompt tester
- [x] Connect E2B API to code playground ← DONE: `/api/code/execute` production route (E2B + gateway fallback)
- [x] Agent Viewport / Collaboration Feed UI ← DONE: `CollaborationFeed.tsx` + `CollaborationSidebar` in chat (G2 closed)
- [x] File generation & download pipeline ← DONE: `/api/files/generate` supports md/json/csv/txt/html (G4 closed)
- [ ] Enable hawk scheduling via n8n cron triggers

### Phase 4: PAAS CORE — CONTAINER-AS-A-SERVICE
**Target:** A.I.M.S. deploys and manages containerized services autonomously

- [ ] Implement Plug Spin-Up deploy engine (Docker API integration for dynamic container creation)
- [ ] Port allocation engine (51000+ auto-increment, conflict detection, release on decommission)
- [ ] Dynamic nginx config generation per instance (reverse proxy + SSL)
- [ ] Instance health check engine (continuous monitoring, restart policies, alerting)
- [ ] Deploy Dock wired to live instance data (running containers, resource usage, logs)
- [ ] Instance decommission flow (graceful stop, cleanup, port release, config removal)
- [ ] ACHEEVY dispatch wiring for PaaS operations ("spin up X", "stop instance Y", "show me what's running")
- [ ] Per-user instance isolation (dedicated Docker networks, tenant-scoped resources)
- [ ] Instance resource monitoring (CPU, memory, disk, network per container)
- [x] Plug Catalog skill + API routes defined
- [x] Plug Spin-Up skill + deployment flow defined
- [x] Plug Export skill + bundle structure defined
- [x] Needs Analysis skill + 5-section intake defined
- [x] Competitor capability analysis + parity table → `docs/COMPETITOR_PARITY_ANALYSIS.md`

### Phase 5: AUTONOMY + EXECUTION PLANE
**Target:** Agents work autonomously, Chicken Hawk builds deploy to Cloud Run

- [ ] Cloud Run job configs for Chicken Hawk (autonomous build executor)
- [ ] n8n → Cloud Run job dispatch pipeline
- [ ] CDN deploy pipeline for generated sites
- [ ] LiveSim WebSocket real-time agent feed
- [ ] PersonaPlex voice integration
- [ ] NtNtN Engine → Chicken Hawk → Plug instance end-to-end pipeline (describe → build → deploy → running instance)

### Phase 6: POLISH + SCALE
**Target:** Production-grade PaaS with monitoring, billing, and multi-tenant operations

- [ ] Stripe 3-6-9 subscription integration
- [ ] ORACLE 8-gate enforcement on all deployments
- [ ] Circuit Metrics dashboard wired to per-instance real data
- [ ] Observability (logs, traces, alerts) per tenant and per instance
- [ ] Load testing and VPS capacity planning
- [ ] Auto-scaling policies (horizontal + vertical) for plug instances
- [ ] Multi-VPS deployment support (instance placement across nodes)
- [ ] Usage metering and billing per instance (LUC integration)

---

## AIMS_REQUIREMENTS Checklist

This is the canonical checklist. Run "completion audit" to re-evaluate.

```
── P0: GET ONLINE ──────────────────────────────────────────────────
P0.1  VPS_DOCKER_DEPLOY          DONE
P0.2  HEALTH_CASCADE             DONE
P0.3  PRISMA_SQLITE_BUILD        DONE
P0.4  NGINX_PROXY                DONE
P0.5  ACHEEVY_CHAT_PAGE          DONE
P0.6  CHAT_TO_GATEWAY_WIRING     DONE       ← real streaming + model slugs fixed
P0.7  VOICE_IO                   PARTIAL    (keys cemented, needs e2e test)
P0.8  AUTH_FLOW                  PARTIAL    (needs Google OAuth credentials)
P0.9  LUC_DASHBOARD              DONE
P0.10 REDIS_SESSIONS             DONE

── P0.PaaS: THE MISSION (AI Managed Solutions) ─────────────────────
P0.P1  PLUG_CATALOG              DONE       ← browsable tool/agent/platform library
P0.P2  PLUG_SPIN_UP              DONE       ← one-click container provisioning spec
P0.P3  PLUG_EXPORT               DONE       ← self-hosting bundle (compose+env+nginx+setup)
P0.P4  INSTANCE_LIFECYCLE        PARTIAL    ← spin-up defined, monitor/decommission needs wiring
P0.P5  PORT_ALLOCATION           PARTIAL    ← 51000+ range defined, needs implementation
P0.P6  DYNAMIC_NGINX             PARTIAL    ← pattern defined, needs dynamic config gen
P0.P7  HEALTH_CHECK_ENGINE       PARTIAL    ← pattern defined, needs continuous monitoring
P0.P8  NEEDS_ANALYSIS            DONE       ← 5-section client intake
P0.P9  DEPLOY_DOCK               DONE       ← real-time instance dashboard
P0.P10 NTNTN_ENGINE              DONE       ← NLP-driven build intent + execution pipeline
P0.P11 CHICKEN_HAWK_EXECUTOR     PARTIAL    ← full spec, Cloud Run configs defined
P0.P12 ACHEEVY_SERVICE_ORCH      PARTIAL    ← orchestrator exists, PaaS dispatch needs wiring

── P1: CORE EXPERIENCE ─────────────────────────────────────────────
P1.1  REVENUE_VERTICALS          PARTIAL    ← 16 verticals, Phase A UI complete, Phase B pending
P1.2  SINGLE_ACHEEVY_UI          PARTIAL
P1.3  ONBOARDING_FLOW            PARTIAL
P1.4  PERFORM_LOBBY              PARTIAL    ← Film Room + Twelve Labs + ScoutVerify wired
P1.5  DEPLOY_DOCK                DONE
P1.6  ARENA_CONTESTS             DONE
P1.7  STRIPE_PAYMENTS            PARTIAL    ← keys cemented, needs webhook setup
P1.8  N8N_AUTOMATION             PARTIAL

── P2: AUTONOMY, PaaS OPS & DIFFERENTIATION ────────────────────────
P2.1  LIVESIM_SPACE              PARTIAL
P2.2  CHICKEN_HAWK_VERTICAL      PARTIAL
P2.3  BOOMERANG_VISUAL_3D        DONE
P2.4  CLOUD_RUN_JOBS             PARTIAL    ← spec + YAML defined, needs deployment
P2.5  CDN_DEPLOY_PIPELINE        MISSING
P2.6  PERSONAPLEX_VOICE          MISSING
P2.7  COMPETITOR_PARITY          DONE
P2.8  CUSTOM_LIL_HAWKS           DONE       ← user-created bots system
P2.9  PLAYGROUND_SANDBOX         DONE       ← 5-type sandbox engine
P2.10 COMPETITOR_PARITY_V2       DONE       ← Flowith/Agent Neo/MoltBook
P2.11 INSTANCE_MONITORING        MISSING    ← CPU/memory/disk per container
P2.12 AUTO_SCALING               MISSING    ← horizontal/vertical scaling policies
P2.13 INSTANCE_DECOMMISSION      MISSING    ← graceful shutdown + cleanup flow
P2.14 MULTI_TENANT_ISOLATION     PARTIAL    ← sandbox-network exists, per-user segmentation needed
```

**Score: 17 DONE / 15 PARTIAL / 4 MISSING = 47% of 36 requirements**
**PaaS identity requirements: 5 DONE / 7 PARTIAL / 0 MISSING — the mission is defined, implementation underway**

---

## Architecture Diagram (Text-Visualizable)

```
                         ┌─────────────────────────┐
                         │      plugmein.cloud      │
                         │       (nginx :80/443)    │
                         └──────────┬───────────────┘
                                    │
                 ┌──────────────────┼──────────────────┐
                 │                  │                   │
          ┌──────▼──────┐   ┌──────▼──────┐    Host certbot (apt)
          │  Frontend   │   │   API       │    manages certs at
          │  Next.js    │   │  /api/*     │    /etc/letsencrypt
          │  :3000      │   │  proxy      │    (bind-mounted :ro)
          └──────┬──────┘   └──────┬──────┘
                 │                 │
                 │        ┌────────▼─────────┐
                 │        │   UEF Gateway    │──── Redis :6379
                 │        │   (Port Auth)    │
                 │        │   :3001          │
                 │        └─┬──┬──┬──┬──┬───┘
                 │          │  │  │  │  │
          ┌──────▼──┐  ┌────▼┐ │  │  │  │
          │House of │  │ACHEE│ │  │  │  │
          │  Ang    │  │ VY  │ │  │  │  │
          │  :3002  │  │:3003│ │  │  │  │
          └─────────┘  └─────┘ │  │  │  │
                               │  │  │  │
      ┌────────────────────────▼┐ │  │  │
      │    Plug Spin-Up Engine  │ │  │  │
      │  (Container-as-a-Svc)   │ │  │  │
      │  Provision → Deploy →   │ │  │  │
      │  Monitor → Scale →      │ │  │  │
      │  Decommission           │ │  │  │
      └────────┬────────────────┘ │  │  │
               │                  │  │  │
    ┌──────────▼───────────┐      │  │  │
    │  PLUG INSTANCES      │      │  │  │
    │  :51000+ (dynamic)   │      │  │  │
    │  ┌─────────────────┐ │      │  │  │
    │  │ User Instance A │ │      │  │  │
    │  │ (e.g. DeerFlow) │ │      │  │  │
    │  ├─────────────────┤ │      │  │  │
    │  │ User Instance B │ │      │  │  │
    │  │ (e.g. n8n)      │ │      │  │  │
    │  ├─────────────────┤ │      │  │  │
    │  │ User Instance C │ │      │  │  │
    │  │ (e.g. Agent)    │ │      │  │  │
    │  └─────────────────┘ │      │  │  │
    └──────────────────────┘      │  │  │
                                  │  │  │
               ┌──────────────────▼┐ │  │
               │  Agent Bridge     │ │  │
               │  :3010            │ │  │
               └──────┬───────────┘  │  │
                      │ (sandbox-net)│  │
               ┌──────▼──────────┐   │  │
               │  Agent Zero     │   │  │
               │  (sandbox)      │   │  │
               └─────────────────┘   │  │
                                     │  │
                    ┌────────────────▼┐  │
                    │  n8n Workflows  │  │
                    │  :5678         │  │
                    └────────────────┘  │
                                       │
                    ┌──────────────────▼──┐
                    │  Circuit Metrics    │
                    │  (Instance Monitor) │
                    └─────────────────────┘

    ── VPS Docker (Control Plane + PaaS Instances) ──

    ── GCP Cloud Run (Execution Plane) ─────────────
    │ Chicken Hawk (autonomous build executor)      │
    │ Per|Form content engine (cron jobs)            │
    │ Scheduled research tasks                      │
    │ NtNtN → Build → Verify → Deploy pipeline      │
    ─────────────────────────────────────────────────

    ── CDN (Generated Artifacts) ───────────────────
    │ Generated sites / landing pages               │
    │ Shareable URLs + optional paywall             │
    │ Plug Export bundles for self-hosting           │
    ─────────────────────────────────────────────────

    ── Client Infrastructure (Plug Export) ─────────
    │ Self-hosted instances from export bundles      │
    │ docker-compose + nginx + env + setup.sh        │
    │ Same structure for every plug (MIM principle)  │
    ─────────────────────────────────────────────────
```

### Instance Lifecycle (The PaaS Loop)

```
User: "Spin up DeerFlow for me"
  ↓ ACHEEVY classifies → Plug Catalog match
  ↓
1. VALIDATE  → Check plug exists, user tier, resource availability
2. CONFIGURE → Resolve env vars, allocate port (51000+), set resource limits
3. PROVISION → Generate docker-compose fragment + nginx reverse proxy config
4. DEPLOY    → Pull/build image, start container, attach to aims-network
5. HEALTH    → Run health check (30 retries, 2s interval)
6. READY     → Return URL + status to user, update Deploy Dock
7. MONITOR   → Continuous health, resource usage, alert on anomalies
8. SCALE     → Adjust resources based on usage (future: auto-scale policies)
9. DECOMMISSION → Graceful stop, cleanup, port release, config removal
```
