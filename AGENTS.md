# A.I.M.S. — AI Managed Solutions

## Commands

```bash
# Frontend build
cd frontend && npm run build

# Backend build
cd backend/uef-gateway && npm run build

# Skills/hooks tests
cd aims-skills && npm test

# Deploy (VPS)
./deploy.sh --domain plugmein.cloud --landing-domain aimanagedsolutions.cloud
```

## Architecture

A.I.M.S. is an AI-orchestrated Platform-as-a-Service. Users deploy containers, stacks, and full environments through **ACHEEVY** (the AI orchestrator). The Plug System handles one-click provisioning, monitoring, scaling, and decommissioning.

| Layer | Tech | Location |
|-------|------|----------|
| Frontend | Next.js 14 (App Router) | `frontend/` |
| API Gateway | Express (UEF Gateway) | `backend/uef-gateway/` |
| AI Orchestrator | ACHEEVY service | `backend/acheevy/` |
| Skills Engine | Hooks, tasks, skills, verticals | `aims-skills/` |
| Infra | Docker Compose + nginx | `infra/`, `deploy.sh` |
| Creative Engine | NtNtN — NLP build intent pipeline | `aims-skills/ntntn-engine/` |
| AI Inference | NVIDIA Nemotron on GCP Vertex AI | via `PERSONAPLEX_ENDPOINT` |

### Key Services (Docker, VPS: 76.13.96.107)

nginx, frontend, demo-frontend, uef-gateway, house-of-ang, acheevy, redis, agent-bridge, chickenhawk-core, circuit-metrics, ii-agent, ii-agent-postgres, ii-agent-tools, ii-agent-sandbox

### Plug Instances (dynamic)

User-deployed containers on port 51000+ with auto-allocated nginx reverse proxy, health checks, and lifecycle management.

## Conventions

### Code Style
- TypeScript everywhere (frontend + backend)
- Next.js App Router patterns (`app/` directory)
- Tailwind CSS for styling
- Framer Motion for animations — use tokens from `frontend/lib/motion/tokens.ts`, never hard-code durations/easings

### Key Rules
1. All external access through UEF Gateway — no direct service exposure
2. Only ACHEEVY speaks to users — never expose internal agent names (Boomer_Ang, Lil_Hawk, Chicken Hawk) in customer-facing UI
3. Every animation MUST respect `prefers-reduced-motion`
4. Human-in-the-loop gates on destructive actions (deploy, scale, decommission)
5. Auth roles: `OWNER`, `ADMIN`, `CUSTOMER`, `DEMO_USER` — never use "MEMBER" or "USER"

### Dual-Mode UI
- **PRIVATE** (Owner/Admin): Full technical vocabulary, all agents visible
- **PUBLIC** (Customer): Simplified UI, plain language, no agent names

Use `usePlatformMode()` from `frontend/lib/platform-mode.tsx` and `t(key, mode)` from `frontend/lib/terminology.ts`.

## Design System

### Motion Components (`frontend/components/motion/`)
ScrollReveal, ParallaxSection, TiltCard, TypeReveal, ScrollProgress, GlowBorder, BentoGrid

### Animation Tokens (`frontend/lib/motion/tokens.ts`)
Durations, easing curves, spring configs, stagger values, scroll presets — import these instead of writing magic numbers.

### Page Archetype Skills (`.claude/skills/aims-*-ui/`)
Each page type has a design skill file. Match route to archetype:
- Landing pages → `aims-landing-ui` + `aims-animated-web`
- Auth/onboarding → `aims-auth-onboarding-ui`
- Chat → `aims-chat-ui`
- Dashboard → `aims-command-center-ui`
- HalalHub → `aims-landing-ui` (emerald variant)

## Testing

Always run `cd frontend && npm run build` before considering frontend work complete.

Backend: `cd backend/uef-gateway && npm run build`

## PR Instructions

- Review diffs carefully when merging branches from external agents (Gemini/Antigravity have caused destructive changes before)
- This is **proprietary software** — never add MIT/Apache/GPL headers to A.I.M.S. code files
- Exception: `backend/ii-agent/` is a third-party fork with its own MIT license
- Never commit API keys, passwords, or session tokens
- Use Prisma v5 CLI (`npx prisma@5 generate`) — Prisma v7 has breaking changes

## Key Files

- `CLAUDE.md` — Extended instructions (Claude Code specific)
- `AIMS_PLAN.md` — Full SOP, PRD, implementation roadmap
- `aims-skills/ACHEEVY_BRAIN.md` — ACHEEVY behavior source of truth
- `frontend/lib/platform-mode.tsx` — Dual OWNER/CUSTOMER context
- `frontend/lib/terminology.ts` — Mode-aware label translations
- `infra/docker-compose.prod.yml` — Production service definitions
- `deploy.sh` — VPS deployment script
