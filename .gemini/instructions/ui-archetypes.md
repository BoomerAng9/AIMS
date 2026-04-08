# A.I.M.S. UI Archetypes — Design Guide

Classify every screen before making UI changes. Map to ONE archetype and apply its spec.

---

## Archetype Detection

Look at: file path, component names, user description. Map to ONE of:

| # | Archetype | Routes |
|---|-----------|--------|
| 1 | **Landing & Marketing** | `app/page.tsx`, public marketing routes |
| 2 | **Auth & Onboarding** | `app/(auth)/**`, `app/onboarding/**` |
| 3 | **Chat with ACHEEVY** | `app/chat/**`, `app/dashboard/chat/**` |
| 4 | **CRM / Client Management** | `app/crm/**`, `app/clients/**`, `app/projects/**` |
| 5 | **Command Center** | `app/agents/**`, `app/dashboard/circuit-box/**`, control panels |
| 6 | **Finance & Analytics** | `app/finance/**`, `app/luc/**`, `app/analytics/**` |
| 7 | **Workflow Builder** | `app/workflows/**`, `app/automation/**`, `app/dashboard/automations/**` |
| 8 | **Content / Research** | `app/tools/**`, `app/research/**`, analysis plugs |

If ambiguous, ask the user which archetype applies.

---

## 1. Landing & Marketing

**Purpose**: Public-facing page that explains A.I.M.S. and funnels to sign-up/chat.

- **Nav**: Logo left, links center, Sign in + Get Started right
- **Hero**: Clear H1 value prop, supporting text, Primary + Secondary CTA
- **Sections**: Use cases, How Boomer_Angs work, social proof, FAQ, final CTA
- **Rules**: Single-column on mobile, 2-col hero from `md` up. No dashboards. No sci-fi lore.

## 2. Auth & Onboarding

**Purpose**: Get users signed in and set up.

- **Auth**: Centered card (max-w ~420px), branded background, title + form + social buttons
- **Onboarding**: Multi-step with stepper (Profile → Goals → LUC → Finish), one form per step
- **Rules**: Same visual style everywhere. No dashboard elements. Short forms. Mobile-readable.

## 3. Chat with ACHEEVY

**Purpose**: Primary post-login experience. User ↔ ACHEEVY conversation.

- **Shell**: Sidebar nav + main chat area
- **Chat**: Scrollable messages, user vs ACHEEVY styling, input row with send button
- **Gate**: Banner if onboarding incomplete
- **Rules**: Default landing after sign-in. Fully mobile. No sci-fi labels.

## 4. CRM / Client Management

**Purpose**: Manage contacts, projects, pipelines.

- **Left Sidebar**: Leads, Clients, Projects, Pipelines
- **Top Bar**: Search + filters + "Add" button
- **Main**: Table view OR Kanban columns
- **Detail**: Slide-over (desktop), full-screen (mobile)
- **Rules**: Clear status indicators. Pagination for long lists.

## 5. Command Center

**Purpose**: Monitor and control Boomer_Angs, agents, environments.

- **Left Sidebar**: Agents, Workflows, Environments, Logs
- **Top Strip**: Environment selector + global status
- **Main**: Agent cards, queue status, activity log
- **Rules**: Safety-first. Confirm destructive actions. Status badges for running/idle/failed.

## 6. Finance & Analytics

**Purpose**: Display costs, usage, trends, KPIs.

- **KPI Row**: Top cards for key metrics
- **Charts**: Time-series graphs for usage/cost
- **Tables**: Breakdowns by Plug, Boomer_Ang, client
- **Controls**: Date-range selector (7d/30d/90d)
- **Rules**: Format numbers correctly. Stack on mobile. Highlight anomalies.

## 7. Workflow Builder

**Purpose**: Create and manage automations and n8n workflows.

- **Left Sidebar**: Workflow list with status
- **Main**: Step editor/canvas
- **Right Panel**: Step configuration (desktop), bottom sheet (mobile)
- **Logs**: Execution history tab
- **Rules**: Clear "Add step" affordance. Distinguish definition vs logs. Show validation errors.

## 8. Content / Research Tools

**Purpose**: Input → Process → Output pattern for analysis tools.

- **Input Panel**: Text area, upload, or form
- **Output Panel**: Rich text, tables, code blocks
- **History**: Past runs (optional)
- **Actions**: Run/Generate button, Copy, Export
- **Rules**: Always show loading states. Prevent input loss. Favor readability.

---

## Implementation Checklist

For every screen you touch:

1. Identify which archetype it is
2. Apply the RESET UI spec (global colors, typography, spacing)
3. Apply the archetype-specific layout
4. Verify mobile responsiveness (375px, 768px, 1024px+)
5. Verify no banned patterns (dark bg, sci-fi labels, Apple glass)
6. Report any gaps found
