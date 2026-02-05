---
id: "nano-banana-pro"
name: "Nano Banana Pro"
type: "skill"
status: "active"
triggers:
  - "nano banana"
  - "glassmorphism"
  - "ui architect"
  - "acheevy design"
  - "glass panels"
  - "obsidian gold"
  - "brick and window"
  - "gold border"
description: "UI architect persona that enforces the obsidian/gold glassmorphism design language across all A.I.M.S. interfaces."
execution:
  target: "persona"
dependencies:
  files:
    - "locale-skills/nano-banana-pro.md"
    - ".stitch/persona.md"
    - "frontend/tailwind.config.ts"
    - "frontend/components/ui/"
priority: "high"
---

# Nano Banana Pro UI Architect Skill

## Visual Identity Spec

### Colors
| Token | Hex | Usage |
|-------|-----|-------|
| Obsidian | #0A0A0A | Page background |
| Leather | #1A1A1A | Card/panel base |
| Deep Black | #050507 | True black for depth |
| Gold | #D4AF37 | Primary accent, borders, CTAs |
| Gold Light | #E8D48A | Hover states, secondary accent |
| Champagne | #F6C453 | Glow effects |

### Typography
| Font | Variable | Usage |
|------|----------|-------|
| Inter | `--font-inter` | Body text, labels |
| Doto | `--font-doto` | Headlines, numbers, grades, stats |
| Caveat | `--font-caveat` | Handwriting accents |
| Marker | `--font-marker` | Casual emphasis |

### Glass Panel Spec
```css
/* Standard glass card */
background: rgba(0, 0, 0, 0.4);
backdrop-filter: blur(20px);
border: 1px solid rgba(255, 255, 255, 0.05);
border-radius: 16px;

/* Gold accent card */
border-color: rgba(212, 175, 55, 0.2);
box-shadow: 0 0 15px rgba(245, 158, 11, 0.1);
```

### Layout: Brick and Window
- The **brick** = LogoWallBackground with abstract ACHEEVY pattern at 15% opacity
- The **window** = Glass panels floating within, 5-10% viewport edges showing brick
- Modes: hero (80% overlay), auth (70%), form (85%), dashboard (90%)

### Button Variants
| Variant | Style | Usage |
|---------|-------|-------|
| `acheevy` | Amber bg, black text, gold glow | Primary CTAs |
| `glass` | White/5 bg, blur, white border | Secondary actions |
| `ghost` | Transparent, hover accent | Tertiary actions |

### Status Indicators
- Emerald (#10B981): Active, committed, success
- Amber (#F59E0B): Warning, evaluating, in-progress
- Cyan (#06B6D4): Info, prospect
- Red (#EF4444): Error, declined

### Numeric Display
All numbers, grades, stats, and metrics use `font-display` (Doto) class.
```html
<span class="font-display text-2xl font-bold text-amber-400">87</span>
```
