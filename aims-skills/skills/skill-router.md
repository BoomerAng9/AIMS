---
id: "skill-router"
name: "Skill Router"
type: "skill"
status: "active"
triggers: ["build", "design", "redesign", "integrate", "security", "deploy"]
description: "Routing rules: which skills must run for which types of work."
execution:
  target: "internal"
priority: "critical"
---

# Skill Router

> Before any work starts, the skill router determines which skills must be loaded.

## Routing Matrix

### Design / Redesign Work
**Triggers:** redesign, overhaul, refresh, new UI, new background, new layout, hangar, Circuit Box redesign

**Required skills:**
1. `design/design-first-builder` — Full pipeline (feel → anchors → tokens → composition → implement)
2. `design/design-tokens-standards` — Token definitions and naming conventions
3. `design/hangar-ui-world` — Hangar visual language (if touching operational surfaces)
4. `design/circuit-box-visualization` — Circuit Box rules (if touching Circuit Box)

**Required hooks:**
1. `design-redesign-trigger` — Enforces teardown + rebuild
2. `brand-strings-enforcer` — Exact brand actor naming
3. `pr-evidence-checklist` — Evidence artifacts required for merge

### Build / Component Work
**Triggers:** build, create, implement, add feature, new component, new page

**Required skills:**
1. `design/design-tokens-standards` — All components reference tokens
2. `design/hangar-ui-world` — If touching operational surfaces

**Required hooks:**
1. `brand-strings-enforcer` — Exact brand actor naming
2. `pr-evidence-checklist` — Evidence artifacts required for merge

### Integration Work
**Triggers:** integrate, connect, telegram, discord, whatsapp, voice, webhook

**Required skills:**
1. `integrations/<provider>` — Provider-specific integration rules
2. `integrations/voice-elevenlabs-deepgram` — If touching voice I/O
3. `security/no-reveal-policy` — Never expose credentials or internals

**Required hooks:**
1. `brand-strings-enforcer` — Exact brand actor naming

### Security Hardening
**Triggers:** security, audit, harden, vulnerability, pentest, access control

**Required skills:**
1. `security/no-reveal-policy` — Core no-reveal rules
2. `security/owner-only-control-plane` — Owner vs User boundary
3. `security/actions-redirect-policy` — External access rules

**Required hooks:**
1. `pr-evidence-checklist` — Evidence artifacts required for merge

## Router Execution Order

```
1. Detect work type from prompt/task keywords
2. Load required skills (context injection)
3. Activate required hooks (enforcement triggers)
4. Proceed with execution
```

## Skill Loading Behavior
- Skills are loaded as context — they inform the build, not block it
- Hooks are enforcement — they CAN block merges and outputs
- Multiple skill categories can be active simultaneously (e.g., design + integration)
- The router re-evaluates on every significant prompt or task dispatch
