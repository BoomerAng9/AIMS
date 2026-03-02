# Design Systems Knowledge Base — Consolidated Reference

**Source:** Agentic UI Design System by Alex Gilev (30kstrategy.com)
**Topics:** 10 Laws, Token Architecture, AI Patterns, CBDS, Component Architecture, Naming, Principles, Insights

This file consolidates the 8 Knowledge Base sub-pages from the Design Systems Manual
into a single AI-agent-readable reference. For detailed coverage of each topic,
see the parent `design-systems-manual/README.md`.

---

## The 10 Laws of an AI-Ready Design System

1. **Name layers semantically** — `cta-primary` not `Button2_final_v3`
2. **Use Figma Variables for everything** — No hardcoded hex/rem/px
3. **Three-tier token hierarchy** — Primitive → Semantic → Component
4. **DTCG W3C format** — `{ "$value": ..., "$type": ... }` JSON
5. **Atomic component structure** — Atoms → Molecules → Organisms → Templates → Pages
6. **Map variant props to code props** — Figma variants = React props
7. **Auto-layout everything** — Maps to CSS flexbox
8. **Name slots explicitly** — `header`, `footer`, `actions`, `leading-visual`
9. **Add Code Connect** — Link Figma components to coded implementations
10. **Build .ai/ directory** — `agents.md` + skills + MCP configs + rules

---

## Three-Tier Token Quick Reference

```
Primitive (raw values)
  blue-500: #3B82F6
  space-4: 1rem
  font-size-16: 1rem

Semantic (meaning + intent) — references primitives
  color-action-primary: {blue-500}
  spacing-inline-md: {space-4}
  text-body-default: {font-size-16}

Component (scoped) — references semantics
  button-bg-primary: {color-action-primary}
  button-padding-inline: {spacing-inline-md}
  button-text-size: {text-body-default}
```

**Rule:** Components consume semantic tokens ONLY. Never reference primitives directly in component code.

---

## AI-Ready Checklist

| Aspect | Hostile | Ready |
|--------|---------|-------|
| Layer names | `Frame 47`, `Group 12` | `card-header`, `nav-primary` |
| Colors | Hardcoded hex | Variable references |
| Token names | `blue-big` | `color-action-primary-default` |
| Variants | Unnamed | Named props = code API |
| Layout | Absolute positioning | Auto-layout + constraints |
| Docs | None | Descriptions + usage guidelines |
| Component size | Monolithic | Atomic (atoms + molecules) |
| Token structure | Flat list | Three-tier hierarchy |

---

## CBDS Flow (Context-Based Design Systems)

1. Designers embed variants, states, tokens, usage intent
2. FigmaLint validates system-readiness
3. MCP extracts structured metadata
4. Developers validate + enhance code
5. Components tested, versioned, published
6. Story UI consumes via prompt-based iteration
7. Product teams approve → engineering

**Skipping any step degrades every step after it.**

---

## Component Architecture Rules

### Build Order
Atoms → Molecules → Organisms → Templates → Pages (bottom-up only)

### 8 Layout Rules
1. Auto Layout on everything (= flexbox)
2. Build smallest elements first
3. Nest auto layouts intentionally (H outer + V inner)
4. Correct resizing: Hug (buttons), Fill (sections), Fixed (grid cards)
5. Max 5 levels of nesting
6. `position: absolute` only for overlays/badges/tooltips
7. `space-between` for justified layouts
8. Always set min/max width constraints

### Slot Names
`children`, `header`, `footer`, `actions`, `leading-visual`, `trailing-actions`, `sidebar`, `main`, `aside`

---

## Naming Formula

```
{namespace}-{category}-{concept/role}-{property}-{variant/scale}-{state}-{mode}
```

| Tier | Pattern | Example |
|------|---------|---------|
| Primitive | `{category}-{scale}` | `blue-500`, `space-4` |
| Semantic | `{category}-{role}-{property}-{state}` | `color-action-primary-hover` |
| Component | `{component}-{element}-{property}-{variant}-{state}` | `button-label-color-ghost-disabled` |

---

## Principles

1. **Respect** — AI handles repetitive work; humans own craft + judgment
2. **Org-specific** — Train AI on YOUR conventions, not generic prompts
3. **Security** — Don't send proprietary IP to public AI services
4. **Human-owned I/O** — Review everything before shipping
5. **Predictability** — Consistency makes AI scalable
6. **Enhancement** — AI extends, never replaces

> "AI is a smart-but-junior developer. It requires supervision."

---

## A.I.M.S. Token Mapping

| Design System Manual | A.I.M.S. Implementation |
|---------------------|------------------------|
| Primitive colors | `tailwind.config.ts` extended colors |
| Semantic tokens | CSS custom properties in `agentic-theme.css` |
| Component tokens | CVA variant classes + `.aims-agentic` overrides |
| Motion tokens | `frontend/lib/motion/tokens.ts` |
| Motion variants | `frontend/lib/motion/variants.ts` |

### A.I.M.S. Semantic Color Map

| Semantic Role | Token | Value |
|--------------|-------|-------|
| Surface (base) | `--aims-surface` | `#111113` |
| Surface (raised) | `--aims-surface-raised` | `#18181B` |
| Surface (elevated) | `--aims-surface-elevated` | `#1F1F23` |
| Action primary | `--aims-gold` | `#D97706` |
| Action primary hover | `--aims-gold-light` | `#F59E0B` |
| Text primary | `--aims-frosty-white` | `#FAFAFA` |
| Text muted | `--aims-muted` | `#A1A1AA` |
| Border default | `--aims-wireframe-stroke` | `rgba(255,255,255,0.08)` |
