# Opus 4.6 — A.I.M.S. Brand + Design Bible

**Version:** 1.0.0
**Date:** 2026-02-14
**Status:** Active
**Engines:** Stitch (UI Assembly) · Nano Banana Pro (Asset Generation) · Framer Motion (Interaction)

---

## 0. Guiding North Star

> Most people don't need "AI" as a concept; they need a softer, more **human** way to get unstuck, create, and connect.

A.I.M.S. frames itself as **voice-first companions** that make real life feel lighter, not weirder. Every design decision flows from three verbs:

| Verb | Meaning | Entry Point |
|------|---------|-------------|
| **Ask** | "Talk it out" with a Boomer_Ang — feelings, decisions, ideas | Voice-first prompt |
| **Play** | Light simulations, roleplays, creative prompts | Life Scenes, Moment Studio |
| **Build Together** | Co-create plans, content, projects with humans + agents | Creator Circles, Money Moves |

Every experience starts with voice (press-and-hold or "Hey ACHEEVY") and **never** dumps a blank text box in someone's face.

---

## 1. Brand Identity

### 1.1 Brand Hierarchy

```
A.I.M.S. (AI Managed Solutions)
├── ACHEEVY          — The calm senior partner you trust to delegate
├── Boomer_Angs      — Colleagues with clear roles who augment your effort
│   ├── PMO Office Heads (8 offices)
│   ├── Lil Hawks (specialist scouts)
│   └── Named Companions (user-tunable over time)
├── plugmein.cloud   — "The Workshop" (playful, experimental)
└── aimanagedsolutions.cloud — "The Firm" (professional, polished)
```

### 1.2 Brand Voice

| Trait | Workshop (plugmein.cloud) | Firm (aimanagedsolutions.cloud) |
|-------|---------------------------|----------------------------------|
| Tone | Warm, playful, encouraging | Confident, precise, trustworthy |
| Register | "Let's try this together" | "Here's what we recommend" |
| Humor | Light, self-aware | Subtle, dry wit |
| Jargon | Minimal — plain language | Industry-aware, never pretentious |
| Agent Framing | "Your Boomer_Ang" | "Your specialist" |

### 1.3 Brand Language Rules

- **Always say:** "Let's do this together" / "What do you want to try?"
- **Never say:** "I will do X for you" / "AI-powered solution"
- ACHEEVY = calm senior partner, **not** a boss replacing you
- Boomer_Angs = colleagues with clear roles, **not** tools or bots
- Users can **name** their primary Boomer_Ang and tune its style over time

### 1.4 Taglines

| Surface | Line |
|---------|------|
| Hero (Workshop) | "Think It. Say It. Let's Build It." |
| Hero (Firm) | "Think It. Prompt It. Let's Build It." |
| Sub-tagline | "Voice-first companions for the rest of us." |
| CTA | "Start talking" (not "Try free" or "Get started") |

---

## 2. Design Philosophy: "Luxury Industrial Companion"

### 2.1 Core Feel

**Keywords:** Precision · Warmth · Depth · Glass · Obsidian · Gold · Human
**Metaphor:** A high-end workshop where AI companions work alongside you — not a cold cockpit.
**Reference Mood:** "Mr. Robot" tension + lo-fi/MTV-era grit + modern AI glass-box + warm studio lighting

### 2.2 Non-Negotiables

1. Dark UI foundation + gold accents (brand identity)
2. "Glass box" operational transparency (status, proofs, attestation)
3. Intentional texture: subtle noise, scanlines, slight vignette, micro-wear
4. Voice as primary input — microphone button is always the largest CTA
5. No blank-slate text prompts — always 3–5 suggested conversation starters
6. Agents are companions, never competition

### 2.3 The "Brick and Window" Layout Rule

- **Brick** = the logo wall / textured dark background layer (the structure)
- **Window** = glass panel content areas cut into the brick (the interaction)
- Content lives in Windows; the Brick provides ambient depth

---

## 3. Color System

### 3.1 Base Layers (Obsidian)

| Name | Hex | Usage |
|------|-----|-------|
| Void Black | `#000000` | Deep backgrounds, true-black surfaces |
| Obsidian | `#0A0A0A` | Card backgrounds, modals, primary surface |
| Charcoal | `#111111` | Sidebar, secondary surfaces |
| Leather | `#1A1A1A` | Tertiary backgrounds |
| Gunmetal | `#2A2A2A` | Borders, separators |
| Ink | `#0B0E14` | Circuit Box main background |

### 3.2 Gold Accent Palette

| Name | Hex | Token | Usage |
|------|-----|-------|-------|
| AIMS Gold | `#D4AF37` | `--aims-color-gold` | Primary CTA, active states, ACHEEVY accent |
| Champagne | `#F6C453` | `--aims-color-champagne` | Gradients, hover states, warmth |
| Gold Light | `#E8D48A` | `--aims-color-gold-light` | Soft highlights |
| Gold Dark | `#B5952F` | `--aims-color-gold-dark` | Pressed states |
| Gold Dim | `rgba(212,175,55,0.1)` | `--aims-color-gold-dim` | Background tints |

**Rule:** Gold is **rare** — only one primary CTA per view. Gold = ACHEEVY authority.

### 3.3 Signal Colors

| Name | Hex | Token | Usage |
|------|-----|-------|-------|
| Emerald | `#10B981` | `--aims-color-emerald` | Healthy, active, success, online |
| Red | `#EF4444` | `--aims-color-red` | Error, alert, destructive, offline |
| Amber | `#F59E0B` | `--aims-color-amber` | Warning, degraded, needs attention |
| Blue | `#3B82F6` | `--aims-color-blue` | Info, navigation, search |
| Cyan | `#22D3EE` | `--aims-color-cyan` | Voice, audio, streaming, live |
| Violet | `#8B5CF6` | `--aims-color-violet` | Data, analytics |
| Rose | `#F43F5E` | `--aims-color-rose` | Payments, billing |

### 3.4 Text Colors

| Name | Hex | Usage |
|------|-----|-------|
| Primary White | `#EDEDED` | Headings, primary text |
| Muted | `#A1A1AA` | Secondary text, labels |
| Dim | `rgba(255,255,255,0.2)` | Tertiary, metadata |
| On-Gold | `#0A0A0A` | Text on gold buttons |

### 3.5 Wireframe System

| Name | Value | Usage |
|------|-------|-------|
| Stroke | `rgba(255,255,255,0.12)` | Default border |
| Glow | `rgba(255,255,255,0.04)` | Inner glow on panels |
| Hover | `rgba(255,255,255,0.18)` | Border on hover |

---

## 4. Typography System

### 4.1 Font Stack

| Role | Family | Variable | Usage |
|------|--------|----------|-------|
| Interface | Inter | `--font-sans` | Body, UI, numbers, all dense text |
| Data/Display | Doto | `--font-doto` | Headers, tech specs, monospace data |
| Human Touch | Permanent Marker | `--font-marker` | Notes, annotations, "human in the loop" |
| Warmth | Caveat Brush | `--font-caveat` | Handwriting feel, micro-annotations |
| Friendly | Patrick Hand SC | `--font-patrick` | Casual labels (Workshop surfaces) |
| Cinematic | Nabla | `--font-nabla` | Special display moments (rare) |

### 4.2 Scale

| Token | Size | Weight | Usage |
|-------|------|--------|-------|
| `--aims-text-xs` | 9px | 400 | Metadata, timestamps |
| `--aims-text-sm` | 11px | 400 | Secondary text, chips |
| `--aims-text-base` | 14px | 400 | Body text |
| `--aims-text-lg` | 16px | 500 | Subheadings |
| `--aims-text-xl` | 20px | 600 | Section headings |
| `--aims-text-2xl` | 24px | 700 | Page titles |
| `--aims-text-mono` | 12px | 400 | Code, IDs, technical values |

### 4.3 Rules

- Hand/marker fonts **never** used for dense paragraphs
- Numbers (tokens, cost, timelines) always use Inter
- Doto for headlines and tech readouts only
- Patrick Hand only on Workshop surfaces

---

## 5. Texture & Effects (The "Blemish" Layer)

### 5.1 Layers

| Layer | Opacity | Purpose |
|-------|---------|---------|
| Noise overlay | 3% | Film grain, tactile warmth |
| Scanlines | 10% opacity bands | CRT/retro feel on hover states |
| Vignette | 25% radial edge darkening | Cinematic depth framing |
| Gold grid | 2-3% dot/line pattern | Ambient structure |

### 5.2 Glass Effects

| Variant | Blur | Background | Border | Usage |
|---------|------|------------|--------|-------|
| Glass Panel | 20px | `rgba(255,255,255,0.03)` | `rgba(255,255,255,0.05)` | Standard cards |
| Glass Premium | 40px | Radial gold gradient at 5% | `rgba(212,175,55,0.2)` | High-value items |
| Auth Glass | 32px | Radial white gradient | `rgba(212,175,55,0.1)` | Auth "window" |
| Wireframe Card | 0 | `rgba(255,255,255,0.02)` | `rgba(255,255,255,0.12)` | Default card primitive |

### 5.3 Rules

- Texture must **never** reduce readability
- Texture is disabled for `prefers-reduced-motion` / `prefers-contrast`
- Gold glow is **controlled** — `0 0 40px rgba(212,175,55,0.06)` max
- No bright haze, no bloom that obscures content

---

## 6. Motion System (Framer Motion)

### 6.1 Duration Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `instant` | 75ms | Micro-interactions (hover color) |
| `fast` | 150ms | Button press, toggle |
| `normal` | 200ms | Standard transitions |
| `slow` | 300ms | Panel expand/collapse |
| `emphasis` | 500ms | Page transitions, cinematic moments |

### 6.2 Easing Curves

| Token | Value | Usage |
|-------|-------|-------|
| `default` | `cubic-bezier(0.4, 0, 0.2, 1)` | General purpose |
| `enter` | `cubic-bezier(0, 0, 0.2, 1)` | Elements entering |
| `exit` | `cubic-bezier(0.4, 0, 1, 1)` | Elements leaving |
| `spring` | `cubic-bezier(0.16, 1, 0.3, 1)` | Playful bounce (Workshop) |

### 6.3 Signature Animations

| Name | Duration | Trigger | Description |
|------|----------|---------|-------------|
| `materialize` | 600ms | Mount | Blur(8px) → clear, Y(20) → 0 |
| `shelf-slide` | 500ms | Mount | X(60) → 0, fade in |
| `pulse-gold` | 3s loop | Active state | Opacity + gold glow breathe |
| `head-bob` | 4s loop | Idle | Gentle Y(-2px) float on avatars |
| `cb-breathe` | 3s loop | Status LED | Opacity + glow pulse |

### 6.4 Rules

1. All animations are **state-driven** (no ad-hoc)
2. Prefer `opacity` + `transform` for GPU performance
3. Never animate layout + opacity + transform simultaneously
4. `prefers-reduced-motion` users get instant or no transitions
5. UI interactions use Framer Motion; cinematic/narrative uses Remotion

---

## 7. Layout System

### 7.1 The Frame

The entire UI lives inside `.aims-frame` — a viewport-inset container:

| Breakpoint | Inset | Border Radius |
|------------|-------|---------------|
| Mobile (<768px) | 12px | 20px |
| Tablet (768-1279px) | 16px | 20px |
| Desktop (1280px+) | 24px | 20px |

### 7.2 Responsive Breakpoints

| Name | Range | Grid Cols | Layout |
|------|-------|-----------|--------|
| Mobile | < 768px | 1 | Stack, full-width |
| Tablet | 768–1439px | 2 | Sidebar collapses |
| Desktop | 1440px+ | 4 | Full sidebar + grid |

### 7.3 Spacing Scale

| Token | Value | Usage |
|-------|-------|-------|
| `space-1` | 4px | Tight inline gaps |
| `space-2` | 8px | Icon-to-text, compact padding |
| `space-3` | 12px | Card internal (compact) |
| `space-4` | 16px | Standard padding |
| `space-6` | 24px | Panel padding |
| `space-8` | 32px | Section separators |
| `space-10` | 40px | Page-level spacing |
| `space-16` | 64px | Page margins (desktop) |

### 7.4 Fit-to-Screen Rules (Non-Negotiable)

- Every page loads centered with consistent padding
- No primary content renders clipped off-screen on first paint
- Header is visible **immediately** — no layout shift
- Chat composer is always fully visible — send button never clipped
- Scroll containers have bounded height — no infinite overflow

---

## 8. Component Inventory

### 8.1 Primitives

| Component | Class/Style | Variants |
|-----------|-------------|----------|
| Button Primary | Solid gold bg, black text, `rounded-md` | Default, Hover, Pressed, Disabled |
| Button Secondary | Transparent, white border | Default, Hover (white bg/black text) |
| Button Ghost | Text only | Default, Gold hover |
| Card (Wireframe) | `.wireframe-card` | Default, Hover (lift + glow) |
| Card (Premium) | `.glass-premium` | Default, Active (gold border) |
| Input | Dark bg, border-bottom only | Default, Focus (gold border) |
| Status Chip | `28px` height, signal color | Green, Amber, Red, Cyan, Fog |
| LED Indicator | Dot + pulse animation | Active, Warning, Error, Loading |

### 8.2 Compound Components

| Component | Description | Key Props |
|-----------|-------------|-----------|
| `DashboardShell` | Main layout wrapper (sidebar + content) | children |
| `FloatingACHEEVY` | Persistent floating command console | mode (chat/voice) |
| `QuickSwitcher` | ⌘K command palette | — |
| `ArsenalShelf` | Horizontal plug carousel | — |
| `CircuitBox` | Tabbed ops panel (plan, boomerangs, LUC, settings) | tab |
| `AcheevyChat` | Text chat with markdown + model switching | — |
| `AcheevyAgent` | Voice session with frequency visualizer | — |
| `AuthGate` | Auth enforcement at action level | — |
| `OnboardingStepper` | Multi-step onboarding flow | step |

### 8.3 Voice-First Components (New for Companion Verse)

| Component | Description | Surface |
|-----------|-------------|---------|
| `VoiceOrb` | Large press-and-hold mic button, gold pulse | Universal entry |
| `ConversationStarters` | 3–5 suggested openings (no blank text box) | All voice flows |
| `CompanionAvatar` | Named Boomer_Ang with idle animation | Chat, Life Scenes |
| `RehearsalStage` | Split-screen rehearsal view | Life Scenes |
| `StoryPlayer` | Audio diary with chapter navigation | Moment Studio |
| `WeeklyCheckIn` | Finance companion card with action item | Money Moves Monday |
| `CircleLobby` | 3–5 person group session with facilitator | Creator Circles |
| `ArtifactCard` | Output artifact (PDF, checklist, plan, audio) | All flows |

---

## 9. Sitemaps

### 9.1 plugmein.cloud — "The Workshop"

```
plugmein.cloud
├── / (Landing)
│   ├── Hero: "Think It. Say It. Let's Build It."
│   ├── VoiceOrb (primary CTA — "Start talking")
│   ├── 3 verb cards: Ask · Play · Build Together
│   ├── Sandbox Showcase (Per|Form, Blockwise AI, verticals)
│   ├── Companion Verse explainer
│   └── Footer
│
├── /workshop (Main Experience Hub)
│   ├── ConversationStarters: suggested flows
│   ├── /workshop/life-scenes — "Rehearse Tomorrow"
│   │   ├── Hard conversation practice
│   │   ├── Negotiation rehearsal
│   │   └── Saying "no" practice
│   ├── /workshop/moment-studio — "Turn Days Into Stories"
│   │   ├── Daily voice recap
│   │   ├── Story generation
│   │   └── Private audio diary
│   ├── /workshop/money-moves — "15-Minute Weekly Companion"
│   │   ├── Weekly spending check-in
│   │   ├── Money wins tracking
│   │   └── One small action generator
│   └── /workshop/creator-circles — "Small Group Collab"
│       ├── Circle lobby
│       ├── Facilitator selection (Chill Coach, Tough Love, Hype Friend)
│       └── Session artifacts (plan, script, checklist)
│
├── /sandbox (Autonomous Project Playground)
│   ├── /sandbox/perform — Per|Form Sports Analytics
│   │   ├── Athlete scouting dashboard
│   │   ├── NIL valuation calculator
│   │   ├── P.A.I. score breakdown
│   │   └── Film room (SAM2 video analysis)
│   ├── /sandbox/blockwise — Blockwise AI Real Estate
│   │   ├── Deal finder
│   │   ├── Property analysis
│   │   ├── OPM funding paths
│   │   └── 90-day close plan
│   └── /sandbox/verticals — Other Verticals
│       ├── Veritas (business plan fact-checking)
│       ├── Strategos (census-backed personas)
│       ├── Grant Scout (government contracts)
│       └── Content Engine (video → clips)
│
├── /discover — Vertical showcase + "Boss-Grunt" architecture explainer
├── /gallery — Character Gallery (ACHEEVY, Boomer_Angs, Hawks)
├── /merch — Merch Store
├── /about — About A.I.M.S.
├── /pricing — 3-6-9 Pricing Model
│
├── /dashboard (Full Platform — Auth Required)
│   ├── /dashboard/chat — Chat w/ACHEEVY
│   ├── /dashboard/build — Chicken Hawk Builder
│   ├── /dashboard/circuit-box — Operations Panel
│   ├── /dashboard/plugs — Deployed Tools
│   ├── /dashboard/nil — N.I.L. Dashboard
│   ├── /dashboard/research — Research Hub
│   └── /dashboard/settings — System Config
│
├── /sign-in
├── /sign-up
└── /forgot-password
```

### 9.2 aimanagedsolutions.cloud — "The Firm"

```
aimanagedsolutions.cloud
├── / (Landing)
│   ├── Hero: "Think It. Prompt It. Let's Build It."
│   ├── Professional positioning
│   ├── Enterprise use cases
│   └── Footer
│
├── /solutions (Professional Companion Flows)
│   ├── /solutions/meeting-prep — "1:1 Prep for Big Meetings"
│   │   ├── Voice briefing builder
│   │   ├── Stakeholder profile cards
│   │   └── Talking points generator
│   ├── /solutions/board-decks — "Board Deck Co-Creation"
│   │   ├── Narrative structuring
│   │   ├── Data storytelling
│   │   └── Presentation artifact
│   ├── /solutions/proposals — "Proposal Builder"
│   │   ├── Scope definition via voice
│   │   ├── Competitive positioning
│   │   └── PDF artifact generation
│   └── /solutions/exec-coaching — "Executive Coaching"
│       ├── Decision rehearsal
│       ├── Leadership scenario practice
│       └── Reflection journaling
│
├── /verticals (Enterprise Verticals)
│   ├── /verticals/veritas — Business Intelligence Fact-Checking
│   ├── /verticals/blockwise — Commercial Real Estate Analytics
│   ├── /verticals/perform — Sports Organization Analytics
│   ├── /verticals/strategos — Market Persona Intelligence
│   └── /verticals/grant-scout — Government Contract Matching
│
├── /platform → (same dashboard routes as plugmein.cloud)
├── /pricing
├── /security
├── /terms
└── /privacy
```

---

## 10. Visual Narrative: Page-by-Page

### 10.1 Landing — plugmein.cloud

**Feel:** Walking into a warm, dimly lit creative studio. Gold light pools on the desk.

1. **Above the fold:** Dark void with subtle gold dot-grid. Large `VoiceOrb` pulsing center-screen. Tagline in Doto font: "Think It. Say It. Let's Build It." Below: three verb cards (Ask · Play · Build Together) with hand-drawn Caveat labels.

2. **Scroll 1 — Companion Verse:** ACHEEVY portrait (glass-premium card) with bio text. Three Boomer_Ang avatars in wireframe cards with idle head-bob animation. Copy: "Your AI companions — not replacements."

3. **Scroll 2 — Workshop Experiences:** Four horizontal cards with hover-glow: Life Scenes, Moment Studio, Money Moves, Creator Circles. Each shows a conversation transcript preview.

4. **Scroll 3 — Sandbox Projects:** Per|Form athlete card, Blockwise deal card, and Veritas fact-check card in a masonry grid. Badge: "Runs autonomously."

5. **Footer:** Newsletter, navigation columns, social links, gold accent line.

### 10.2 Workshop — Life Scenes

**Feel:** Backstage at a theater. Warm, safe, private.

1. **Entry:** VoiceOrb + 4 conversation starters ("Rehearse a hard talk", "Practice saying no", "Negotiate salary", "Set a boundary").
2. **Active Session:** Split view — left: your voice waveform + transcript. Right: Boomer_Ang playing the other person with their avatar + waveform.
3. **Wrap-up:** Confidence checklist + "script" artifact card. Option to replay or save.

### 10.3 Sandbox — Per|Form

**Feel:** A scout's war room. Film projector glow. Chalkboard energy.

1. **Athlete Grid:** Cards with GROC scores, tier badges, headshot placeholders.
2. **Detail View:** P.A.I. breakdown (Performance 40%, Athleticism 30%, Intangibles 30%). Video analysis frame. Lil_Bull_Hawk vs Lil_Bear_Hawk debate panel.
3. **NIL Dashboard:** Deal type breakdown, valuation calculator, tier brackets.

### 10.4 Sandbox — Blockwise AI

**Feel:** A real estate closing table. Blueprint paper texture. Confidence.

1. **Deal Finder:** Voice prompt: "I have $50K. Find me a deal in Atlanta." Map view + deal cards.
2. **Analysis View:** Property metrics, OPM funding paths, 90-day close timeline.
3. **Artifact:** One-page deal summary PDF.

---

## 11. Sandbox Project Architecture

### 11.1 Design Principle

Sandbox projects run **autonomously** outside the main platform. They are:

- Self-contained: own routes, own data pipelines, own agent teams
- ACHEEVY-orchestrated: still report through chain of command
- Evidence-gated: "no proof, no done" applies
- Discoverable: showcased on `/sandbox` and `/discover`

### 11.2 Shared Infrastructure

```
┌─────────────────────────────────────────────────┐
│  A.I.M.S. Core Platform                         │
│  (ACHEEVY · UEF Gateway · Auth · LUC)          │
├─────────────────────────────────────────────────┤
│                                                  │
│  ┌──────────────┐  ┌──────────────┐             │
│  │  Per|Form     │  │  Blockwise   │             │
│  │  Sandbox      │  │  AI Sandbox  │             │
│  │              │  │              │             │
│  │  Scout Hub   │  │  Deal Finder │             │
│  │  Film Room   │  │  Analyzer    │             │
│  │  War Room    │  │  OPM Paths   │             │
│  │              │  │              │             │
│  │  Ports:      │  │  Ports:      │             │
│  │  5001-5003   │  │  5004-5005   │             │
│  └──────────────┘  └──────────────┘             │
│                                                  │
│  ┌──────────────┐  ┌──────────────┐             │
│  │  Veritas      │  │  Future      │             │
│  │  Sandbox      │  │  Verticals   │             │
│  └──────────────┘  └──────────────┘             │
│                                                  │
└─────────────────────────────────────────────────┘
```

### 11.3 Per|Form Stack

| Service | Port | Purpose |
|---------|------|---------|
| Scout Hub | 5001 | Lil_Hawk data acquisition (Bull + Bear debate) |
| Film Room | 5002 | SAM 2 on Vertex AI (video analysis) |
| War Room | 5003 | Chicken Hawk mediation → rankings + content |

**Pipeline:** INGEST → ENRICH → GRADE (GROC + Luke) → RANK → WRITE_BIO → RENDER_CARD → PUBLISH → VALIDATE

**Scoring:** P.A.I. = (Performance × 0.40) + (Athleticism × 0.30) + (Intangibles × 0.30)

### 11.4 Blockwise AI Stack

| Service | Port | Purpose |
|---------|------|---------|
| Deal Engine | 5004 | Property discovery + analysis |
| Funding Router | 5005 | OPM path calculation + lender matching |

**Pipeline:** DISCOVER → ANALYZE → FUND_PATH → TIMELINE → SUMMARY_ARTIFACT

---

## 12. Nano Banana Pro Image Prompts

### 12.1 Brand Photography

| ID | Prompt | Usage | Export |
|----|--------|-------|--------|
| `NBP-001` | "Professional African American man in tailored dark suit, seated at obsidian desk with gold desk lamp, warm studio lighting, cinematic depth of field, 4K, luxury office atmosphere, subtle gold accents" | ACHEEVY hero portrait | 2400×1600 WEBP |
| `NBP-002` | "Diverse group of 5 professional avatars in wireframe glass cards, floating in dark void with gold dot grid, each with distinct personality — coach, researcher, builder, analyst, creative — warm ambient lighting" | Boomer_Ang team showcase | 2400×800 WEBP |
| `NBP-003` | "Two people sitting across a warm table, one speaking into a glowing gold microphone, soft bokeh, intimate rehearsal space, warm shadows, cinematic" | Life Scenes hero | 1920×1080 WEBP |
| `NBP-004` | "Abstract audio waveform in gold on obsidian background, transitioning into handwritten journal pages, warm lamp light, personal diary feel" | Moment Studio hero | 1920×1080 WEBP |
| `NBP-005` | "Minimal gold coin stack growing on dark surface, single spotlight, one small green arrow, warm not corporate, personal finance feel" | Money Moves hero | 1200×800 WEBP |
| `NBP-006` | "3–5 people around a round table with floating glass holographic notes, warm collaborative energy, creative studio lighting, gold accent highlights" | Creator Circles hero | 1920×1080 WEBP |

### 12.2 Sandbox Project Art

| ID | Prompt | Usage | Export |
|----|--------|-------|--------|
| `NBP-010` | "Football scout's war room, dark room with film projector glow, chalkboard with X's and O's, gold-framed athlete silhouettes on wall, cinematic noir" | Per|Form hero | 1920×1080 WEBP |
| `NBP-011` | "Athlete scouting card template, obsidian background, gold border, headshot placeholder circle, stat bars in emerald/gold/red, clean data layout" | Per|Form card template | 800×1200 WEBP |
| `NBP-012` | "Modern real estate closing table from above, blueprint paper texture, gold pen, property documents, warm overhead lighting, sophisticated" | Blockwise AI hero | 1920×1080 WEBP |
| `NBP-013` | "Abstract city skyline made of glass blocks on dark background, gold light emanating from within buildings, wealth and opportunity feel" | Blockwise AI background | 2400×800 WEBP |

### 12.3 Texture Assets

| ID | Prompt | Usage | Export |
|----|--------|-------|--------|
| `NBP-020` | "Seamless subtle film grain noise texture, dark gray, extremely fine, 3% opacity suitable" | Global noise overlay | 512×512 PNG transparent |
| `NBP-021` | "Seamless horizontal scanline pattern, alternating transparent and 10% black bands, 4px spacing" | CRT scanline overlay | 512×512 PNG transparent |
| `NBP-022` | "A.I.M.S. gold logo repeated in subtle tile pattern, 2% opacity on transparent background, luxury wallpaper feel" | Logo wall background | 1024×1024 PNG transparent |
| `NBP-023` | "Radial vignette from transparent center to 25% black edges, smooth gradient, cinematic framing" | Vignette overlay | 1920×1080 PNG transparent |

### 12.4 UI Decals

| ID | Prompt | Usage | Export |
|----|--------|-------|--------|
| `NBP-030` | "Small verified checkmark badge, gold on dark, subtle glow, clean vector style" | Verified badge | 64×64 SVG/PNG |
| `NBP-031` | "Small shield badge with gold star center, dark background, 'CERTIFIED' text below in micro font" | Certified badge | 64×64 SVG/PNG |
| `NBP-032` | "Circular badge with plug icon, gold ring, 'MANAGED' text, dark center" | Managed install badge | 64×64 SVG/PNG |

---

## 13. Human Companion Experiences Skill

See: `aims-skills/skills/companion/human-companion-experiences.skill.md`

This skill governs all voice-first companion flows across both surfaces:

| Flow | Entry Sentence | Conversation Outline | Artifact |
|------|---------------|---------------------|----------|
| Life Scenes | "I have a hard conversation coming up — help me practice." | 1. Set the scene (who, what, stakes) → 2. Boomer_Ang plays the other person → 3. Practice rounds with coaching → 4. Confidence check | Script PDF + Confidence Checklist |
| Moment Studio | "Here's what happened today…" | 1. Free-form voice recap → 2. ACHEEVY identifies themes → 3. Story Boomer_Ang crafts narrative → 4. Review + edit | Audio diary with chapters + text summary |
| Money Moves | "Let's do my 15-minute check-in." | 1. Spending review ("How much on eating out?") → 2. Wins/surprises → 3. One small action | Action card (cancel sub / move $20 / ask boss) |
| Creator Circles | "Start a circle for [project]." | 1. Invite 3–5 people → 2. Facilitator sets vibe → 3. Timed creative session → 4. Artifact generation | Plan / Script / Checklist / Storyboard |

---

## 14. Asset Manifest

### 14.1 Existing Assets (in `/public/images/`)

| Path | Description | Usage |
|------|-------------|-------|
| `/images/acheevy/acheevy-office-plug.png` | ACHEEVY in office | Auth left column |
| `/images/acheevy/acheevy-helmet.png` | ACHEEVY helmet icon | Floating chat, nav |
| `/images/logo/` | A.I.M.S. logo variants | Logo wall, header |

### 14.2 Required New Assets (Nano Banana Pro)

| Priority | ID | Description | Status |
|----------|----|-------------|--------|
| P0 | NBP-001 | ACHEEVY hero portrait | Needed |
| P0 | NBP-003 | Life Scenes hero | Needed |
| P0 | NBP-010 | Per|Form hero | Needed |
| P0 | NBP-012 | Blockwise AI hero | Needed |
| P1 | NBP-002 | Boomer_Ang team | Needed |
| P1 | NBP-004 | Moment Studio hero | Needed |
| P1 | NBP-005 | Money Moves hero | Needed |
| P1 | NBP-006 | Creator Circles hero | Needed |
| P1 | NBP-011 | Per|Form card template | Needed |
| P2 | NBP-020–023 | Texture overlays | Needed |
| P2 | NBP-030–032 | UI decals/badges | Needed |

---

## 15. Implementation Priority

### Phase 1: Foundation (Week 1–2)
- [ ] Voice-first entry point (VoiceOrb component)
- [ ] Conversation starters (no blank text box)
- [ ] Sandbox route structure (`/sandbox/perform`, `/sandbox/blockwise`)
- [ ] Updated landing page with three-verb hero

### Phase 2: Companion Flows (Week 3–4)
- [ ] Life Scenes flow (rehearsal mode)
- [ ] Moment Studio flow (daily recap → story)
- [ ] Money Moves Monday flow
- [ ] Artifact generation system

### Phase 3: Sandbox Projects (Week 5–6)
- [ ] Per|Form dashboard (athlete grid, P.A.I. scores, NIL)
- [ ] Blockwise AI dashboard (deal finder, analysis, OPM)
- [ ] Vertical showcase on `/discover`

### Phase 4: Creator Circles (Week 7–8)
- [ ] Multi-user voice session
- [ ] Facilitator Boomer_Ang selection
- [ ] Session artifact generation
- [ ] Circle management

---

*This document is the single source of truth for all design decisions across plugmein.cloud and aimanagedsolutions.cloud. All implementation must reference these tokens, components, and rules.*
