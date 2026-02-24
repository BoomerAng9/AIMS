# Antigravity — Master Instruction Set for A.I.M.S.

> **Platform:** Google Antigravity IDE
> **Models:** Gemini 3.1 Pro (agentic code) + Stitch (UI design) + Nano Banana Pro (image gen)
> **Companion:** Claude Opus 4.6 (cross-validation via Claude Code)
> **Engine:** NtNtN (creative development library) + n8n WBT Framework
> **Version:** 2.0.0
> **Date:** 2026-02-23

---

## 0. What This Document Is

This is the **single master instruction file** for any agent running inside Google Antigravity
that works on A.I.M.S. It unifies three tools — **Stitch**, **Nano Banana Pro**, and **Gemini 3.1 Pro** —
into one coherent pipeline for designing, generating assets, and building production code.

**Load order:** This file → RESET-UI-SPEC.md → ui-archetypes.md → gap-reporting.md

---

## 1. The Three-Tool Pipeline

```
┌─────────────────────────────────────────────────────────┐
│  ANTIGRAVITY PIPELINE                                    │
│                                                          │
│  ┌──────────┐    ┌──────────────┐    ┌───────────────┐  │
│  │  STITCH   │───▶│ NANO BANANA  │───▶│ GEMINI 3.1    │  │
│  │  (Design) │    │ PRO (Images) │    │ PRO (Code)    │  │
│  └──────────┘    └──────────────┘    └───────────────┘  │
│       │                │                     │           │
│       ▼                ▼                     ▼           │
│  Layout Map      Visual Assets        Production Code    │
│  Component Tree  Hero Images          Next.js + Tailwind │
│  Tailwind Specs  Illustrations        API Routes         │
│  Motion Spec     Background Tiles     Component Wiring   │
│  QA Checklist    Badges/Decals        Build Verification │
│                                                          │
│  ═══════════════════════════════════════════════════════  │
│  HUMAN APPROVAL GATE between each phase                  │
│  ═══════════════════════════════════════════════════════  │
└─────────────────────────────────────────────────────────┘
```

### Phase 1: DESIGN (Stitch)

Stitch generates UI layouts from text descriptions. It outputs:
- **Layout Map** — sections, spacing, responsive grid, breakpoints
- **Component Tree** — React component hierarchy with props
- **Tailwind Classes** — exact class strings per element
- **State Map** — loading, empty, error, success variants
- **Motion Spec** — Framer Motion initial/animate/exit per element
- **QA Checklist** — acceptance criteria to verify the design

**Invocation:**
```bash
# Direct prompt
./stitch.sh "Create a dashboard overview with KPI cards and activity feed"

# Full spec mode
./stitch.sh --spec "Chat interface with streaming messages and voice input"

# With file context
./stitch.sh --file frontend/app/page.tsx "Redesign hero section for light SaaS theme"
```

**Persona:** Stitch loads `.stitch/persona.md` automatically. The persona defines:
- Color system, typography, spacing tokens
- Component patterns (glass cards, status chips, CTAs)
- Motion choreography (stagger, breathe, scan)
- Non-negotiable rules (gold rarity, WCAG contrast, safe padding)

### Phase 2: ASSETS (Nano Banana Pro)

Nano Banana Pro generates/edits visual assets. Use it for:
- Hero backgrounds and illustrations
- Feature illustrations (isometric style)
- Background tile variants and texture overlays
- Agent avatars (Boomer_Ang, ACHEEVY)
- Badges, decals, and micro-decals
- Noise/scanline overlay PNGs

**Do NOT use it for:**
- Core logotype changes (brand integrity risk)
- Dense UI text rendering inside images (keep text native for accessibility)
- Icons (use Lucide React instead)

**Invocation:**
```bash
# Via Gemini CLI MCP
nano-banana setup           # Interactive wizard
nano-banana init --api-key YOUR_KEY  # Manual init
```

### Phase 3: CODE (Gemini 3.1 Pro)

Once designs are approved and assets generated, Gemini 3.1 Pro writes production code:
- Next.js 14 App Router pages and layouts
- Tailwind CSS classes matching Stitch specs exactly
- Framer Motion animations matching Motion Spec
- API route wiring (UEF Gateway, n8n webhooks)
- Component extraction and reuse

**Capabilities to leverage:**
- **Deep Think mode** — `thinking_level: HIGH` for 5+ file refactors
- **1M token context** — load entire frontend directory for consistency
- **Thought Signatures** — maintain reasoning across multi-step tool use
- **64K output** — complete file rewrites when needed
- **80.6% SWE-Bench** — solve complex coding tasks in single attempts

---

## 2. MANDATORY: Human Approval Gate

**ALL designs and assets MUST be approved by the user BEFORE implementation.**

```
DESIGN (Stitch) ──▶ PRESENT TO USER ──▶ WAIT ──▶ APPROVED? ──▶ CODE
                                          │
                                          ▼
                                    FEEDBACK? ──▶ REVISE ──▶ RE-PRESENT
```

- Use Stitch to generate design previews FIRST
- Present screenshots/previews to the user
- WAIT for explicit "approved", "yes", "build this", or "go"
- If feedback is given, revise and re-present
- NEVER push code for unapproved designs
- This applies to ALL screens: landing, auth, chat, dashboard, everything

---

## 3. Design Authority: RESET UI Spec

The **RESET-UI-SPEC.md** is the SOLE source of truth for frontend design.
It supersedes ALL older specs (Design System, Opus Brand Bible, Wireframe Component Spec,
Apple Glassmorphism rules, Book of Vibe layout patterns).

### Color Mandate

| Surface | Value | Notes |
|---------|-------|-------|
| **Page background** | `#F8FAFC` (slate-50) | Light, NOT dark |
| **Cards** | `#FFFFFF` white | `border-slate-200`, subtle shadows |
| **Primary accent** | `#D97706` amber-600 | CTAs, highlights, brand |
| **Primary text** | `#0F172A` slate-900 | High contrast on light bg |
| **Secondary text** | `#475569` slate-600 | Descriptions, muted content |
| **Tertiary text** | `#94A3B8` slate-400 | Timestamps, labels |
| **Success** | `#22C55E` emerald-500 | Live, healthy, active |
| **Warning** | `#F59E0B` amber-500 | Degraded, in-progress |
| **Error** | `#EF4444` red-500 | Failed, blocked |
| **Info** | `#06B6D4` cyan-500 | Informational |

### Typography Mandate

| Context | Minimum Mobile | Minimum Desktop | Font |
|---------|---------------|-----------------|------|
| Body text | 14px (`text-sm`) | 16px (`text-base`) | Inter |
| Secondary | 12px (`text-xs`) | 14px (`text-sm`) | Inter |
| Buttons & inputs | 14px | 14px | Inter |
| H1 | 24px (`text-2xl`) | 36px (`text-4xl`) | Doto |
| H2 | 20px (`text-xl`) | 28px (`text-2xl`) | Doto |
| H3 | 16px (`text-base`) | 20px (`text-xl`) | Inter bold |

**BANNED:** `text-[9px]`, `text-[10px]`, `text-[11px]` in user-facing UI.
Only acceptable for non-interactive decorative elements.

### Spacing Mandate

8px base grid:
- `space-2`: 8px — minimum spacing
- `space-3`: 12px — compact padding
- `space-4`: 16px — standard padding, mobile body margin
- `space-6`: 24px — section padding, card gaps
- `space-8`: 32px — page section breaks
- `space-10`: 40px — major layout breaks

### Mobile-First Mandate

Design for 375–430px first, then scale up:
- Phone: default / `max-sm:` (up to 640px)
- Tablet: `md:` (641–1024px)
- Desktop: `lg:` (1025px+)

---

## 4. UI Archetypes

Every screen maps to ONE archetype. Identify it before making changes.

| # | Archetype | Routes | Key Layout |
|---|-----------|--------|------------|
| 1 | **Landing & Marketing** | `app/page.tsx`, public routes | Hero + sections + CTA + footer |
| 2 | **Auth & Onboarding** | `app/(auth)/**`, `app/onboarding/**` | Centered card, max-w-md |
| 3 | **Chat with ACHEEVY** | `app/chat/**`, `app/dashboard/chat/**` | Sidebar + message stream + input bar |
| 4 | **CRM / Client Management** | CRM routes | Sidebar + table/kanban + detail panel |
| 5 | **Command Center** | `app/dashboard/circuit-box/**` | Agent cards + queue + activity log |
| 6 | **Finance & Analytics** | `app/dashboard/luc/**` | KPI row + charts + breakdown tables |
| 7 | **Workflow Builder** | `app/dashboard/automations/**` | Workflow list + step editor + config |
| 8 | **Content / Research** | `app/dashboard/research/**` | Input panel + output panel + history |

---

## 5. NtNtN Engine Integration

The **NtNtN Engine** (`aims-skills/ntntn-engine/NTNTN_ENGINE.md`) is the creative development
library that powers all build decisions. When Antigravity receives a build request:

```
User describes vision
    ↓
ACHEEVY classifies intent → maps to NtNtN capabilities
    ↓
Picker_Ang selects from NtNtN Engine:
  - Framework (default: Next.js 14)
  - Animation library (default: Motion / Framer Motion)
  - Styling system (default: Tailwind CSS 3.3)
  - UI components (default: shadcn/ui + Radix)
  - Layout patterns (from NtNtN categories)
    ↓
Stitch generates design using selections
    ↓
User approves design
    ↓
Buildsmith executes via Gemini 3.1 Pro:
  PHASE 0: INTAKE    → Build Manifest
  PHASE 1: IMAGE     → Nano Banana Pro assets
  PHASE 2: INTERFACE → Code generation in sandbox
  PHASE 3: INTEGRATIONS → DB, auth, API, deploy
  PHASE 4: VERIFICATION → Lighthouse, a11y, CWV, security
  PHASE 5: SIGN      → Buildsmith signature + delivery
    ↓
ACHEEVY delivers to user
```

### NtNtN Categories (Quick Reference)

1. **Frontend Frameworks** — React/Next.js, Vue/Nuxt, Svelte, Angular, Astro, Solid, Qwik
2. **Animation & Motion** — Motion, GSAP, Anime.js, Lottie, Rive, CSS, Spring physics
3. **Styling Systems** — Tailwind, CSS Modules, Vanilla Extract, UnoCSS, Open Props
4. **3D & Visual** — Three.js, R3F, Drei, Babylon.js, p5.js, D3.js, Canvas, SVG
5. **Scroll & Interaction** — CSS scroll-driven, IntersectionObserver, GSAP ScrollTrigger, Lenis
6. **UI Components** — shadcn/ui, Radix, Headless UI, Chakra, Material UI
7. **Layout & Responsive** — CSS Grid, Flexbox, Container Queries, View Transitions
8. **Backend & Fullstack** — Node/Express, Next.js, FastAPI, Go, Rust, Edge Functions
9. **CMS & Content** — Sanity, Strapi, Contentful, MDX, Keystatic, Payload
10. **Deployment & Infra** — Docker, Vercel, Netlify, Cloudflare, AWS, GCP, VPS

### A.I.M.S. Stack Defaults

For all A.I.M.S. internal work, use these unless the user specifies otherwise:
- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS 3.3
- **Animation:** Framer Motion (Motion)
- **Components:** shadcn/ui + Radix primitives
- **State:** Zustand + React Context
- **Auth:** NextAuth.js
- **Database:** Prisma + SQLite
- **Deployment:** Docker → VPS (76.13.96.107)

---

## 6. Stitch Prompt Templates

### Landing Page
```
Generate a modern SaaS landing page for "A.I.M.S. — AI Managed Solutions".
Background: light (#F8FAFC), white cards with slate-200 borders, amber (#D97706) accent.
Hero: Clear H1 "AI Managed Solutions", subtext about ACHEEVY orchestrator, two CTAs.
Sections: Experience Gateway (4 cards), Platform Pillars (4 cols), Final CTA.
Typography: Doto for headings, Inter for body. Minimum 14px mobile, 16px desktop.
Mobile-first, responsive at 375px/768px/1024px. No dark theme elements.
```

### Auth Page
```
Generate a sign-in page for A.I.M.S.
Centered card (max-w-md) on light background (#F8FAFC).
Title: "Sign in to A.I.M.S." in Doto font.
Social buttons: Google OAuth, Discord OAuth (full-width, h-10).
Email/password form below. Amber accent for primary button.
Clean, minimal. Mobile-first. No dark background.
```

### Chat Interface
```
Generate a chat interface for "Chat w/ ACHEEVY".
Left sidebar (collapsible): model selector, voice selector, conversation history.
Main area: scrollable message stream (max-w-4xl centered).
Bottom: sticky input bar with voice button, file attach, send.
Light theme: white bg, slate-200 borders, amber accents.
Message bubbles: user = white card, ACHEEVY = amber-50 card.
Responsive: sidebar hidden on mobile (hamburger toggle).
```

### Dashboard
```
Generate a SaaS dashboard overview for A.I.M.S.
Left sidebar: navigation (collapsible on mobile).
Top: KPI strip (4 stat cards in a row).
Main: Arsenal Shelf (horizontal carousel), Tool Grid (7 tiles).
Light theme: white cards, slate-200 borders, amber accent.
Responsive: sidebar collapses on mobile, grid stacks.
```

---

## 7. Nano Banana Pro Prompt Templates

### Hero Background
```
Modern SaaS platform hero image. Light, airy composition.
Subtle amber and gold gradients on white/cream background.
Abstract geometric shapes suggesting AI and automation.
Clean, professional, minimalist. No dark elements.
Aspect ratio: 16:9. Resolution: 1920x1080.
```

### Feature Illustration
```
Clean illustration for [FEATURE NAME].
Isometric style, light background, amber accent color (#D97706).
Simple, modern, professional SaaS aesthetic.
No text in image. Transparent background preferred.
Square format, 512x512px minimum.
```

### Agent Avatar (Boomer_Ang)
```
Professional AI agent avatar for [AGENT_NAME].
Warm amber/gold color scheme (#D97706 primary).
Friendly, approachable, modern design.
Clean geometric style, suitable for light backgrounds.
Square format, 256x256px minimum.
```

### Background Tile
```
Subtle repeating tile pattern for A.I.M.S. platform.
Very light amber/gold (#D97706 at 3-5% opacity) geometric shapes.
Clean, minimal, professional. Must tile seamlessly.
Intended use: page background overlay at 2-5% opacity.
Format: PNG with transparency. Size: 400x400px.
```

### Texture Overlay
```
Subtle noise texture for SaaS platform overlay.
Very fine grain, monochrome, semi-transparent.
Intended use: full-page overlay at 2-3% opacity for depth.
Format: PNG with transparency. Size: 512x512px, tileable.
```

---

## 8. Workflow Pattern (Agentic Sequence)

For ANY UI task in Antigravity, follow this exact sequence:

```
1. ANALYZE
   - Read the target file(s)
   - Identify the UI archetype (Section 4)
   - Check current state against RESET spec
   - List violations found

2. DESIGN (Stitch)
   - Generate visual preview using Stitch prompt templates
   - Ensure compliance with RESET spec colors/typography/spacing
   - Output Layout Map + Component Tree + Motion Spec

3. APPROVE
   - Present design to user
   - WAIT for explicit approval
   - If feedback → revise and re-present
   - NEVER proceed without approval

4. ASSETS (Nano Banana Pro) — if needed
   - Generate hero images, illustrations, textures
   - Present to user for approval
   - Only use approved assets

5. BUILD (Gemini 3.1 Pro)
   - Generate Next.js + Tailwind code matching approved design
   - Use Deep Think for complex refactors (5+ files)
   - Maintain existing backend wiring
   - Follow NtNtN Engine stack defaults

6. TEST
   - Run: cd frontend && npm run build
   - Verify responsive at 375px, 768px, 1024px
   - Check for banned text sizes
   - Run gap report

7. REPORT
   - List every file changed
   - Confirm compliance with RESET spec
   - Note any remaining gaps
```

**NEVER skip step 3 (APPROVE).** The user MUST see and approve the design.

---

## 9. Skill Pack Auto-Loading

When the user requests anything UI-related, Antigravity automatically loads:

| Skill Pack | When Triggered | What It Provides |
|------------|---------------|-----------------|
| **AIMS_UI_SYSTEM** | Any UI task | Layout rules, spacing, responsive, a11y |
| **AIMS_MOTION** | "animation", "motion", "interactive" | Motion rules, reduced-motion, choreography |
| **AIMS_BRAND_ASSETS** | "logo", "brand", "identity" | Logo usage, gold accent limits, tiling |
| **AIMS_TEXTURE** | "texture", "retro", "noise" | Noise/scanline/vignette layer rules |
| **AIMS_PERFORMANCE** | "loading", "performance", "CLS" | Header render, layout shift prevention |
| **AIMS_SECURITY_UI** | "auth", "gate", "permission" | No leaking internals, redaction rules |

### NtNtN Engine Auto-Routing

When user says "build", "create", "design", "develop", "code", "scaffold", "generate", "launch"
with keywords like "website", "page", "app", "dashboard" → NtNtN Engine routing activates:

1. ACHEEVY classifies the intent
2. Picker_Ang selects from NtNtN categories
3. Buildsmith constructs using the three-tool pipeline
4. Chicken Hawk dispatches Lil_Hawks for parallel execution

---

## 10. Gap Reporting (Mandatory)

After every task, output a gap report:

```markdown
## Gap Report

| File | Issue | Severity | Fix |
|------|-------|----------|-----|
| path/to/file.tsx | text-[9px] found on line 42 | HIGH | Replace with text-xs (12px) |
| path/to/file.tsx | bg-[#0A0A0A] dark background | HIGH | Replace with bg-[#F8FAFC] |

### Compliance Summary
- [ ] All text >= 14px mobile / 16px desktop
- [ ] No banned text sizes
- [ ] Light background (#F8FAFC)
- [ ] Responsive at 375px / 768px / 1024px
- [ ] Buttons >= 40px height, 44px tap target
- [ ] No banned UI labels
```

**You must NOT say "looks good" without evidence.** Every claim requires proof.

---

## 11. Brand Constants

| Actor | Spelling | Notes |
|-------|----------|-------|
| A.I.M.S. | With periods | AI Managed Solutions |
| ACHEEVY | All caps | Executive orchestrator |
| Chicken Hawk | Two words, title case | Coordinator |
| Boomer_Ang | Underscore, title case | Manager agents |
| Lil_*_Hawk | Underscore-delimited | Worker agents |
| Circuit Box | Two words, title case | Control center |
| LUC | All caps | Usage credit system |
| Per\|Form | Pipe character | Sports analytics platform |
| Buildsmith | One word, title case | Builder agent (no _Ang suffix) |
| Picker_Ang | Underscore, title case | Selector agent |

---

## 12. Testing Requirements

Before any PR or deployment:

```bash
cd frontend && npm run build           # Zero errors required
cd ../backend/uef-gateway && npm run build  # Backend check
cd ../../aims-skills && npm test        # Skills/hooks tests
```

Verify at three breakpoints:
1. **Phone (375px):** No horizontal scroll, text readable, stacked layout
2. **Tablet (768px):** 2-column where appropriate, proper spacing
3. **Desktop (1024px+):** Full layout, sidebars visible, max-width applied

---

## 13. Deployment

```bash
# Standard deploy to VPS
./deploy.sh --domain plugmein.cloud --landing-domain aimanagedsolutions.cloud

# First-time cert
./deploy.sh --domain plugmein.cloud --landing-domain aimanagedsolutions.cloud --email admin@aimanagedsolutions.cloud
```

**Architecture:**
```
plugmein.cloud → nginx (:80/443) → Frontend Next.js (:3000)
                                  → UEF Gateway (:3001) → ACHEEVY (:3003)
                                                        → Redis (:6379)
                                                        → Agent Bridge (:3010)
                                                        → n8n (:5678)
                                                        → House of Ang (:3002)
```

---

## 14. Cross-Validation with Claude Code

Antigravity (Gemini 3.1 Pro) and Claude Code (Claude Opus 4.6) work as companions:

- **Antigravity leads** on: UI design (Stitch), image generation (Nano Banana Pro), visual previews
- **Claude Code leads** on: backend logic, API wiring, deployment scripts, skills engine
- **Both validate**: Build passes, responsive compliance, RESET spec adherence, gap reports

When switching between tools, the shared files are:
- `ANTIGRAVITY_HANDOFF.md` — current project status
- `RESET-UI-SPEC.md` — design authority
- `.gemini/` — Antigravity-specific instructions
- `CLAUDE.md` — Claude Code-specific instructions

---

*This document is the master reference for all Antigravity work on A.I.M.S.
When in doubt, follow the RESET UI spec. When the RESET spec is unclear, ask the user.*
