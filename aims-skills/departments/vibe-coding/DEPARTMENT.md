# Managed Vibe Coding Department

## Mission
**"Conversate your way to a working aiPLUG."**

Users don't need to write code. They don't need to prompt-engineer their way
to a working app. They just talk — describe what they want, how it should feel,
who it's for — and the Vibe Coding Department handles the rest.

An **aiPLUG** is any application, tool, or integration built on the A.I.M.S.
platform through conversational orchestration. From landing pages to full-stack
SaaS products, every aiPLUG flows through this department.

## Chain of Command

```
ACHEEVY (receives user's app idea)
  ↓
Vibe_Ang (Boomer_Ang — Vibe Coding Department Manager)
  ↓ delegates build manifests to
Chicken Hawk (Coordinator — dispatches squads)
  ↓ spawns specialized squads
┌─────────────────────────────────────────────┐
│  Lil_Scaffold_Hawk — Project scaffolding    │
│  Lil_Code_Hawk     — Feature implementation │
│  Lil_Style_Hawk    — UI/UX + design system  │
│  Lil_Test_Hawk     — Testing + QA           │
│  Lil_Deploy_Hawk   — Build + deploy preview │
└─────────────────────────────────────────────┘
```

### Support Angs (pulled in as needed)
- **Coder_Ang** — E2B sandboxed code execution for complex builds
- **Quality_Ang** — ORACLE 8-gate verification on every deliverable
- **Dockmaster_Ang** — Container builds + Cloud Run Job deployment
- **SiteBuilder_Ang** — For landing page / CMS-heavy aiPLUGs

## How It Works

### Phase A: Vibe Session (Conversational)
ACHEEVY guides the user through 5 steps:

1. **The Vision** — What does the aiPLUG do? Who is it for?
2. **The Vibe** — Design feel: minimal, bold, playful, enterprise? Colors? Inspirations?
3. **The Features** — Must-have features for v1. Ruthless prioritization.
4. **The Stack** — ACHEEVY recommends (or user overrides) the tech stack.
5. **The Go** — User confirms. Build manifest issued.

### Phase B: Build Pipeline (Execution)
Vibe_Ang receives the build manifest from ACHEEVY and issues it to Chicken Hawk:

1. **Scaffold** — Lil_Scaffold_Hawk generates project structure, config, boilerplate
2. **Implement** — Lil_Code_Hawk generates feature code (routes, APIs, components)
3. **Style** — Lil_Style_Hawk applies design system, responsive layout, animations
4. **Test** — Lil_Test_Hawk runs unit tests, lint, type check, accessibility
5. **Deploy** — Lil_Deploy_Hawk containerizes and deploys preview to Cloud Run
6. **Verify** — Quality_Ang runs ORACLE 8-gate verification
7. **Seal** — Receipt sealed with preview URL, build artifacts, verification report

### Phase C: Iterate (Loop)
User reviews the preview → provides feedback → Vibe_Ang dispatches delta builds.
Repeat until the user is satisfied. Ship when ready.

## Revenue Signal
- **Service:** Plug Factory (Vibe_Ang + full build pipeline)
- **Upsell:** Managed hosting, custom domains, ongoing maintenance, scale-up
- **Pricing tier:** Build hours billed via LUC (units of compute)

## Cloud Run Integration
- **Small builds** (landing pages, simple tools): Run synchronously in Chicken Hawk
- **Large builds** (full-stack apps): Dispatched to `aims-vibe-coder` Cloud Run Job
- **Preview deployments**: Each aiPLUG gets a Cloud Run preview URL

## Agent Bench Requirements
| Agent | Minimum Bench |
|-------|--------------|
| Vibe_Ang | Expert |
| Lil_Scaffold_Hawk | Intermediate |
| Lil_Code_Hawk | Intermediate |
| Lil_Style_Hawk | Intermediate |
| Lil_Test_Hawk | Intermediate |
| Lil_Deploy_Hawk | Intermediate |
