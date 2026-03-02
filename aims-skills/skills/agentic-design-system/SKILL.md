---
name: agentic-design-system
description: |
  Agentic UI Design System integration for A.I.M.S. — enterprise-grade
  components for building AI agent interfaces with ACHEEVY.
  Use when: building or modifying chat UI, agent dashboards, tool execution
  displays, streaming responses, or any AI-facing interface component.
role: Specialist Executor
intent: Apply Agentic UI design patterns, RAG-backed best practices, and themed components to all AI agent interfaces in A.I.M.S.
kpis:
  - design_consistency_score
  - component_reuse_rate
  - accessibility_compliance_rate
  - cognitive_load_reduction
status: active
priority: critical
triggers:
  - chat UI modification
  - new agent interface component
  - dashboard design review
  - tool execution display
  - streaming response rendering
  - design system audit
execution: sequential
dependencies:
  - agentic-ui (npm package v0.4.0+)
  - frontend/lib/agentic-theme.css (dark theme bridge)
  - frontend/lib/motion/tokens.ts (animation tokens)
---

# Agentic Design System

## Overview

The Agentic UI Design System provides enterprise-grade React components specifically designed for AI agent interfaces. A.I.M.S. uses it with a custom dark theme bridge that maps all components to the obsidian/gold/glass aesthetic.

**Source:** agenticui.net (premium subscription)
**Package:** `agentic-ui@0.4.0`
**Theme bridge:** `frontend/lib/agentic-theme.css`

## Component Library

### Conversation Components
| Component | Purpose | Import |
|-----------|---------|--------|
| `ChatInput` | Multi-modal input with tools, files, slash commands | `agentic-ui` |
| `ChatMessage` | Role-based message rendering (user/assistant/system) | `agentic-ui` |
| `MessageList` | Virtualized message container | `agentic-ui` |

### Agent Components
| Component | Purpose | Import |
|-----------|---------|--------|
| `AgentCard` | Agent status card (online/offline/thinking/busy) | `agentic-ui` |
| `AgentSelector` | Multi-agent picker | `agentic-ui` |
| `AgentGrid` | Grid layout for agent display | `agentic-ui` |

### Input Components
| Component | Purpose | Import |
|-----------|---------|--------|
| `PromptComposer` | Template-based prompt builder with variables | `agentic-ui` |
| `MarkdownRenderer` | Rich markdown display | `agentic-ui` |
| `CodeBlock` | Syntax-highlighted code display | `agentic-ui` |

### Memory Components
| Component | Purpose | Import |
|-----------|---------|--------|
| `ContextViewer` | Display conversation context items | `agentic-ui` |
| `UsageMetrics` | Token usage, cost, response time display | `agentic-ui` |

### UI Primitives
| Component | Purpose | Import |
|-----------|---------|--------|
| `Badge` | Status/label badges with variants | `agentic-ui` |
| `Button` | Action buttons with 6 variants | `agentic-ui` |
| `StreamingText` | Real-time text streaming display | `agentic-ui` |
| `Typewriter` | Character-by-character reveal | `agentic-ui` |
| `TypingIndicator` | Animated typing dots | `agentic-ui` |
| `ThinkingAnimation` | AI thinking state animation | `agentic-ui` |
| `Skeleton` / `MessageSkeleton` | Loading placeholders | `agentic-ui` |
| `LoadingSpinner` / `PulseLoader` / `WaveLoader` | Loading indicators | `agentic-ui` |
| `DragDropOverlay` | File drag-and-drop overlay | `agentic-ui` |
| `SearchMenu` | Searchable dropdown menu | `agentic-ui` |
| `FileDisplay` | File attachment display with status | `agentic-ui` |
| `Toaster` | Toast notification system | `agentic-ui` |

## Theme Integration

All agentic-ui components must be wrapped in the `.aims-agentic` class to apply the A.I.M.S. dark theme:

```tsx
import "@/lib/agentic-theme.css";

export function MyComponent() {
  return (
    <div className="aims-agentic">
      <ChatInput {...props} />
    </div>
  );
}
```

### Color Mapping
| agentic-ui default | A.I.M.S. override |
|-------------------|-------------------|
| `bg-white` | `#18181B` (surface-raised) |
| `bg-gray-50` | `#111113` (surface) |
| `text-gray-600` | `#A1A1AA` (muted) |
| `text-gray-800` | `#FAFAFA` (frosty-white) |
| `bg-blue-500` | `#D97706` (gold) |
| `border-gray-200` | `rgba(255,255,255,0.08)` (wireframe-stroke) |

## Usage Rules

1. **Always wrap in `.aims-agentic`** — Components render with light theme by default
2. **Import theme CSS once** per page/layout: `import "@/lib/agentic-theme.css"`
3. **Use with existing motion tokens** — Animations should still use `frontend/lib/motion/tokens.ts`
4. **Respect `prefers-reduced-motion`** — Every animation MUST check reduced motion preference
5. **Don't duplicate** — If agentic-ui has a component (Badge, Button, StreamingText), use it instead of building custom

## RAG Knowledge Base Reference

548 best practices across 27 categories are available at:
`aims-skills/design/rag-knowledge-base/`

Categories include: Cognitive Load, Accessibility, Behavioral Psychology, Component Patterns, Dashboard Design, Data Display & Tables, Design Process & Methodology, Design Systems & Tokens, Desktop-Specific Patterns, Navigation, Interaction Patterns, Forms, Gamification, Reading Psychology, Human-Centered Design, Gestalt Principles.

## Design Systems Reference

Full design system methodology reference at:
- `aims-skills/design/design-systems-manual/` — 10 Laws, token architecture, CBDS, AI-ready patterns, tool stack, naming conventions, AI principles
- `aims-skills/design/ucd-manual/` — 13-section UCD manual (Lean UX, personas, IA, wireframes, usability testing, accessibility, gamification)
- `aims-skills/design/knowledge-base/` — Consolidated KB: token hierarchy, AI-ready checklist, component architecture, naming formula, CBDS flow

### Key Rules from Knowledge Base
1. **10 Laws** — Semantic naming, Figma Variables, three-tier tokens, DTCG format, atomic structure, prop mapping, auto-layout, explicit slots, Code Connect, .ai/ directory
2. **Three-Tier Tokens** — Primitive → Semantic → Component. Components consume semantic tokens ONLY.
3. **AI-Ready Patterns** — Named layers, variable references, auto-layout, atomic components, documented variants
4. **CBDS** — Context travels with component from design → development → AI. Skipping steps degrades all downstream.
5. **Naming** — `{namespace}-{category}-{concept}-{property}-{variant}-{state}-{mode}`

## Quality Gates

- [ ] All agentic-ui components use `.aims-agentic` wrapper
- [ ] Theme CSS imported in layout or page
- [ ] No hardcoded colors — use theme bridge or Tailwind tokens
- [ ] `prefers-reduced-motion` respected
- [ ] WCAG 2.1 AA compliance verified
- [ ] Token usage follows three-tier hierarchy (no primitives in components)
- [ ] Component names match slot-based naming conventions
- [ ] Build passes (`npm run build`)
