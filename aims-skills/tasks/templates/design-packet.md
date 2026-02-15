---
id: "design-packet-template"
name: "Design Packet"
type: "task"
status: "active"
triggers: ["design packet", "design system", "token sheet"]
description: "Template for what must be produced for any design work: anchors, tokens, motion rules, composition rules."
execution:
  target: "internal"
priority: "high"
---

# Design Packet Template

> Fill this out for every design or redesign task. No design work proceeds without a completed packet.

## 1. Anchors

### Emotional Target
_What should the user FEEL when they see this?_

- [ ] Professional / Trustworthy
- [ ] Technical / Powerful
- [ ] Warm / Approachable
- [ ] Futuristic / Cutting-edge
- [ ] Other: ___

### Reference Imagery
_List or attach mood board references:_

| Ref # | Source | What We're Taking From It |
|-------|--------|--------------------------|
| 1 | | |
| 2 | | |
| 3 | | |

### Brand Asset Usage
- ACHIEVEMOR gold logo: Edge-wrapped (perimeter emboss / corner stamp / edge band)
- ACHEEVY helmet: Header badge, avatar, controlled opacity watermark (max 4%)
- Background: Purpose-built Hangar surface (see `hangar-ui-world.md`)

## 2. Token Sheet

_Reference `design-tokens-standards.md` for the full token system._

### Overrides or Additions for This Work
| Token | Standard Value | Override Value | Reason |
|-------|---------------|----------------|--------|
| | | | |

## 3. Motion Rules

### Transitions
| Element | Enter | Exit | Duration |
|---------|-------|------|----------|
| Page | | | |
| Panel | | | |
| Modal | | | |
| Toast | | | |

### Idle Animations
| Element | Animation | Duration | Easing |
|---------|-----------|----------|--------|
| | | | |

### Interaction Responses
| Trigger | Response | Duration |
|---------|----------|----------|
| Hover | | |
| Click | | |
| Focus | | |

## 4. Layout Rules

### Grid
- Columns: ___
- Gutter: ___
- Margins: Desktop ___ / Tablet ___ / Mobile ___

### Breakpoints
- Desktop: 1440px+
- Tablet: 768px - 1439px
- Mobile: < 768px

### Safe Areas
- Top: ___
- Bottom: ___
- Notch handling: ___

### Overflow Behavior
- Primary scroll container: ___
- Nested scroll: ___
- Max content width: ___

## 5. Composition Map

### Component Hierarchy
```
[Root Layout]
  ├── [Component A]
  │   ├── [Sub-component]
  │   └── [Sub-component]
  ├── [Component B]
  └── [Component C]
```

### Token Bindings
| Component | Spacing | Colors | Radii | Elevation |
|-----------|---------|--------|-------|-----------|
| | | | | |

## Sign-Off

- [ ] Anchors locked
- [ ] Tokens defined (no magic numbers)
- [ ] Motion rules specified
- [ ] Layout rules explicit for all breakpoints
- [ ] Composition map complete
- [ ] Ready for implementation
