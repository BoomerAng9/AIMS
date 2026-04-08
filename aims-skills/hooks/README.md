# Hooks

> Hooks are automatic enforcement triggers that fire BEFORE execution.

## Hook Types

| Type | When It Runs | Purpose |
|------|-------------|---------|
| **Guard** | Before every task dispatch | Validate authority, check gates |
| **Interceptor** | Before tool invocation | Enforce gateway routing, sanitize |
| **Scanner** | Before every outbound message | Detect leaked internals, enforce naming |
| **Trigger** | On intent detection | Activate specialized workflows (e.g., redesign teardown) |
| **Checklist** | Before PR merge | Require evidence artifacts |

## Existing Hooks

| Hook | File | Priority |
|------|------|----------|
| Chain of Command | `chain-of-command.hook.ts` | Critical |
| Gateway Enforcement | `gateway-enforcement.hook.ts` | Critical |
| Identity Guard | `identity-guard.hook.ts` | Critical |
| Onboarding Flow | `onboarding-flow.hook.ts` | High |
| Conversation State | `conversation-state.hook.ts` | High |
| Claude Loop | `claude-loop.hook.ts` | Medium |
| Design Redesign Trigger | `design-redesign-trigger.md` | Critical |
| Brand Strings Enforcer | `brand-strings-enforcer.md` | Critical |
| PR Evidence Checklist | `pr-evidence-checklist.md` | High |

## Adding a New Hook

1. Create `hooks/<name>.hook.ts` (runtime) or `hooks/<name>.md` (declarative)
2. Add YAML frontmatter with triggers and priority
3. Export from `hooks/index.ts` (for `.ts` hooks)
4. Document in `ACHEEVY_BRAIN.md` Section 5
