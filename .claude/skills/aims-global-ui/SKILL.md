---
name: aims-global-ui
description: >
  Global A.I.M.S. design system: layout, responsiveness, typography, and
  visual rules that all A.I.M.S. screens must follow, regardless of page
  type (landing, chat, CRM, command center, finance, workflows, tools).
allowed-tools: Read, Glob, Grep, Edit
---

# A.I.M.S. Global UI Skill

This skill defines the shared design language for all A.I.M.S. screens so Landing, Chat w/ ACHEEVY, CRM, Command Centers, and Plugs all feel like one coherent product.

Use this skill **together with** a more specific archetype skill (e.g., aims-landing-ui, aims-crm-ui) whenever you touch A.I.M.S. frontend code.

## When to Use

Activate this skill whenever:

- You are editing any A.I.M.S. frontend file in `app/**` (Next.js 14).
- The user says "use the A.I.M.S. design system", "normalize the UI", or
  "make this match the rest of A.I.M.S.".
- You are applying an archetype-specific UI skill for A.I.M.S.

---

## Global Layout & Responsiveness

- Mobile-first:
  - Design for ~375–430px width first, then scale to tablet and desktop.
  - Stack sections on mobile; use columns only from `md` upwards.
- Breakpoints:
  - `sm`: stacked.
  - `md`: 2-column layouts where appropriate.
  - `lg`: 2–3 column dashboards and data layouts.
- Safe areas:
  - Horizontal padding: 16px (mobile), 24–32px (tablet/desktop).
  - Max main content width: 960–1200px.
- Text:
  - Body text: ≥14px on mobile, ≥16px on desktop.
  - Line-height: 1.4–1.6.
  - No clipped or overflowing text; use `flex-wrap` and `max-w-*`.

---

## Visual Language

- Background:
  - Single calm dark/neutral base, not noisy; optional subtle logo/texture.
- Foreground:
  - Glass cards/windows with:
    - Rounded corners (20–28px if glass).
    - Subtle blur, 1px border, soft shadow.
- Typography:
  - Use configured fonts (e.g., Doto for headings, Inter for body).
  - Prioritize legibility over decorative effects.
- Colors:
  - Neutral background, strong accent for CTAs and key states.
  - Maintain sufficient contrast for accessibility.

Avoid:
- Old Apple sample UIs.
- Book Of Vibe or sci‑fi themed visuals in product UI (fine in internal docs only).

---

## Core Components

- Buttons:
  - Min height 40–44px.
  - Primary, secondary, ghost variants; clear hover/focus/disabled.
- Inputs:
  - Full-width on mobile, aligned grids on desktop.
  - Real labels (not placeholders only).
- Cards:
  - Consistent padding (16–24px), clear titles, optional subtext.
- Navigation:
  - For any given area, choose either:
    - Top nav, or
    - Persistent sidebar.
  - Keep navigation pattern consistent within that area.

Always combine this skill with the appropriate archetype UI skill for the current page type.
