---
id: "design-first-builder"
name: "Design-First Builder"
type: "skill"
status: "active"
triggers: ["design", "redesign", "UI", "layout", "component", "page", "screen", "overhaul", "refresh"]
description: "Full design pipeline: feel -> anchors -> tokens -> composition -> implementation. Enforces teardown-first on redesigns."
execution:
  target: "persona"
priority: "critical"
---

# Design-First Builder

> Every build starts with design intent, not code.

## Pipeline

```
1. FEEL        — Define the emotional target and brand posture
2. ANCHORS     — Lock reference imagery, mood boards, existing brand assets
3. TOKENS      — Codify spacing, color, radii, elevation, motion, typography
4. COMPOSITION — Layout rules, grid, responsive breakpoints, safe-area handling
5. IMPLEMENT   — Build components against the token system, never ad-hoc
```

## Redesign = Full Teardown + Rebuild

When the intent is redesign / overhaul / refresh / fix the UI:

### 1. Freeze
- Capture current UI state (screenshots + route list + "must-not-break" list)
- Document existing component tree and style dependencies
- Identify critical user flows that must survive the transition

### 2. Teardown
- Remove or disable the old layout/components/styles being replaced
- No "patchwork layering" — clean cut
- Document everything removed in the teardown log

### 3. Rebuild from Scratch
- Use the new design packet and token system
- Implement against the locked token definitions
- Every component references tokens, never magic numbers

### 4. Audit
- Responsive fit-to-screen: desktop / tablet / mobile
- No clipping, no unbounded overflow
- Brand actor naming is exact (see brand-strings-enforcer hook)
- First paint renders all primary content visible and centered

## Design Packet (Required Output)

Every design or redesign must produce:

| Artifact | Description |
|----------|-------------|
| **Anchors** | Reference imagery, mood/tone, brand asset usage rules |
| **Token Sheet** | All design tokens with values (see design-tokens-standards) |
| **Motion Rules** | Easing curves, durations, interaction triggers |
| **Layout Rules** | Grid, breakpoints, safe areas, overflow behavior |
| **Composition Map** | Component hierarchy with token bindings |

## Fit-to-Screen Rules (Non-Negotiable)

- Every page loads centered with consistent padding
- No primary content renders clipped off-screen on first paint
- Responsive rules are explicit for desktop (1440+), tablet (768-1439), mobile (<768)
- Safe-area handling for notch devices
- Scroll containers have bounded height — no infinite overflow
