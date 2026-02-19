---
name: model-garden-inventory
displayName: A.I.M.S. Model Garden — Complete Platform Inventory
version: 2.0.0
updated: 2026-02-18
type: reference
tags: [model-garden, apis, tools, inventory, mind-map]
---

# A.I.M.S. Model Garden — Complete Platform Inventory

> The A.I.M.S. Model Garden is our own curated catalog of every model, API,
> tool, and service available through the platform — modeled after Google's
> Model Garden concept but built for AIMS's architecture.
>
> Updated: February 18, 2026

---

## Mind Map Structure

```
                            ┌─────────────┐
                            │  ACHEEVY    │
                            │  (Agent 0)  │
                            └──────┬──────┘
                                   │
                    ┌──────────────┼──────────────┐
                    │              │              │
              ┌─────▼─────┐ ┌─────▼─────┐ ┌─────▼─────┐
              │    UEF     │ │   AVVA    │ │  Chicken  │
              │  Gateway   │ │   NOON    │ │   Hawk    │
              │ (Port Auth)│ │(SmelterOS)│ │ (Executor)│
              └─────┬──────┘ └─────┬─────┘ └─────┬─────┘
                    │              │              │
    ┌───────────────┼──────┐      │      ┌───────┼───────┐
    │       │       │      │      │      │       │       │
  ┌─▼─┐  ┌─▼─┐  ┌─▼─┐  ┌─▼─┐  ┌─▼─┐  ┌─▼─┐  ┌─▼─┐  ┌─▼─┐
  │LLM│  │VCE│  │SRC│  │PAY│  │OS │  │COD│  │UI │  │QA │
  │   │  │   │  │   │  │   │  │   │  │   │  │   │  │   │
  └─┬─┘  └─┬─┘  └─┬─┘  └─┬─┘  └─┬─┘  └─┬─┘  └─┬─┘  └─┬─┘
    │      │      │      │      │      │      │      │
   ...    ...    ...    ...    ...    ...    ...    ...
```

---

## 1. LLM Gateway — Three-Tier Routing

**Router:** UEF Gateway (`/llm/chat`, `/llm/stream`)
**Priority:** Vertex AI → OpenRouter → Stub

### Tier: Premium

| Model | Provider | OpenRouter ID | Vertex AI ID | Cost (in/out per 1M) |
|-------|----------|--------------|-------------|---------------------|
| Claude Opus 4.6 | Anthropic | `anthropic/claude-opus-4.6` | `claude-opus-4-6@20250218` | $5 / $25 |
| GPT-5.2 | OpenAI | `openai/gpt-5.2` | — | $5 / $20 |

### Tier: Standard

| Model | Provider | OpenRouter ID | Vertex AI ID | Cost (in/out per 1M) |
|-------|----------|--------------|-------------|---------------------|
| Claude Sonnet 4.6 | Anthropic | `anthropic/claude-sonnet-4.6` | `claude-sonnet-4-6@20250218` | $3 / $15 |
| GPT-5.1 | OpenAI | `openai/gpt-5.1` | — | $3 / $12 |
| Gemini 3 Pro | Google | `google/gemini-3-pro-preview` | `gemini-3.0-pro` | $1.25 / $10 |

### Tier: Fast

| Model | Provider | OpenRouter ID | Vertex AI ID | Cost (in/out per 1M) |
|-------|----------|--------------|-------------|---------------------|
| Claude Haiku 4.6 | Anthropic | `anthropic/claude-haiku-4.6` | `claude-haiku-4-6@20250218` | $0.80 / $4 |
| Gemini 3.0 Flash | Google | `google/gemini-3.0-flash` | `gemini-3.0-flash` | $0.10 / $0.40 |
| Gemini 3.0 Flash Lite | Google | `google/gemini-3.0-flash-lite` | — | $0.05 / $0.20 |

### Tier: Economy

| Model | Provider | OpenRouter ID | Cost (in/out per 1M) |
|-------|----------|--------------|---------------------|
| DeepSeek V3.2 | DeepSeek | `deepseek/deepseek-v3.2` | $0.30 / $0.88 |

**Default model:** `gemini-3.0-flash` (configurable via `OPENROUTER_MODEL`)
**Env:** `OPENROUTER_API_KEY`, `GOOGLE_CLOUD_PROJECT`, `GOOGLE_APPLICATION_CREDENTIALS`

---

## 2. Voice Pipeline

**Router:** ACHEEVY → `/api/voice/tts`, `/api/voice/stt`

### Text-to-Speech (TTS)

| Provider | Model | Role | Protocol |
|----------|-------|------|----------|
| **ElevenLabs** | `eleven_turbo_v2_5` | Primary TTS | REST API |
| **Deepgram** | Aura-2 | Fallback TTS | REST API |
| **Browser SpeechSynthesis** | — | Emergency fallback | Local |

### Speech-to-Text (STT)

| Provider | Model | Role | Protocol |
|----------|-------|------|----------|
| **Groq** | Whisper-large-v3-turbo | Primary STT | REST API |
| **Deepgram** | Nova-3 | Fallback STT | REST API |

**Env:** `ELEVENLABS_API_KEY`, `DEEPGRAM_API_KEY`, `GROQ_API_KEY`

---

## 3. Search & Research

**Router:** UEF Gateway → Unified search library

| Provider | Role | Protocol | Env |
|----------|------|----------|-----|
| **Brave Search** | Primary web search | REST API | `BRAVE_API_KEY` |
| **Tavily** | Fallback #1 | REST API | `TAVILY_API_KEY` |
| **Serper** | Fallback #2 | REST API | `SERPER_API_KEY` |

---

## 4. Payments & Billing

**Router:** `/api/stripe/*` (ACHEEVY only — never exposed to agents)

| Provider | Role | Env |
|----------|------|-----|
| **Stripe** | Checkout, subscriptions (5-tier: Pay-per-Use, Coffee $7.99, Data Entry $29.99, Pro $99.99, Enterprise $299) | `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY` |
| **LUC Engine** | Internal token cost tracking | Self-hosted |

---

## 5. Messaging / Social Channels

**Router:** `/api/social/gateway` → provider-specific webhooks

| Provider | Protocol | Env |
|----------|----------|-----|
| **Telegram** | Bot API (webhook) | `TELEGRAM_BOT_TOKEN` |
| **Discord** | Bot + Webhook (slash commands) | `DISCORD_BOT_TOKEN`, `DISCORD_PUBLIC_KEY` |
| **WhatsApp** | Business API (Meta Graph v18.0) | `WHATSAPP_API_TOKEN`, `WHATSAPP_VERIFY_TOKEN` |
| **GitHub** | OAuth + REST API | `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` |

---

## 6. Authentication & Identity

| Provider | Role | Env |
|----------|------|-----|
| **NextAuth.js** | Session management | `NEXTAUTH_SECRET`, `NEXTAUTH_URL` |
| **Google OAuth** | Social login | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` |
| **Prisma + SQLite** | User accounts, sessions | `DATABASE_URL` |

---

## 7. Storage & Databases

| Provider | Role | Protocol |
|----------|------|----------|
| **Prisma + SQLite** | User accounts, sessions | ORM |
| **better-sqlite3** (UEF Gateway) | Projects, plugs, deployments, audit, evidence | Direct |
| **Firebase/Firestore** | Session prefs, task queue (optional, has in-memory fallback) | gRPC |
| **Redis** | Session cache, pub/sub between services | TCP |
| **Google Cloud Storage** | Evidence Locker artifacts (Phase 2) | REST API |
| **Local filesystem** | Upload storage (`public/uploads/`) | Disk |

---

## 8. Design & UI Generation

| Provider | Role | Protocol |
|----------|------|----------|
| **Nano Banana Pro** | Design system standards, UI component generation | Internal |
| **Google Stitch** | AI-powered UI scaffolding from prompts | Cloud API |

---

## 9. Video Generation

| Provider | Model | Role | Env |
|----------|-------|------|-----|
| **Kling.ai** | `kling-2.6-motion` | Primary video generation | `KLING_API_KEY` |
| **Remotion** | — | Programmatic video rendering | Self-hosted |

---

## 10. Code Execution & Sandboxing

| Provider | Role | Env |
|----------|------|-----|
| **E2B** | Cloud code sandbox (multi-language) | `E2B_API_KEY` |
| **Code Ang** (Chicken Hawk) | Sandboxed file ops in Docker | Internal |

---

## 11. Web Scraping & Crawling

| Provider | Role | Env |
|----------|------|-----|
| **Firecrawl** | Primary web scraper | `FIRECRAWL_API_KEY` |
| **Apify** | Scraper library fallback | `APIFY_API_KEY` |

---

## 12. Email

| Provider | Role | Env |
|----------|------|-----|
| **Resend** | Primary email delivery | `RESEND_API_KEY` |
| **SendGrid** | Fallback email | `SENDGRID_API_KEY` |

---

## 13. Workflow Automation (Core — n8n)

n8n is **core infrastructure**, not optional. It powers:
- PMO pipeline (project intake → Boomer_Ang dispatch)
- Deployment workflows
- Boomer_Ang task execution
- Chicken Hawk and Lil_Hawk orchestration
- Webhook ingestion for social channels
- Scheduled jobs (cron-based scouting, reporting)

| Provider | Role | Protocol |
|----------|------|----------|
| **n8n** | PMO pipeline, deployment workflows, Boomer_Ang dispatch, cron jobs | REST API + webhooks |
| **Composio** | Unified API integrations | REST API |

**Env:** `N8N_URL`, `N8N_API_KEY`, `COMPOSIO_API_KEY`

---

## 14. Analytics

| Provider | Role | Env |
|----------|------|-----|
| **PostHog** | Product analytics | `POSTHOG_KEY` |
| **Plausible** | Privacy-first analytics | `PLAUSIBLE_DOMAIN` |

---

## 15. 3D / Visualization

| Provider | Role | Protocol |
|----------|------|----------|
| **Three.js** | Hangar 3D environment | Client-side |

---

## 16. Infrastructure

| Service | Role | Location |
|---------|------|----------|
| **GCP Cloud Run** | Frontend + UEF Gateway (auto-scaling, managed) | GCP |
| **GCP Artifact Registry** | Docker image storage (`aims-docker` repo) | GCP |
| **GCP Cloud Build** | CI/CD pipeline (build, test, deploy on push to main) | GCP |
| **GCP Vertex AI** | LLM calls (Claude, Gemini via Model Garden) | GCP |
| **GCP Secret Manager** | Production secrets (API keys, auth tokens) | GCP |
| **Hostinger VPS** (76.13.96.107) | n8n, Redis, agent containers (stateful services) | VPS |
| **Docker Compose** | VPS stateful service orchestration | VPS |

---

## 17. Internal Services

| Service | Port | Runs On | Purpose |
|---------|------|---------|---------|
| **Frontend** (Next.js) | 3000 | Cloud Run | App UI, auth, chat, payments |
| **UEF Gateway** | 3001 | Cloud Run | All external tool access, LLM proxy, Port Authority |
| **ACHEEVY Service** | 3003 | Cloud Run | Orchestration, chat, payments |
| **House of Ang** | 3002 | Cloud Run | Boomer_Ang registry |
| **n8n** | 5678 | VPS | Workflow automation engine (core) |
| **Per\|Form Scout Hub** | 5001 | Sports scouting (Per\|Form Platform) |
| **Per\|Form Film Room** | 5002 | Film analysis (Per\|Form Platform) |
| **Per\|Form War Room** | 5003 | Rankings & content (Per\|Form Platform) |
| **Boost\|Bridge** | 7001 | Simulation/trial |
| **Veritas** | 7001 | Content ingest/report |
| **Estate Scout** | 6001 | Real estate scouting |
| **Chicken Hawk Core** | 4001 | Execution engine |
| **Chicken Hawk Policy** | 4002 | Policy enforcement |
| **Chicken Hawk Audit** | 4003 | Audit logging |
| **Chicken Hawk Voice** | 4004 | Voice pipeline |
| **AVVA NOON / SmelterOS** | 9020 / 4100 | OS governance / Puter runtime |
| **LUC Engine** | 9010 | Token cost tracking |
| **ByteRover** | 7000 | Context tree / RAG |

---

## 18. Cloned Repos (vendor/)

| Repo | Purpose | Location |
|------|---------|----------|
| **common-ground-core** | Observability, telemetry, shared agent infra | `vendor/common-ground-core/` |
| **intelligent-internet** | II-Agent framework, autonomous agent runtime | `vendor/intelligent-internet/` |

---

## 19. Per|Form Platform — Sports Verticals

Per|Form is the sports analytics platform. Gridiron (football) is **one category** within it.

| Category | Services | Status |
|----------|----------|--------|
| **Gridiron** (Football) | Scout Hub, Film Room, War Room | Built |
| **Basketball** | — | Planned |
| **Baseball** | — | Planned |
| **Soccer** | — | Planned |

---

## Routing Map (Who Calls What)

```
User → ACHEEVY → UEF Gateway → [LLM / Voice / Search / etc.]
User → ACHEEVY → Chicken Hawk → [Code Ang / Stitch / ORACLE]
User → ACHEEVY → n8n → [Workflow / Boomer_Ang dispatch / Cron jobs]
AVVA NOON → [Puter / LUC / Metrics / Audit]
OpsConsole_Ang → [CommonGround / Health / Telemetry]
```

Every external call goes through Port Authority (UEF Gateway).
No direct service exposure. No exceptions.
