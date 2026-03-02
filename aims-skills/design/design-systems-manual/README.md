# Design Systems Manual

**Source:** Agentic UI Design System by Alex Gilev (30kstrategy.com)
**License:** Non-resale, personal/team use only

## Overview

Comprehensive resource for building an AI-ready design system in Figma and porting
it to code via Claude Code, Cursor, or other LLM tools. Covers best practices for
connecting design systems to code to achieve pixel-perfect handoff.

---

## Getting Started (10-Step Guide)

| Step | Name | Priority |
|------|------|----------|
| 1 | Set Up Figma Variables (Primitives → Semantics → Components) | Do Not Skip |
| 2 | Structure Components Atomically (Atoms → Molecules → Organisms) | Do Not Skip |
| 3 | Name Layers Semantically (match code prop names) | Do Not Skip |
| 4 | Set Up Auto Layout Everywhere | Do Not Skip |
| 5 | Map Variant Props to Code Props | Important |
| 6 | Add Component Descriptions and Usage Guidelines | Important |
| 7 | Export Tokens in DTCG/W3C Format | Important |
| 8 | Set Up Design-to-Code Pipeline (MCP / Code Connect) | Helpful |
| 9 | Create a .ai/ Directory with Rules and Context | Important |
| 10 | Lint and Validate with FigmaLint | Helpful |

---

## The 10 Laws of an AI-Ready Design System

1. **Name layers semantically** — Layer names must describe purpose, not appearance. `cta-primary` not `Button2_final`.
2. **Use Figma Variables for everything** — No hardcoded hex/rem/px values. Every color, spacing, radius, shadow = a variable.
3. **Three-tier token hierarchy** — Primitive → Semantic → Component. Components consume semantic tokens ONLY.
4. **DTCG W3C format** — Export tokens as `{ "$value": ..., "$type": ... }` JSON for cross-tool consumption.
5. **Atomic component structure** — Atoms → Molecules → Organisms → Templates → Pages. Build bottom-up.
6. **Map variant props to code props** — Figma variant names must match React/code prop names exactly.
7. **Auto-layout everything** — Every frame containing multiple elements uses auto layout (maps to CSS flexbox).
8. **Name slots explicitly** — Use `header`, `footer`, `actions`, `leading-visual`, `trailing-actions` — not `Frame47`.
9. **Add Code Connect** — Link design components to their coded implementations for bidirectional parity.
10. **Build .ai/ directory** — Include `agents.md`, skills, MCP configs, component rules, and token files.

### Cost of Not Following
- Poorly named layers → AI hallucinates component intent
- Hardcoded values → tokens can't sync across design/code
- Missing auto-layout → AI generates absolute positioning that breaks at every screen size
- Unnamed slots → AI places content in wrong component regions

---

## Three-Tier Token Architecture

### Hierarchy

| Tier | Scope | Example | Consumed By |
|------|-------|---------|-------------|
| **Primitive** | Raw values | `blue-500: #3B82F6` | Semantic tokens only |
| **Semantic** | Meaning + intent | `color-action-primary: {blue-500}` | Component tokens |
| **Component** | Scoped per-component | `button-bg-primary: {color-action-primary}` | Component code |

### DTCG W3C JSON Format

```json
{
  "color": {
    "action": {
      "primary": {
        "$value": "{color.blue.500}",
        "$type": "color",
        "$description": "Primary action background"
      }
    }
  }
}
```

### Token Category Coverage

| Category | Primitive Example | Semantic Example |
|----------|------------------|-----------------|
| Colors | `blue-500`, `gray-100` | `color-bg-surface`, `color-text-primary` |
| Typography | `font-size-16`, `font-weight-600` | `text-body-default`, `text-heading-lg` |
| Spacing | `space-4`, `space-8` | `spacing-inline-md`, `spacing-stack-lg` |
| Sizing | `size-40`, `size-48` | `icon-size-default`, `avatar-size-lg` |
| Border | `radius-4`, `width-1` | `border-radius-interactive`, `border-width-default` |
| Elevation | `shadow-sm`, `shadow-lg` | `elevation-raised`, `elevation-overlay` |
| Motion | `duration-200`, `ease-out` | `motion-enter`, `motion-exit` |
| Opacity | `opacity-50`, `opacity-80` | `opacity-disabled`, `opacity-hover` |

### Naming Anti-Patterns

| Anti-Pattern | Problem | Correct |
|-------------|---------|---------|
| `blue-button-bg` | Color-locked | `button-bg-primary` |
| `big-font` | Subjective | `text-heading-xl` |
| `margin-20` | Value-locked | `spacing-stack-lg` |
| `header-color` | Context-locked | `color-text-heading` |

---

## AI-Ready vs AI-Hostile Patterns

| Aspect | AI-Hostile | AI-Ready |
|--------|-----------|----------|
| Layer names | `Frame 47`, `Group 12` | `card-header`, `nav-primary` |
| Color values | `#3B82F6` hardcoded | `{color.action.primary}` variable |
| Token names | `blue-big` | `color-action-primary-default` |
| Variants | Unnamed, undocumented | Named props matching code API |
| Layout | Absolute positioning | Auto-layout with constraints |
| Documentation | None | Descriptions, usage guidelines in Figma |
| Component size | Monolithic 500-line components | Atomic: atoms + molecules + organisms |
| Token structure | Flat list of values | Three-tier: primitive → semantic → component |

---

## Context-Based Design Systems (CBDS)

CBDS encode not just how something looks, but **what it does, how it behaves, and when it should be used**. That context travels with the component from design to development to AI.

### The CBDS Flow (7 Steps)

1. Designers embed variants, states, tokens, and usage intent
2. Linting tools (FigmaLint) validate designs are system-ready
3. A design-to-code protocol (MCP) extracts structured metadata
4. Developers validate and enhance code with a clear map
5. Components are tested, versioned, and published
6. Layout tools (Story UI) consume components via prompt-based iteration
7. Product teams approve and hand refined designs to engineering

Each step makes the next one smarter. **Skipping a step degrades every step after it.**

### The Context Engineer Role

Senior developers evolve into **Context Engineers** — they understand code, metadata, AI generation models, MCP, and how systems communicate across tooling boundaries. They are system stewards who ensure context is never lost.

---

## Component Architecture for AI

### Atomic Design Hierarchy

| Level | Definition | LLM Implication |
|-------|-----------|----------------|
| Atoms | Indivisible elements (button, input, label) | Smallest prompt targets |
| Molecules | Functional groupings (search = label + input + button) | Single-responsibility, reproducible |
| Organisms | Complex sections (header, card grid) | Composition patterns for AI assembly |
| Templates | Page layout with placeholders | Structural scaffolds for generation |
| Pages | Templates + real content | Validation instances |

### 8 Rules for AI-Translatable Layouts

1. **Use Auto Layout as default — always.** Maps to CSS flexbox.
2. **Start from smallest element up.** Build atoms first, compose into molecules.
3. **Nest auto layouts intentionally.** Horizontal outer + vertical inner = multi-column.
4. **Use correct resizing.** Buttons = Hug. Sections = Fill. Cards in grid = Fixed width.
5. **Keep layer hierarchy flat.** No deeper than 5 levels (avoids bloated DOM).
6. **Use 'Ignore auto layout' sparingly.** Only for overlays, badges, tooltips.
7. **Use 'Space between' for justified layouts.** Maps to `justify-content: space-between`.
8. **Set min/max constraints.** Prevents collapse at small sizes, overflow at wide viewports.

### Slot-Based Naming Pattern

| Slot Type | Example Names | Purpose |
|-----------|--------------|---------|
| General | `children` | Main body content |
| Named | `header`, `footer`, `actions`, `leading-visual` | Specific regions |
| Layout | `sidebar`, `main`, `aside` | Page sections |

---

## Naming Convention Cheat Sheet

### Universal Formula

```
{namespace}-{category}-{concept/role}-{property}-{variant/scale}-{state}-{mode}
```

### Naming by Tier

| Tier | Pattern | Example |
|------|---------|---------|
| Primitive | `{category}-{scale}` | `blue-500`, `space-4` |
| Semantic | `{category}-{role}-{property}-{state}` | `color-action-primary-hover` |
| Component | `{component}-{element}-{property}-{variant}-{state}` | `button-label-color-ghost-disabled` |

### Real-World Examples

| System | Token Example |
|--------|-------------|
| GitHub Primer | `color-fg-default`, `color-bg-accent-emphasis` |
| Atlassian | `color.text.brand`, `space.200` |
| IBM Carbon | `$button-primary`, `$spacing-05` |
| Shopify Polaris | `color-bg-fill-brand`, `space-400` |

---

## Principles for AI Design Systems

1. **Respect** — Use AI for repetitive low-value work. Protect craft and human judgment.
2. **Org-specific solutions** — Train AI on YOUR culture, stack, and preferences — not generic prompts.
3. **Security and privacy** — Prefer on-premises/private AI tools. Don't send proprietary IP to public services.
4. **Human-owned I/O** — Humans control input and can modify output. Review everything before shipping.
5. **Predictability** — Fine-tune for consistent results. Consistency is what makes AI scalable.
6. **Enhancement, not replacement** — AI extends the system. It does not replace the people who built it.

### Where AI Supercharges Design Systems

| Area | Impact |
|------|--------|
| Writing component code | 40–90% faster with trained LLMs |
| Cross-framework translation | e.g., LitElement to React |
| Unit test generation | Automated from component specs |
| Accessibility reviewing | Automated a11y auditing |
| Documentation | Auto-generated props tables, usage guides |

### Vibe Coding Warning

> 16 of 18 CTOs reported production disasters from "vibe-coded" solutions lacking architectural oversight.

Use AI freely in sandboxes. Apply rigor for production. The two modes are **not** interchangeable.

---

## Databases

### Component Database (15 components)

Core atomic and molecular components tracked with: name, category, Figma status, code status, tokens used, variant count, a11y compliance.

### Tool Stack (17 tools)

| Category | Tools |
|----------|-------|
| Design | Figma, FigmaLint, Anova, Figma Code Connect |
| MCP | Figma Console MCP, Design Systems MCP, Storybook MCP |
| Code | Claude Code, Cursor, Antigravity (Google) |
| Build | Story UI, Storybook, Warp Terminal |
| Audit | WAVE, axe, OpenHands |
| Other | Docker MCP Manager, Zeroheight MCP, Gotrino, A2UI |

### Methodologies (7 frameworks)

Atomic Design, CBDS, DTCG/W3C Tokens, Brad Frost Agentic DS, Nathan Curtis Slots, MCP Protocol, Design-Code Parity.

---

## Insights — Tools, Workflows & Best Practices

### Key MCP Tools

| Tool | Author | Purpose |
|------|--------|---------|
| Figma Console MCP | TJ/Southleft | Full read/write Figma access — components, variables, docs |
| Design Systems MCP | TJ/Southleft | Teaches AI component structure, a11y, slot architecture |
| Storybook MCP | Chromatic | AI works with Storybook stories (React) |
| Story UI | TJ/Southleft | AI-powered story generator for ANY JS framework |

### Anova Plugin (Token Savings)

| Method | Tokens | Quality |
|--------|--------|---------|
| Figma link only (MCP) | 130k | B+ |
| Figma link + Anova data | 120k | B+ |
| Only Anova data (no MCP) | 103k | A+ |

**Result:** ~30% token savings with better output. Raw Figma data overwhelms Claude at large context.

### Modern Figma-to-Code Pipeline

**Old way:** Figma + specs → engineering handoff → code → QA → merge
**New way:** Simple `.md` file → AI IDE (with QA at same time) → code → merge

### Best Practices

- Provide FULL token structure to AI: primitives + semantics + component mappings
- Minimize active MCP servers to reduce context bloat
- Use Docker as MCP manager
- Generate docs from source (Figma + code) rather than writing by hand
- Decide which side is canonical (design or code) and enforce alignment
- QA is non-negotiable — always finish the last mile
- `agents.md` files are the least-resistance path for adoption

### Model Selection

| Use Case | Recommended Model |
|----------|------------------|
| Complex multi-repo tasks | Opus |
| Planning | Opus |
| Coding (cost-efficient) | Gemini Flash (1/10th cost) |
| Nuanced MCP extraction | Claude or Gemini (not ChatGPT) |

---

## A.I.M.S. Design System Architecture

### Token Hierarchy

```
Design Tokens (Figma Variables)
  → CSS Custom Properties (tailwind.config.ts)
    → Tailwind Utilities (className)
      → Component Variants (CVA)
        → Themed Components (.aims-agentic override)
```

### Design-to-Code Flow

```
Figma (Agentic Design System Beta)
  → Figma MCP Server (inspect frames)
    → Claude Code / Cursor
      → React components with agentic-ui + A.I.M.S. tokens
        → Build verification (npm run build)
```

### Current Token Sources

| Source | File | Purpose |
|--------|------|---------|
| Tailwind Config | `frontend/tailwind.config.ts` | Colors, spacing, typography, breakpoints |
| Motion Tokens | `frontend/lib/motion/tokens.ts` | Durations, easings, springs, stagger |
| Motion Variants | `frontend/lib/motion/variants.ts` | 22+ reusable Framer Motion presets |
| Agentic Theme | `frontend/lib/agentic-theme.css` | Dark theme overrides for agentic-ui |
| CVA Variants | `agentic-ui/dist/` | Component-level variant definitions |

### Component Layers

1. **agentic-ui primitives** — Badge, Button, StreamingText, LoadingStates
2. **agentic-ui conversation** — ChatInput, ChatMessage, MessageList
3. **agentic-ui agent** — AgentCard, AgentSelector, AgentGrid
4. **A.I.M.S. motion** — ScrollReveal, ParallaxSection, TiltCard, GlowBorder, BentoGrid
5. **A.I.M.S. custom** — VoiceVisualizer, CircuitBoard, LEDDisplay, NixieTube, QuotaBar
6. **A.I.M.S. wrappers** — AcheevyChatInput (planned), themed composition components

---

## Design System Rules for AI Agents

When any AI agent (Claude, Gemini, Cursor) generates UI code for A.I.M.S.:

1. **Check agentic-ui first** — If a component exists in agentic-ui, use it
2. **Check motion library second** — If an animation exists in `frontend/lib/motion/`, use it
3. **Check existing components third** — If a component exists in `frontend/components/`, use it
4. **Only then build custom** — New components must follow CVA + Tailwind + cn() pattern
5. **Always wrap agentic-ui** in `.aims-agentic` class
6. **Always import theme CSS** with `import "@/lib/agentic-theme.css"`
7. **Never hardcode colors** — Use Tailwind tokens or CSS variables
8. **Never hardcode animation values** — Import from `@/lib/motion/tokens`
9. **Always support `prefers-reduced-motion`**
10. **Always run `npm run build`** before considering work complete
11. **Three-tier tokens** — Primitive → Semantic → Component. Components consume semantic only.
12. **Atomic structure** — Build bottom-up: atoms → molecules → organisms
13. **Name slots explicitly** — `header`, `footer`, `actions` — not `Frame47`
14. **Human review** — AI is a smart-but-junior developer. Review everything before shipping.
