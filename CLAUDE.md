# A.I.M.S. — Claude Code Project Instructions

## What A.I.M.S. IS (Read This First)

**A.I.M.S. = AI Managed Solutions.** That is not a company name — it is the literal job description.
This platform **manages services with AI**. Every feature, every container, every agent, every
deployment exists to fulfill that mission.

**What does that mean concretely?**
- **Platform as a Service (PaaS)** — Users deploy containers, stacks, and full environments through ACHEEVY
- **Container-as-a-Service** — One-click deployment of open source apps, custom tools, AI agents, and full-stack platforms
- **Autonomous Operations** — ACHEEVY doesn't just chat. It provisions infrastructure, deploys instances, monitors health, scales resources, and decommissions services
- **Instance Lifecycle Management** — Create → Configure → Deploy → Monitor → Scale → Decommission — all orchestrated by AI
- **Human-in-the-Loop** — The team or the end user gets prompted when decisions are needed. No action without authorization on critical paths
- **Self-Managing Platform** — A.I.M.S. manages its own infrastructure AND manages services for its users

**ACHEEVY** is the AI orchestrator that ties everything together. It is interwoven into every aspect
of the platform. It doesn't just respond to chat — it deploys Docker containers, spins up instances,
runs health checks, monitors services, and delivers completed solutions. ACHEEVY is the embodiment
of "achieving" — it must fully accomplish what its name represents.

**The Plug System** is the delivery mechanism:
- **Plug Catalog** — Browsable library of deployable tools, agents, and platforms
- **Plug Spin-Up** — One-click container provisioning with auto-config, port allocation, nginx routing, and health checks
- **Plug Export** — Self-hosting bundles (Docker Compose + env + nginx + setup script) for clients to run anywhere
- **Plug Monitor** — Real-time health, resource usage, and lifecycle management for running instances

**Ask yourself:** "What services are we managing with AI?" Then look at the stack. That's the answer.

---

## Deployment Pipeline Rules

These rules determine WHERE every piece of code deploys. Apply them to every task:

```
IF core platform service (ACHEEVY API, UEF Gateway, Per|Form, House of Ang, Redis)
  THEN → AIMS Core VPS (76.13.96.107 / srv1328075.hstgr.cloud) in Docker
  Files: infra/docker-compose.prod.yml, deploy.sh
  Deploy: ./deploy.sh --domain plugmein.cloud --landing-domain aimanagedsolutions.cloud
  First-time cert: ./deploy.sh --domain plugmein.cloud --landing-domain aimanagedsolutions.cloud --email admin@aimanagedsolutions.cloud

IF user-deployed Plug instance (one-click tool/agent/platform deployment)
  THEN → AIMS VPS in Docker (port 51000+ range, auto-allocated)
  Orchestrated by: Plug Spin-Up engine via UEF Gateway
  Config: Auto-generated docker-compose + nginx reverse proxy per instance
  Lifecycle: provision → configure → deploy → health-check → monitor → scale → decommission

IF GPU-accelerated AI inference (PersonaPlex / Nemotron model serving)
  THEN → GCP Vertex AI Endpoints (GPU: L4 or A100)
  Model: nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B-Base-BF16 (MoE, 3B active params)
  License: NVIDIA Nemotron Open Model License (commercial OK)
  The UEF Gateway calls this via PERSONAPLEX_ENDPOINT env var.

IF autonomous build/execution job (Chicken Hawk builds, scheduled tasks)
  THEN → GCP Cloud Run Jobs (sandboxed, scale-to-zero, 60 min timeout)
  Triggered by: ACHEEVY dispatch, automation pipelines, or API events
  VPC connector to reach Firestore, ByteRover, LUC on internal network

IF CI pipeline (image builds on push to main)
  THEN → GCP Cloud Build → Artifact Registry (us-central1-docker.pkg.dev)
  Files: cloudbuild.yaml, .github/workflows/deploy.yml
  VPS pulls images via deploy.sh

IF client self-hosted export (Plug Export bundle)
  THEN → Client's own infrastructure
  Bundle: docker-compose.yml + .env.example + nginx.conf + setup.sh + healthcheck.sh + README.md
  Same structure for every plug — only content changes (MIM principle)
```

## Project Overview
A.I.M.S. (AI Managed Solutions) is an autonomous, AI-orchestrated Platform-as-a-Service.
ACHEEVY is the executive orchestrator — it manages the full lifecycle of containerized services,
from provisioning to monitoring to decommissioning, with human-in-the-loop gates where needed.

Domain: plugmein.cloud | AIMS VPS: 76.13.96.107 | GCP: ai-managed-services

## ACHEEVY Brain
The single source of truth for ACHEEVY's behavior, skills, hooks, and recurring tasks:
**`aims-skills/ACHEEVY_BRAIN.md`**

Read that file before making any changes to ACHEEVY's behavior, skills, hooks, verticals, or chain-of-command logic.

## Current Status & Plan
See **`AIMS_PLAN.md`** for the full SOP, PRD, implementation roadmap, and AIMS_REQUIREMENTS checklist.

## Architecture
- **Frontend**: Next.js 14 (App Router) at `frontend/`
- **Backend**: Express gateway at `backend/uef-gateway/`, ACHEEVY service at `backend/acheevy/`
- **Skills Engine**: `aims-skills/` — hooks, skills, tasks, verticals, chain-of-command
- **Infra**: Docker Compose at `infra/`, deploy script at root (`deploy.sh`)
- **Plug Engine**: Container provisioning, port allocation, nginx routing, health checks — the PaaS delivery layer
- **NtNtN Engine**: Creative development library — NLP-driven build intent detection + execution pipeline
- **PersonaPlex**: NVIDIA Nemotron-3-Nano-30B-A3B on GCP Vertex AI — called via `PERSONAPLEX_ENDPOINT`
- **CI Pipeline**: GitHub Actions → Cloud Build → Artifact Registry (build+push only)

### VPS Services (default deploy, no profiles)
nginx, frontend, demo-frontend, uef-gateway, house-of-ang, acheevy, redis, agent-bridge, chickenhawk-core, circuit-metrics, ii-agent, ii-agent-postgres, ii-agent-tools, ii-agent-sandbox (14 containers)
SSL: host certbot (apt) — certs at /etc/letsencrypt, bind-mounted into nginx container

### User-Deployed Plug Instances (dynamic, on-demand)
Any plug from the catalog can be deployed as a running container instance on the VPS.
Port range: 51000+ (auto-allocated in 10-port increments). Each instance gets its own
nginx reverse proxy config, health check, and lifecycle management via ACHEEVY.

### Optional profiles
- `--profile tier1-agents` → research-ang, router-ang
- `--profile ii-agents` → agent-zero
- `--profile perform` → scout-hub, film-room, war-room (Per|Form / Gridiron)

## A.I.M.S. GATEWAY SYSTEM

The A.I.M.S. GATEWAY SYSTEM (formerly DEOM Gateway System) is the multi-channel access,
security, and service delivery layer for the entire platform. It governs WHO can access WHAT
and HOW they interact with the platform.

### History
The original DEOM Gateway System was built for Saudi Arabia — connecting businesses to the
General Authority of Zakat and VAT through secure one-way API tokens, ERP reporting, and
subscription-based compliance services. The A.I.M.S. GATEWAY SYSTEM inherits that lineage
but is re-engineered for global use.

### Multi-Channel Access

**Admin Channel** — `admin.aimanagedsolutions.cloud`
- Owner/Developer access to both `plugmein.cloud` and `aimanagedsolutions.cloud`
- Developer-mode interface — full visibility into all agents
- Boomer_Ang management (create, configure, assign, monitor)
- Lil_Hawk management (deploy, task assignment, status tracking)
- Chicken Hawk management (safety policies, audit logs, compliance gates)
- ACHEEVY remains the orchestrator, but the owner can manage all agent layers directly
- Infrastructure, Docker, deployment, and monitoring tools fully exposed

**User Channel** — `plugmein.cloud` (main domain)
- Customer-facing access — simplified, clean UI
- Users interact ONLY with ACHEEVY — no agent names exposed
- No developer access, no infrastructure visibility
- Paywalled features, managed service experience
- White-label version may grant developer access later (not now)

### Security Layer
Security features and parameters are enabled by default for BOTH admin and user channels:
- Secure Drop Tokens (SDTs) for artifact delivery
- Evidence Locker with chain-of-custody tracking
- Certification gates for Plug marketplace
- Role-based access (OWNER, ADMIN, CUSTOMER, DEMO_USER)
- Audit trail on all Gateway events

### LUC (Locale Universal Calculator) Integration
The Gateway System integrates LUC as the universal calculation engine:
- **Foundation**: Built from the Flip Secrets real estate calculator (`aims-tools/luc/presets/real-estate-flip/`)
- **K1 Taxation**: Real estate K1 reporting — critical for investors and enterprise users
- **Zakat/VAT**: Saudi market plug-in for ERP integration and Zakat reporting
- **North America**: K1 taxation, real estate taxes, business tax calculation
- **Customizable**: Base LUC engine can be customized per customer use case via CLI tooling
- **Billing**: All calculations metered through LUC usage tracking

### Gateway Services (aims-skills/gateway/)
- **SDT Service** — Issue, revoke, rotate, validate Secure Drop Tokens
- **Evidence Locker** — Artifact storage with SHA-256 integrity and custody chain
- **Certification Gate** — Plug certification pipeline (review, check, certify, exception)
- **Submission Service** — Form-based submissions to external parties
- **Compliance Packs** — Region/industry compliance bundles
- **Operations Engine** — Job packets, LUC quotes, operations feed
- **Event Bus** — 24+ event types for full audit trail

## Key Rules
1. All tool access goes through Port Authority (UEF Gateway) — no direct service exposure
2. Only ACHEEVY speaks to the user — never internal agent names
3. Every completed task requires evidence (no proof, no done)
4. Skills follow the taxonomy: Hooks (before), Tasks (do), Skills (guide)
5. Verticals have 2 phases: Phase A (conversational), Phase B (execution)
6. A.I.M.S. manages services with AI — every feature must serve that mission
7. Plug instances follow the full lifecycle: provision → deploy → monitor → scale → decommission
8. Human-in-the-loop gates on critical paths — no unauthorized deployments, no unreviewed costs

## When Modifying ACHEEVY Behavior
1. Read `aims-skills/ACHEEVY_BRAIN.md` first
2. Make changes in the appropriate file (hooks/, skills/, tasks/, acheevy-verticals/)
3. Update the brain file to reflect changes
4. Export new modules from the relevant index.ts

## Agent Naming Conventions — MANDATORY

### Spelling
- **ACHEEVY** — NOT "ACHEVY", NOT "Achevy". Double-E, double-V-Y.
- **A.I.M.S. GATEWAY SYSTEM** — Formerly "DEOM Gateway System". NOT "DEON", NOT "DM Gateway", NOT "Dion Gateway". Always "A.I.M.S. GATEWAY SYSTEM"

### Agent Hierarchy Names
- **Boomer_Ang** — Manager-level agents. Name format: `Name_Ang` (e.g., SME_Ang, Researcher_Ang, Quality_Ang). NOT "boomerang".
- **Lil_Hawk** — Worker-level agents. Name format: `Lil_X_Hawk` where X is a short nickname (e.g., Lil_Creddy_Hawk, Lil_Scout_Hawk). NEVER "Name_Hawk" without "Lil_" prefix.
- **Chicken Hawk** — Coordinator/safety bot. Always "Chicken Hawk" (two words).

### Examples of WRONG naming
```
WRONG: Credential_Hawk    → CORRECT: Lil_Creddy_Hawk
WRONG: Scout_Hawk         → CORRECT: Lil_Scout_Hawk
WRONG: boomerang          → CORRECT: Boomer_Ang
WRONG: ACHEVY             → CORRECT: ACHEEVY
WRONG: DM Gateway         → CORRECT: A.I.M.S. GATEWAY SYSTEM
WRONG: DEON Gateway       → CORRECT: A.I.M.S. GATEWAY SYSTEM (historical name was DEOM, now renamed)
```

## Documented Mistakes (Learn From These)

1. Named a Lil_Hawk as "Credential_Hawk" instead of "Lil_Creddy_Hawk" — Lil_Hawks ALWAYS follow `Lil_X_Hawk` pattern
2. Spelled ACHEEVY as "ACHEVY" — must be double-E
3. Called A.I.M.S. GATEWAY SYSTEM by wrong names ("DM Gateway", "DEON Gateway") — the original system was DEOM Gateway System, now renamed to A.I.M.S. GATEWAY SYSTEM
4. Wrapped entire sections in ScrollReveal, causing IntersectionObserver collapse (opacity:0) — only use per-element ScrollReveal
5. ACHEEVY chat was told it could see images — it cannot, text-only backend
6. Internal agent names exposed in public-facing UI — only ACHEEVY speaks to users
7. Design skills exist but were never auto-triggered during builds
8. MIT license was applied — this is proprietary, not open source
9. Called Boomer_Ang agents "boomerangs" — the correct name is always **Boomer_Ang** (with underscore). Never "boomerang", "boomerangs", or "Boomerang"

## Testing
```bash
cd frontend && npm run build    # Frontend build check
cd backend/uef-gateway && npm run build  # Backend build check
cd aims-skills && npm test      # Skills/hooks tests
```

## Design System Auto-Trigger (MANDATORY)

When building or modifying ANY frontend page, you MUST follow these rules:

1. **Classify the page** using the archetype mapping below
2. **Read the matching skill file** BEFORE writing any code
3. **For landing/marketing pages**, ALSO apply `aims-animated-web` skill
4. **ALL animation timing** MUST use tokens from `frontend/lib/motion/tokens.ts` — NO magic numbers
5. **ALL animation variants** MUST come from `frontend/lib/motion/variants.ts`
6. **Reusable components** live in `frontend/components/motion/` — use them before writing custom animations
7. **ALWAYS apply** `aims-global-ui` rules (colors, spacing, typography, light theme) in addition to the archetype

### Path → Archetype Mapping

| Path Pattern | Archetype Skill | Extra Skills |
|---|---|---|
| `app/page.tsx`, `app/landing/**` | `.claude/skills/aims-landing-ui/SKILL.md` | + `aims-animated-web` |
| `app/(auth)/**`, `app/onboarding/**` | `.claude/skills/aims-auth-onboarding-ui/SKILL.md` | — |
| `app/chat/**`, `app/dashboard/chat/**` | `.claude/skills/aims-chat-ui/SKILL.md` | — |
| `app/dashboard/**` (general) | `.claude/skills/aims-command-center-ui/SKILL.md` | — |
| `app/crm/**`, `app/project-management/**` | `.claude/skills/aims-crm-ui/SKILL.md` | — |
| `app/dashboard/luc/**`, `app/finance/**` | `.claude/skills/aims-finance-analytics-ui/SKILL.md` | — |
| `app/dashboard/automations/**`, `app/workstreams/**` | `.claude/skills/aims-workflow-ui/SKILL.md` | — |
| `app/dashboard/research/**`, `app/tools/**` | `.claude/skills/aims-content-tools-ui/SKILL.md` | — |
| `app/halalhub/**` | `.claude/skills/aims-landing-ui/SKILL.md` (emerald variant) | + `aims-animated-web` |
| **Global (always)** | `.claude/skills/aims-global-ui/SKILL.md` | — |

### Motion Component Library

Before writing custom animations, check `frontend/components/motion/`:
- `ScrollReveal` — viewport-triggered fade/slide reveal
- `ParallaxSection` — scroll-driven depth layers
- `TiltCard` — mouse-tracking 3D perspective
- `TypeReveal` — character-by-character stagger
- `ScrollProgress` — fixed progress bar
- `GlowBorder` — Huly.io-style rotating gradient border
- `BentoGrid` — asymmetric feature grid with stagger

## Dual-Layer Access (PRIVATE vs PUBLIC)

A.I.M.S. has two interaction modes, enforced by the A.I.M.S. GATEWAY SYSTEM:

- **PRIVATE mode** (Owner/Admin via `admin.aimanagedsolutions.cloud`): Full technical vocabulary, all agents visible (Boomer_Ang, Lil_Hawks, Chicken Hawk), all integrations exposed, developer tools, raw ACHEEVY. Owner can manage all agent layers directly.
- **PUBLIC mode** (Customer via `plugmein.cloud`): Simplified UI, plain language labels, no agent names, paywalled features. Users interact ONLY with ACHEEVY.

Use `usePlatformMode()` from `frontend/lib/platform-mode.tsx` to detect mode.
Use `t(key, mode)` from `frontend/lib/terminology.ts` for mode-aware labels.

**Never expose to PUBLIC users:** Agent names (Boomer_Ang, Lil_Hawk, Chicken Hawk), Docker terminology, infrastructure details. Only "ACHEEVY" and "your AI team".

## Mistakes & Lessons Learned

Every recurring mistake is documented here. Read this BEFORE making changes. Add new entries when mistakes are discovered.

### Architecture Mistakes
1. **Role mismatch** — Prisma schema used "MEMBER" as default, auth.ts used "USER". Always use canonical `UserRole` types: OWNER, ADMIN, CUSTOMER, DEMO_USER.
2. **Two Chicken Hawk implementations** — In-process agent (`agents/chicken-hawk.ts`) AND standalone service (`services/chicken-hawk/`). The in-process version should proxy to standalone when `CHICKENHAWK_URL` is available.
3. **Design skills not auto-triggered** — Skills in `.claude/skills/aims-*-ui/` are reference docs. They are NOT enforced by code. Follow the archetype-router mapping above every time.
4. **Antigravity destructive changes** — External agents (Gemini/Antigravity) have deleted critical files when adding new features. Always review diffs before merging branches from other agents.

### UI Mistakes
5. **Magic animation numbers** — Never hard-code duration, easing, or spring values. Import from `@/lib/motion/tokens.ts`.
6. **Missing reduced-motion** — Every animation component MUST respect `prefers-reduced-motion`. Test with DevTools.
7. **Dark theme when not requested** — Default A.I.M.S. is LIGHT (#F8FAFC background). Only use dark backgrounds if explicitly requested.
8. **Exposing agent names to public** — Customer-facing UI must NEVER show "Boomer_Ang", "Lil_Hawk", "Chicken Hawk". Only "ACHEEVY" and "your team".
9. **Ignoring existing motion library** — `frontend/lib/motion/` has tokens.ts and variants.ts with 22+ reusable presets. Use them.

### Deployment Mistakes
10. **Pushing without permission** — Never push to remote without explicit owner request.
11. **Skipping build verification** — Always run `cd frontend && npm run build` before considering frontend work complete.
12. **License violations** — This is PROPRIETARY software. Never add MIT/Apache/GPL headers to A.I.M.S. code files. `backend/ii-agent/` is an exception (third-party fork with its own MIT license).

### Security Mistakes
13. **Sensitive data in logs** — Never log API keys, user passwords, or session tokens.
14. **No auth on destructive actions** — Deploy, scale, decommission actions MUST check user role via `requireRole()` middleware before executing.
15. **Prisma v7 breaking change** — Prisma v7 removed `url` from schema `datasource`. Use Prisma v5 CLI (`npx prisma@5 generate`) until migration complete.
