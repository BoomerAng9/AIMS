# Acceptance Criteria: stitch-nano-design

## Must Pass

- [ ] Design directives output use A.I.M.S. color palette (dark bg `#0A0A0F`, gold `#D4A843`, glass surfaces)
- [ ] All motion directives reference tokens from `frontend/lib/motion/tokens.ts` -- no hard-coded values
- [ ] Glass-morphism (`backdrop-blur-xl`, semi-transparent backgrounds) applied to card/panel directives
- [ ] Typography hierarchy defined with clear size steps and weight variations
- [ ] Image usage directives specify treatment (gradient overlay, contained, circular, background texture)
- [ ] Nano Banana Pro design asset reference loaded and cross-referenced during execution
- [ ] Motion variant library checked before creating new animation definitions
- [ ] Existing motion components in `frontend/components/motion/` audited before proposing custom components

## Should Pass

- [ ] Retro-futurism aesthetic maintained: dark + gold + glass + intentional texture
- [ ] Noise/grain texture directives included where appropriate (not on interactive elements)
- [ ] Monospace font usage specified for data/code contexts
- [ ] Color contrast ratios meet WCAG AA (4.5:1 for normal text, 3:1 for large text)
- [ ] Design directives include responsive breakpoint considerations

## Quality

- [ ] Directives are production-ready: copy-pasteable color values, spacing values, and motion configs
- [ ] Asset utilization rate > 70% (reuses existing assets/components over creating new ones)
- [ ] No conflicting directives (e.g., two different gold values, conflicting easing curves)
