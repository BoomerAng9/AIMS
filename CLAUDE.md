# A.I.M.S. — Claude Code Project Instructions

## Deployment Pipeline Rules (READ FIRST)

These rules determine WHERE every piece of code deploys. Apply them to every task:

```
IF core platform service (ACHEEVY API, UEF Gateway, Per|Form, House of Ang, Redis, n8n)
  THEN → AIMS Core VPS (76.13.96.107 / srv1328075.hstgr.cloud) in Docker
  Files: infra/docker-compose.prod.yml, deploy.sh
  Deploy: ./deploy.sh --domain plugmein.cloud --landing-domain aimanagedsolutions.cloud
  First-time cert: ./deploy.sh --domain plugmein.cloud --landing-domain aimanagedsolutions.cloud --email admin@aimanagedsolutions.cloud

IF GPU-accelerated AI inference (PersonaPlex / Nemotron model serving)
  THEN → GCP Vertex AI Endpoints (GPU: L4 or A100)
  Model: nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B-Base-BF16 (MoE, 3B active params)
  License: NVIDIA Nemotron Open Model License (commercial OK)
  The UEF Gateway calls this via PERSONAPLEX_ENDPOINT env var.

IF CI pipeline (image builds on push to main)
  THEN → GCP Cloud Build → Artifact Registry (us-central1-docker.pkg.dev)
  Files: cloudbuild.yaml, .github/workflows/deploy.yml
  No Cloud Run deploys — VPS pulls images via deploy.sh
```

## Project Overview
A.I.M.S. (AI Managed Solutions) is an AI-managed platform orchestrated by ACHEEVY.
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
- **PersonaPlex**: NVIDIA Nemotron-3-Nano-30B-A3B on GCP Vertex AI — called via `PERSONAPLEX_ENDPOINT`
- **CI Pipeline**: GitHub Actions → Cloud Build → Artifact Registry (build+push only, no Cloud Run)

### VPS Services (default deploy, no profiles)
nginx, frontend, demo-frontend, uef-gateway, house-of-ang, acheevy, redis, agent-bridge, chickenhawk-core, n8n, circuit-metrics, ii-agent, ii-agent-postgres, ii-agent-tools, ii-agent-sandbox (15 containers)
SSL: host certbot (apt) — certs at /etc/letsencrypt, bind-mounted into nginx container

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
