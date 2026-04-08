# Acceptance Criteria: ui-interaction-motion

## Must Pass

- [ ] All duration and easing values imported from `frontend/lib/motion/tokens.ts` -- zero hard-coded values
- [ ] All reusable variants come from `frontend/lib/motion/variants.ts` -- new variants only when no existing match
- [ ] Existing motion components in `frontend/components/motion/` checked before building custom animation
- [ ] Every animated element has a `prefers-reduced-motion` fallback
- [ ] `useReducedMotion()` hook from Framer Motion used for accessibility checks
- [ ] Interaction latency < 100ms (user perceives instant response)
- [ ] Overlays/drawers animate in and out (no instant appear/disappear without motion)
- [ ] State transitions (loading->loaded, empty->populated) animated with appropriate duration tokens
- [ ] Micro-feedback on buttons (scale on press), inputs (focus glow), toggles (spring flip)
- [ ] Layout reflow uses Framer Motion `layout` prop for smooth sibling rearrangement

## Should Pass

- [ ] Modal enter/exit: fade + scale from/to 0.95 with `duration.normal`
- [ ] Side drawer: slide from edge with `duration.normal`
- [ ] Bottom sheet: slide up with `duration.slow`
- [ ] Dropdown: fade + slide down 8px with `duration.fast`
- [ ] Toast: slide in from right, fade out with `duration.fast`
- [ ] List item add/remove animated with `AnimatePresence`
- [ ] Accordion expand/collapse uses height auto animation

## Accessibility

- [ ] When reduced motion is active, all transforms replaced with instant opacity changes
- [ ] Focus indicators visible and do not rely on animation alone
- [ ] No animation-only state communication (always pair with color, icon, or text change)
- [ ] Skip animation option available for users who request it
