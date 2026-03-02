# SOP-04: Stitch Design Trigger

> Ensure consistent design quality by triggering a design review pass on any UI/UX change.

## Preconditions

- A change is proposed that affects UI layout, user flows, or brand expression
- Design skill files are accessible (`.claude/skills/aims-*-ui/`)

## When to Trigger

Any of these conditions:
- New page or route is being created
- Existing page layout is being modified
- Component library changes affect rendered output
- Brand tokens (colors, typography, spacing) are being updated
- User flow changes (navigation, onboarding, checkout)

## What Happens

1. The `stitch_design` hook is called with:
   - **Screen/flow context:** Which page, which route, what the user sees
   - **Target platform:** Web, mobile, dashboard, export
   - **Brand tokens and constraints:** From `frontend/lib/motion/tokens.ts` and design system files

2. The design pass produces:
   - Layout recommendations (grid, spacing, component placement)
   - Component suggestions (from existing library first, new only if needed)
   - Microcopy review (labels, tooltips, error messages)
   - Motion/animation review (tokens, reduced-motion compliance)
   - Accessibility check (contrast, focus states, screen reader)

3. Results are attached as evidence artifacts to the current task.

## Constraints

The Stitch Design pass is allowed to:
- Propose layouts, components, and microcopy
- Suggest animation patterns from `frontend/components/motion/`
- Recommend token usage from `frontend/lib/motion/tokens.ts`

The Stitch Design pass is NOT allowed to:
- Change platform identity or branding decisions
- Modify agent role definitions or chain of command
- Alter system architecture or deployment targets
- Override security policies or access controls

## Integration Points

- **Design Skills:** `.claude/skills/aims-*-ui/SKILL.md` — archetype definitions
- **Motion Tokens:** `frontend/lib/motion/tokens.ts` — animation values
- **Motion Components:** `frontend/components/motion/` — reusable animated components
- **Design Redesign Hook:** `aims-skills/hooks/design-redesign-trigger.md` — existing trigger
