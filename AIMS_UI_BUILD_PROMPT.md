# A.I.M.S. — Holistic UI/UX Build Prompt

> **Version:** 1.0.0
> **Date:** 2026-02-28
> **Target:** Complete frontend build with full backend wiring
> **Platform:** Next.js 14 (App Router) + Tailwind CSS + Framer Motion
> **Deploy:** VPS Docker (plugmein.cloud) — NO Vercel, NO Netlify

---

## 0. MISSION — Read This Before Everything

**A.I.M.S. = AI Managed Solutions.** This is a Platform-as-a-Service where users tell
ACHEEVY (the AI orchestrator) what they need, and ACHEEVY deploys it as a running,
managed container instance.

The UI must accomplish ONE thing: **make the user feel like they have an entire
engineering team behind a single chat window.**

Every page, every button, every animation exists to:
1. Get the user INTO a conversation with ACHEEVY
2. Show them what ACHEEVY can deploy for them
3. Let them monitor and manage what's running
4. Bill them fairly and transparently

If a page doesn't serve one of those 4 goals, it doesn't belong.

---

## 1. DESIGN SYSTEM FOUNDATION

### 1.1 Theme

| Token | Value | Usage |
|-------|-------|-------|
| `--bg-base` | `#09090B` | Root background (dark) |
| `--bg-surface` | `#111113` | Card/panel backgrounds |
| `--bg-elevated` | `#18181B` | Elevated surfaces, inputs |
| `--border-subtle` | `rgba(255,255,255,0.06)` | Card borders, dividers |
| `--border-hover` | `rgba(212,175,55,0.2)` | Hover state borders |
| `--text-primary` | `#F4F4F5` (zinc-100) | Headings, primary text |
| `--text-secondary` | `#A1A1AA` (zinc-400) | Body text, descriptions |
| `--text-muted` | `#71717A` (zinc-500) | Labels, captions, timestamps |
| `--accent-gold` | `#D4AF37` | Primary accent, CTAs, highlights |
| `--accent-cyan` | `#22D3EE` | Secondary accent, links, active states |
| `--accent-emerald` | `#10B981` | Success, online, healthy |
| `--accent-red` | `#EF4444` | Error, offline, critical |
| `--accent-amber` | `#F59E0B` | Warning, degraded, pending |

### 1.2 Typography

| Element | Font | Size | Weight |
|---------|------|------|--------|
| Display/Hero | Doto | 48-72px | 700 |
| Page headings | Inter/System | 24-32px | 700 |
| Section headings | Inter/System | 18-20px | 600 |
| Body text | Inter/System | 14-16px | 400 |
| Labels/captions | Inter/System | 12-13px | 500 |
| Code/mono | JetBrains Mono | 13px | 400 |

### 1.3 Spacing & Layout

- **Mobile-first**: Design for 375px, scale up
- **Breakpoints**: `sm` (640px), `md` (768px), `lg` (1024px), `xl` (1280px)
- **Max content width**: 1200px (`max-w-7xl`)
- **Page padding**: 16px mobile → 24-32px desktop
- **Card padding**: 16-24px
- **Card radius**: 16-20px (`rounded-2xl`)
- **Section spacing**: 48-80px between sections

### 1.4 Glass Card Pattern (Use Everywhere)

```tsx
className="rounded-2xl border border-white/[0.06] bg-[#111113]/80
           backdrop-blur-sm p-6 shadow-lg"
```

### 1.5 Animation Rules

**Import from `@/lib/motion/tokens` and `@/lib/motion/variants` ONLY.**

```typescript
// Duration tokens
duration.fast    // 0.15s — micro-interactions
duration.normal  // 0.25s — standard transitions
duration.slow    // 0.4s  — emphasis
duration.emphasis // 0.6s — hero animations

// Spring configs
spring.snappy  // { stiffness: 400, damping: 30 } — buttons
spring.gentle  // { stiffness: 200, damping: 25 } — panels
spring.bouncy  // { stiffness: 300, damping: 15 } — emphasis

// Stagger timing
stagger.fast   // 0.05s
stagger.normal // 0.08s
stagger.slow   // 0.12s
```

**Motion components (use before writing custom)**:
- `ScrollReveal` — viewport-triggered fade/slide
- `ParallaxSection` — scroll-driven depth
- `TiltCard` — mouse-tracking 3D tilt
- `TypeReveal` — character-by-character stagger
- `ScrollProgress` — fixed progress bar
- `GlowBorder` — rotating gradient border
- `BentoGrid` — asymmetric feature grid

**Rules:**
- NO magic numbers. Every `duration`, `delay`, `ease` must use a token
- ALL animations must respect `prefers-reduced-motion`
- Landing/marketing pages: rich animation (ScrollReveal, Parallax, BentoGrid)
- Dashboard pages: minimal animation (hover/tap micro-feedback only)
- Animate only `transform` and `opacity` (GPU-accelerated)

### 1.6 Dual-Layer Access (PRIVATE vs PUBLIC)

```typescript
import { usePlatformMode } from '@/lib/platform-mode';
import { t } from '@/lib/terminology';

const { mode, isOwner } = usePlatformMode();
// PRIVATE → admin.aimanagedsolutions.cloud (owner sees everything)
// PUBLIC  → plugmein.cloud (customer sees simplified view)

<h2>{t('circuitBox', mode)}</h2>
// PRIVATE → "Circuit Box"
// PUBLIC  → "Settings & Services"
```

**Key terminology swaps:**

| Internal (PRIVATE) | Customer (PUBLIC) |
|-----|--------|
| Plug | Tool |
| Spin Up | Set Up |
| Deploy | Launch |
| Container | App Instance |
| Boomer_Ang | AI Specialist |
| Lil_Hawk | Task Worker |
| Chicken Hawk | Project Manager |
| LUC Credits | Usage Credits |
| Deploy Dock | Launch Tools |
| Circuit Box | Settings & Services |

**NEVER expose to PUBLIC**: agent names, Docker terminology, infrastructure details.
Only "ACHEEVY" and "your AI team."

---

## 2. BACKEND API — Complete Wiring Map

Every frontend page MUST wire to real backend endpoints. No mock data in production.
Gateway base URL: `process.env.NEXT_PUBLIC_UEF_GATEWAY_URL` or `/api/` (Next.js proxy).

### 2.1 Auth & Sessions

| Endpoint | Method | Purpose | Wire To |
|----------|--------|---------|---------|
| `/api/auth/[...nextauth]` | POST | NextAuth session handler | Sign-in, Sign-up, OAuth |
| `/api/auth/register` | POST | User registration | Sign-up page |
| `/api/auth/forgot-password` | POST | Password reset request | Forgot password page |
| `/api/auth/reset-password` | POST | Complete reset | Reset password page |
| `/api/auth/demo-session` | POST | Demo account login | Demo mode button |

### 2.2 ACHEEVY Chat & Orchestration

| Endpoint | Method | Purpose | Wire To |
|----------|--------|---------|---------|
| `/api/chat` | POST | Unified LLM + agent stream (SSE) | Chat page (text mode) |
| `/api/acheevy/chat` | POST | ACHEEVY chat proxy | Chat page (ACHEEVY mode) |
| `/api/acheevy/classify` | POST | Intent classification | Chat routing logic |
| `/api/acheevy/diy` | POST | DIY scaffolding | Make It Mine builder |
| `/api/acheevy/idea-validation` | POST | Idea validation flow | Deep Scout page |

### 2.3 Plug Engine (The Core PaaS)

| Endpoint | Method | Purpose | Wire To |
|----------|--------|---------|---------|
| `/api/plug-catalog` | GET | Browse catalog with search/filter | Plug Catalog page |
| `/api/plug-catalog` | POST | Spin up plug instance | Catalog "Spin Up" button |
| `/api/plug-instances` | GET | List user's running instances | Dashboard, Plug Manager |
| `/api/plug-instances` | POST | Lifecycle: stop/restart/health/export/remove | Instance action buttons |
| `/api/plug-catalog/needs/questions` | GET | Intake questionnaire | Needs Analysis page |
| `/api/plug-catalog/needs/analyze` | POST | Business needs → plug recommendations | Needs Analysis results |

### 2.4 LUC — Billing, Quotas, Usage

| Endpoint | Method | Purpose | Wire To |
|----------|--------|---------|---------|
| `/api/luc` | GET | Account summary | LUC Dashboard header |
| `/api/luc` | POST | Operations: quote, debit, credit, get-history, etc. | LUC Dashboard panels |
| `/api/luc/billing` | GET | Billing summary | Billing page |
| `/api/luc/usage` | GET | Usage breakdown by period | Usage charts |
| `/api/luc/status` | GET | Plan, quota, remaining | Quota bar component |
| `/api/luc/estimate` | POST | Cost estimation | Cost estimator widget |
| `/api/luc/can-execute` | POST | Check if action allowed (quota gate) | Pre-action checks |

### 2.5 Payments & Commerce

| Endpoint | Method | Purpose | Wire To |
|----------|--------|---------|---------|
| `/api/stripe/checkout` | POST | Create Stripe checkout session | Upgrade/buy buttons |
| `/api/payments/wallet/:agentId` | GET | Agent wallet balance | Admin wallet view |
| `/api/billing/gate` | GET | Billing gate check | Pre-deploy quota check |

### 2.6 Voice

| Endpoint | Method | Purpose | Wire To |
|----------|--------|---------|---------|
| `/api/voice/tts` | POST | Text-to-speech generation | Chat TTS button |
| `/api/voice/voices` | GET | Available voice list | Voice selector dropdown |
| `/api/tts` | POST | ElevenLabs TTS shortcut | Quick TTS |

### 2.7 Workflows & Automations

| Endpoint | Method | Purpose | Wire To |
|----------|--------|---------|---------|
| `/api/composio` | GET | List available tools | Automations page |
| `/api/composio` | POST | Execute workflow action | Automation run button |

### 2.8 Gateway System (SDT, Evidence Locker, Certification)

| Endpoint | Method | Purpose | Wire To |
|----------|--------|---------|---------|
| `/api/evidence-locker` | GET | List artifacts | Evidence Locker page |
| `/api/evidence-locker` | POST | Upload/seal/log/gate/attestation | Evidence Locker actions |
| (UEF) `/gateway/sdt/issue` | POST | Issue Secure Drop Token | SDT Management page |
| (UEF) `/gateway/sdt/revoke` | POST | Revoke SDT | SDT revoke button |
| (UEF) `/gateway/sdt/validate` | POST | Validate SDT | SDT verify page |
| (UEF) `/gateway/certification/submit` | POST | Submit plug for certification | Cert gate in Plug detail |
| (UEF) `/gateway/certification/:plugId` | GET | Cert status | Plug detail status badge |

### 2.9 Admin & Operations

| Endpoint | Method | Purpose | Wire To |
|----------|--------|---------|---------|
| `/api/admin/api-keys` | GET/POST | Manage API keys | Admin API Keys page |
| `/api/admin/chicken-hawk` | GET | Chicken Hawk status | Admin agent page |
| `/api/admin/lil-hawks` | GET | List Lil_Hawks | Admin hawk management |
| `/api/health` | GET | System health check | Dashboard health indicator |
| (UEF) `/factory/status` | GET | Factory controller status | Operations page |
| (UEF) `/factory/runs` | GET | FDH active runs | Operations run tracker |
| (UEF) `/factory/runs/:id/approve` | POST | Approve human-in-loop run | Approval modal |
| (UEF) `/factory/chambers` | GET | List chambers | Operations chamber view |
| (UEF) `/agents` | GET | List all agents | Circuit Box agent list |

### 2.10 Content & Video

| Endpoint | Method | Purpose | Wire To |
|----------|--------|---------|---------|
| (UEF) `/api/video/generate` | POST | Video generation | Content pipeline |
| (UEF) `/api/video/models` | GET | Available video models | Model selector |
| (UEF) `/api/content/pipeline` | POST | Launch content pipeline | Content creation page |
| (UEF) `/api/content/pipelines` | GET | List user pipelines | Content history |

### 2.11 Per|Form (Sports Analytics)

| Endpoint | Method | Purpose | Wire To |
|----------|--------|---------|---------|
| `/api/perform/prospects` | GET | List prospects | Big Board, Hub |
| `/api/perform/teams` | GET | List teams | War Room, Draft |
| `/api/perform/stats` | GET | Player stats | Prospect detail |
| `/api/perform/search` | POST | Search players | Search bar |
| `/api/perform/draft/simulate` | POST | Simulate draft | Draft simulator |
| `/api/perform/transfer-portal` | GET | Transfer portal | Portal page |

### 2.12 Research & Memory

| Endpoint | Method | Purpose | Wire To |
|----------|--------|---------|---------|
| `/api/research` | POST | Research dispatch | Research page |
| (UEF) `/memory/remember` | POST | Store memory | Auto-triggered by chat |
| (UEF) `/memory/recall` | POST | Retrieve memories | Chat context injection |

### 2.13 Make It Mine (DIY Builder)

| Endpoint | Method | Purpose | Wire To |
|----------|--------|---------|---------|
| `/api/make-it-mine` | GET/POST | Status + generate | Make It Mine hub |
| `/api/make-it-mine/generate` | POST | Generate scaffold | Web app builder |
| `/api/make-it-mine/generate-mobile` | POST | Generate mobile app | Mobile builder |
| `/api/make-it-mine/generate-automation` | POST | Generate automation | Automation builder |

### 2.14 Other

| Endpoint | Method | Purpose | Wire To |
|----------|--------|---------|---------|
| `/api/forms` | GET | List forms | Forms page |
| `/api/projects` | GET/POST | Projects CRUD | Project management |
| `/api/integrations` | GET/POST | Integrations | Settings integrations tab |
| `/api/invite` | POST | Invite users | Team management |
| `/api/custom-hawks` | GET/POST | Custom Lil_Hawks | Custom Hawks page |

---

## 3. PAGE-BY-PAGE SPECIFICATION

### 3.0 Architecture Map

```
app/
├── page.tsx                          ← LANDING (public, marketing)
├── (auth)/                           ← AUTH FLOW
│   ├── sign-in/page.tsx
│   ├── sign-up/page.tsx
│   ├── forgot-password/page.tsx
│   └── reset-password/page.tsx
├── onboarding/                       ← ONBOARDING (post-signup)
│   ├── page.tsx
│   └── [step]/page.tsx
├── chat/page.tsx                     ← CHAT W/ ACHEEVY (main entry)
├── dashboard/                        ← DASHBOARD SHELL (sidebar + top nav)
│   ├── page.tsx                      ← Dashboard Home
│   ├── chat/page.tsx                 ← Chat (within dashboard)
│   ├── plug-catalog/page.tsx         ← Plug Marketplace
│   ├── plugs/page.tsx                ← My Deployed Plugs
│   ├── plugs/[id]/page.tsx           ← Plug Instance Detail
│   ├── build/page.tsx                ← Deployment Hangar (n8n workflows)
│   ├── luc/page.tsx                  ← LUC Billing Dashboard
│   ├── luc/calculator/page.tsx       ← LUC Calculator
│   ├── settings/page.tsx             ← Settings
│   ├── operations/page.tsx           ← Operations Feed
│   ├── admin/page.tsx                ← Admin Hub
│   │   ├── chicken-hawk/page.tsx
│   │   ├── lil-hawks/page.tsx
│   │   └── ii-agent/page.tsx
│   ├── make-it-mine/page.tsx         ← Builder Hub
│   │   ├── web-app/page.tsx
│   │   ├── mobile-app/page.tsx
│   │   ├── diy/page.tsx
│   │   └── automation/page.tsx
│   ├── model-garden/page.tsx         ← AI Model Selector
│   ├── research/page.tsx             ← Research Hub
│   ├── needs-analysis/page.tsx       ← Business Needs → Plug Match
│   ├── automations/page.tsx          ← Workflow Automations
│   ├── deep-scout/page.tsx           ← Deep Research Engine
│   ├── ntntn-studio/page.tsx         ← Creative Build Studio
│   ├── circuit-box/page.tsx          ← Agent Control Center
│   ├── project-management/page.tsx   ← Project Tracker
│   ├── house-of-ang/page.tsx         ← Boomer_Ang Directory
│   ├── deploy-dock/page.tsx          ← Deployment Manager
│   ├── security/page.tsx             ← Security Dashboard
│   └── [specialty pages]             ← See Section 3.10
├── perform/                          ← PER|FORM VERTICAL (sports analytics)
├── halalhub/                         ← HALALHUB VERTICAL (marketplace)
├── workshop/                         ← WORKSHOP VERTICAL (creative tools)
├── arena/                            ← ARENA VERTICAL (contests)
├── pricing/page.tsx                  ← PRICING PAGE
├── about/page.tsx                    ← ABOUT PAGE
├── privacy/page.tsx                  ← PRIVACY POLICY
└── terms/page.tsx                    ← TERMS OF SERVICE
```

---

### 3.1 LANDING PAGE — `app/page.tsx`

**Archetype**: `aims-landing-ui` + `aims-animated-web`
**Status**: Polished (781 lines) — MAINTAIN, don't rebuild

**Current structure (keep):**
1. Sticky nav with blur on scroll
2. Hero with gradient text, status badge, dual CTAs
3. "How It Works" — 3-step glass cards
4. "What You Can Deploy" — category grid
5. "Built for Production" — 3x2 capability grid
6. Testimonials
7. Final CTA
8. Scroll progress bar

**Backend wiring:**
- `/api/health` → live system status badge in hero ("Systems Online")

**Required fixes:**
- [ ] Wire health status to real API (currently may be static)
- [ ] CTA buttons → `/chat` (primary), `/pricing` (secondary)
- [ ] Testimonials → replace mock with real or remove section

---

### 3.2 AUTH FLOW — `app/(auth)/`

**Archetype**: `aims-auth-onboarding-ui`
**Status**: Functional — POLISH

**Pages:**
- `sign-in/page.tsx` — Email/password + OAuth (Google, Discord, GitHub)
- `sign-up/page.tsx` — Registration form
- `forgot-password/page.tsx` — Password reset request
- `reset-password/page.tsx` — Complete reset with token

**Backend wiring:**
```
POST /api/auth/register        → sign-up form submit
POST /api/auth/[...nextauth]   → sign-in + OAuth
POST /api/auth/forgot-password → forgot password submit
POST /api/auth/reset-password  → reset form submit
POST /api/auth/demo-session    → "Try Demo" button
```

**Layout:**
- Full-viewport dark background with subtle grid overlay
- Centered glass card (360-420px desktop, full-width-minus-padding mobile)
- A.I.M.S. logo at top
- Social auth buttons → email/password form → helper links
- Error states: inline validation, API error toasts
- Success: redirect to `/onboarding` (new users) or `/dashboard` (returning)

**Required work:**
- [ ] Ensure all OAuth providers actually work (check NextAuth config)
- [ ] Demo mode button → creates temp session, redirects to `/dashboard`
- [ ] Rate limiting on auth endpoints (show friendly error if rate-limited)
- [ ] Password requirements shown inline during sign-up

---

### 3.3 ONBOARDING — `app/onboarding/`

**Archetype**: `aims-auth-onboarding-ui`
**Status**: EXISTS but needs verification

**Flow (multi-step stepper):**
1. **Profile** — Name, company/project name, industry vertical
2. **Goals** — What do you want to build/manage? (checkboxes: Deploy apps, Automate workflows, Research & analysis, Manage clients, Build software)
3. **LUC Estimate** — Based on goals, show estimated monthly cost with plan recommendation
4. **Finish** — Flag `onboardingComplete`, redirect to `/chat`

**Backend wiring:**
```
POST /api/luc/estimate         → cost estimation based on selected goals
POST /api/luc { action: 'apply-preset' } → apply industry preset
PATCH /api/user/profile        → save profile info
```

**Layout:**
- Progress stepper (4 dots/steps) at top of glass card
- One decision per step — no overloaded forms
- Back/Next buttons at bottom
- Skip option (goes to chat, can finish later)

**Required work:**
- [ ] Build or verify the `[step]/page.tsx` dynamic routing
- [ ] Wire LUC estimation to real endpoint
- [ ] Store onboarding state (flag in user profile)
- [ ] Show dismissible "Complete onboarding" banner on dashboard if not done

---

### 3.4 CHAT WITH ACHEEVY — `app/chat/page.tsx`

**Archetype**: `aims-chat-ui`
**Status**: HIGHLY POLISHED (898 lines) — MAINTAIN

**Current features (keep):**
- Text mode (AI SDK `useChat` with SSE streaming)
- Voice mode (ElevenLabs Conversational AI Agent SDK)
- Threads sidebar (persistent history, localStorage)
- Model switcher (9 models)
- Voice selector dropdown
- TTS toggle with auto-play
- File attachments (images, PDFs, text, CSV, JSON, MD)
- Markdown rendering with syntax highlighting
- Voice frequency visualizer (canvas-based)

**Backend wiring:**
```
POST /api/chat                → text chat stream (SSE)
POST /api/voice/tts           → TTS generation
GET  /api/voice/voices        → voice list for selector
POST /api/acheevy/classify    → intent classification (route to skills)
```

**Required fixes:**
- [ ] Thread persistence → move from localStorage to API (backend needed)
- [ ] Wire intent classification to show contextual action buttons
- [ ] Onboarding gate banner if `onboardingComplete === false`
- [ ] Mobile keyboard handling (input doesn't get covered)
- [ ] File upload → actual processing (currently may just attach without analysis)

---

### 3.5 DASHBOARD HOME — `app/dashboard/page.tsx`

**Archetype**: `aims-command-center-ui`
**Status**: POLISHED (294 lines) — ENHANCE

**Current features (keep):**
- Health status indicator (API-driven)
- Onboarding alert (dismissible)
- Arsenal Shelf (carousel of active plugs)
- Quick Links grid (7 tiles)

**Backend wiring:**
```
GET /api/health               → system health status
GET /api/plug-instances       → running instances for Arsenal Shelf
GET /api/luc/status           → quota summary for LUC tile
```

**Required enhancements:**
- [ ] Arsenal Shelf → wire to real `/api/plug-instances` data
- [ ] Add mini quota bar below LUC tile (% used this cycle)
- [ ] Quick links should show notification badges (e.g., pending approvals count)
- [ ] Recent activity feed (last 5 actions from `/factory/runs`)

---

### 3.6 PLUG CATALOG — `app/dashboard/plug-catalog/page.tsx`

**Archetype**: `aims-command-center-ui`
**Status**: POLISHED (579 lines) — MAINTAIN

**Current features (keep):**
- Full-text search (name, tagline, tags)
- Category filter pills (11 categories)
- Stats bar (available, featured, categories, coming soon)
- Plug card grid with tier badges, resource specs
- Deploy state tracking (deploying → success → error → retry)
- Running instances panel with restart/stop/remove

**Backend wiring (already implemented):**
```
GET  /api/plug-catalog        → fetch plugs + categories
POST /api/plug-catalog        → spin up instance
GET  /api/plug-instances      → list running instances
POST /api/plug-instances      → manage (restart/stop/remove)
```

**Required fixes:**
- [ ] Add billing gate check before spin-up (`/api/luc/can-execute`)
- [ ] Show estimated LUC cost per plug before deploy
- [ ] Instance health polling (every 30s when instances panel open)
- [ ] Export button → `/api/plug-instances` with `action: 'export'`

---

### 3.7 LUC BILLING DASHBOARD — `app/dashboard/luc/page.tsx`

**Archetype**: `aims-finance-analytics-ui`
**Status**: PARTIAL — REBUILD

This is the **most critical missing UI**. Users need to see what they're paying for.

**Required layout:**

```
┌─────────────────────────────────────────────────────────┐
│ LUC Dashboard                              [Upgrade]    │
├──────────┬──────────┬──────────┬──────────┬─────────────┤
│ Plan     │ Credits  │ Used     │ Remaining│ Cycle Resets│
│ Starter  │ 10,000   │ 3,247    │ 6,753    │ in 14 days │
├──────────┴──────────┴──────────┴──────────┴─────────────┤
│                                                         │
│  [=============================·············] 32.5%     │
│  Overall usage this cycle                               │
│                                                         │
├─────────────────────────────────────────────────────────┤
│ Usage by Service              │ Usage Over Time          │
│ ┌───────────────────────┐     │ ┌───────────────────┐   │
│ │ Chat          1,200 ▓▓│     │ │    ╱╲             │   │
│ │ Deploy          847 ▓ │     │ │   ╱  ╲   ╱╲      │   │
│ │ Voice           523 ▓ │     │ │  ╱    ╲_╱  ╲     │   │
│ │ Research        412 ▓ │     │ │ ╱           ╲    │   │
│ │ Build           265 ░ │     │ │╱             ╲   │   │
│ └───────────────────────┘     │ └───────────────────┘   │
│                               │ [7d] [30d] [90d]        │
├─────────────────────────────────────────────────────────┤
│ Recent Transactions                          [Export]    │
│ ┌──────────┬─────────┬────────┬──────────────────────┐  │
│ │ Time     │ Service │ Amount │ Description            │  │
│ │ 2m ago   │ Chat    │ -12    │ Claude Opus 4.6 query  │  │
│ │ 15m ago  │ Deploy  │ -100   │ Spin up: n8n instance  │  │
│ │ 1h ago   │ Voice   │ -25    │ TTS: 450 chars         │  │
│ └──────────┴─────────┴────────┴──────────────────────┘  │
├─────────────────────────────────────────────────────────┤
│ Plans                                                    │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐    │
│ │ Free     │ │ Starter  │ │ Pro      │ │ Enterprise│    │
│ │ 500/mo   │ │ 10K/mo   │ │ 50K/mo   │ │ Custom    │    │
│ │ $0       │ │ $29/mo   │ │ $99/mo   │ │ Contact   │    │
│ │ [Current]│ │ [Upgrade]│ │ [Upgrade]│ │ [Contact] │    │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘    │
└─────────────────────────────────────────────────────────┘
```

**Backend wiring:**
```
GET  /api/luc/status          → plan, quota, remaining, cycle reset date
GET  /api/luc/usage           → usage breakdown by service + time series
GET  /api/luc/billing         → billing summary, invoices
POST /api/luc { action: 'get-history' } → transaction history
POST /api/luc { action: 'get-stats' }  → usage statistics
POST /api/luc { action: 'export' }     → export usage data (CSV/JSON)
POST /api/stripe/checkout     → plan upgrade (Stripe checkout session)
```

**Components needed:**
- `QuotaBar` — reusable progress bar showing % used (use in dashboard too)
- `UsageChart` — time-series chart (use recharts or lightweight charting lib)
- `ServiceBreakdown` — horizontal bar chart by service
- `TransactionTable` — sortable, filterable transaction list
- `PlanCard` — plan comparison cards with upgrade CTAs

**Required work:**
- [ ] Full rebuild wired to real LUC endpoints
- [ ] Quota bar component (reuse across dashboard)
- [ ] Usage chart with date range selector
- [ ] Transaction history with pagination
- [ ] Plan comparison cards
- [ ] Upgrade flow → Stripe checkout
- [ ] Export button (CSV/JSON)
- [ ] Threshold warnings (80% = amber bar, 95% = red bar + alert)

---

### 3.8 SETTINGS — `app/dashboard/settings/page.tsx`

**Archetype**: `aims-command-center-ui`
**Status**: FUNCTIONAL (325 lines) — WIRE TO BACKEND

**Current features (client-side only, need backend wiring):**
- Workspace Identity (name, industry, timezone)
- Security (2FA toggle, session timeout)
- API Keys display
- Notification toggles
- Danger Zone (delete workspace)

**Backend wiring:**
```
GET  /api/integrations         → connected accounts list
POST /api/integrations         → connect new integration
GET  /api/admin/api-keys       → list API keys
POST /api/admin/api-keys       → create new key
DELETE /api/admin/api-keys/:id → revoke key
PATCH /api/user/profile        → update workspace settings
```

**Required work:**
- [ ] Move from localStorage to real API persistence
- [ ] API key management: generate, copy, revoke (real keys)
- [ ] Integration status indicators (connected/disconnected)
- [ ] 2FA setup flow (QR code, verify code)
- [ ] Team management tab (invite, roles, remove members)

---

### 3.9 CRITICAL MISSING PAGES — BUILD THESE

#### 3.9.1 BILLING PAGE — `app/dashboard/billing/page.tsx` (NEW)

**Archetype**: `aims-finance-analytics-ui`

Separate from LUC dashboard. This is the payment/subscription management page.

**Layout:**
- Current plan card (plan name, price, renewal date)
- Payment method (card on file, update button)
- Invoice history (date, amount, status, download PDF)
- Usage summary (this billing period)

**Backend wiring:**
```
POST /api/stripe/checkout     → create checkout session for upgrade
GET  /api/luc/billing         → billing info, invoices
```

#### 3.9.2 EVIDENCE LOCKER — `app/dashboard/evidence-locker/page.tsx` (NEW)

**Archetype**: `aims-command-center-ui`

Gateway System artifact browser with chain-of-custody tracking.

**Layout:**
- Search/filter bar (by deployment, type, date range)
- Artifact grid/list (file name, type, SHA-256 hash, upload date, custody chain)
- Artifact detail slide-over (full metadata, download, verify integrity)
- Seal/unseal controls

**Backend wiring:**
```
GET  /api/evidence-locker              → list artifacts
POST /api/evidence-locker { action: 'upload' }  → upload artifact
POST /api/evidence-locker { action: 'verify' }  → verify integrity
POST /api/evidence-locker { action: 'seal' }    → seal locker
POST /api/evidence-locker { action: 'log' }     → add custody log
```

#### 3.9.3 SDT MANAGEMENT — `app/dashboard/security/sdt/page.tsx` (NEW)

**Archetype**: `aims-command-center-ui`

Secure Drop Token lifecycle management.

**Layout:**
- Active tokens list (token ID, issued to, resource, expiry, status)
- Issue new token form (agent, resource, TTL)
- Revoke button with confirmation modal
- Validate token input

**Backend wiring (via UEF Gateway proxy):**
```
POST /api/gateway/sdt/issue    → issue token
POST /api/gateway/sdt/revoke   → revoke token
POST /api/gateway/sdt/validate → validate token
```

#### 3.9.4 OPERATIONS FEED — `app/dashboard/operations/page.tsx` (ENHANCE)

**Archetype**: `aims-command-center-ui`

Live operations view — what ACHEEVY and agents are doing right now.

**Layout:**
- Live feed (streaming events: deploy, health check, build, approval request)
- Active runs panel (FDH runs with approve/reject/pause buttons)
- Chamber status (active build chambers)
- Factory status indicator

**Backend wiring:**
```
GET  /factory/status           → factory controller status
GET  /factory/runs             → active FDH runs
POST /factory/runs/:id/approve → approve run
POST /factory/runs/:id/reject  → reject run
POST /factory/runs/:id/pause   → pause run
GET  /factory/chambers         → list chambers
```

#### 3.9.5 PRICING PAGE — `app/pricing/page.tsx` (ENHANCE)

**Archetype**: `aims-landing-ui` + `aims-animated-web`

Public pricing page (accessible without login).

**Layout:**
- 4 plan cards (Free, Starter, Pro, Enterprise)
- Feature comparison table
- FAQ accordion
- "Start Free" CTA → `/sign-up`

**Backend wiring:**
```
POST /api/luc { action: 'get-services' } → service list with per-unit costs
```

---

### 3.10 EXISTING PAGES — STATUS & REQUIRED WORK

#### FUNCTIONAL — Wire to Backend

| Page | Path | Status | Required Work |
|------|------|--------|---------------|
| Build/Deploy Hangar | `/dashboard/build` | Polished | Verify n8n health check wiring |
| Plugs Manager | `/dashboard/plugs` | Polished | Wire pipeline stages to real API |
| Model Garden | `/dashboard/model-garden` | Polished | Read-only catalog, OK as-is |
| Make It Mine Hub | `/dashboard/make-it-mine` | Functional | Wire sub-builders to real endpoints |
| Deep Scout | `/dashboard/deep-scout` | Functional | Wire to `/api/acheevy/idea-validation` |
| Automations | `/dashboard/automations` | Functional | Wire to Composio API |
| Research Hub | `/dashboard/research` | Functional | Wire sub-pages to research API |
| Needs Analysis | `/dashboard/needs-analysis` | Functional | Wire to plug-catalog needs endpoints |
| NtNtN Studio | `/dashboard/ntntn-studio` | Functional | Wire to Make It Mine generate |

#### PARTIAL — Need Significant Work

| Page | Path | Status | Required Work |
|------|------|--------|---------------|
| Circuit Box | `/dashboard/circuit-box` | Partial | Wire to `/agents` endpoint, show live status |
| Admin Hub | `/dashboard/admin` | Partial | Wire all 3 sub-pages to real endpoints |
| Project Management | `/dashboard/project-management` | Partial | Wire to `/api/projects`, add CRUD |
| House of Ang | `/dashboard/house-of-ang` | Partial | Wire to Boomer_Ang registry |
| Deploy Dock | `/dashboard/deploy-dock` | Partial | Wire to plug instances lifecycle |
| Security | `/dashboard/security` | Partial | Add SDT sub-page, wire 2FA |
| Custom Hawks | `/dashboard/custom-hawks` | Partial | Wire to `/api/custom-hawks` CRUD |
| War Room | `/dashboard/war-room` | Partial | Wire to Per|Form war room proxy |

#### SPECIALTY — Lower Priority

| Page | Path | Priority | Notes |
|------|------|----------|-------|
| Per|Form Hub | `/perform` | Medium | Sports analytics vertical, 14+ sub-pages |
| HalalHub | `/halalhub` | Low | Marketplace vertical |
| Workshop | `/workshop` | Low | Creative tools vertical |
| Arena | `/arena` | Low | Contests/leaderboard vertical |
| About | `/about` | Low | Static content |
| Gallery | `/gallery` | Low | Showcase |
| Showroom | `/showroom` | Low | Demo viewer |

---

## 4. NAVIGATION & SHELL

### 4.1 Dashboard Shell (`DashboardShell` component)

**Persistent elements:**
- **Sidebar** (left, collapsible):
  ```
  ┌────────────────────┐
  │ A.I.M.S. Logo      │
  ├────────────────────┤
  │ 🏠 Home            │  → /dashboard
  │ 💬 Chat            │  → /dashboard/chat
  │ 🔌 Plug Catalog    │  → /dashboard/plug-catalog
  │ 📦 My Plugs        │  → /dashboard/plugs
  │ 🔨 Build           │  → /dashboard/build
  │ 🔧 Make It Mine    │  → /dashboard/make-it-mine
  ├────────────────────┤
  │ 📊 LUC / Billing   │  → /dashboard/luc
  │ 🔬 Research        │  → /dashboard/research
  │ ⚡ Automations     │  → /dashboard/automations
  │ 📋 Projects        │  → /dashboard/project-management
  ├────────────────────┤  (PRIVATE mode only ↓)
  │ 🎛️ Circuit Box     │  → /dashboard/circuit-box
  │ 🏭 Operations      │  → /dashboard/operations
  │ 🔐 Security        │  → /dashboard/security
  │ 👑 Admin           │  → /dashboard/admin
  ├────────────────────┤
  │ ⚙️ Settings        │  → /dashboard/settings
  └────────────────────┘
  ```

- **Top bar**: Breadcrumb + QuickSwitcher (Cmd+K) + User avatar + Notifications
- **Floating ACHEEVY**: Persistent chat FAB (bottom-right) → opens mini chat
- **QuickSwitcher**: Cmd+K command palette for fast navigation

**Mobile**: Sidebar becomes hamburger drawer. Top bar stays. FAB stays.

### 4.2 Public Pages (no sidebar)

Landing, pricing, about, privacy, terms — use `SiteHeader` component:
```
┌─────────────────────────────────────────────┐
│ Logo    Product  Pricing  About    [Sign In] │
└─────────────────────────────────────────────┘
```

### 4.3 Vertical Layouts

Per|Form, HalalHub, Workshop, Arena each have their own sub-navigation:
- Sticky horizontal tab bar below SiteHeader
- Vertical-specific branding (Per|Form = emerald, HalalHub = emerald/gold, etc.)

---

## 5. SHARED COMPONENTS TO BUILD

### 5.1 Data Display

| Component | Usage | Priority |
|-----------|-------|----------|
| `QuotaBar` | LUC usage progress (dashboard, LUC page, pre-deploy check) | Critical |
| `DataTable` | Transactions, artifacts, API keys, instances, history | Critical |
| `StatCard` | KPI display (number, label, trend arrow, sparkline) | Critical |
| `StatusBadge` | online/offline/degraded/pending/building/error | Critical |
| `EmptyState` | "No data yet" with illustration + CTA | High |

### 5.2 Inputs & Forms

| Component | Usage | Priority |
|-----------|-------|----------|
| `SearchInput` | Catalog search, research, project search | High |
| `FilterBar` | Category pills, status filters, date range | High |
| `StepperForm` | Onboarding, needs analysis, deployment wizard | High |
| `ConfirmModal` | Destructive actions (delete, stop, revoke) | High |

### 5.3 Feedback

| Component | Usage | Priority |
|-----------|-------|----------|
| `Toast` | Success/error notifications | Critical |
| `LoadingSkeleton` | Page loading states (match card layout) | High |
| `ProgressTracker` | Multi-step operations (deploy, build, export) | High |
| `HealthPulse` | Animated dot (green=healthy, amber=degraded, red=down) | High |

### 5.4 Layout

| Component | Usage | Priority |
|-----------|-------|----------|
| `PageHeader` | Consistent page title + description + actions | Critical |
| `SlideOver` | Detail panels (plug detail, artifact detail, settings) | High |
| `TabGroup` | Multi-tab layouts (build page, settings, admin) | High |

---

## 6. STATE MANAGEMENT

### 6.1 Server State (React Query / SWR)

Use `useSWR` or React Query for all API data:

```typescript
// Example: Plug instances with auto-refresh
const { data: instances, mutate } = useSWR('/api/plug-instances', fetcher, {
  refreshInterval: 30000, // 30s polling for health
});

// Example: LUC status
const { data: lucStatus } = useSWR('/api/luc/status', fetcher);
```

**Polling intervals:**
- Health status: 30s
- Instance list: 30s
- LUC quota: 60s
- Operations feed: 10s (when page is active)
- Chat threads: no polling (SSE stream)

### 6.2 Client State

- **Auth**: NextAuth session (`useSession()`)
- **Platform mode**: `usePlatformMode()` context
- **Sidebar state**: localStorage + context
- **Chat threads**: localStorage (migrate to API later)
- **UI preferences**: localStorage (theme, sidebar collapsed, notification settings)

### 6.3 URL State

- Search/filter params: URL search params (`useSearchParams`)
- Active tab: URL search params
- Pagination: URL search params
- Modal/slide-over open state: URL hash or search params

---

## 7. ERROR HANDLING

### 7.1 API Error Pattern

```typescript
// Standard error response shape
interface APIError {
  error: string;
  code: string;
  details?: Record<string, unknown>;
}

// Frontend handler
async function apiCall(url: string, options?: RequestInit) {
  const res = await fetch(url, options);
  if (!res.ok) {
    const err = await res.json();
    if (res.status === 402) {
      // Quota exceeded → show upgrade modal
      showQuotaExceededModal(err);
    } else if (res.status === 403) {
      // Forbidden → show role required
      showAccessDeniedToast(err);
    } else {
      showErrorToast(err.error || 'Something went wrong');
    }
    throw new Error(err.error);
  }
  return res.json();
}
```

### 7.2 Error Boundaries

- Wrap each dashboard page in an error boundary
- Show "Something went wrong" card with retry button
- Log error to console (NOT to external service without permission)

### 7.3 Loading States

Every page must have a loading skeleton that matches its layout:
- Cards → card-shaped skeletons with shimmer
- Tables → row skeletons
- Charts → chart-area skeleton
- Text → line skeletons of varying width

---

## 8. BUILD & DEPLOY VERIFICATION

### 8.1 Pre-Commit Checks

```bash
cd frontend && npm run build   # Must pass — no build errors
```

### 8.2 Quality Gates

- [ ] All pages render without console errors
- [ ] No hardcoded mock data in production pages (gated behind `DEMO_MODE` if needed)
- [ ] All API calls use real endpoints (no `setTimeout` faking responses)
- [ ] Mobile responsive (test at 375px width)
- [ ] `prefers-reduced-motion` respected on all animations
- [ ] No agent names exposed in PUBLIC mode
- [ ] No magic animation numbers (all from tokens)
- [ ] Glass card pattern consistent across all pages
- [ ] Error states handled for every API call
- [ ] Loading skeletons for every data-dependent section

---

## 9. IMPLEMENTATION PRIORITY

### Phase 1 — Core Revenue Path (CRITICAL)
1. **LUC Billing Dashboard** — full rebuild with real API wiring
2. **QuotaBar component** — reusable, show on dashboard + pre-deploy
3. **Billing Page** — payment management, plan upgrade via Stripe
4. **Onboarding Flow** — verified, wired, functional
5. **Settings** — migrated from localStorage to real API

### Phase 2 — Platform Trust (HIGH)
6. **Evidence Locker** — new page, full CRUD
7. **SDT Management** — new page under security
8. **Operations Feed** — enhance with real factory/runs API
9. **Circuit Box** — wire to real agent status API
10. **Admin Pages** — wire all 3 sub-pages to real endpoints

### Phase 3 — Builder Experience (MEDIUM)
11. **Make It Mine** — wire all sub-builders to generate endpoints
12. **Deep Scout** — wire to idea validation flow
13. **NtNtN Studio** — wire to creative pipeline
14. **Automations** — wire to Composio
15. **Project Management** — wire CRUD to projects API

### Phase 4 — Verticals & Polish (LOWER)
16. **Per|Form** — replace mock data with real API calls
17. **Pricing Page** — polish with real plan data
18. **HalalHub** — wire to marketplace backend
19. **Workshop** — wire to creative tools
20. **Arena** — wire to contest engine

---

## 10. FILE CONVENTIONS

### 10.1 Page Structure

```typescript
// Every page.tsx follows this pattern:
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import useSWR from 'swr';
import { usePlatformMode } from '@/lib/platform-mode';
import { t } from '@/lib/terminology';
import { staggerContainer, staggerItem } from '@/lib/motion/variants';

export default function PageName() {
  const { mode } = usePlatformMode();
  const { data, error, isLoading } = useSWR('/api/endpoint', fetcher);

  if (isLoading) return <PageSkeleton />;
  if (error) return <ErrorState onRetry={() => mutate()} />;

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="p-6 max-w-7xl mx-auto space-y-6"
    >
      <PageHeader
        title={t('pageKey', mode)}
        description="Description text"
        actions={<Button>Primary Action</Button>}
      />
      {/* Page content */}
    </motion.div>
  );
}
```

### 10.2 API Route Structure

```typescript
// Every API route follows this pattern:
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Call UEF Gateway
    const res = await fetch(`${process.env.UEF_GATEWAY_URL}/endpoint`, {
      headers: { 'x-api-key': process.env.UEF_API_KEY! },
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
  }
}
```

### 10.3 Component Naming

- Pages: `PascalCase` function, file at `page.tsx`
- Components: `PascalCase.tsx` in `components/`
- Hooks: `useCamelCase.ts` in `hooks/`
- Utils: `camelCase.ts` in `lib/`
- Types: `PascalCase` interfaces in `types/` or co-located

---

## 11. HARD RULES (NEVER VIOLATE)

1. **No mock data** — All data from real API endpoints or gated behind `DEMO_MODE`
2. **No magic animation numbers** — Import from `@/lib/motion/tokens`
3. **No agent names in PUBLIC mode** — Only "ACHEEVY" and "your AI team"
4. **No Vercel/Netlify code paths** — VPS Docker only
5. **No MIT/Apache/GPL headers** — Proprietary software
6. **No dark mode toggle** — Dark theme is the default (light only for Per|Form vertical)
7. **Mobile-first** — Every page must work at 375px
8. **Glass card consistency** — Same border, radius, blur pattern everywhere
9. **Build must pass** — `cd frontend && npm run build` before any PR
10. **Reduced motion** — Every animation must respect `prefers-reduced-motion`
11. **Auth on every API** — Check session before any data fetch
12. **Error states everywhere** — Never show a blank page on API failure
