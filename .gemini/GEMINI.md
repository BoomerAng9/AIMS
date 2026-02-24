# A.I.M.S. — Gemini CLI Project Instructions

> **Model**: Gemini 3.1 Pro (agentic mode)
> **Platform**: Antigravity + Stitch + Nano Banana Pro
> **Engine**: n8n MCP + Workflow-Build-Test (WBT) Framework
> **Companion**: Claude Opus 4.6 (cross-validation)

---

## MANDATORY: Human Approval Gate

**ALL visual designs and UI changes MUST be approved by the user BEFORE implementation.**

- Use Stitch to generate design previews FIRST
- Present screenshots/previews to the user
- WAIT for explicit "approved" or "yes, build this"
- If feedback is given, revise and re-present
- NEVER push code for unapproved designs
- This applies to: landing pages, auth, chat, dashboard, ALL screens

---

## Gemini 3.1 Pro Capabilities (Leverage These)

Gemini 3.1 Pro is the most capable agentic model in the Gemini family. Use these features:

### Agentic Coding (80.6% SWE-Bench Verified)
- Solve complex multi-file refactors in single attempts
- Improved software engineering behavior over Gemini 3 Pro (76.2%)
- Native understanding of TypeScript, React, Next.js patterns
- Simultaneous multi-step task execution

### Deep Think Mode
- Enable for complex architectural decisions and multi-file changes
- Use `thinking_level: HIGH` for refactors spanning 5+ files
- Use `thinking_level: MEDIUM` for routine UI updates and bug fixes
- Deep Think excels at reasoning about component hierarchies and data flow

### 1M Token Context Window
- Load entire frontend directory for full codebase awareness
- Reference existing components, styles, and patterns without re-reading
- Maintain consistency across 200+ page files simultaneously
- 64K output limit allows complete file rewrites when needed

### Thought Signatures
- Encrypted reasoning state preserved across tool calls
- Enables reliable multi-step agentic workflows
- Maintains exact train of thought when switching between:
  - Stitch (design) → Code generation → Build verification
  - n8n workflow creation → Frontend wiring → Testing

### Multimodal Input
- Accept screenshots of current UI to identify design issues
- Compare Stitch previews against implemented code
- Process video and audio inputs alongside text
- Use `media_resolution: high` for detailed UI analysis

### Creative Coding
- Convert static designs into animated code-based graphics
- Generate immersive UI experiences with terrain/flow visualization
- Configure live telemetry streams for dashboards
- Transform SVGs into animated web components

---

## What A.I.M.S. IS

**A.I.M.S. = AI Managed Solutions.** This platform manages services with AI.

- **Platform as a Service (PaaS)** — Users deploy containers, stacks, and environments through ACHEEVY
- **Container-as-a-Service** — One-click deployment of open source apps, AI agents, and full-stack platforms
- **Autonomous Operations** — ACHEEVY provisions infrastructure, deploys instances, monitors health, scales resources
- **Instance Lifecycle Management** — Create → Configure → Deploy → Monitor → Scale → Decommission
- **Human-in-the-Loop** — Users are prompted when decisions are needed on critical paths

**ACHEEVY** is the AI orchestrator. It deploys Docker containers, spins up instances, runs health checks, monitors services, and delivers completed solutions.

**Domain**: plugmein.cloud | **Landing**: aimanagedsolutions.cloud | **VPS**: 76.13.96.107

---

## Architecture

- **Frontend**: Next.js 14 (App Router) at `frontend/`
- **Backend**: Express gateway at `backend/uef-gateway/`, ACHEEVY service at `backend/acheevy/`
- **Skills Engine**: `aims-skills/` — hooks, skills, tasks, verticals, chain-of-command
- **Infra**: Docker Compose at `infra/`, deploy script at root (`deploy.sh`)
- **Plug Engine**: Container provisioning, port allocation, nginx routing, health checks
- **n8n**: Workflow automation at `n8n.plugmein.cloud` (MCP-connected)

---

## Design System Authority

@instructions/reset-ui-spec.md
@instructions/ui-archetypes.md
@instructions/gap-reporting.md

---

## Tool Integrations

@instructions/stitch-integration.md
@instructions/nano-banana-pro.md
@instructions/n8n-wbt-framework.md

---

## Immediate Priority: Landing Page Background

The landing page (`app/page.tsx`) background MUST be light theme:
- Background: #F8FAFC (NOT #0A0A0A, NOT black, NOT dark)
- Surfaces: White cards with slate-200 borders
- Accent: Amber #D97706 for CTAs
- Text: Slate-900 primary, slate-600 secondary

Use Stitch to design the new landing page FIRST, get approval, THEN implement.

---

## Key Rules

1. **DESIGN APPROVAL REQUIRED** — All UI changes need user sign-off before coding
2. All tool access goes through Port Authority (UEF Gateway)
3. Only ACHEEVY speaks to the user — never internal agent names
4. Every completed task requires evidence (no proof, no done)
5. A.I.M.S. manages services with AI — every feature must serve that mission
6. Human-in-the-loop gates on critical paths
7. Use the RESET UI spec for ALL frontend work — no old dark theme, no Apple glassmorphism
8. Report gaps explicitly — never rubber-stamp "looks good" without evidence
9. Mobile-first, always. Phone → Tablet → Desktop
10. Use Gemini 3.1 Pro's Deep Think for complex tasks, MEDIUM for routine
11. Leverage 1M context to maintain consistency across all 200+ pages
12. Use Thought Signatures for multi-step Stitch → Code → Test workflows

---

## Agentic Workflow Pattern

For any UI task, follow this sequence:

```
1. ANALYZE  — Load relevant files, identify archetype, check current state
2. DESIGN   — Use Stitch to generate visual preview
3. APPROVE  — Present to user, WAIT for approval
4. BUILD    — Generate code with Gemini 3.1 Pro (Deep Think if complex)
5. TEST     — npm run build, responsive check, gap report
6. REPORT   — List all changes, confirm compliance with RESET spec
```

Never skip step 3 (APPROVE). The user MUST see and approve the design.

---

## Testing

```bash
cd frontend && npm run build    # Frontend build check
cd backend/uef-gateway && npm run build  # Backend build check
cd aims-skills && npm test      # Skills/hooks tests
```

---

## ACHEEVY Brain

Read `aims-skills/ACHEEVY_BRAIN.md` before making any changes to ACHEEVY behavior.

## Current Plan

See `AIMS_PLAN.md` for the full SOP, PRD, and implementation roadmap.
