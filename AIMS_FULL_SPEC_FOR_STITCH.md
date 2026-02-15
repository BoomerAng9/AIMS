# A.I.M.S. — Complete Codebase Specification for UI Design

> **Purpose**: Feed this document to Stitch (or any design AI) to recreate the entire A.I.M.S. UI.
> **Generated**: 2026-02-14
> **Domain**: plugmein.cloud (landing) | aimanagedsolutions.cloud (app)

---

## PART 1: FRONTEND ARCHITECTURE

### Executive Summary

**A.I.M.S.** (AI Managed Solutions) is a Next.js 14 full-stack application featuring ACHEEVY, an AI orchestrator managing 25+ agents across 8 PMO offices. The platform integrates voice I/O, real-time streaming chat, deployment automation, and usage metering (LUC) under a 3-6-9 Tesla-inspired pricing model.

**Tech Stack:**
- Frontend: Next.js 14 (App Router)
- Auth: NextAuth.js 4.24 (OAuth + Credentials)
- Styling: Tailwind CSS 3.3 + custom Circuit Box design system
- State: Zustand 4.5.5, React Context
- APIs: Vercel AI SDK, OpenRouter, Stripe, Deepgram, ElevenLabs
- Database: Prisma 5.22 + SQLite
- Hosting: Docker (standalone output)

---

## 1. APP ROUTER STRUCTURE

### Root Level

**File:** `frontend/app/layout.tsx`
- Global layout with Providers wrapper
- Local fonts: Doto, Permanent Marker, Caveat, Patrick Hand, Nabla
- Metadata: title "A.I.M.S. | AI Managed Solutions", OpenGraph, Twitter cards
- Background: dark ink theme (#050505) with texture and vignette overlays
- Root classes: antialiased, selection:bg-gold/30

### Authentication Routes (Group: `(auth)`)

**Location:** `frontend/app/(auth)/`

#### Auth Layout
- Three-column grid layout: ACHEEVY office image | form | Remotion video
- Left column (hidden on mobile): ACHEEVY office image with gold accents
- Center column: wireframe-card (dark glass) with overflow scroll
- Right column: AuthWelcomePlayer (dynamic, SSR disabled)
- Full-height screen with logo wall background

#### Pages
- **sign-in/page.tsx** — OAuth providers (Google, Discord), email/password form, ACHEEVY helmet image with glow pulse
- **sign-up/page.tsx** — New user registration, email verification
- **forgot-password/page.tsx** — Password recovery

### Public Routes

| Route | Purpose |
|-------|---------|
| `/` | Landing page (Hero + Footer + FloatingChat) |
| `/about` | About AIMS |
| `/pricing` | 3-6-9 pricing tiers |
| `/gallery` | Showcase/portfolio |
| `/merch` | Merchandise store |
| `/the-book-of-vibe` | Lore/brand book |
| `/plugs` | Public plugs catalog |
| `/plugs/[plugId]` | Individual plug detail |
| `/workshop` | Creator learning hub |
| `/workshop/creator-circles` | Community circles |
| `/workshop/life-scenes` | Life/scene tutorials |
| `/workshop/moment-studio` | Studio tools |
| `/workshop/money-moves` | Monetization guide |
| `/hangar` | Asset/resource hub |
| `/showroom` | Product showcase |
| `/discover` | Discovery interface |
| `/new` | New user landing |
| `/integrations` | Available integrations |

### Dashboard Routes

**Layout:** `frontend/app/dashboard/layout.tsx`
- Force dynamic rendering
- DashboardShell wrapper (nav + sidebar + content)
- Persistent: FloatingACHEEVY, QuickSwitcher
- Auth enforced at ACTION level, not page load

**Dashboard Root (`page.tsx`):**
- Health status indicator (healthy/degraded/unhealthy)
- Onboarding alert (dismissible, localStorage)
- Arsenal Shelf carousel (deployed plugs)
- Tool grid (7 tiles): Chat, Chicken Hawk (build), AVVA NOON (reasoning), Boomer_Angs, Deployed Tools, LUC, Settings

#### Dashboard Subsections

| Route | Purpose |
|-------|---------|
| `/dashboard/acheevy` | Primary ACHEEVY chat interface |
| `/dashboard/chat` | Secondary chat interface |
| `/dashboard/build` | Plugin/tool builder (Chicken Hawk) |
| `/dashboard/circuit-box` | Tabbed control center (plan, luc, settings, boomerangs) |
| `/dashboard/deploy-dock` | Deployment orchestration |
| `/dashboard/plugs` | Manage deployed tools |
| `/dashboard/plugs/[id]` | Individual plug detail/config |
| `/dashboard/luc` | Usage/cost tracking |
| `/dashboard/boomerangs` | Agent team management |
| `/dashboard/lab` | Experimental features |
| `/dashboard/house-of-ang` | Ang integration dashboard |
| `/dashboard/make-it-mine` | DIY customization |
| `/dashboard/make-it-mine/diy` | DIY detailed interface |
| `/dashboard/research` | Research tools hub |
| `/dashboard/research/codebase-sync` | Sync external codebases |
| `/dashboard/research/activity-feed` | Activity logs |
| `/dashboard/research/connected-accounts` | OAuth integrations |
| `/dashboard/research/google-ecosystem` | Google services integration |
| `/dashboard/research/notebook-lm` | Notebook LM integration |
| `/dashboard/research/protocols` | Research protocols |
| `/dashboard/research/revenue-platform` | Revenue tracking |
| `/dashboard/operations` | Operational oversight |
| `/dashboard/environments` | Environment management |
| `/dashboard/security` | Security settings |
| `/dashboard/settings` | General settings |
| `/dashboard/admin` | Admin console (OWNER only) |
| `/dashboard/project-management` | Project tracking |
| `/dashboard/model-garden` | Available LLM models |
| `/dashboard/gates` | Access control |
| `/dashboard/your-space` | User personal space |
| `/dashboard/war-room` | War room/crisis mode |
| `/dashboard/workstreams` | Workstream management |
| `/dashboard/the-hangar` | Asset management |
| `/dashboard/veritas` | Truth/verification system |
| `/dashboard/editors-desk` | Content editing |
| `/dashboard/blockwise` | Block-based workflows |
| `/dashboard/boost-bridge` | Integration bridge |
| `/dashboard/sports-tracker` | Sports/fitness tracking |
| `/dashboard/nil` | Nil/empty state |

### Onboarding Routes
- `/onboarding` — Entry
- `/onboarding/[step]` — Step-by-step flow
- Layout: LogoWallBackground with auth-glass-card

---

## 2. API ROUTES

### Authentication
| Route | Method | Purpose |
|-------|--------|---------|
| `/api/auth/[...nextauth]` | GET, POST | NextAuth handler |
| `/api/auth/demo-session` | POST | Demo mode session |
| `/api/auth/register` | POST | User registration |

### ACHEEVY & Chat
| Route | Method | Purpose |
|-------|--------|---------|
| `/api/acheevy` | POST | Main ACHEEVY chat endpoint |
| `/api/acheevy/chat` | POST | Streaming chat |
| `/api/acheevy/diy` | POST | DIY mode (image + voice) |
| `/api/chat` | POST | Unified LLM gateway + agent dispatch |
| `/api/chat/classify` | POST | Intent classification |

### Voice
| Route | Method | Purpose |
|-------|--------|---------|
| `/api/transcribe` | POST | Speech-to-text (Groq/Deepgram) |
| `/api/tts` | POST | Text-to-speech batch |
| `/api/voice/stt` | POST | STT streaming |
| `/api/voice/tts` | POST | TTS streaming (ElevenLabs primary, Deepgram fallback) |
| `/api/voice/voices` | GET | List 15 available voices |

### Deployments & Plugins
| Route | Method | Purpose |
|-------|--------|---------|
| `/api/plugs` | GET, POST | List/create plugins |
| `/api/plugs/[plugId]` | GET, PUT, DELETE | Plugin CRUD |
| `/api/deploy` | POST | Deploy plugin |
| `/api/deploy-dock` | POST | Advanced deployment |
| `/api/templates` | GET | Plugin templates |

### Usage & Billing (LUC)
| Route | Method | Purpose |
|-------|--------|---------|
| `/api/luc` | GET | LUC summary |
| `/api/luc/status` | GET | Current tier and quotas |
| `/api/luc/usage` | GET | Usage history |
| `/api/luc/estimate` | POST | Cost estimation |
| `/api/luc/meter` | POST | Record usage event |
| `/api/luc/can-execute` | POST | Check execution permission |
| `/api/luc/billing` | GET, POST | Billing management |

### Stripe
| Route | Method | Purpose |
|-------|--------|---------|
| `/api/stripe/checkout` | POST | Create checkout session |
| `/api/stripe/subscription` | GET, POST, DELETE | Manage subscription |

### Integrations
| Route | Method | Purpose |
|-------|--------|---------|
| `/api/n8n` | GET, POST | n8n workflow bridge |
| `/api/n8n/webhook` | POST | n8n webhook receiver |
| `/api/discord/webhook` | POST | Discord webhook |
| `/api/telegram/webhook` | POST | Telegram webhook |
| `/api/whatsapp/webhook` | POST | WhatsApp webhook |
| `/api/social/feed` | GET | Social feed |
| `/api/social/github` | GET | GitHub integration |
| `/api/video/generate` | POST | Video generation |
| `/api/video/analyze` | POST | Video analysis |
| `/api/upload` | POST | File upload |
| `/api/health` | GET | System health |

---

## 3. COMPONENTS ARCHITECTURE

### Core Layout
| Component | Purpose |
|-----------|---------|
| **DashboardShell** | Main dashboard wrapper, navigation, sidebar |
| **DashboardNav** | Sidebar navigation menu |
| **GlobalNav** | Global header navigation |
| **SiteHeader** | Landing page header |
| **SiteFooter** | Landing page footer |
| **Providers** | NextAuth + DemoProvider wrapper |

### Chat Components
| Component | Purpose |
|-----------|---------|
| **AcheevyChat** | Full chat interface (voice, TTS, file upload, streaming) |
| **ChatInterface** | Chat message display and input |
| **ChatShell** | Chat container layout |
| **FloatingChat** | Floating chat widget |
| **ReadReceipt** | Message read/delivery status indicator |

### ACHEEVY & Agent Components
| Component | Purpose |
|-----------|---------|
| **AcheevyAgent** | ACHEEVY agent representation |
| **HeroAcheevy** | ACHEEVY hero section on landing |
| **FloatingACHEEVY** | Persistent floating ACHEEVY widget |
| **AgentLoopVisualizer** | Visual agent execution loop |
| **OrchestratorStatus** | Agent orchestration status |

### Dashboard Widgets
| Component | Purpose |
|-----------|---------|
| **ArsenalShelf** | Horizontal carousel of deployed plugs |
| **LucUsageWidget** | LUC balance, tier, usage breakdown |
| **CircuitBox** | Control center UI (tabs: plan, luc, settings) |
| **TechStack** | Technology stack display |
| **DynamicTagline** | Rotating/dynamic tagline |
| **MottoBar** | Motivational banner bar |

### Deployment & Operations
| Component | Purpose |
|-----------|---------|
| **ParticleLazer** | Particle effect for deploy UI |
| **LiveOpsTheater** | Live deployment monitoring |
| **DepartmentBoard** | PMO department visualization |
| **OperationsOverlay** | Operations status overlay |

### Auth Components
| Component | Purpose |
|-----------|---------|
| **AuthGate** | Enforce auth for actions (chat, deploy, build) |
| **AuthWelcomePlayer** | Remotion welcome video on auth layout |
| **OwnerGate** | Enforce OWNER role |

### UI Primitives
| Component | Purpose |
|-----------|---------|
| **Brand** | AIMS logo/wordmark |
| **CircuitBoard** | Circuit board pattern background |
| **LEDDisplay** | LED-style numeric display |
| **LogoWallBackground** | Logo wallpaper background |
| **MinimalSidebar** | Compact sidebar navigation |
| **QuickSwitcher** | Cmd+K quick navigation |
| **DemoBanner** | Demo mode notice banner |
| **StatusStrip** | Bottom status bar (health, version) |

---

## 4. TAILWIND DESIGN SYSTEM (Circuit Box)

### Color Palette

**Base Colors:**
```
black:     #000000
obsidian:  #0A0A0A  (darkest)
charcoal:  #111111
leather:   #1A1A1A
gunmetal:  #2A2A2A
ink:       #0B0E14  (Circuit Box main background)
```

**Brand Colors:**
```
gold:          #D4AF37  (AIMS Gold — authority, owner)
gold-light:    #E8D48A  (champagne)
gold-dark:     #B5952F
gold-dim:      rgba(212, 175, 55, 0.1)
champagne:     #F6C453
```

**Signal Colors (Status):**
```
cb-cyan:   #22D3EE  (live/streaming/routing)
cb-green:  #22C55E  (healthy/connected/on)
cb-amber:  #F59E0B  (warning/degraded)
cb-red:    #EF4444  (blocked/offline)
cb-fog:    #6B7280  (secondary text)
```

**Text:**
```
frosty-white: #EDEDED
muted:        #A1A1AA
```

**Wireframe System (translucent):**
```
wireframe.stroke: rgba(255,255,255,0.12)
wireframe.glow:   rgba(255,255,255,0.04)
wireframe.hover:  rgba(255,255,255,0.18)
```

### Typography

```
sans (default):  Inter
display:         Doto (monospace, headers/data)
doto:            Doto (explicit alias)
mono:            Doto
marker:          Permanent Marker (A.I.M.S. wordmark)
handwriting:     Caveat
```

### Spacing (8px Base Grid)
```
cb-xs:   8px
cb-sm:   16px
cb-md:   24px
cb-lg:   32px
cb-xl:   40px
cb-chip: 28px  (status chip height)
cb-row:  44px  (control row height)
```

### Shadow Effects
```
glass:            0 4px 30px rgba(0, 0, 0, 0.1)
neon-gold:        0 0 20px rgba(212, 175, 55, 0.3)
neon-blue:        0 0 20px rgba(59, 130, 246, 0.3)
wireframe-inner:  inset 0 1px 1px rgba(255,255,255,0.06), inset 0 -1px 1px rgba(255,255,255,0.02)
card-lift:        0 8px 32px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.3)
glow-controlled:  0 0 40px rgba(212, 175, 55, 0.06)
```

### Background Patterns
```
gradient-radial: radial gradient center
glass-shine:     linear shimmer effect
subtle-grid:     1px grid lines
dot-matrix:      circular dot pattern
grid-fine:       fine 1px grid
```

### Animations
| Animation | Duration | Purpose |
|-----------|----------|---------|
| `float` | 6s ease-in-out infinite | Floating object motion |
| `pulse-gold` | 3s ease-in-out infinite | Gold glow pulsing |
| `connector-pulse` | 4s ease-in-out infinite | Connection line pulsing |
| `shelf-slide` | 0.5s ease-out | Arsenal shelf entry |
| `head-bob` | 4s ease-in-out infinite | Bobbing motion (character) |
| `cb-breathe` | 3s ease-in-out infinite | Opacity/glow breathing |
| `cb-scan` | 2.5s linear infinite | Scanline effect |
| `cb-route` | 1.5s ease-out | Route pulse (connection) |

### Transition Timing
```
cb-toggle: 150ms  (toggle interactions)
cb-panel:  200ms  (panel expand/collapse)
```

### Responsive Breakpoints (Standard Tailwind)
```
sm:  640px
md:  768px
lg:  1024px
xl:  1280px
2xl: 1536px
```

**Key Responsive Patterns:**
- Dashboard Nav: Mobile = collapsed hamburger; Tablet+ = full sidebar
- Auth Layout: Mobile = single-column (form only); Tablet+ = three-column
- Component Grid: Mobile = 1 col; Tablet = 2 col; Desktop = 4 col

---

## 5. AUTHENTICATION FLOW

### NextAuth Configuration
- **Strategy:** JWT-based session
- **Session Duration:** Demo: 4 hours; Production: 30 days

### Providers
1. **Google OAuth** (primary)
2. **GitHub OAuth** (social)
3. **Discord OAuth** (community)
4. **Credentials** (email/password with bcryptjs)

### User Roles
| Role | Purpose | Capabilities |
|------|---------|--------------|
| `OWNER` | Super admin | Full platform control, admin console, API keys |
| `USER` | Regular customer | Dashboard, chat, deployment within LUC quotas |
| `DEMO_USER` | Trial user | Limited dashboard, demo-only features |

### Auth Enforcement
- Pages are freely browsable
- Auth enforced at **ACTION level** (chat, deploy, build)
- `AuthGate` component wraps interactive features
- API endpoints protected by middleware rate limiting

---

## 6. STATE MANAGEMENT

### Provider Stack
1. **NextAuth SessionProvider** — JWT token, useSession()
2. **DemoProvider** — Demo mode flags
3. **Framer Motion** — Animation context (implicit)

### Key Custom Hooks
| Hook | Purpose | Returns |
|------|---------|---------|
| `useLuc()` | LUC quota tracking | `{ status, loading, error, refresh }` |
| `useStreamingChat()` | Streaming chat SSE | `{ messages, isStreaming, sendMessage }` |
| `useVoiceInput()` | STT (Deepgram/Groq) | `{ transcript, isListening, start, stop }` |
| `useVoiceOutput()` | TTS (ElevenLabs) | `{ play, pause, isPlaying, voices }` |
| `useUserTier()` | Subscription tier | `{ tier, tokenAllowance, concurrent }` |
| `useOrchestration()` | Agent dispatch | `{ dispatch, cancel, status }` |
| `useChangeOrder()` | Change request workflow | `{ currentStep, submit, validate }` |
| `useMediaPermissions()` | Mic/camera access | `{ hasAudio, hasVideo, request }` |

---

## 7. DATA MODELS

### Prisma Schema (SQLite)

**User** — id, email, name, passwordHash?, role (OWNER|USER|DEMO_USER), status (ACTIVE|SUSPENDED)

**Workspace** — id, name, slug, lucAccount (relation), members[], usageEvents[]

**LucAccount** — id, workspaceId, planId (free|garage|community|enterprise), quotas (JSON), stripeCustomerId?, status

**UsageEvent** — id, workspaceId, service, units, cost, timestamp

**AuditLog** — id, userId, workspaceId, action, resource, changes (JSON), timestamp

### Pricing Model (3-6-9)
| Tier | Commitment | Delivered | Price/mo | Tokens | Agents |
|------|------------|-----------|----------|--------|--------|
| Garage | 3 months | 3 months | $99 | 100K | 3 |
| Community | 6 months | 6 months | $89 | 250K | 10 |
| Enterprise | 9 months | 12 months | $67 | 500K | 50 |
| P2P | None | Variable | Variable | Variable | Unlimited |

---

## 8. VOICE I/O SYSTEM

### Text-to-Speech (TTS)
- **Primary:** ElevenLabs (eleven_turbo_v2_5, voice: Adam)
- **Fallback:** Deepgram (aura-2, voice: Orion)
- **Browser fallback:** Planned but not yet implemented
- **15 voices available** (10 Deepgram + 5 ElevenLabs)

### Speech-to-Text (STT)
- **Primary:** Groq (whisper-large-v3-turbo)
- **Fallback:** Deepgram (nova-3)

### Voice Flow
1. User speaks → useVoiceInput → POST /api/voice/stt → Groq Whisper → transcript
2. Transcript appears editable in input bar
3. User sends → ACHEEVY responds → autoPlay triggers
4. Response text sanitized (markdown stripped) → POST /api/voice/tts → ElevenLabs → audio plays

---

## 9. INTEGRATIONS

### AI/LLM
- **OpenRouter** — Primary LLM gateway (200+ models)
- **Available models:** Claude Opus 4.6, Sonnet 4.6, Gemini 2.5 Flash/Pro, Qwen 2.5 Coder, GLM-5, Kimi K2.5
- **UEF Gateway** — Internal metered access

### Payments
- **Stripe** — Checkout sessions, subscription management, 3-6-9 tiers

### Video/Media
- **Remotion** — Auth welcome video, landing hero animations
- **Kling** — Video generation
- **Google Cloud Storage** — Media uploads

### Social
- **Discord** — Webhooks, command registration
- **Telegram** — Bot webhooks
- **WhatsApp** — Webhook receiver
- **GitHub** — OAuth + repo sync

### Spatial
- **Three.js + React Three Fiber** — 3D hero animations

### Workflow
- **n8n** — Business process automation

### Sandbox
- **E2B** — Server-side code execution

---

## 10. MIDDLEWARE & SECURITY

### Rate Limiting
| Endpoint | Limit |
|----------|-------|
| API general | 100 req/min (30 in demo) |
| Chat/Acheevy | 30 req/min (15 in demo) |
| LUC | 60 req/min (30 in demo) |
| TTS/Transcribe | 20 req/min (10 in demo) |

### Security Headers
```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

### Domain Routing
- **plugmein.cloud** → Landing (lore, gallery, blog)
- **aimanagedsolutions.cloud** → App (dashboard, chat, api)

---

## 11. COMPONENT HIERARCHY

```
Root
├── Providers (SessionProvider + DemoProvider)
│   └── App Router Layout
│       └── DashboardLayout (on dashboard routes)
│           ├── DashboardShell
│           │   ├── DashboardNav (sidebar)
│           │   ├── Main Content (children)
│           │   └── StatusStrip (footer)
│           ├── FloatingACHEEVY (persistent)
│           └── QuickSwitcher (persistent)
│
├── Auth Routes
│   └── LogoWallBackground
│       └── 3-column grid
│           ├── ACHEEVY Image
│           ├── Auth Form (SignIn/SignUp)
│           └── AuthWelcomePlayer (Remotion)
│
├── Landing Routes
│   ├── SiteHeader
│   ├── Hero / HeroPlayer
│   ├── AppShowcase
│   ├── Footer
│   └── FloatingChat
│
└── Dashboard Pages
    └── [Page-specific components]
        ├── AuthGate (wraps interactive features)
        └── [Feature components]
```

---

## 12. DATA FLOW

```
User Action (Chat Message)
│
├─→ useStreamingChat hook
│   └─→ POST /api/chat
│       └─→ classifyIntent()
│           ├─→ "actionable" → UEF Gateway → Agents → LUC Meter
│           └─→ "conversational" → OpenRouter → SSE Stream
│
├─→ Read Receipt (PMO Classification)
│   └─→ INTAKE → ANALYSIS → ASSIGNMENT → EXECUTION → DELIVERY
│
└─→ Voice Output
    └─→ autoPlay → sanitize markdown → /api/voice/tts → ElevenLabs → audio
```

---

## PART 2: BACKEND & INFRASTRUCTURE

### Service Architecture

```
Frontend (3000) → UEF Gateway (3001) → Specialized Services
                                      ├── House of Ang (3002) — Agent Registry
                                      ├── ACHEEVY (3003) — Executive Orchestrator
                                      ├── Agent Bridge (3010) — Sandbox Security
                                      ├── Research_Ang (3020) — A2A Research
                                      ├── Router_Ang (3021) — A2A Routing
                                      ├── Redis (6379) — Cache/Sessions
                                      ├── n8n (5678) — Workflow Automation
                                      └── Circuit Metrics (9090) — Health
```

### Networks
- **aims-network** — Main inter-service communication
- **sandbox-network** (internal: true) — Agent sandbox, no internet
- Only `agent-bridge` spans both

### Key API Contracts

**POST `/acheevy/execute`** — Execute user intent
```json
Request:  { userId, message, intent, conversationId, context }
Response: { reqId, status, message, quote, executionPlan, prepIntelligence }
```

**POST `/llm/stream`** — Streaming LLM response (SSE)
```json
Request:  { model, messages, max_tokens, temperature }
Response: SSE stream of { text } chunks
```

**POST `/house-of-ang/route`** — Find agents by capability
```json
Request:  { capabilities: ["research", "analysis"] }
Response: { matched, unmatched, recommendedOrder }
```

---

## PART 3: GOVERNANCE

### Chain of Command
```
User → ACHEEVY → Boomer_Angs → Chicken Hawk → Lil_Hawks
```

### 14 Boomer_Angs
| Agent | Domain | Wraps |
|-------|--------|-------|
| Forge_Ang | Agent Runtime | ii-agent |
| Scout_Ang | Research | ii-researcher |
| Chronicle_Ang | Timeline | Common_Chronicle |
| Patchsmith_Ang | Coding | codex + codex-as-mcp |
| Bridge_Ang | Protocol | MCP bridges |
| Runner_Ang | CLI | gemini-cli + bridge |
| Gatekeeper_Ang | LLM Gateway | litellm-debugger |
| Showrunner_Ang | Presentations | reveal.js |
| Scribe_Ang | Documentation | Symbioism-Nextra |
| Lab_Ang | R&D | ii-thought + ii_verl |
| Dockmaster_Ang | Templates | Safe templates |
| OpsConsole_Ang | Observability | CommonGround |
| Index_Ang | Data | II-Commons |
| Licensing_Ang | Compliance | License manager |

### 12 Business Verticals
1. Idea Generator
2. Pain Points Analyzer
3. Brand Name Generator
4. Value Proposition Builder
5. MVP Launch Plan
6. Customer Persona Builder
7. Social Launch Campaign
8. Cold Outreach Engine
9. Task Automation Builder
10. Content Calendar Generator
11. LiveSim Autonomous Space
12. Chicken Hawk Code & Deploy

### Evidence Requirements
- **No Proof, No Done** — Every task requires artifacts
- **ORACLE 8-Gate** — Policy → Preflight → Execute → Postflight → Evidence → Seal → Deliver → Archive

### Brand Constants (Exact Spelling)
- `A.I.M.S.` — with periods
- `ACHEEVY` — all caps
- `Chicken Hawk` — two words, title case
- `Boomer_Ang` / `Boomer_Angs` — underscore
- `Lil_*_Hawk` — underscore-delimited
- `Circuit Box` — two words, title case

---

## PART 4: FEATURES CHECKLIST FOR DESIGN

### Core Chat Interface
- [ ] Streaming message display (SSE)
- [ ] Voice input with waveform visualizer
- [ ] Editable transcription before submit
- [ ] Per-message TTS playback controls
- [ ] Voice model selector (15 voices)
- [ ] File attachment preview and upload
- [ ] Read receipt chip (PMO status)
- [ ] Intent classification visual indicator

### Dashboard
- [ ] Health check status (live polling 30s)
- [ ] Arsenal Shelf (deployed plugs carousel)
- [ ] Tool Grid (7 main tiles)
- [ ] Onboarding alert (dismissible)
- [ ] LUC balance widget with tier badge

### Auth
- [ ] Three-column responsive layout
- [ ] Google + Discord OAuth buttons
- [ ] Email/password form
- [ ] ACHEEVY helmet with glow animation
- [ ] Remotion welcome video

### Pricing
- [ ] 3-6-9 tier cards
- [ ] Discount badges (0% | 10% | 33%)
- [ ] Stripe checkout integration

### LUC Dashboard
- [ ] Tier display with commitment
- [ ] Quota bars per service
- [ ] Cost estimation calculator
- [ ] Billing cycle dates

### Navigation
- [ ] Dashboard sidebar with collapse
- [ ] Quick switcher (Cmd+K)
- [ ] Breadcrumbs
- [ ] Mobile hamburger

### Animations
- [ ] Framer Motion stagger
- [ ] Gold pulse glow
- [ ] Shelf slide transitions
- [ ] Connector pulse lines
- [ ] Scanline effects
- [ ] Breathing opacity

---

## PACKAGE DEPENDENCIES

### Core
- next: 14.0.4, react: ^18, react-dom: ^18

### Auth & Security
- next-auth: ^4.24.13, bcryptjs: ^3.0.3

### Styling & Animation
- tailwindcss: ^3.3.0, framer-motion: ^10.16.16, clsx: ^2.1.1, tailwind-merge: ^2.2.1

### AI & LLM
- ai: ^3.4.33, @ai-sdk/openai: ^0.0.66, groq-sdk: ^0.8.0

### Voice
- @elevenlabs/client: ^0.14.0, @elevenlabs/react: ^0.14.0, @deepgram/sdk: ^3.9.0

### Database
- @prisma/client: ^5.22.0

### UI
- lucide-react: ^0.303.0, @radix-ui/react-dialog: ^1.0.5

### Markdown
- react-markdown: ^9.0.1, remark-gfm: ^4.0.0, highlight.js: ^11.9.0

### Video & 3D
- remotion: ^4.0.0, @remotion/player: ^4.0.419, three: ^0.169.0, @react-three/fiber: ^8.17.10

### Payments
- stripe: ^14.14.0

### State
- zustand: ^4.5.5

### Utilities
- uuid: ^9.0.1, zod: ^3.22.4

---

*End of specification. This document contains everything needed for a design AI to recreate the A.I.M.S. UI.*
