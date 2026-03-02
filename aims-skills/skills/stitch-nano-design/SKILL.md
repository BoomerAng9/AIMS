---
name: stitch-nano-design
description: |
  Stitch + Nano Banana Pro Design Plan skill for A.I.M.S.
  Use when: auto-loading A.I.M.S. Skill Packs and Design Assets to output production-ready
  UI/UX directives including motion design and image usage.
role: Specialist Executor
intent: Auto-load A.I.M.S. Skill Packs and Design Assets to output production-ready UI/UX directives including motion and image usage.
kpis:
  - design_directive_quality
  - asset_utilization_rate
  - motion_consistency
status: active
priority: medium
triggers:
  - stitch
  - nano banana
  - design plan
  - ui design
  - ux design
execution: sequential
dependencies:
  - "aims-skills/skills/nano-banana-pro.md"
  - "frontend/lib/motion/tokens.ts"
  - "frontend/lib/motion/variants.ts"
  - "frontend/components/motion/"
---

# Stitch + Nano Banana Pro Design Plan

## Design Intent

**Retro-futurism with controlled imperfection.** The A.I.M.S. visual identity merges premium dark interfaces with gold accents, glass-morphism transparency, and intentional texture. The goal is a UI that feels expensive, intelligent, and slightly dangerous -- like a command center for the future.

## Target Vibe

- Blade Runner control room meets Bloomberg Terminal
- Premium but not sterile
- Dark, moody, and confident
- Gold as the power color -- used sparingly for impact

## Non-Negotiables

1. **Dark UI + Gold Accents** -- Primary background `#0A0A0F` to `#1A1A2E`, gold `#D4A843` for highlights, actions, and status indicators
2. **Glass Box Transparency** -- Cards and panels use `backdrop-blur-xl` with semi-transparent backgrounds (`rgba(26, 26, 46, 0.8)`)
3. **Intentional Texture** -- Subtle noise overlays, grain effects, or micro-patterns to prevent flat/sterile feeling
4. **Motion with Purpose** -- Every animation communicates state change; no decorative animation without information value
5. **Typography Hierarchy** -- Clear size steps, variable weight usage, monospace for data/code contexts

## Style System

### Color Palette
```
Background:     #0A0A0F (deep black)
Surface:        #1A1A2E (card/panel)
Glass:          rgba(26, 26, 46, 0.8)
Gold Primary:   #D4A843
Gold Glow:      rgba(212, 168, 67, 0.3)
Text Primary:   #F8FAFC
Text Muted:     #94A3B8
Border:         rgba(212, 168, 67, 0.2)
Error:          #EF4444
Success:        #22C55E
```

### Motion Tokens
All motion must use tokens from `frontend/lib/motion/tokens.ts`. Key tokens:
- `duration.fast` (150ms) -- micro-interactions, hover states
- `duration.normal` (300ms) -- standard transitions, panel open/close
- `duration.slow` (500ms) -- page transitions, large reveals
- `easing.smooth` -- default for most transitions
- `spring.snappy` -- interactive elements, buttons, cards

### Image Usage Directives
- Hero images: full-bleed with gradient overlay (bottom-to-top, `#0A0A0F` to transparent)
- Card images: contained, rounded corners matching card radius
- Avatar images: circular, gold border on active/premium users
- Background images: low opacity (0.05-0.15), used as texture only

## Skill Pack Auto-Loading

When this skill is triggered, the agent must:
1. Load the Nano Banana Pro design asset reference (`nano-banana-pro.md`)
2. Load the motion token library (`frontend/lib/motion/tokens.ts`)
3. Load the motion variant library (`frontend/lib/motion/variants.ts`)
4. Cross-reference the component being built against existing motion components in `frontend/components/motion/`
5. Output production-ready directives: color values, spacing, motion config, and image treatment

## References

- `references/acceptance-criteria.md` -- Acceptance criteria for this skill
