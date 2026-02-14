# A.I.M.S. — Claude Code Project Instructions

## Project Overview
A.I.M.S. (AI Managed Solutions) is an AI-managed platform orchestrated by ACHEEVY.
Domain: plugmein.cloud | VPS: 76.13.96.107 | GCP: ai-managed-services

## ACHEEVY Brain
The single source of truth for ACHEEVY's behavior, skills, hooks, and recurring tasks:
**`aims-skills/ACHEEVY_BRAIN.md`**

Read that file before making any changes to ACHEEVY's behavior, skills, hooks, verticals, or chain-of-command logic.

## Architecture
- **Frontend**: Next.js 15 (App Router) at `frontend/`
- **Backend**: Express gateway at `backend/uef-gateway/`, ACHEEVY service at `backend/acheevy/`
- **Skills Engine**: `aims-skills/` — hooks, skills, tasks, verticals, chain-of-command
- **Infra**: Docker Compose at `infra/`, deploy scripts at root

## D.U.M.B. — Deep Universal Meticulous Build
**Every build in this ecosystem must follow D.U.M.B.** — the mandatory build standard.
Read **`aims-skills/skills/dumb-sop.skill.md`** before any build, deploy, or scaffold operation.

Key D.U.M.B. requirements:
- 12 Non-Negotiable Pillars (requirements, auth, authz, tenancy, data, secrets, supply chain, sandbox, testing, security testing, release engineering, operations)
- 6 Minimum Gates to Ship: lint, unit tests, integration tests, dependency scan, secret scan, smoke test
- Every work item needs: Objective, Inputs, Outputs, Acceptance criteria, Required gates, Required evidence
- No manual override without approval record + reason + time-bounded exception

**Frontend Design Contract:** `aims-skills/skills/design/frontend-design-spec.md`
**Gate Enforcement Hook:** `aims-skills/hooks/dumb-gate.hook.md`

## Key Rules
1. All tool access goes through Port Authority (UEF Gateway) — no direct service exposure
2. Only ACHEEVY speaks to the user — never internal agent names
3. Every completed task requires evidence (no proof, no done)
4. Skills follow the taxonomy: Hooks (before), Tasks (do), Skills (guide)
5. Verticals have 2 phases: Phase A (conversational), Phase B (execution)
6. **D.U.M.B. applies to every build** — see Section 16 of ACHEEVY_BRAIN.md

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
