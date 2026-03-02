A.I.M.S. is an AI-orchestrated Platform-as-a-Service where ACHEEVY manages the full lifecycle of containerized services — from provisioning to monitoring to decommissioning — with human-in-the-loop gates on critical paths.

## Commands

```bash
# Frontend
cd frontend && npm run build        # Build check (MUST pass before shipping)
cd frontend && npm run dev          # Dev server on :3000

# Backend
cd backend/uef-gateway && npm run build   # Gateway build check
cd backend/uef-gateway && npm run dev     # Dev server on :3001

# Skills & Hooks
cd aims-skills && npm test          # Unit tests for hooks, skills, tasks

# Deploy (VPS only — never Vercel/Netlify)
./deploy.sh --domain plugmein.cloud --landing-domain aimanagedsolutions.cloud
```

## Architecture

| Layer | Tech | Location |
|-------|------|----------|
| Frontend | Next.js 14 (App Router) | `frontend/` |
| API Gateway | Hono.js (UEF Gateway) | `backend/uef-gateway/` |
| AI Orchestrator | ACHEEVY service | `backend/acheevy/` |
| Skills Engine | Hooks, tasks, skills, verticals | `aims-skills/` |
| Chain of Command | Role cards + enforcement engine | `aims-skills/chain-of-command/` |
| Plug Engine | Container provisioning & lifecycle | Port 51000+ range |
| Infra | Docker Compose + nginx | `infra/`, `deploy.sh` |
| AI Inference | NVIDIA Nemotron on GCP Vertex AI | via `PERSONAPLEX_ENDPOINT` |

### VPS Services (76.13.96.107)

nginx, frontend, uef-gateway, acheevy, redis, agent-bridge, chickenhawk-core, circuit-metrics, ii-agent

### Agent Hierarchy

```
ACHEEVY (Executive Orchestrator)
  → Boomer_Angs (Managers — own objectives, supervise below)
    → Chicken Hawk (Coordinator — dispatches, enforces SOP)
      → Lil_Hawks (Workers — execute tasks, ship artifacts)
```

See `aims-skills/ABSTRACT_SPEC.md` for the identity-free role-based specification.
See `aims-skills/AIMS_ROLE_BINDINGS.md` for agent-to-role mapping.

## Code Style

- TypeScript everywhere (frontend + backend + skills)
- Next.js App Router patterns (`app/` directory)
- Tailwind CSS for styling
- Framer Motion for animations — import tokens from `frontend/lib/motion/tokens.ts`
- Skills follow Microsoft Skills format: `skills/<name>/SKILL.md` + `references/`
- Hooks follow trigger/pre_gsd/post_gsd/stitch_design lifecycle

✅ **Good:**
```typescript
import { DURATION, EASING } from '@/lib/motion/tokens';
const fadeIn = { duration: DURATION.normal, ease: EASING.smooth };
```

❌ **Bad:**
```typescript
const fadeIn = { duration: 0.3, ease: [0.4, 0, 0.2, 1] }; // magic numbers
```

## Boundaries

### ✅ Always
- Route all external access through UEF Gateway
- Run `npm run build` before considering frontend work complete
- Enforce evidence gates — no proof, no done
- Use `usePlatformMode()` for dual OWNER/CUSTOMER UI
- Follow the chain of command — ACHEEVY → Boomer_Ang → Chicken Hawk → Lil_Hawks
- Every animation MUST respect `prefers-reduced-motion`

### ⚠️ Ask First
- Deploy, scale, or decommission any service
- Changes to `infra/docker-compose.prod.yml`
- Modifications to role cards or chain-of-command policies
- Any action visible to external users (push, PR, message)

### 🚫 Never
- Expose internal agent names (Boomer_Ang, Lil_Hawk, Chicken Hawk) to customers
- Add MIT/Apache/GPL headers to A.I.M.S. code (proprietary)
- Commit API keys, passwords, or session tokens
- Add Vercel, Netlify, or other PaaS-specific code paths
- Skip hooks (`--no-verify`) or bypass signing
- Use `docker-compose` v1 syntax (use `docker compose` v2)

## Key Files

| File | Purpose |
|------|---------|
| `CLAUDE.md` | Claude Code-specific instructions (extended) |
| `AGENTS.md` | This file — cross-agent entry point |
| `aims-skills/ACHEEVY_BRAIN.md` | ACHEEVY behavior source of truth |
| `aims-skills/ABSTRACT_SPEC.md` | Abstract role-based spec (no identity assumptions) |
| `aims-skills/AIMS_ROLE_BINDINGS.md` | Concrete agent → role mapping |
| `aims-skills/sops/` | Standard Operating Procedures (SOP-01 through SOP-04) |
| `aims-skills/chain-of-command/` | Role cards + enforcement engine |
| `aims-skills/tools/TOOL_MCP_REGISTRY.md` | Consolidated tool & MCP registry |
| `frontend/lib/platform-mode.tsx` | Dual OWNER/CUSTOMER context |
| `infra/docker-compose.prod.yml` | Production service definitions |
| `deploy.sh` | VPS deployment script |
