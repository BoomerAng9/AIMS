---
id: "magic-ui-components"
name: "21st.dev Magic UI"
type: "skill"
status: "active"
triggers:
  - "21st"
  - "21st.dev"
  - "magic component"
  - "magic ui"
  - "generate component"
  - "ui component"
  - "build component"
  - "/ui"
  - "component builder"
  - "component inspiration"
  - "logo search"
  - "svgl"
description: "21st.dev Magic MCP — generate production-grade React/TypeScript UI components from natural language via curated component library. 1000+ pre-tested community components."
execution:
  target: "api"
  route: "/api/mcp/magic-ui"
dependencies:
  env:
    - "TWENTY_FIRST_API_KEY"
  files:
    - "aims-skills/tools/21st-dev-magic.tool.md"
    - "frontend/components/"
priority: "high"
---

# 21st.dev Magic UI Components Skill

## When This Fires

Triggers when any agent needs to:
- Generate a new UI component from a description
- Find inspiration for a component design
- Search for SVG logos or brand assets
- Build rapid prototypes of dashboard features
- Create landing page sections (heroes, pricing, CTAs)

## What It Does

The 21st.dev Magic MCP generates production-grade React/TypeScript components from
natural language. Unlike hallucinated code, Magic draws from a curated library of
1000+ community-contributed, pre-tested components. Every generated component comes
with clean TypeScript, proper props, and responsive design out of the box.

## MCP Tools

### `21st_magic_component_builder`
Generate new React component code from a description.

```
Input:
  message: "Create a dark-themed pricing table with 3 tiers and annual/monthly toggle"
  searchQuery: "pricing table toggle"

Output: Full React/TypeScript component code snippet
```

**Trigger phrases:** /ui, "create a component", "build a button", "make a card"

### `21st_magic_component_inspiration`
Fetch existing component designs and code from 21st.dev library.

```
Input:
  message: "Show me modern hero sections with gradient backgrounds"
  searchQuery: "hero gradient"

Output: JSON data with matching components, previews, and code
```

**Trigger phrases:** "show me", "find a component", "get inspiration", "browse components"

### `logo_search`
Search for SVG logos and brand assets via SVGL integration.

**Trigger phrases:** "find logo", "company logo", "brand icon", "svg logo"

## Component Categories Available

### Section Components (for pages)
- **Heroes** (73) — Landing, SaaS, app, minimal
- **Navigation** (11) — Navbar, mega menu, mobile
- **Pricing** (17) — Tables, cards, comparison
- **Features** (36) — Grids, icons, alternating
- **CTAs** (34) — Banners, inline, floating
- **Testimonials** (15) — Quotes, carousels, avatars
- **Footers** (14) — Multi-column, minimal, mega
- **Backgrounds** (33) — Gradients, particles, mesh

### UI Components (for interfaces)
- **Buttons** (130) — Primary, ghost, icon, animated
- **Cards** (79) — Info, product, profile, dashboard
- **Inputs** (102) — Text, search, password, OTP
- **Tables** (30) — Data, sortable, paginated
- **Dialogs** (37) — Modals, sheets, drawers
- **Forms** (23) — Contact, signup, multi-step
- **AI Chats** (30) — Chat bubbles, streaming
- **Selects** (62) — Dropdown, combobox, multi

### Tech Stack Output
- React + TypeScript
- Tailwind CSS
- shadcn/ui + Radix UI primitives
- Framer Motion animations

## Rules for Agents

1. **Dark theme alignment** — All generated components must be adapted to A.I.M.S. dark theme (#09090B bg, amber-500 accent, zinc-50 text)
2. **searchQuery must be concise** — 2-4 words max for best library matching
3. **Decompose complex UIs** — Break large interfaces into smaller component requests
4. **Review before integrating** — Always review generated code for quality and compatibility
5. **Use inspiration first** — Check existing components before generating new ones
6. **Respect rate limits** — Free tier: 5 generations/month. Pro tier: higher limits

## A.I.M.S. Integration Points

| Touch Point | Component Use |
|-------------|-------------|
| **Dashboard** | Generate data cards, metric displays, charts |
| **HalalHub** | Product cards, vendor profiles, category grids |
| **Plug Catalog** | Deployment cards, tool comparison tables |
| **ACHEEVY Chat** | Chat bubbles, input bars, streaming indicators |
| **Landing Pages** | Hero sections, pricing tables, feature grids |
| **Auth Pages** | Sign-in forms, onboarding steps |

## Integration with Design Skills

Generated components should be post-processed through:
- `aims-global-ui` — Layout and responsiveness rules
- `aims-animated-web` — Motion and scroll animations
- Nano Banana Pro — Obsidian/gold glassmorphism overlay

## Fallback Chain

```
Primary:   21st.dev Magic MCP (curated library)
Fallback:  shadcn/ui CLI (npx shadcn-ui add <component>)
Emergency: Manual component authoring with Tailwind
```

## Cost Considerations

| Tier | Generations/month | Existing Components |
|------|-------------------|-------------------|
| Hobby | 5 | Always accessible |
| Pro | Higher | Always accessible |

SME_Ang tracks generation count and switches to inspiration-only mode
when approaching limits.
