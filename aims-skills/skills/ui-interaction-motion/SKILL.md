---
name: ui-interaction-motion
description: |
  UI Interaction Motion skill for A.I.M.S.
  Use when: designing overlays, drawers, state transitions, micro-feedback animations,
  layout reflow animations, or enforcing accessibility in motion design.
role: Specialist Executor
intent: Design and enforce a consistent high-performance UI interaction motion system using Motion for A.I.M.S.
kpis:
  - animation_consistency
  - reduced_motion_compliance
  - interaction_latency_ms
status: active
priority: medium
triggers:
  - motion
  - interaction
  - animation
  - overlay
  - drawer
  - micro-feedback
execution: sequential
dependencies:
  - "frontend/lib/motion/tokens.ts"
  - "frontend/lib/motion/variants.ts"
  - "frontend/components/motion/"
  - "framer-motion"
---

# UI Interaction Motion

## Purpose

This skill defines and enforces the A.I.M.S. interaction motion system. It covers five categories of UI motion:

1. **Overlays & Drawers** -- Modal dialogs, slide-out panels, bottom sheets, dropdown menus
2. **State Transitions** -- Loading to loaded, empty to populated, enabled to disabled
3. **Micro-Feedback** -- Button press, hover effects, toggle flips, input focus
4. **Layout Reflow** -- List item add/remove, accordion expand/collapse, grid resize
5. **Accessibility** -- `prefers-reduced-motion` compliance, focus indicators, skip animations

## Inputs Required

When invoking this skill, provide:

| Input | Description | Required |
|-------|-------------|----------|
| Components | List of components needing motion | Yes |
| State Model | States the component transitions between | Yes |
| Intensity | `subtle`, `standard`, or `dramatic` | No (default: `standard`) |
| Platform | `mobile`, `tablet`, `desktop`, or `all` | No (default: `all`) |
| Accessibility Mode | Whether reduced-motion must be honored | No (default: `true`) |

## Outputs

The skill produces:

1. **Variant Definitions** -- Framer Motion `variants` objects for each component state
2. **Token References** -- Mapped to `frontend/lib/motion/tokens.ts` values
3. **State-to-Animation Mapping** -- Which variant applies at which state
4. **Accessibility Fallbacks** -- What happens when `prefers-reduced-motion: reduce` is active

## Motion Categories

### Overlays & Drawers

| Element | Enter | Exit | Duration Token |
|---------|-------|------|----------------|
| Modal | Fade + scale from 0.95 | Fade + scale to 0.95 | `duration.normal` |
| Side Drawer | Slide from edge | Slide to edge | `duration.normal` |
| Bottom Sheet | Slide up | Slide down | `duration.slow` |
| Dropdown | Fade + slide down 8px | Fade + slide up 8px | `duration.fast` |
| Toast | Slide in from right | Fade out | `duration.fast` |

### State Transitions

| Transition | Animation | Token |
|-----------|-----------|-------|
| Loading -> Loaded | Skeleton pulse stops, content fades in | `duration.normal` |
| Empty -> Populated | Stagger children in | `duration.normal` + stagger |
| Enabled -> Disabled | Opacity to 0.5, grayscale | `duration.fast` |
| Error state | Border color shift to red, shake | `duration.fast` |

### Micro-Feedback

| Interaction | Response | Token |
|-------------|----------|-------|
| Button press | Scale to 0.97, release to 1.0 | `spring.snappy` |
| Hover | Subtle lift (translateY -2px) + shadow increase | `duration.fast` |
| Toggle flip | Background color slide, thumb position spring | `spring.snappy` |
| Input focus | Border glow (gold), label float up | `duration.fast` |
| Checkbox check | Scale bounce 1.0 -> 1.2 -> 1.0 | `spring.snappy` |

### Layout Reflow

| Action | Animation | Token |
|--------|-----------|-------|
| List item add | Slide in + fade, push siblings with `layout` | `duration.normal` |
| List item remove | Fade + slide out, siblings collapse with `layout` | `duration.normal` |
| Accordion expand | Height auto with `AnimatePresence` | `duration.normal` |
| Grid resize | `layout` prop on grid children | `duration.slow` |

### Accessibility

- **All animated components** must check `prefers-reduced-motion`
- When reduced motion is active: replace animations with instant state changes (opacity 0->1, no transform)
- Focus indicators must be visible and not rely on animation alone
- Use `useReducedMotion()` hook from Framer Motion

## Rules

1. **Never hard-code duration or easing values.** Always import from `frontend/lib/motion/tokens.ts`.
2. **Never create animation without a reduced-motion fallback.**
3. **Reuse existing variants** from `frontend/lib/motion/variants.ts` before creating new ones.
4. **Check `frontend/components/motion/`** for existing components (ScrollReveal, TiltCard, GlowBorder, etc.) before building custom.
5. **Interaction latency < 100ms.** The user must perceive the animation as starting instantly.

## References

- `references/acceptance-criteria.md` -- Acceptance criteria for this skill
