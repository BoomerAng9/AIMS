---
id: "ui-interaction-motion"
name: "UI Interaction Motion"
type: "task"
status: "active"
triggers:
  - "animate"
  - "transition"
  - "motion"
  - "overlay"
  - "drawer"
  - "micro-interaction"
  - "framer"
description: "Apply Framer Motion interaction layer to A.I.M.S. UI components with shared motion tokens."
execution:
  target: "frontend"
  route: "frontend/lib/motion/"
dependencies:
  packages:
    - "framer-motion"
  files:
    - "frontend/lib/motion/tokens.ts"
    - "frontend/lib/motion/variants.ts"
    - "frontend/components/LogoWallBackground.tsx"
    - "frontend/components/FloatingChat.tsx"
    - "frontend/components/AcheevyChat.tsx"
priority: "high"
---

# UI Interaction Motion Tasks (Framer Motion)

## Phase 1 — Motion Audit
- [x] Identify interactive components (overlay, drawer, cards, buttons)
- [x] Map component states (idle, active, loading, blocked)
- [x] Decide which state changes deserve motion

## Phase 2 — Motion Language
- [x] Define duration tokens (fast / normal / slow)
- [x] Define easing curves (standard, emphasized)
- [x] Define opacity + transform standards
- [x] Define reduce-motion behavior

## Phase 3 — Component Variants
- [x] Overlay PiP variants (hidden → visible)
- [x] Drawer variants (closed → open)
- [x] Status chip transitions
- [x] Card fade-in stagger
- [x] Hover/tap feedback for actionable elements

## Phase 4 — Presence & Layout
- [x] AnimatePresence for FloatingChat toggle
- [x] AnimatePresence for intent picker dropdown
- [x] Shared layoutId for expanding/collapsing panels
- [x] Exit animations clarify state change

## Phase 5 — Performance & Accessibility
- [ ] Verify GPU-friendly properties only
- [ ] Check no layout thrashing
- [ ] Validate reduce-motion behavior
- [ ] Confirm keyboard + focus flow is unaffected

## Phase 6 — Review
- [ ] Motion improves clarity (not decoration)
- [ ] No animation feels "cute" or distracting
- [ ] Consistent timing across the app

## Token Files

| File | Purpose |
|------|---------|
| `frontend/lib/motion/tokens.ts` | Duration, easing, and spring constants |
| `frontend/lib/motion/variants.ts` | Reusable variant presets for common patterns |

## Integration Points
- `LogoWallBackground` — subtle wave breathing animation
- `FloatingACHEEVY` — overlay mount/unmount with scale + opacity
- `AcheevyChat` — intent picker dropdown, message entry
- `DashboardShell` — page transition fade
- `WorkstreamsPage` — pipeline bar progress animation
