---
id: "21st-dev-magic"
name: "21st.dev Magic MCP"
type: "tool"
category: "ui-generation"
provider: "21st.dev"
tier: "Pro"
description: "AI-powered UI component generation via MCP. Like v0 but inside your IDE. Generates production-grade React/TypeScript components from natural language descriptions."
env_vars:
  - "TWENTY_FIRST_API_KEY"
docs_url: "https://github.com/21st-dev/magic-mcp"
aims_files:
  - "aims-skills/skills/integrations/magic-ui-components.skill.md"
  - "frontend/components/"
---

# 21st.dev Magic MCP — Tool Reference

## What It Is

21st.dev Magic is a production-ready MCP server that generates beautiful React/TypeScript
UI components from natural language descriptions. It draws from a curated library of 1000+
community-contributed, pre-tested components — no hallucinated code.

Tagline: "Like v0 but in your Cursor/WindSurf/Cline."

## npm Package

```
@21st-dev/magic  (MIT, beta)
```

## Environment Variables

```
TWENTY_FIRST_API_KEY=<your-api-key>    # From https://21st.dev/magic/console
# OR
API_KEY=<your-api-key>                  # Alternative env var name
```

## MCP Configuration

### Claude Code
```json
{
  "mcpServers": {
    "@21st-dev/magic": {
      "command": "npx",
      "args": ["-y", "@21st-dev/magic@latest"],
      "env": {
        "API_KEY": "<your-api-key>"
      }
    }
  }
}
```

### CLI Install (Recommended)
```bash
npx @21st-dev/cli@latest install claude --api-key <key>
```

Supported clients: `cursor`, `windsurf`, `cline`, `claude`

## MCP Tools Exposed

### 1. `21st_magic_component_builder`
Generate new React components from natural language descriptions.

**Input Schema:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `message` | string | Yes | Full user message describing the component |
| `searchQuery` | string | Yes | 2-4 word search query for 21st.dev library match |

**Output:** React/TypeScript component code snippet ready to integrate.

**Example:**
```
message: "Create a modern pricing table with 3 tiers, annual/monthly toggle, and a highlighted recommended plan"
searchQuery: "pricing table toggle"
```

### 2. `21st_magic_component_inspiration`
Fetch existing component data from 21st.dev library for inspiration.

**Input Schema:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `message` | string | Yes | What you're looking for |
| `searchQuery` | string | Yes | 2-4 word search query |

**Output:** JSON data of matching components with previews and code snippets.

### 3. `logo_search`
Search and retrieve SVG logos and brand assets via SVGL integration.

**Use Cases:**
- Company logos in JSX/TSX/SVG format
- Brand icons for dashboards
- Professional asset integration

## Component Library (1000+ components)

### Section Components
| Category | Count | Examples |
|----------|-------|---------|
| Heroes | 73 | Landing heroes, app heroes, SaaS heroes |
| Navigation | 11 | Navbars, mega menus, mobile navs |
| Pricing | 17 | Pricing tables, comparison cards |
| Testimonials | 15 | Quote cards, carousel reviews |
| Features | 36 | Feature grids, icon sections |
| CTAs | 34 | Banner CTAs, inline CTAs |
| Footers | 14 | Multi-column, minimal, mega footers |
| Backgrounds | 33 | Gradients, particles, mesh |

### UI Components
| Category | Count | Examples |
|----------|-------|---------|
| Buttons | 130 | Primary, ghost, icon, animated |
| Cards | 79 | Info, product, profile, dashboard |
| Inputs | 102 | Text, search, password, OTP |
| Tables | 30 | Data tables, sortable, paginated |
| Dialogs | 37 | Modals, sheets, drawers |
| Forms | 23 | Contact, signup, multi-step |
| AI Chats | 30 | Chat bubbles, streaming UI |
| Selects | 62 | Dropdown, combobox, multi-select |

### Tech Stack
- **React** + **TypeScript** (primary output)
- **Tailwind CSS** (styling)
- **shadcn/ui** + **Radix UI** (primitives)
- **Framer Motion** (animations)

## A.I.M.S. Integration

### Use Cases

| Use Case | Description |
|----------|-------------|
| **Rapid Prototyping** | Generate dashboard components from ACHEEVY chat |
| **Design System** | Pull pre-built components matching dark theme spec |
| **HalalHub UI** | Generate marketplace components (product cards, filters) |
| **Plug Catalog** | Build deployment card UIs from descriptions |
| **Landing Pages** | Generate hero sections, pricing tables, CTAs |

### Routing via Design Agents
```
User → ACHEEVY → SME_Ang → 21st.dev Magic MCP → Component Code → Frontend
```

### Integration with Design Skills
21st.dev Magic components should be styled to match the A.I.M.S. dark theme:
- Background: #09090B
- Surface: #111113
- Cards: #18181B
- Accent: amber-500
- Text: zinc-50

## Pricing

| Tier | Generations/month | Cost |
|------|-------------------|------|
| Hobby | 5 | Free |
| Pro | Higher limits | Paid |

Existing components remain functional regardless of plan limits.

## Ownership

All generated components are MIT-licensed. Full ownership — use, modify,
and distribute freely. No attribution required.

## Links

- Platform: https://21st.dev/magic
- GitHub: https://github.com/21st-dev/magic-mcp
- npm: https://www.npmjs.com/package/@21st-dev/magic
- Console: https://21st.dev/magic/console
- Component Library: https://21st.dev/home
