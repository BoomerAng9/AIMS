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
| `/dashboard/nil` | N.I.L. Dashboard |

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

## 4-12. [Sections 4 through 12 unchanged — see full file for Tailwind Design System, Authentication Flow, State Management, Data Models, Voice I/O, Integrations, Middleware & Security, Component Hierarchy, and Data Flow]

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
| Buildsmith | Agent Runtime | ii-agent |
| Scout_Ang | Research | ii-researcher |
| Chronicle_Ang | Timeline | Common_Chronicle |
| Patchsmith_Ang | Coding | codex + codex-as-mcp |
| Bridge_Ang | Protocol | MCP bridges |
| Runner_Ang | CLI | gemini-cli + bridge |
| Gatekeeper_Ang | LLM Gateway | Gemini API gateway (~~litellm~~ BLOCKED) |
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

[Features checklist unchanged]

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
