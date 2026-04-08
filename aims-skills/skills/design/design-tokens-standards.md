---
id: "design-tokens-standards"
name: "Design Tokens Standards"
type: "skill"
status: "active"
triggers: ["tokens", "spacing", "typography", "colors", "radii", "elevation", "motion tokens"]
description: "Token naming conventions for spacing, radii, elevation, motion, opacity, and semantic colors."
execution:
  target: "persona"
priority: "high"
---

# Design Tokens Standards

> Every visual value has a name. No magic numbers in components.

## Naming Convention

```
--aims-{category}-{scale|semantic}
```

Examples: `--aims-space-4`, `--aims-color-gold`, `--aims-radius-lg`, `--aims-elevation-panel`

## Spacing Scale

| Token | Value | Usage |
|-------|-------|-------|
| `--aims-space-0` | 0px | Reset |
| `--aims-space-1` | 4px | Tight inline gaps |
| `--aims-space-2` | 8px | Icon-to-text, compact padding |
| `--aims-space-3` | 12px | Card internal padding (compact) |
| `--aims-space-4` | 16px | Standard padding, form field spacing |
| `--aims-space-5` | 20px | Section gaps |
| `--aims-space-6` | 24px | Panel padding |
| `--aims-space-8` | 32px | Section separators |
| `--aims-space-10` | 40px | Page-level spacing |
| `--aims-space-12` | 48px | Major section breaks |
| `--aims-space-16` | 64px | Page margins (desktop) |

## Border Radii

| Token | Value | Usage |
|-------|-------|-------|
| `--aims-radius-none` | 0px | Sharp edges (data tables) |
| `--aims-radius-sm` | 4px | Tags, badges, inline chips |
| `--aims-radius-md` | 8px | Buttons, inputs, small cards |
| `--aims-radius-lg` | 12px | Cards, panels |
| `--aims-radius-xl` | 16px | Modals, large panels |
| `--aims-radius-2xl` | 24px | Chat bubbles, floating elements |
| `--aims-radius-full` | 9999px | Pills, avatars, status dots |

## Elevation (Shadow Scale)

| Token | Value | Usage |
|-------|-------|-------|
| `--aims-elevation-flat` | none | Flush surfaces |
| `--aims-elevation-subtle` | `0 1px 2px rgba(0,0,0,0.3)` | Slightly raised elements |
| `--aims-elevation-card` | `0 2px 8px rgba(0,0,0,0.4)` | Standard card |
| `--aims-elevation-panel` | `0 4px 16px rgba(0,0,0,0.5)` | Floating panels |
| `--aims-elevation-modal` | `0 8px 32px rgba(0,0,0,0.6)` | Modals, overlays |
| `--aims-elevation-toast` | `0 12px 48px rgba(0,0,0,0.7)` | Toasts, urgent overlays |

## Semantic Colors

| Token | Value | Usage |
|-------|-------|-------|
| `--aims-color-bg` | #0A0A0A | Page background |
| `--aims-color-surface` | #111111 | Card/panel surface |
| `--aims-color-stroke` | rgba(255,255,255,0.08) | Borders (wireframe-stroke) |
| `--aims-color-text` | #FFFFFF | Primary text |
| `--aims-color-text-muted` | rgba(255,255,255,0.5) | Secondary text |
| `--aims-color-text-dim` | rgba(255,255,255,0.2) | Tertiary/metadata text |
| `--aims-color-gold` | #D4AF37 | Brand gold — ACHEEVY accent |
| `--aims-color-gold-muted` | rgba(212,175,55,0.4) | Gold at reduced intensity |
| `--aims-color-emerald` | #10B981 | Healthy / active / success |
| `--aims-color-red` | #EF4444 | Error / alert / destructive |
| `--aims-color-amber` | #F59E0B | Warning / approval-required |
| `--aims-color-blue` | #3B82F6 | Info / search / navigation |
| `--aims-color-cyan` | #22D3EE | Voice / audio |
| `--aims-color-violet` | #8B5CF6 | Data / analytics |
| `--aims-color-rose` | #F43F5E | Payments / billing |

## Opacity Scale

| Token | Value | Usage |
|-------|-------|-------|
| `--aims-opacity-invisible` | 0 | Hidden |
| `--aims-opacity-ghost` | 0.03 | Background tints |
| `--aims-opacity-faint` | 0.08 | Borders, dividers |
| `--aims-opacity-muted` | 0.2 | Disabled states, dim text |
| `--aims-opacity-soft` | 0.4 | Secondary elements |
| `--aims-opacity-medium` | 0.6 | Supporting text |
| `--aims-opacity-strong` | 0.8 | Important secondary |
| `--aims-opacity-full` | 1 | Primary elements |

## Motion Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `--aims-duration-instant` | 75ms | Micro-interactions (hover color) |
| `--aims-duration-fast` | 150ms | Button press, toggle |
| `--aims-duration-normal` | 200ms | Standard transitions |
| `--aims-duration-slow` | 300ms | Panel expand/collapse |
| `--aims-duration-emphasis` | 500ms | Page transitions |
| `--aims-ease-default` | cubic-bezier(0.4, 0, 0.2, 1) | General purpose |
| `--aims-ease-enter` | cubic-bezier(0, 0, 0.2, 1) | Elements entering |
| `--aims-ease-exit` | cubic-bezier(0.4, 0, 1, 1) | Elements leaving |

## Typography Scale

| Token | Size | Weight | Usage |
|-------|------|--------|-------|
| `--aims-text-xs` | 9px | 400 | Metadata, timestamps, labels |
| `--aims-text-sm` | 11px | 400 | Secondary text, chips |
| `--aims-text-base` | 14px | 400 | Body text, messages |
| `--aims-text-lg` | 16px | 500 | Subheadings |
| `--aims-text-xl` | 20px | 600 | Section headings |
| `--aims-text-2xl` | 24px | 700 | Page titles |
| `--aims-text-mono` | 12px | 400 | Code, IDs, technical values (font-family: monospace) |

## Enforcement

- Components reference tokens, never raw values
- New values require a new token definition — no inline overrides
- Token changes propagate globally — single source of truth
- Tailwind config maps tokens to utility classes
