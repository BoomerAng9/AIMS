# A.I.M.S. — Frontend Design, Routing & Wiring, and AI Tools Integration Plan

> **Generated:** 2026-02-24 | **Author:** AI CTO Session | **Status:** PLAN

---

## PART 0: TEST RESULTS (Pre-Plan Audit)

| Suite | Command | Result | Details |
|-------|---------|--------|---------|
| Frontend Build | `cd frontend && npm run build` | **PASS** | All routes compile, 0 errors, static + dynamic pages confirmed |
| Backend Build | `cd backend/uef-gateway && npm run build` | **PASS** | TypeScript clean compile, 0 errors |
| Skills Tests | `cd aims-skills && npm test` | **PASS** | 4 suites, 65 tests, 0 failures (hooks, onboarding-sop, luc-adk, skills) |

**Platform readiness:** 46/47 requirements DONE (98%). Only P0.8 AUTH_FLOW remains PARTIAL (needs Google OAuth credentials).

---

## PART 1: FRONTEND DESIGN PLAN

### 1.1 Current State Analysis

#### Route Map (100+ pages across 8 major zones)

```
/                           Landing page (dark premium PaaS)
├── /(auth)/
│   ├── sign-in             NextAuth sign-in
│   ├── sign-up             Registration
│   ├── forgot-password     Password reset request
│   └── reset-password      Password reset confirm
│
├── /chat                   Chat w/ ACHEEVY (full-page, Vercel AI SDK + ElevenLabs)
│
├── /dashboard/             DashboardShell layout (sidebar nav + FloatingACHEEVY + QuickSwitcher)
│   ├── (root)              Overview — health check, onboarding CTA, quick-launch cards
│   ├── chat                Chat (in-dashboard variant)
│   ├── acheevy             ACHEEVY dedicated page (own layout)
│   ├── deploy-dock         Running instance dashboard (PaaS core)
│   ├── plug-catalog        Browsable plug library
│   ├── plugs               My Plugs (user's deployed instances)
│   ├── plugs/[id]          Individual plug detail
│   ├── automations         Automation builder
│   ├── make-it-mine/       DIY builder (web-app, mobile-app, automation sub-routes)
│   ├── build               Build workspace
│   ├── luc                 LUC billing calculator (1163 lines)
│   ├── circuit-box         Control plane (services, integrations, model garden, settings — tab-based)
│   ├── custom-hawks        Custom Lil_Hawks creator wizard (4-step)
│   ├── playground          Code playground (E2B sandbox)
│   ├── model-garden        AI model browser
│   ├── film-room           Per|Form video intelligence (Twelve Labs)
│   ├── perform             Per|Form sports lobby
│   ├── nil                 Name Image Likeness tracker
│   ├── livesim             LiveSim agent feed
│   ├── boomerangs          Agent visual directory
│   ├── house-of-ang        House of Ang PMO
│   ├── research/           Research hub (6 sub-pages: activity-feed, codebase-sync, connected-accounts, google-ecosystem, notebook-lm)
│   ├── project-management  PM board
│   ├── map                 Platform mind map
│   ├── plan                Plan view
│   ├── operations          Operations center
│   ├── environments        Environment manager
│   ├── gates               Governance gates
│   ├── admin               Admin panel
│   ├── lab                 Experimental lab
│   ├── needs-analysis      Client intake wizard
│   ├── editors-desk        Content desk
│   ├── garage-to-global    E-commerce vertical
│   ├── buy-in-bulk         Bulk purchasing
│   ├── boost-bridge        Marketing automation
│   ├── blockwise           Real estate AI
│   └── showroom            Showcase gallery
│
├── /sandbox/               Isolated experimentation zone (own layout)
│   ├── (root)              Sandbox hub
│   ├── perform/            Per|Form sandbox (10+ sub-pages: big-board, war-room, draft/*, prospects/[slug], etc.)
│   ├── blockwise           BlockWise AI sandbox
│   └── verticals           Vertical tester
│
├── /workshop/              Creative workshop (own layout)
│   ├── (root)              Workshop hub
│   ├── life-scenes         Life Scenes video studio
│   ├── moment-studio       Moment capture
│   ├── money-moves         Financial planning
│   └── creator-circles     Community
│
├── /perform/               Public Per|Form (own layout)
│   ├── (root)              Per|Form lobby
│   ├── coaching-carousel   Coaching analytics
│   ├── nil-tracker         NIL tracker
│   ├── pricing             Subscription tiers
│   ├── revenue-budget      Revenue modeling
│   └── transfer-portal     Transfer portal
│
├── /arena/                 Contests & trivia (own layout)
│   ├── (root)              Arena lobby
│   ├── contests/[slug]     Individual contest
│   ├── how-it-works        Rules
│   ├── leaderboard         Rankings
│   ├── mock-draft          Mock draft game
│   └── wallet              Arena credits
│
├── /halalhub/              Halal marketplace (own layout, emerald variant)
│   ├── (auth)/login        HalalHub auth
│   ├── (auth)/signup/*     Vendor/customer signup
│   └── shop/[category]     Product browsing
│
├── /workspace/luc          LUC workspace
├── /your-space             User profile & space
├── /hangar                 3D Boomer_Ang hangar (Three.js)
├── /onboarding             Multi-step onboarding (own layout)
├── /about                  About page
├── /pricing                Pricing page
├── /gallery                Gallery
├── /integrations           Integration directory
├── /merch                  Merchandise store
├── /showroom               Showcase
├── /mission-control        Mission control view
├── /the-book-of-vibe       Design language reference
├── /terms/savings-plan     Terms page
└── /new                    New project wizard
```

#### Design System Assets

| Asset | Location | Status |
|-------|----------|--------|
| Motion tokens | `frontend/lib/motion/tokens.ts` | Active — timing, easing, spring presets |
| Motion variants | `frontend/lib/motion/variants.ts` | Active — 22+ reusable animation presets |
| Motion components | `frontend/components/motion/` | Active — 7 components (ScrollReveal, ParallaxSection, TiltCard, TypeReveal, ScrollProgress, GlowBorder, BentoGrid) |
| Platform mode | `frontend/lib/platform-mode.tsx` | Active — PRIVATE/PUBLIC dual-layer |
| Terminology | `frontend/lib/terminology.ts` | Active — mode-aware labels |
| UI primitives | `frontend/components/ui/` | Active — button, card, dialog, input, textarea, Brand, LED, Nixie |
| UI archetypes | `.claude/skills/aims-*-ui/` | Reference — 10 archetype skills |

#### Layout Hierarchy

```
RootLayout (app/layout.tsx)
├── Providers (NextAuth SessionProvider + PlatformModeProvider)
├── Fonts: Doto (headings), Permanent Marker, Caveat, Patrick Hand, Nabla
│
├── DashboardLayout (app/dashboard/layout.tsx)
│   ├── DashboardShell (sidebar nav, health check, LUC widget)
│   ├── FloatingACHEEVY (persistent chat bubble)
│   └── QuickSwitcher (⌘K)
│
├── SandboxLayout, WorkshopLayout, PerformLayout, ArenaLayout
│   └── (Each with own shell/nav appropriate to zone)
│
├── AuthLayout (app/(auth)/layout.tsx)
│   └── Centered card layout
│
├── OnboardingLayout (app/onboarding/layout.tsx)
│
└── HalalHubLayout (app/halalhub/layout.tsx)
    └── Emerald variant
```

### 1.2 Design Priorities (What to Improve)

#### Priority A: Navigation Coherence

**Current issue:** The DashboardNav has 50+ links split across 9 groups (PRIVATE_PRIMARY, PRIVATE_CORE, PRIVATE_CIRCUIT_BOX, PRIVATE_WORKSHOP, PRIVATE_SANDBOX, PLUG_ITEMS, PRIVATE_LIVE_APPS, PRIVATE_PERFORM, PRIVATE_OWNER). This is overwhelming.

**Plan:**
1. **Collapse into 5 top-level sections** with expandable sub-groups:
   - **ACHEEVY** (Chat, Overview)
   - **Deploy** (Deploy Dock, Plug Catalog, My Plugs, Make It Mine)
   - **Tools** (Automations, Playground, Custom Hawks, Research, Lab)
   - **Verticals** (Per|Form, BlockWise, Garage to Global, Buy in Bulk, Workshop suite)
   - **System** (Circuit Box, LUC, Operations, Admin — owner only)
2. **QuickSwitcher (⌘K)** already exists — make it the primary navigation method. All pages searchable.
3. **Breadcrumbs** — Add a breadcrumb strip below the top bar for deep pages.
4. **PUBLIC mode** — Already simplified (8 items). No changes needed.

#### Priority B: Consistent Page Shells

**Current issue:** Each page re-implements its own health hooks, loading states, and layout patterns. Example: `useHealthCheck()` is duplicated in `DashboardShell.tsx` and `dashboard/page.tsx`.

**Plan:**
1. **Extract shared hooks** into `frontend/hooks/`:
   - `useHealthCheck()` → single implementation
   - `useLucBalance()` → single implementation
   - `usePlugInstances()` → shared across Deploy Dock, Plugs pages
2. **Create `PageShell` component** — wraps each page with consistent title bar, loading skeleton, error boundary.
3. **Enforce archetype skill** on every page per the mapping table in CLAUDE.md.

#### Priority C: Mobile-First Gaps

**Current issue:** Many dashboard pages use fixed widths or assume desktop layout.

**Plan:**
1. **Responsive audit** of all `/dashboard/**` pages — identify `w-[fixed]` patterns.
2. **Stack sidebar below on mobile** — DashboardShell should collapse to bottom-tab navigation on `< md`.
3. **Touch targets** — Ensure all buttons ≥ 44px height on mobile per aims-global-ui spec.

#### Priority D: Light Theme Default

**Current issue:** Landing page uses dark premium theme (intentional). Dashboard uses mixed light/dark. Some internal pages incorrectly default to dark.

**Plan:**
1. **Landing page** → dark premium (keep as-is per `aims-landing-ui`).
2. **Dashboard & all authenticated pages** → light (#F8FAFC background) per CLAUDE.md rule #7.
3. **Dark mode toggle** → optional, user-controlled, not default.

---

## PART 2: ROUTING & WIRING PLAN

### 2.1 Current Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER (Browser)                              │
│                                                                     │
│  Next.js Frontend (:3000)                                           │
│  ├── /chat/page.tsx ─── useChat() ──┐                               │
│  ├── /api/chat/route.ts ────────────┤                               │
│  │   ├── classifyIntent() ──────────┤                               │
│  │   ├── tryAgentDispatch() ────────┤                               │
│  │   └── tryGatewayStream() ────────┤                               │
│  │       └── fallback: OpenRouter ──┤                               │
│  │                                  │                               │
│  ├── /api/acheevy/chat/route.ts     │                               │
│  ├── /api/plug-catalog/route.ts     │                               │
│  ├── /api/plug-instances/route.ts   │                               │
│  └── /api/*/route.ts (90+ routes) ──┤                               │
│                                     ▼                               │
│               UEF Gateway (Express :3001)                           │
│               ├── /acheevy/classify  (intent classification)        │
│               ├── /acheevy/execute   (orchestrator dispatch)        │
│               ├── /llm/stream        (metered LLM streaming)        │
│               ├── /plug-catalog/*    (catalog CRUD)                 │
│               ├── /instances/*       (lifecycle management)         │
│               ├── /api/payments/*    (Stripe)                       │
│               └── 100+ more routes                                  │
│                          │                                          │
│        ┌─────────────────┼─────────────────┐                        │
│        ▼                 ▼                  ▼                       │
│   ACHEEVY           Chicken Hawk      Plug Engine                   │
│   Orchestrator      (executor)        (Docker API)                  │
│        │                 │                  │                        │
│        ▼                 ▼                  ▼                       │
│   II-Agent         Cloud Run          Docker containers             │
│   (autonomous)     (sandboxed)        (:51000+ range)               │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 Frontend API Proxy Pattern

**Current:** Frontend Next.js API routes (`/api/*`) act as a proxy layer to the UEF Gateway. Each route:
1. Reads `UEF_GATEWAY_URL` from env
2. Forwards request with `X-API-Key` header
3. Transforms response for frontend consumption

**Key file:** `frontend/lib/api-proxy.ts` — shared proxy utility.

**Wiring map (key routes):**

| Frontend Route | Gateway Endpoint | Purpose |
|---------------|-----------------|---------|
| `POST /api/chat` | `/acheevy/classify` + `/acheevy/execute` OR `/llm/stream` | Chat with ACHEEVY (3-path: agent, LLM, fallback) |
| `POST /api/acheevy/chat` | `/acheevy/chat` | Legacy ACHEEVY chat |
| `POST /api/acheevy/classify` | `/acheevy/classify` | Intent classification |
| `GET /api/plug-catalog` | `/plug-catalog/browse` | Browse plug library |
| `POST /api/plug-instances` | `/instances/deploy` | Deploy a plug instance |
| `GET /api/plug-instances` | `/instances/list` | List running instances |
| `POST /api/deploy` | `/instances/deploy` | Alternate deploy endpoint |
| `POST /api/luc/*` | `/luc/*` | LUC billing operations |
| `POST /api/stripe/*` | `/api/payments/stripe/*` | Stripe operations |
| `POST /api/custom-hawks` | `/custom-hawks/*` | Custom Lil_Hawks CRUD |
| `GET /api/health` | `/health` | Health check cascade |
| `POST /api/code/execute` | `/playground/execute` OR E2B direct | Code execution |
| `POST /api/needs-analysis` | `/intake/*` | Client needs analysis |
| `POST /api/perform/*` | `/perform/*` | Per\|Form sports data |

### 2.3 Authentication Wiring

```
NextAuth (frontend/lib/auth.ts)
  ├── Providers: CredentialsProvider (email/password via Prisma)
  │              GoogleProvider (needs GOOGLE_CLIENT_ID/SECRET)
  │
  ├── Session: JWT strategy, Redis store via gateway
  │
  ├── Middleware: frontend/middleware.ts
  │   ├── Bot blocking (100+ UA patterns)
  │   ├── CORS validation
  │   ├── Rate limiting headers
  │   └── Geo/device context injection
  │
  ├── Page-Level Auth:
  │   └── Dashboard is freely browsable (force-dynamic)
  │       Auth enforced at ACTION level (chat submit, deploy, build)
  │       via AuthGate component, NOT page load
  │
  └── Role System:
      ├── OWNER  → PRIVATE mode, full access, developer toggle
      ├── ADMIN  → PRIVATE mode, full access
      ├── CUSTOMER → PUBLIC mode, simplified UI
      └── DEMO_USER → PUBLIC mode, limited features
```

### 2.4 Routing Improvements Needed

#### A. Consolidate Duplicate Chat Routes

**Current:** Three chat entry points exist:
- `/chat` — Full-page chat (standalone)
- `/dashboard/chat` — In-dashboard chat
- `/dashboard/acheevy` — ACHEEVY dedicated page

**Plan:** Keep all three, but unify the underlying component:
1. `/chat` → standalone shell wrapping `<ChatInterface />` (already done)
2. `/dashboard/chat` → DashboardShell wrapping `<ChatInterface />` (already done)
3. `/dashboard/acheevy` → ACHEEVY-specific view (vertical control, admin tools) — keep distinct

#### B. Normalize API Route Patterns

**Current:** Some frontend API routes call the gateway directly; others use `lib/api-proxy.ts`. Some routes are redundant (both `/api/deploy` and `/api/plug-instances` can deploy).

**Plan:**
1. Standardize all gateway calls through a single `gatewayFetch()` utility with:
   - Automatic API key injection
   - Error normalization
   - Retry with exponential backoff (network errors only)
   - LUC metering headers pass-through
2. Deprecate duplicate endpoints — `/api/deploy` becomes an alias for `/api/plug-instances` with `action: "deploy"`.

#### C. WebSocket/SSE Wiring

**Current:** LiveSim uses WebSocket (Socket.IO via gateway). Chat uses SSE (Vercel AI SDK text streaming). Agent status uses polling.

**Plan:**
1. **Chat:** Keep SSE via Vercel AI SDK `useChat()` — works well, metered through LUC.
2. **LiveSim:** Keep WebSocket via Socket.IO — real-time agent events need bidirectional.
3. **Instance status:** Migrate from polling (30s interval) to SSE event stream from Deploy Dock. Gateway already emits instance events via LiveSim — bridge them to frontend.
4. **Voice:** Keep ElevenLabs Conversational AI SDK for real-time bidirectional voice.

---

## PART 3: AI TOOLS INTEGRATION PLAN

### 3.1 Current AI Tool Inventory

| Tool | Type | Location | Status | Wiring |
|------|------|----------|--------|--------|
| **OpenRouter** | LLM Gateway | `frontend/app/api/chat/route.ts`, `backend/uef-gateway/src/llm/` | **Active** | 10 models: Claude Opus 4.6, Sonnet 4.5, Qwen 2.5, Qwen Max, MiniMax-01, GLM-4+, Moonshot v1, Gemini 2.5 Flash/Pro, Nano Banana Pro |
| **PersonaPlex** | Voice+Inference | `backend/uef-gateway/src/llm/personaplex.ts` | **Active** | NVIDIA Nemotron-3-Nano-30B-A3B on GCP Vertex AI, called via `PERSONAPLEX_ENDPOINT` |
| **ElevenLabs** | TTS + Voice Agent | `frontend/lib/services/elevenlabs.ts`, `@elevenlabs/react` | **Active** | Scribe v2 for STT, conversational AI agent for real-time voice, TTS for playback |
| **Deepgram** | STT/TTS | `frontend/lib/services/deepgram.ts` | **Active** | Alternative STT/TTS provider |
| **Groq** | Fast STT | `frontend/lib/services/groq.ts` | **Active** | Whisper-large-v3 for fast speech-to-text |
| **E2B** | Code Sandbox | `frontend/lib/services/e2b.ts` | **Active** | Sandboxed code execution for playground |
| **Twelve Labs** | Video AI | `backend/uef-gateway/src/twelve-labs/` | **Active** | Video intelligence for Per|Form Film Room |
| **Brave Search** | Web Search | `frontend/lib/search/brave.ts`, `backend/uef-gateway/src/search/` | **Active** | Priority search (Brave → Tavily → Serper fallback chain) |
| **Composio** | Tool Integration | `backend/uef-gateway/src/composio/` | **Active** | External tool/API integration bridge |
| **n8n** | Workflow Automation | Docker container :5678 | **Active** | 8 vertical workflow templates, auto-trigger on Phase B |
| **II-Agent** | Autonomous Agent | Docker container (postgres + tools + sandbox) | **Active** | Socket.IO connection from orchestrator, autonomous task execution |
| **Chicken Hawk** | Build Executor | Docker container :4001 + Cloud Run | **Active** | Manifest-based execution, wave/task structure |
| **NtNtN Engine** | Build Intent NLP | `aims-skills/ntntn-engine/` | **Active** | Detect build intent → classify → generate steps → dispatch |

### 3.2 Chat Pipeline (The Core AI Loop)

```
User Message
    │
    ▼
┌─ /api/chat/route.ts (POST) ────────────────────────────────┐
│                                                              │
│  1. Extract last message + model selection                   │
│  2. Build ACHEEVY system prompt (persona + vertical context)│
│                                                              │
│  ┌─ Step 1: Classify Intent ────────────────────┐           │
│  │  POST /acheevy/classify                       │           │
│  │  Returns: { intent, confidence, requiresAgent }│          │
│  └───────────────────────────────────────────────┘           │
│                                                              │
│  ┌─ Path A: Agent Dispatch (requiresAgent=true) ─┐          │
│  │  POST /acheevy/execute                         │          │
│  │  → Orchestrator → II-Agent / Chicken Hawk      │          │
│  │  → Formatted as Vercel AI SDK text stream      │          │
│  └────────────────────────────────────────────────┘          │
│                                                              │
│  ┌─ Path B: Gateway LLM Stream (requiresAgent=false) ┐     │
│  │  POST /llm/stream                                   │     │
│  │  → OpenRouter (model auto-selected)                 │     │
│  │  → SSE → Vercel AI SDK format transform             │     │
│  │  → LUC metered                                      │     │
│  └─────────────────────────────────────────────────────┘     │
│                                                              │
│  ┌─ Path C: Direct Fallback (gateway unreachable) ────┐     │
│  │  Vercel AI SDK streamText() → OpenRouter direct     │     │
│  │  → Unmetered (emergency only)                       │     │
│  └─────────────────────────────────────────────────────┘     │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 3.3 Voice Pipeline

```
┌─ Text Mode ──────────────────────────────────────────────┐
│  Input:  useVoiceInput() → Groq Whisper STT → text       │
│  Output: LLM response → sanitizeForTTS() → ElevenLabs    │
│          → VoicePlaybackBar component                     │
└───────────────────────────────────────────────────────────┘

┌─ Voice Mode (Real-Time Bidirectional) ───────────────────┐
│  @elevenlabs/react useConversation()                      │
│  → ELEVENLABS_AGENT_ID                                    │
│  → Real-time audio ←→ ElevenLabs Conversational AI        │
│  → Audio frequency visualizer (VoiceVisualizer.tsx)       │
└───────────────────────────────────────────────────────────┘

┌─ PersonaPlex (GPU-accelerated) ──────────────────────────┐
│  Frontend: /api/voice/personaplex                         │
│  Gateway:  /api/personaplex/*                             │
│  Backend:  PersonaplexClient → GCP Vertex AI Endpoint     │
│  Model:    NVIDIA Nemotron-3-Nano-30B-A3B (MoE, 3B active)│
│  Use case: Advanced persona-driven conversations          │
└───────────────────────────────────────────────────────────┘
```

### 3.4 AI Tools Integration Improvements

#### A. Model Intelligence Router (Improve Model Selection)

**Current:** User manually selects model from dropdown (9 options).

**Plan:** Implement smart model routing:
1. **Simple questions** → Gemini 2.5 Flash (fast, cheap)
2. **Code tasks** → Qwen 2.5 Coder 32B (code-optimized)
3. **Complex reasoning** → Claude Opus 4.6 (best reasoning)
4. **Creative content** → MiniMax-01 or GLM-4+ (creative strengths)
5. **Cost-sensitive** → Auto-downgrade within thinking_level tiers
6. Keep manual override available in PRIVATE mode.

**Implementation:** Extend the classify step to include `suggestedModel` in the response.

#### B. Agentic Tool Use (Structured Outputs)

**Current:** ACHEEVY orchestrator dispatches to II-Agent or Chicken Hawk for execution. The response is formatted as text and streamed back.

**Plan:** Add structured tool-use capabilities:
1. **Tool definitions** in the LLM system prompt (search, deploy, monitor, create)
2. **Tool call streaming** — When LLM emits a tool call, intercept → execute → stream result inline
3. **Visual tool execution** — Show the user what ACHEEVY is doing (spinners for "Searching...", "Deploying...", "Checking health...")
4. **Evidence artifacts** — Attach tool results as collapsible evidence blocks in the chat

**Frontend changes:**
- New `<ToolCallBlock />` component — renders tool name, params, status, result
- `<EvidenceAttachment />` component — collapsible proof artifact
- Modify `ChatInterface.tsx` to recognize tool-call message types

#### C. Memory & Context Window

**Current:** Memory system exists (`backend/uef-gateway/src/memory/`) with remember/recall. Auto-recall before execution, auto-remember after.

**Plan:** Surface memory to the user:
1. **Memory indicator** in chat — show when ACHEEVY recalls relevant context
2. **"Remember this"** button on important messages
3. **Memory browser** in Circuit Box → shows what ACHEEVY knows about the user
4. **Cross-session context** — conversation history persisted via memory engine

#### D. Plug Catalog AI Enhancement

**Current:** Plug catalog is a static registry (`frontend/lib/plugs/registry.ts`). User browses manually.

**Plan:**
1. **AI-powered search** — "I need a CRM" → ACHEEVY matches to appropriate plug
2. **Needs Analysis integration** — After needs analysis, ACHEEVY recommends plugs
3. **Auto-configure** — When deploying, ACHEEVY pre-fills config based on needs analysis answers
4. **Compatibility check** — Before deploy, check resource requirements vs. available capacity

#### E. Factory Controller Integration

**Current:** Factory Controller exists in backend (`backend/uef-gateway/src/factory/`) with FDH pipeline support. Not yet surfaced in frontend.

**Plan:**
1. **Factory Dashboard** — New page at `/dashboard/factory` showing:
   - Active FDH runs with status
   - Pending approvals (human-in-the-loop gates)
   - Run history with evidence artifacts
2. **Push notifications** — When ACHEEVY initiates an FDH run, notify user for approval
3. **Approval UI** — In-chat approval cards with Accept/Reject/Modify options

---

## PART 4: WIRING DIAGRAM (COMPLETE)

### 4.1 Service Mesh (Docker Compose)

```
┌──────────────────────────────────────────────────────────────────────┐
│                       AIMS VPS (76.13.96.107)                        │
│                                                                      │
│  ┌─ nginx (:80/:443) ──────────────────────────────────────────────┐│
│  │  *.plugmein.cloud → frontend (:3000)                             ││
│  │  /api/* → uef-gateway (:3001)                                    ││
│  │  /hoa/* → house-of-ang (:3002)                                   ││
│  │  /plugs/*.plugmein.cloud → :51000+ (dynamic per instance)        ││
│  └──────────────────────────────────────────────────────────────────┘│
│                                                                      │
│  ┌─ Core Services ──────────────────────────────────────────────────┐│
│  │  frontend (Next.js :3000)                                         ││
│  │  demo-frontend (:3004)                                            ││
│  │  uef-gateway (Express :3001) ── redis (:6379)                     ││
│  │  house-of-ang (:3002)                                             ││
│  │  acheevy (:3003)                                                  ││
│  │  agent-bridge (:3010)                                             ││
│  │  chickenhawk-core (:4001)                                         ││
│  │  circuit-metrics (:4002)                                          ││
│  │  ii-agent + ii-agent-postgres + ii-agent-tools + ii-agent-sandbox ││
│  └──────────────────────────────────────────────────────────────────┘│
│                                                                      │
│  ┌─ Dynamic Plug Instances ─────────────────────────────────────────┐│
│  │  Port range: 51000+ (auto-allocated, 10-port increments)          ││
│  │  Each instance: own Docker container + nginx reverse proxy        ││
│  │  Lifecycle: provision → deploy → health-check → monitor → scale   ││
│  │            → decommission (via ACHEEVY or Deploy Dock UI)         ││
│  └──────────────────────────────────────────────────────────────────┘│
│                                                                      │
│  ┌─ Optional Profiles ──────────────────────────────────────────────┐│
│  │  --profile tier1-agents: research-ang, router-ang                 ││
│  │  --profile ii-agents: agent-zero                                  ││
│  │  --profile perform: scout-hub, film-room, war-room                ││
│  └──────────────────────────────────────────────────────────────────┘│
│                                                                      │
│  ┌─ External Services ──────────────────────────────────────────────┐│
│  │  GCP Vertex AI: PersonaPlex (Nemotron-3-Nano, GPU L4/A100)        ││
│  │  GCP Cloud Run: Chicken Hawk jobs (sandboxed, scale-to-zero)      ││
│  │  GCP Artifact Registry: Docker images (CI pipeline)               ││
│  │  OpenRouter: Multi-model LLM access                               ││
│  │  ElevenLabs: Voice (TTS + Conversational AI)                      ││
│  │  Deepgram: Alternative STT/TTS                                    ││
│  │  Groq: Fast STT (Whisper)                                         ││
│  │  E2B: Code sandbox execution                                      ││
│  │  Twelve Labs: Video intelligence                                  ││
│  │  Brave Search: Web search (+ Tavily/Serper fallback)              ││
│  │  Stripe: Payment processing                                       ││
│  │  Composio: External tool integration                              ││
│  └──────────────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────────────┘
```

### 4.2 Request Flow (Typical Chat Message)

```
1. User types message in /chat or /dashboard/chat
2. useChat() (Vercel AI SDK) sends POST /api/chat
3. /api/chat/route.ts:
   a. Extracts last user message + selected model
   b. Builds ACHEEVY system prompt (persona + mode + vertical context)
   c. Calls classifyIntent() → POST {gateway}/acheevy/classify
   d. If requiresAgent=true:
      → POST {gateway}/acheevy/execute
      → Orchestrator selects: II-Agent (Socket.IO) → Chicken Hawk (HTTP) → queued
      → Memory auto-recall + auto-remember
      → Response formatted as Vercel AI SDK text stream
   e. If requiresAgent=false:
      → POST {gateway}/llm/stream
      → OpenRouter model (user-selected or auto)
      → SSE transform to Vercel AI SDK format
      → LUC metered via meterAndRecord()
   f. If gateway unreachable:
      → Direct OpenRouter via Vercel AI SDK streamText()
      → Unmetered fallback
4. Response streams to frontend → rendered in ChatInterface
5. If voice output enabled → sanitizeForTTS() → ElevenLabs TTS → playback
```

### 4.3 Instance Deployment Flow (Plug Spin-Up)

```
1. User clicks "Deploy" on a plug in Plug Catalog
2. Frontend: POST /api/plug-instances { plugId, config }
3. Gateway: /instances/deploy
   a. Oracle.runGates() — 8-gate pre-flight check
   b. LUC quota check — meterAndRecord()
   c. Port allocation — next available in 51000+ range
   d. Docker pull + create + start (via dockerode)
   e. nginx reverse proxy config written to /etc/nginx/conf.d/plugs/
   f. nginx reload
   g. Health check (HTTP, 30s intervals)
   h. LiveSim broadcast: { event: 'instance.deployed', instanceId, status }
4. Deploy Dock UI auto-refreshes via polling (→ plan: migrate to SSE)
5. Instance monitored: Circuit Metrics (CPU/mem/net), AlertEngine (thresholds)
6. Auto-scaler evaluates: horizontal/vertical policies per tier limits
```

---

## PART 5: IMPLEMENTATION PRIORITIES (Ordered)

### Immediate (This Session)

| # | Task | Impact | Effort |
|---|------|--------|--------|
| 1 | Extract duplicate hooks (`useHealthCheck`, `useLucBalance`) into `frontend/hooks/` | Code quality | Low |
| 2 | Add breadcrumb component to dashboard pages | Navigation UX | Low |
| 3 | Create `gatewayFetch()` utility to standardize all frontend→gateway calls | Reliability | Medium |

### Short-Term (Next 1-2 Sessions)

| # | Task | Impact | Effort |
|---|------|--------|--------|
| 4 | Implement Model Intelligence Router (auto-model selection in classify step) | AI quality | Medium |
| 5 | Add `<ToolCallBlock />` and `<EvidenceAttachment />` chat components | User trust | Medium |
| 6 | Collapse DashboardNav into 5 expandable sections | Navigation UX | Medium |
| 7 | Create Factory Dashboard at `/dashboard/factory` | Autonomy visibility | High |
| 8 | Migrate Deploy Dock from polling to SSE for instance status | Real-time UX | Medium |

### Medium-Term (Next 3-5 Sessions)

| # | Task | Impact | Effort |
|---|------|--------|--------|
| 9 | AI-powered plug catalog search + needs analysis integration | PaaS core | High |
| 10 | Memory browser in Circuit Box | Transparency | Medium |
| 11 | Mobile-responsive audit of all dashboard pages | Reach | High |
| 12 | Complete Google OAuth setup (credential config only) | Auth completion | Low |
| 13 | Cross-session chat persistence via memory engine | Continuity | Medium |

---

## PART 6: ARCHITECTURE RULES (Carry Forward)

1. **All AI tool access goes through UEF Gateway** — no direct service exposure from frontend
2. **Only ACHEEVY speaks to the user** — never internal agent names in PUBLIC mode
3. **Every deployment requires LUC quota check** — no free-riders
4. **Three-path chat pipeline** — classify → agent dispatch OR LLM stream OR fallback
5. **Frontend API routes are proxies** — they don't contain business logic, just forward to gateway
6. **Motion library is mandatory** — use `tokens.ts` and `variants.ts`, never magic numbers
7. **Dual-layer access** — `usePlatformMode()` for PRIVATE/PUBLIC, `t(key, mode)` for labels
8. **Page archetype skills** — every page must follow its archetype per the mapping table
9. **Evidence or it didn't happen** — `no_proof_no_done: true` for all ACHEEVY operations
10. **Human-in-the-loop gates** — destructive actions (deploy, decommission, scale) require confirmation
