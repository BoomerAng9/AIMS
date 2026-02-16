# RESET-UI-SPEC.md — A.I.M.S. Functional Website Specification

**Version:** 2.0.0
**Date:** 2026-02-16
**Status:** ACTIVE — This document SUPERSEDES all previous UI/design specs
**Authority:** This is the SOLE source of truth for frontend layout, responsiveness, typography, and component behavior.

---

## 0. Supersession Notice

This spec **replaces and overrides** the following older documents for all layout, responsiveness, and component sizing decisions:

- `DESIGN_SYSTEM.md` (typography scale, glassmorphism rules)
- `OPUS_4_6_BRAND_DESIGN_BIBLE.md` (section 4.2 type scale, "Brick and Window" layout)
- `WIREFRAME_COMPONENT_SPEC.md` (component sizing)
- Any "Apple glassmorphic", "Hybrid Business Architect", or "Book Of Vibe"-derived layout patterns

**What is preserved** from those docs: color palette, font families, brand voice, agent hierarchy, animation philosophy. Those remain valid. Only layout, sizing, responsiveness, and readability rules are reset here.

---

## 1. Layout & Responsiveness

### 1.1 Mobile-First Mandate

Every page MUST be designed for **375-430px wide screens first**, then scale up. No page is allowed to ship without being tested at all three breakpoints:

| Breakpoint | Name | Width | Tailwind Prefix |
|------------|------|-------|-----------------|
| Phone | `sm` | up to 640px | (default / `max-sm:`) |
| Tablet | `md` | 641-1024px | `md:` |
| Desktop | `lg` | 1025px+ | `lg:` |

### 1.2 Core Layout Rules

1. **Text must NEVER overflow or get cut off.** Use `flex-wrap`, `max-width`, `overflow-wrap: break-word`, and proper `line-height`.
2. **No fixed widths without responsive guards.** Any `w-[Npx]` above 360px MUST be wrapped in a responsive prefix (`sm:`, `md:`, `lg:`) or use `max-w-` instead.
3. **Horizontal scroll is a bug** (except for explicitly scrollable data tables with `overflow-x-auto`).
4. **The `.aims-frame` inset** must not eat into content on small screens. On phone: `--frame-inset: 8px`. On tablet: `12px`. On desktop: `24px`.

### 1.3 Spacing Scale

Use ONLY these values for padding, margins, and gaps. Nothing smaller than 8px for content areas:

| Token | Value | Usage |
|-------|-------|-------|
| `space-2` | 8px | Minimum spacing (icon gaps, tight chip internals) |
| `space-3` | 12px | Compact padding (badges, tags) |
| `space-4` | 16px | Standard padding (cards, inputs, mobile body margin) |
| `space-6` | 24px | Section padding, card gaps |
| `space-8` | 32px | Page section breaks |
| `space-10` | 40px | Major layout breaks |

**Horizontal body padding:**
- Phone: `px-4` (16px each side)
- Tablet: `px-6` (24px each side)
- Desktop: `px-8` (32px each side) or centered `max-w-7xl mx-auto`

### 1.4 Container Rules

| Surface | Max Width | Alignment |
|---------|-----------|-----------|
| Auth cards (sign-in, sign-up, forgot-password) | `max-w-md` (448px) | Centered |
| Onboarding steps | `max-w-lg` (512px) | Centered |
| Chat interface | Full width, `max-w-4xl` message area | Centered |
| Dashboard content area | `max-w-7xl` (1280px) | Left-aligned with sidebar |
| Landing sections | `max-w-6xl` (1152px) | Centered |
| Data tables | Full container width with `overflow-x-auto` | Left-aligned |

---

## 2. Typography — Readability First

### 2.1 Minimum Font Sizes (ENFORCED)

| Context | Minimum Mobile | Minimum Desktop |
|---------|---------------|-----------------|
| Body text | **14px** (`text-sm`) | **16px** (`text-base`) |
| Secondary/muted text | **12px** (`text-xs`) | **14px** (`text-sm`) |
| Buttons & inputs | **14px** | **14px** |
| Headings (H1) | **24px** (`text-2xl`) | **36px** (`text-4xl`) |
| Headings (H2) | **20px** (`text-xl`) | **28px** (`text-2xl`) |
| Headings (H3) | **16px** (`text-base font-semibold`) | **20px** (`text-xl`) |

**BANNED sizes:** `text-[9px]`, `text-[10px]`, `text-[11px]` are prohibited in user-facing UI. The only acceptable use of sub-12px text is non-interactive decorative elements (e.g., the Hangar 3D overlay telemetry, NixieTube internals) that have no functional purpose.

### 2.2 Font Family Usage (Preserved from Brand Bible)

| Font | Usage | Rules |
|------|-------|-------|
| **Inter** (`font-sans`) | All body text, UI labels, numbers, dense content | Default for everything |
| **Doto** (`font-display` / `font-doto`) | Page titles, tech readouts, data displays | Never for paragraphs |
| **Permanent Marker** (`font-marker`) | Brand terms, annotations, human-touch moments | Never for dense text |
| **Caveat Brush** (`font-handwriting`) | Micro-annotations, casual notes | Sparingly |
| **Patrick Hand SC** | Workshop casual labels only | Workshop surfaces only |

### 2.3 Line Height & Readability

- Body text: `leading-relaxed` (1.625) or `leading-normal` (1.5)
- Headings: `leading-tight` (1.25)
- Card descriptions: `leading-relaxed`
- Never use `leading-none` on multi-line text

---

## 3. Visual Style — Clean Dark, Not Busy

### 3.1 Background Rules

| Page Type | Background | Notes |
|-----------|-----------|-------|
| Landing page | `bg-ink` (#0B0E14) + subtle grid or gradient | Clean, not busy |
| Auth pages | Solid `bg-[#050505]` | No logo wall behind the auth card content area |
| Dashboard | `bg-obsidian` (#0A0A0A) | Clean dark surface |
| Onboarding | `bg-[#050505]` | Minimal |

**Logo wall (`LogoWallBackground`)**: Can remain as an ambient texture layer, but at **2% opacity max**. It must NEVER interfere with text readability. If content overlaps the logo wall, the logo wall must be hidden or masked behind the content card.

### 3.2 Card Styling

Keep the existing `wireframe-card` as the base primitive, but enforce contrast:

```
Background:  bg-black/60  (not bg-white/2 — too transparent on some screens)
Border:      border-white/10
Backdrop:    backdrop-blur-md (12px, not xl/3xl — performance + readability)
Padding:     p-4 on mobile, p-6 on desktop
```

**Rules:**
- Card text must have **minimum 4.5:1 contrast ratio** against card background
- No card-on-card-on-card nesting (max 2 levels deep)
- Auth glass card: keep the gold gradient accent but ensure inner text contrast

### 3.3 What to Keep vs. Remove

**KEEP (Brand Identity):**
- Dark UI foundation + gold accents
- Wireframe card borders (`border-white/10-12`)
- Gold hover states and neon-gold glows
- Noise texture at 3% opacity
- Vignette overlay (subtle)
- `.aims-frame` viewport frame concept (with revised inset per 1.2)
- Gold edge rail (decorative)

**REMOVE / DEPRECATE from user-facing UI text and class names:**
- "Hybrid Business Architect" from metadata descriptions (replace with "AI Managed Solutions")
- "Apple-friendly" comments in code
- Over-stacked blur layers (no `backdrop-blur-3xl` — cap at `backdrop-blur-md` for cards, `backdrop-blur-lg` max for modals)
- CRT scanline effects on interactive content (keep only on decorative/ambient elements)

### 3.4 Sci-Fi Label Ban (UI Copy Only)

These terms must NOT appear in visible UI navigation, labels, or buttons:

| Banned in UI | Replace With |
|--------------|-------------|
| "MetaAuth Gateway" | "Sign In" |
| "Subframe" | (remove) |
| "The Void" | (remove from navigation; OK in Book of V.I.B.E. lore page) |
| "Hybrid Business Architect" | "AI Managed Solutions" |

**OK to keep** in lore/content pages (Book of V.I.B.E., Gallery, About): brand terms like ACHEEVY, Boomer_Angs, Chicken Hawk, Lil_Hawks, V.I.B.E., PMO Offices, House of Ang. These are product terms, not sci-fi decoration.

---

## 4. Component Standards

### 4.1 Buttons

| Property | Value |
|----------|-------|
| Min height | `h-10` (40px) — all devices |
| Min width | `min-w-[120px]` for primary actions |
| Font size | `text-sm` (14px) minimum |
| Border radius | `rounded-md` (6px) or `rounded-lg` (8px) |
| Tap target | 44x44px minimum touch area (per WCAG) |
| Padding | `px-4 py-2` minimum |

**Variants (preserved):**
- `acheevy` (gold, uppercase, neon shadow) — primary CTA
- `glass` (backdrop-blur, wireframe border) — secondary
- `ghost` (text only, gold hover) — tertiary
- `destructive` (red) — destructive actions

### 4.2 Inputs & Forms

| Property | Value |
|----------|-------|
| Width | `w-full` on phone, constrained by parent max-width on desktop |
| Height | `h-10` (40px) minimum |
| Font size | `text-sm` (14px) minimum |
| Label | Always visible above input, `text-sm font-medium` |
| Placeholder | Muted color, descriptive text |
| Border | `border-white/10`, `focus:border-gold/50` |
| Error states | Red border + error message below in `text-sm text-red-400` |

### 4.3 Cards

| Property | Phone | Tablet | Desktop |
|----------|-------|--------|---------|
| Padding | `p-4` (16px) | `p-5` (20px) | `p-6` (24px) |
| Gap (grid) | `gap-4` (16px) | `gap-5` (20px) | `gap-6` (24px) |
| Max width (auth) | `max-w-md` (448px) | `max-w-md` | `max-w-md` |
| Max width (content) | full | full | `max-w-7xl` |
| Grid columns | 1 | 2 | 3 or 4 |

### 4.4 Navigation

**Dashboard Sidebar:**
- Desktop: Fixed left, `w-64` (256px), always visible
- Tablet: Collapsible, hidden by default, hamburger toggle
- Phone: Hidden, full-screen overlay on toggle

**Site Header:**
- Desktop: Full nav links visible
- Phone: Hamburger menu, slide-down or slide-right panel
- Sticky: `sticky top-0 z-50`
- Height: `h-14` (56px) minimum

### 4.5 Floating ACHEEVY Chat Widget

- Position: `fixed bottom-4 right-4` (always)
- Button: `w-12 h-12` (48px), gold accent
- Expanded panel: `w-full max-w-sm` on phone, `w-96` on desktop
- Panel max-height: `max-h-[70vh]`
- Must not overlap critical page content on phone

---

## 5. Page-by-Page Requirements

### 5.1 Landing Page (`/`)

| Element | Spec |
|---------|------|
| Hero heading | `text-3xl md:text-5xl lg:text-6xl font-display` |
| Hero subtext | `text-base md:text-lg text-muted` |
| CTA button | `acheevy` variant, `h-12 px-8 text-base` |
| Feature cards | `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6` |
| Body padding | `px-4 md:px-6 lg:px-8` |

### 5.2 Auth Pages (`/sign-in`, `/sign-up`, `/forgot-password`)

| Element | Spec |
|---------|------|
| Layout | Single centered card (drop the 3-column layout on phone/tablet) |
| Card | `max-w-md w-full mx-auto p-6 md:p-8` |
| Heading | `text-2xl font-display` |
| Inputs | Full width, `h-10`, `text-sm` |
| OAuth buttons | Full width, `h-10`, icon + text |
| Desktop: 3-column | Left image (hidden on phone), center card, right video (hidden on phone) |
| Tablet: 1-column | Center card only, hide side panels |
| Phone: 1-column | Center card only, full bleed padding `px-4` |

### 5.3 Onboarding (`/onboarding`, `/onboarding/[step]`)

| Element | Spec |
|---------|------|
| Container | `max-w-lg w-full mx-auto` |
| Stepper | Horizontal dots/bars, `text-sm` labels |
| Step content | `p-6` padding, `space-y-4` vertical spacing |
| Inputs | Full width |
| Progress indicator | Visible at top, `h-1` bar or numbered dots |

### 5.4 Chat Page (`/chat`, `/dashboard/chat`)

| Element | Spec |
|---------|------|
| Message area | `max-w-4xl mx-auto`, scrollable |
| Message text | `text-sm md:text-base`, `leading-relaxed` |
| Input bar | Sticky bottom, `px-4`, full width, `h-12` min |
| Sidebar (model selector) | Hidden on phone (toggle), `w-60` on desktop |
| Code blocks | `overflow-x-auto`, `text-xs md:text-sm`, `rounded-lg p-4` |

### 5.5 Dashboard (`/dashboard/*`)

| Element | Spec |
|---------|------|
| Shell | Sidebar + main content area |
| Sidebar | See 4.4 Navigation |
| Content | `p-4 md:p-6 lg:p-8`, `max-w-7xl` |
| Page title | `text-xl md:text-2xl font-display` |
| Stat cards | `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4` |
| Data tables | `overflow-x-auto`, `text-sm`, `min-w-[600px]` inner table |

### 5.6 Pricing Page (`/pricing`)

| Element | Spec |
|---------|------|
| Tier cards | `grid grid-cols-1 md:grid-cols-3 gap-6`, `max-w-5xl mx-auto` |
| Comparison table | `overflow-x-auto`, scroll hint on mobile |
| Price display | `text-3xl font-display`, gold for highlighted tier |
| Feature list | `text-sm`, checkmark icons, `space-y-2` |

---

## 6. Route Inventory & Status

Every route in the application. Pages marked NEEDS FIX require alignment with this spec.

### Public Pages

| Route | Status | Priority | Notes |
|-------|--------|----------|-------|
| `/` | NEEDS FIX | P1 | Hero text sizing, mobile padding, feature grid |
| `/about` | NEEDS FIX | P2 | Responsive check, text sizes |
| `/pricing` | NEEDS FIX | P1 | Table overflow on mobile, font sizes |
| `/gallery` | NEEDS FIX | P3 | Card grid responsiveness |
| `/the-book-of-vibe` | OK (LORE) | P3 | Lore page — exempt from sci-fi ban |
| `/merch` | NEEDS FIX | P3 | Coming soon — basic responsive check |
| `/discover` | NEEDS FIX | P2 | Grid layout, card sizing |
| `/terms/savings-plan` | NEEDS FIX | P3 | Legal text readability |

### Auth Pages

| Route | Status | Priority | Notes |
|-------|--------|----------|-------|
| `/(auth)/sign-in` | NEEDS FIX | P0 | 3-col layout breaks on mobile, `text-[9px]` found, cramped |
| `/(auth)/sign-up` | NEEDS FIX | P0 | Multi-step form responsiveness |
| `/(auth)/forgot-password` | NEEDS FIX | P1 | Basic responsive check |

### Onboarding

| Route | Status | Priority | Notes |
|-------|--------|----------|-------|
| `/onboarding` | NEEDS FIX | P0 | Form layout, wireframe bg readability |
| `/onboarding/[step]` | NEEDS FIX | P0 | Step form sizing, LUC panel layout |

### Chat

| Route | Status | Priority | Notes |
|-------|--------|----------|-------|
| `/chat` | NEEDS FIX | P0 | Sidebar fixed width, message text sizing, input bar |
| `/dashboard/chat` | NEEDS FIX | P0 | Same issues as /chat |

### Dashboard Core

| Route | Status | Priority | Notes |
|-------|--------|----------|-------|
| `/dashboard` | NEEDS FIX | P1 | Overview card grid, text sizes in DashboardShell |
| `/dashboard/circuit-box` | NEEDS FIX | P1 | 14-tab layout, small text throughout |
| `/dashboard/deploy-dock` | NEEDS FIX | P2 | Layout responsiveness |
| `/dashboard/build` | NEEDS FIX | P2 | Workflow builder layout |
| `/dashboard/the-hangar` | NEEDS FIX | P2 | 40 small-text occurrences |
| `/dashboard/boomerangs` | NEEDS FIX | P2 | Agent card grid |
| `/dashboard/luc` | NEEDS FIX | P1 | Calculator layout, bucket grid |
| `/dashboard/model-garden` | NEEDS FIX | P2 | Model card grid |
| `/dashboard/plugs` | NEEDS FIX | P2 | Pipeline stages on mobile |
| `/dashboard/plan` | NEEDS FIX | P2 | Mission card layout |
| `/dashboard/workstreams` | NEEDS FIX | P2 | Kanban columns on mobile |
| `/dashboard/lab` | NEEDS FIX | P2 | Input/output layout |
| `/dashboard/operations` | NEEDS FIX | P1 | 47 small-text occurrences |
| `/dashboard/security` | NEEDS FIX | P2 | Score cards, small text |
| `/dashboard/environments` | NEEDS FIX | P2 | Environment cards |
| `/dashboard/gates` | NEEDS FIX | P2 | Gate status cards, small text |
| `/dashboard/settings` | NEEDS FIX | P2 | Form layout |
| `/dashboard/your-space` | NEEDS FIX | P2 | Profile layout |
| `/dashboard/house-of-ang` | NEEDS FIX | P2 | Org chart, small text |
| `/dashboard/project-management` | NEEDS FIX | P2 | PMO cards, `text-[9px]` found |
| `/dashboard/research` | NEEDS FIX | P3 | Link hub layout |
| `/dashboard/admin` | NEEDS FIX | P2 | Admin panels, small text |

### Verticals (Owner-Gated)

| Route | Status | Priority | Notes |
|-------|--------|----------|-------|
| `/dashboard/war-room` | NEEDS FIX | P2 | Sports analytics layout |
| `/dashboard/veritas` | NEEDS FIX | P2 | Upload + results layout |
| `/dashboard/editors-desk` | NEEDS FIX | P2 | Approval queue layout |
| `/dashboard/blockwise` | NEEDS FIX | P2 | Calculator grid |
| `/dashboard/boost-bridge` | NEEDS FIX | P2 | 3-engine layout |
| `/dashboard/garage-to-global` | NEEDS FIX | P2 | 5-stage journey |
| `/dashboard/buy-in-bulk` | NEEDS FIX | P3 | Shopping assistant |
| `/dashboard/sports-tracker` | NEEDS FIX | P2 | Nixie tube displays |
| `/dashboard/nil` | NEEDS FIX | P2 | N.I.L. tabs |
| `/dashboard/make-it-mine` | NEEDS FIX | P2 | Project picker |

### Standalone

| Route | Status | Priority | Notes |
|-------|--------|----------|-------|
| `/hangar` | EXEMPT | - | 3D scene, own layout rules |
| `/sandbox/*` | NEEDS FIX | P3 | Sandbox hub cards |
| `/workshop/*` | NEEDS FIX | P3 | Workshop flow cards |
| `/mission-control` | NEEDS FIX | P2 | Visualizer layout |
| `/showroom` | NEEDS FIX | P3 | `w-[800px]` hardcoded |

---

## 7. Gap Reporting Rules (For AI Agents)

Any AI agent (Claude Code, Stitch, Antigravity Boomer_Ang) working on this frontend MUST follow these rules:

### 7.1 No Rubber-Stamping

You must NOT say "this has passed", "looks good", or "no issues" unless:
- You have listed each route you checked
- For each route, listed either: (a) current issues found, or (b) "no issues found" with a one-line explanation

### 7.2 Mandatory Gap Report

If ANY of the following are true for a file you touch:
- A route is missing
- A component import fails
- A design rule from THIS spec is violated
- Text is below minimum size
- Layout breaks at any breakpoint

You MUST output a **GAP REPORT** section with:
- The exact file path(s) that need to be created/edited
- The specific rule from this spec being violated (section number)
- A concrete fix description

### 7.3 Change Documentation

After modifying any file, report:
- Which file was changed
- What was broken (before)
- What was fixed (after)
- Which breakpoints were affected
- Which section of this spec the fix addresses

---

## 8. Implementation Priority Order

Work through fixes in this order:

| Phase | Pages | Goal |
|-------|-------|------|
| **P0 — Critical Path** | Sign-in, Sign-up, Onboarding, Chat | Users must be able to auth + chat without layout bugs |
| **P1 — Core Experience** | Landing, Dashboard overview, Pricing, Circuit Box, LUC, Operations | Main flows must be clean and readable |
| **P2 — Full Dashboard** | All remaining dashboard pages | Consistent grid/card/text treatment |
| **P3 — Content & Extras** | Gallery, Merch, Showroom, Book of V.I.B.E., Workshop, Sandbox | Polish passes |

### Per-File Fix Checklist

For each file you fix, confirm ALL of these:

- [ ] Body text >= 14px mobile / 16px desktop
- [ ] No `text-[9px]`, `text-[10px]`, `text-[11px]` in user-facing elements
- [ ] Headings readable and properly scaled across breakpoints
- [ ] Text never overflows its container (test at 375px width)
- [ ] Horizontal padding: `px-4` mobile / `px-6` tablet / `px-8` desktop
- [ ] Cards use consistent padding: `p-4` mobile / `p-6` desktop
- [ ] Grid columns collapse properly: 1 col phone / 2 col tablet / 3-4 col desktop
- [ ] Buttons meet 40px min height and 44px tap target
- [ ] Inputs are full-width on mobile with 14px+ font
- [ ] No hardcoded widths > 360px without responsive prefix
- [ ] No banned UI labels (see Section 3.4)
- [ ] Backdrop blur capped at `backdrop-blur-md` for cards, `backdrop-blur-lg` for modals

---

## 9. Files to Modify (Quick Reference)

### Global / Layout Files
- `app/layout.tsx` — Update metadata description, verify `.aims-frame` inset
- `app/globals.css` — Adjust `.auth-glass-card` blur, update `.wireframe-card` bg opacity, add responsive `--frame-inset`

### Auth
- `app/(auth)/layout.tsx` — Make 3-column responsive (hide sides on mobile)
- `app/(auth)/sign-in/page.tsx` — Fix `text-[9px]`, responsive card
- `app/(auth)/sign-up/page.tsx` — Multi-step form responsive
- `app/(auth)/forgot-password/page.tsx` — Basic responsive

### Onboarding
- `app/onboarding/layout.tsx` — Card container sizing
- `app/onboarding/page.tsx` — Form layout
- `app/onboarding/[step]/page.tsx` — Step form responsive

### Chat
- `app/chat/page.tsx` — Sidebar responsive, message sizing
- `components/chat/ChatInterface.tsx` — Message text sizing, input bar

### Dashboard
- `components/DashboardShell.tsx` — Fix `text-[9px]`, `text-[10px]`, `text-[11px]`
- `components/DashboardNav.tsx` — Responsive sidebar collapse
- Every `app/dashboard/*/page.tsx` — Per-file checklist above

### Landing
- `app/page.tsx` — Hero sizing, feature grid
- `components/landing/Hero.tsx` — Text scale, CTA sizing
- `components/SiteHeader.tsx` — Mobile hamburger, sticky behavior

---

## 10. Tailwind Config Recommendations

Add these to `tailwind.config.ts` to enforce the spec:

```ts
// Add to theme.extend.fontSize to create AIMS-specific scale
fontSize: {
  'aims-xs': ['0.75rem', { lineHeight: '1rem' }],       // 12px — secondary only
  'aims-sm': ['0.875rem', { lineHeight: '1.25rem' }],    // 14px — mobile body min
  'aims-base': ['1rem', { lineHeight: '1.5rem' }],       // 16px — desktop body
  'aims-lg': ['1.125rem', { lineHeight: '1.75rem' }],    // 18px — subheading
  'aims-xl': ['1.25rem', { lineHeight: '1.75rem' }],     // 20px — section heading
  'aims-2xl': ['1.5rem', { lineHeight: '2rem' }],        // 24px — page title mobile
  'aims-3xl': ['1.875rem', { lineHeight: '2.25rem' }],   // 30px
  'aims-4xl': ['2.25rem', { lineHeight: '2.5rem' }],     // 36px — page title desktop
},

// Update screens if needed
screens: {
  'sm': '640px',
  'md': '768px',
  'lg': '1024px',
  'xl': '1280px',
},
```

---

## 11. Testing Requirements

Before any PR is merged, verify:

1. **Build passes**: `cd frontend && npm run build` — zero errors
2. **Phone viewport** (375px): All pages render without horizontal scroll, text readable
3. **Tablet viewport** (768px): Layouts adjust, grids restructure
4. **Desktop viewport** (1280px): Full layouts, sidebars visible
5. **No TypeScript errors**: All imports resolve, no missing components
6. **No console errors**: No hydration mismatches, no missing refs

---

*This spec is the single canonical source of truth. When in doubt, follow this document. If this document conflicts with older specs, THIS document wins.*
