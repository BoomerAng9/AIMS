---
name: UI Interaction Motion
description: Design and enforce a consistent, high-performance UI interaction motion system using Framer Motion for A.I.M.S.
version: 1.0.0
---

# UI Interaction Motion (Skill)

## Purpose
Govern a consistent, high-performance UI interaction motion system using Framer Motion for A.I.M.S.

This skill covers:
- Overlays and drawers
- State transitions
- Micro-feedback (hover, tap, focus)
- Layout reflow animations
- Accessibility-safe motion behavior

## Inputs Required
- Component(s) to animate
- State model (open/closed/loading/blocked/etc.)
- Motion intensity (low / medium)
- Platform target (mobile / tablet / web)
- Accessibility mode (reduce motion enabled/disabled)

## Outputs
- Motion variants per component
- Shared transition tokens (duration, easing)
- State-to-animation mapping
- Accessibility-safe fallbacks
- Acceptance checklist

## Core Motion Concepts (Required)
- **Variants** — state-based animation declarations
- **AnimatePresence** — mount/unmount clarity
- **Layout animations** — shared `layoutId`
- **Gesture feedback** — hover/tap/focus
- **Reduced-motion handling** — `prefers-reduced-motion` respect

## Global Rules
1. All animations must be state-driven (no ad-hoc animations)
2. Never animate layout + opacity + transform simultaneously unless intentional
3. Prefer `opacity` + `transform` for GPU-accelerated performance
4. Use layout animations sparingly and intentionally
5. Respect `prefers-reduced-motion` globally
6. Durations must use shared tokens from `frontend/lib/motion/tokens.ts`

## Motion vs Remotion Boundary
| Layer | Tool | Purpose |
|-------|------|---------|
| UI Interactions | Framer Motion | State changes, overlays, micro-feedback |
| Cinematic/Narrative | Remotion | Video generation, story-driven compositions |

They complement. They do not overlap.

## Definition of Done
- Every animated component has documented variants
- No animation blocks user interaction
- Reduced-motion users receive instant or minimal transitions
- Animations are consistent across similar components
- All timing uses shared motion tokens
