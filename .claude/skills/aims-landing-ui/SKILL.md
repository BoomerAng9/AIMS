---
name: aims-landing-ui
description: >
  A.I.M.S. landing and marketing page layout. Use for public pages like
  app/page.tsx and marketing-style Plug intros so they share one clean,
  consistent funnel into Chat with ACHEEVY.
allowed-tools: Read, Glob, Grep, Edit
---

# A.I.M.S. Landing UI Skill

This skill defines the landing / marketing archetype for A.I.M.S.: the public surface that explains the Hybrid Business Architect, ACHEEVY, Boomer_Angs, and Plugs without sci‑fi jargon.

Use **together with** `aims-global-ui`.

## When to Use

Activate when:

- Editing `app/page.tsx` or other public marketing routes.
- Building a landing for a specific Plug (app) under A.I.M.S.
- The user asks for:
  - "Home / marketing page"
  - "Top of funnel for A.I.M.S. or a Plug"

Do NOT use this for authenticated dashboards, CRM, or command centers.

---

## Layout Structure

1. Top Navigation
   - Left: A.I.M.S. / Hybrid Business Architect logo.
   - Center/right: simple nav sections (Product, Boomer_Angs, Plugs, Pricing).
   - Right: Sign in / Get started button.

2. Hero Section
   - H1: clear business-focused value proposition.
   - Short paragraph emphasising outcomes (speed, reliability, expert Boomer_Angs).
   - Primary CTA: "Start with ACHEEVY" or "Get started".
   - Secondary CTA: "Watch demo" or "Explore Plugs".

3. Supporting Sections
   - How it works (User → ACHEEVY → Boomer_Angs → Plug).
   - Key use cases (CRM, Command Center, Automation, Finance, Research).
   - Testimonials or logos (when available).
   - FAQ + final CTA.

---

## Rules & Constraints

- Single-column flow on mobile, 2-column hero from `md` upwards.
- Banner images/illustrations optional, but must not overpower copy.
- Only use brand primitives ACHEEVY, AVVA NOON, Chicken Hawk, Boomer_Angs
  where they help clarity; avoid unexplained lore.
- Keep CTAs visually consistent with the rest of the product.

If in doubt, ask:
> "Is this screen public landing, or authenticated product UI?"
and only apply this skill to public landing.
