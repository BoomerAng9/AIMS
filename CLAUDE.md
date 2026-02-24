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

## Testing
```bash
cd frontend && npm run build    # Frontend build check
cd backend/uef-gateway && npm run build  # Backend build check
cd aims-skills && npm test      # Skills/hooks tests
```
