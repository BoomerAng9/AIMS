---
name: aims-ui-archetypes
description: >
  A.I.M.S. design and layout skill. Automatically applies the correct UI
  archetype (landing, auth, chat, CRM, command center, finance, workflow,
  content tools) based on the current route/file being built, so the
  platform feels consistent and professional end-to-end.
allowed-tools: Read, Glob, Grep, Edit
---

# A.I.M.S. UI Archetypes Skill

This skill standardizes how A.I.M.S. screens are designed and implemented,
so every Plug and Boomer_Ang experience feels like one coherent product,
not a mix of random templates.

It defines a small set of **UI archetypes** and tells you when and how
to apply each one based on the file/route currently being edited
(e.g., landing page vs CRM area vs OpenClaw Command Center view).

---

## 1. When to Use This Skill

Use this skill whenever:

- You are editing A.I.M.S. frontend code (Next.js 14, App Router) in:
  - `app/page.tsx` (landing)
  - `app/(auth)/**` (sign-in, onboarding)
  - `app/chat/**` (Chat w/ ACHEEVY)
  - `app/crm/**` or similar
  - `app/boomer-angs/**`, `app/agents/**`, `app/openclaw/**`
  - `app/finance/**`, `app/luc/**`, `app/analytics/**`
  - `app/workflows/**`, `app/automation/**`
  - `app/tools/**`, `app/research/**`, etc.
- The user asks for:
  - "Make this look like a real SaaS front end for A.I.M.S."
  - "Normalize the UI for this page"
  - "Use the A.I.M.S. design spec for this screen"

If another project-specific UI skill exists and clearly overrides this,
follow that project spec and only use this skill as a fallback.

---

## 2. Archetype Detection and Invocation

Before changing any UI, **classify the current screen**:

1. Look at:
   - File path and route (`app/...`)
   - Existing component names (`*Landing*`, `*Dashboard*`, `*CRM*`, `*CommandCenter*`, etc.)
   - The user's description of the page's purpose

2. Map the screen to one of these **A.I.M.S. UI archetypes**:

   1. Landing & Marketing (public)
   2. Auth & Onboarding (sign-in, profile setup)
   3. Chat with ACHEEVY (primary account landing)
   4. CRM / Client & Project Management
   5. Agent Command Center (Boomer_Ang & OpenClaw control)
   6. Finance, LUC & Analytics Dashboards
   7. Workflow & Automation Builder
   8. Content / Research Tools (docs, transcripts, analysis)

3. Apply:
   - Global design rules (Section 3)
   - The **one** archetype spec matching this screen (Section 4)

If you cannot confidently classify the page, **ask the user**:
> "Should this screen behave like: (1) Landing, (2) CRM, (3) Command Center, (4) Finance dashboard, (5) Workflow builder, or (6) Content tool?"

Never mix multiple archetypes into one page at the same time.

---

## 3. Global A.I.M.S. Design Rules

Apply these rules to **all** A.I.M.S. screens unless the user explicitly overrides them.

### 3.1 Layout & Responsiveness

- Mobile-first:
  - Design for ~375–430px width first.
  - Stack sections vertically on mobile; only introduce columns at `md` and up.
- Breakpoints:
  - `sm`: stacked layout.
  - `md`: 2-column (sidebar + main, or filters + content) where appropriate.
  - `lg`: enhanced grids for dashboards and data-heavy pages.
- Safe areas:
  - Horizontal padding: 16px on mobile, 24–32px on tablet/desktop.
  - Max main content width: 960–1200px.
- Text:
  - Body ≥14px on mobile, ≥16px on desktop.
  - Line-height 1.4–1.6; no clipped or overlapping text.
  - Never allow text overflow; use `flex-wrap`, `max-w-*`, and responsive font sizes.

### 3.2 Visual Language

Use the **A.I.M.S. brand** visual language (not Apple samples, not Book Of Vibe):

- Background:
  - Light, calm base (#F8FAFC) with clean white surfaces.
  - Optional subtle texture/gradient, never noisy.
- Foreground:
  - Clean cards with:
    - Rounded corners (16–24px).
    - 1px border (slate-200), subtle shadow.
- Typography:
  - Use the project's configured fonts (Doto for headings, system sans for body).
  - Prioritize legibility over ornament.
- Colors:
  - Light neutral background (#F8FAFC), white surfaces (#FFFFFF).
  - Amber/gold accent (#D97706) for CTAs and key states.
  - Slate hierarchy for text: #0F172A primary, #475569 secondary, #94A3B8 muted.
  - Sufficient contrast for accessibility.

Avoid:
- Old Apple-style glassmorphism, Book Of Vibe, or sci-fi themed visuals.
- Dark backgrounds (#0A0A0A, #000) unless explicitly requested.

### 3.3 Components

- Buttons:
  - Min height 40–44px, clear primary vs secondary states.
  - Primary: bg-amber-600 text-white, hover:bg-amber-700.
  - Secondary: bg-white border-slate-200, hover:bg-slate-50.
  - Obvious hover, focus, and disabled states.
- Inputs:
  - Full-width on mobile, aligned grids on desktop.
  - Real labels, placeholders as hints only.
  - bg-white border-slate-200 focus:ring-amber-500.
- Cards:
  - bg-white border border-slate-200 rounded-2xl shadow-sm.
  - Consistent padding (16–24px), clear titles, optional subtext.
- Navigation:
  - Choose **either** a top nav **or** a persistent sidebar for a given app section.
  - Keep the primary navigation pattern consistent within each archetype.
  - Active state: text-amber-700, border-amber-600.
  - Default: text-slate-500, hover:bg-slate-50.

---

## 4. Archetype Specs

### 4.1 Landing & Marketing (Public)

Used for: `app/page.tsx`, `/landing`, marketing-style plugs.

Layout:

- Top bar:
  - A.I.M.S. / ACHEEVY logo left, nav center/right, Sign in + Get Started buttons.
- Hero:
  - Clear H1 explaining what A.I.M.S. does.
  - Supporting text focused on outcomes (not sci-fi lore).
  - Primary CTA (Start with ACHEEVY / Get started) and secondary CTA (Learn more).
- Below the fold:
  - Key use cases (CRM, Command Center, Automations, Plugs).
  - How Boomer_Angs work.
  - Social proof, FAQs, final CTA.

Rules:
- Strong, focused headline.
- Smooth scroll and clean vertical rhythm.
- No complex dashboards here; keep it marketing-focused.
- Single-column flow on mobile, 2-column hero from `md` upwards.

### 4.2 Auth & Onboarding

Used for: `app/(auth)/sign-in`, `app/(auth)/sign-up`, `app/onboarding/**`.

Layout:

- Centered auth card on branded background.
- Card: max-width ~420px, bg-white, rounded-3xl, generous padding.
- Clear title: "Sign in to A.I.M.S."
- Social providers row (Google, Discord if configured).
- Email/password form below.

Onboarding:
- Multi-step layout: Step indicator (Profile → Goals → LUC estimate → Finish).
- One focused form per step.
- Buttons: Back / Next / Finish.

Rules:
- Same auth/onboarding visual style across the platform.
- No dashboard elements in auth flows.
- Forms short and readable on mobile.

### 4.3 Chat with ACHEEVY (Primary Account Landing)

Used for: `app/chat/page.tsx` or equivalent.

Layout:
- Global shell with sidebar navigation.
- Main glass card window for chat stream.
- Message list with distinct user vs ACHEEVY styles.
- Input row: text field + optional mic button + send button.
- Onboarding gate banner if setup incomplete.

Rules:
- Chat is the default landing after sign-in.
- Fully mobile-usable, no extra navigation clutter.
- Call it "Chat with ACHEEVY" — no sci-fi labels.

### 4.4 CRM / Client & Project Management

Used for: `app/crm/**`, `app/clients/**`, `app/projects/**`.

Layout:
- Left sidebar: Leads, Clients, Projects, Pipelines.
- Top bar: Search + filters (status, owner, priority) + "Add" button.
- Main: Table view with status chips OR Kanban-style columns.
- Detail: slide-over panel (desktop), full-screen modal (mobile).

Rules:
- Clear status and next action indicators.
- Pagination or lazy load for long lists.
- Don't mix finance KPIs into pure CRM views.

### 4.5 Agent Command Center (Boomer_Ang & OpenClaw)

Used for: `app/agents/**`, `app/boomer-angs/**`, `app/openclaw/**`, control panels.

Layout:
- Left sidebar: Boomer_Angs, Workflows, Environments, Logs.
- Top strip: Environment selector (Dev/Staging/Prod), global status.
- Cards: Active agents, queue length, job status.
- Activity log or console.

Rules:
- Emphasize status and safety.
- Running vs idle vs failed clearly indicated.
- Confirm destructive actions with modals.

### 4.6 Finance, LUC & Analytics Dashboards

Used for: `app/finance/**`, `app/luc/**`, `app/analytics/**`.

Layout:
- KPI row at top: LUC totals, cost, token usage, MRR.
- Main chart area: Time-series graphs.
- Secondary: Breakdown tables by Plug, Boomer_Ang, client.
- Date-range selector (7d/30d/90d/custom).

Rules:
- Currency and percentages formatted correctly.
- Stack KPIs and charts on mobile.
- Highlight trends and anomalies (arrows, color coding).

### 4.7 Workflow & Automation Builder

Used for: `app/workflows/**`, `app/automation/**`, n8n integration UIs.

Layout:
- Left sidebar: List of workflows/automations with status.
- Main: Canvas or structured editor for steps.
- Right config panel (desktop) / bottom sheet (mobile).
- Runs/Logs tab for execution history.

Rules:
- Clear "Add step" and "Reorder" affordances.
- Distinguish workflow definition vs run logs.
- Surface validation errors in actionable way.

### 4.8 Content / Research Tools

Used for: `app/tools/**`, `app/research/**`, analysis Plugs.

Layout:
- Input panel: Text area, upload, or structured form.
- Output panel: Rich text, tables, code blocks.
- History / saved runs (optional).
- "Run / Generate" button, Copy/Export actions.

Rules:
- Always show loading/processing states.
- Prevent accidental input loss when re-running.
- Favor readability over dense output.

---

## 5. Implementation Rules

When this skill is active:

1. Detect the archetype (Section 2).
2. Apply global design rules (Section 3).
3. Apply only the **matching archetype** spec (Section 4).
4. Do NOT:
   - Pull in layouts from unrelated archetypes.
   - Reuse obsolete Apple-style designs or Book Of Vibe visuals.
   - Use dark backgrounds (#0A0A0A, bg-black) unless explicitly requested.
5. Always explain:
   - Which archetype you chose.
   - What structural/layout changes you made.
   - Any remaining gaps (missing routes, components, or data).

If a screen does not fit any archetype, ask the user which pattern
it should follow before you refactor the UI.
