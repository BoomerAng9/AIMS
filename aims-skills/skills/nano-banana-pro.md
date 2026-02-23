---
id: "nano-banana-pro"
name: "Nano Banana Pro"
type: "skill"
status: "active"
triggers:
  - "nano banana"
  - "image generation"
  - "ui architect"
  - "acheevy design"
  - "hero image"
  - "illustration"
  - "visual assets"
  - "design assets"
description: "Image generation and UI visual asset skill powered by Nano Banana Pro (Gemini 3 Pro Image). Generates hero images, illustrations, textures, and brand assets for the A.I.M.S. platform."
execution:
  target: "persona"
dependencies:
  files:
    - ".gemini/instructions/nano-banana-pro.md"
    - ".stitch/persona.md"
    - "frontend/tailwind.config.ts"
    - "frontend/components/ui/"
priority: "high"
---

# Nano Banana Pro — A.I.M.S. Visual Asset Skill

## Design Authority

This skill follows the **RESET-UI-SPEC.md** as the sole design authority.
All generated assets must be compatible with the light SaaS theme.

## Visual Identity Spec

### Color Palette (Light Theme)
| Token | Hex | Usage |
|-------|-----|-------|
| Background | #F8FAFC | Page base (slate-50) |
| Surface | #FFFFFF | Cards, panels |
| Accent | #D97706 | Amber — primary CTA, brand highlights |
| Accent Light | #FFFBEB | Amber-50 — light accent backgrounds |
| Accent Border | #FDE68A | Amber-200 — accent card borders |
| Text Primary | #0F172A | Slate-900 — headings, body text |
| Text Secondary | #475569 | Slate-600 — descriptions |
| Text Tertiary | #94A3B8 | Slate-400 — labels, timestamps |
| Border | #E2E8F0 | Slate-200 — card/input borders |

### Typography
| Font | Variable | Usage |
|------|----------|-------|
| Inter | `--font-inter` | Body text, labels, numbers |
| Doto | `--font-doto` | Headlines, data displays, metrics |
| Caveat | `--font-caveat` | Handwriting accents (sparingly) |
| Permanent Marker | `--font-marker` | A.I.M.S. wordmark ONLY |

### Card Spec (Light Theme)
```css
/* Standard card */
background: #FFFFFF;
border: 1px solid #E2E8F0;
border-radius: 12px;
box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

/* Accent card */
background: #FFFBEB;
border-color: #FDE68A;
```

### Button Variants
| Variant | Style | Usage |
|---------|-------|-------|
| `primary` | Amber-600 bg, slate-800 text | Primary CTAs (one per view) |
| `secondary` | White bg, slate-200 border | Secondary actions |
| `ghost` | Transparent, amber hover | Tertiary actions |

### Status Indicators
- Emerald-500 (#22C55E): Live, active, healthy, success
- Amber-500 (#F59E0B): Warning, evaluating, in-progress
- Cyan-500 (#06B6D4): Info, informational
- Red-500 (#EF4444): Error, blocked, declined

### Numeric Display
All numbers, grades, stats, and metrics use `font-display` (Doto) class.
```html
<span class="font-display text-2xl font-bold text-amber-600">87</span>
```

## Image Generation Guidelines

### For Light Theme Assets
- **Color palette:** Amber/gold (#D97706) as accent, slate neutrals, white surfaces
- **Style:** Modern SaaS, clean, professional — NOT sci-fi or dark theme
- **Backgrounds:** Light, airy, subtle gradients on white/cream
- **Illustrations:** Isometric or flat, amber accent color, transparent backgrounds preferred

### For Dark Context Assets (Hangar, Lore Pages)
- **Color palette:** Gold (#D4AF37) accent, ink/obsidian base
- **Style:** Retro-futurism, controlled imperfection
- **Only for:** /hangar, Book of V.I.B.E., decorative ambient elements

### Human Approval Required
**ALL generated images MUST be reviewed and approved by the user before use.**

## Integration Pipeline
```
Stitch (UI layouts) → Nano Banana Pro (visual assets) → Gemini 3.1 Pro (production code)
```
