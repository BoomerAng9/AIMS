---
name: model-garden-inventory
displayName: A.I.M.S. Model Garden — Complete API & Tool Inventory
version: 1.0.0
type: reference
tags: [model-garden, apis, tools, inventory, mind-map]
---

# A.I.M.S. Model Garden — Complete API & Tool Inventory

> The definitive map of every external API, tool, and service integrated into A.I.M.S.
> Use this as the source for building the visual mind map.

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

## 1. LLM Gateway (via OpenRouter)

**Router:** UEF Gateway → OpenRouter API
**Endpoint:** `/api/chat`, `/api/acheevy/chat`

| Provider | Models Available | Usage |
|----------|----------------|-------|
| **Anthropic** | Claude Opus 4.6, Claude Sonnet 4.6 | Primary for complex tasks, Chicken Hawk builds |
| **Google** | Gemini 2.5 Pro, Gemini 2.5 Flash, Gemini 3.0 Flash | Default chat, research, fallback |
| **Alibaba** | Qwen 3 | Alternative reasoning |
| **MiniMax** | MiniMax-01 | Alternative reasoning |
| **Zhipu** | GLM-5, GLM-4.7-Image | Chinese market, image gen |
| **Moonshot** | Kimi K2.5 | Deep research, M.I.M. aquifer |
| **01.AI** | WAN 2.1 | Alternative generation |
| **Groq** | LLaMA 3 (via Groq inference) | Fast responses, testing |

**Env:** `OPENROUTER_API_KEY`

---

## 2. Voice Pipeline

**Router:** ACHEEVY → `/api/voice/tts`, `/api/voice/stt`

### Text-to-Speech (TTS)

| Provider | Model | Role | Protocol |
|----------|-------|------|----------|
| **ElevenLabs** | `eleven_turbo_v2_5` | Primary TTS | REST API |
| **Deepgram** | Aura-2 | Fallback TTS | REST API |
| **NVIDIA PersonaPlex** | `personaplex-7b-v1` | Planned: full-duplex voice | WebSocket |
| **Browser SpeechSynthesis** | — | Emergency fallback | Local |

**Env:** `ELEVENLABS_API_KEY`, `DEEPGRAM_API_KEY`

### Speech-to-Text (STT)

| Provider | Model | Role | Protocol |
|----------|-------|------|----------|
| **Groq** | Whisper-large-v3-turbo | Primary STT | REST API |
| **NVIDIA Parakeet** | `parakeet-tdt-0.6b-v2` | Planned: best accuracy | Self-hosted |
| **Deepgram** | Nova-3 | Fallback STT | REST API |
| **OpenAI** | Whisper-large-v3 | Emergency fallback | REST API |

**Env:** `GROQ_API_KEY`, `DEEPGRAM_API_KEY`, `OPENAI_API_KEY`

---

## 3. Search & Research

**Router:** UEF Gateway → Unified search library

| Provider | Role | Protocol | Env |
|----------|------|----------|-----|
| **Brave Search** | Primary web search | REST API | `BRAVE_API_KEY` |
| **Tavily** | Fallback #1 | REST API | `TAVILY_API_KEY` |
| **Serper** | Fallback #2 | REST API | `SERPER_API_KEY` |
| **Gemini Research** | Deep research pipeline | Vertex AI | GCP service account |

---

## 4. Payments & Billing

**Router:** `/api/stripe/*`

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
| **Firebase Auth** | Planned: SmelterOS auth bridge | GCP service account |

---

## 7. Storage & Databases

| Provider | Role | Protocol |
|----------|------|----------|
| **Prisma + SQLite** | User accounts, sessions | ORM |
| **Firebase/Firestore** | Session prefs, task queue, flight recorder | gRPC |
| **Redis** | Session cache (TTL-based) | TCP |
| **Google Cloud Storage** | Evidence Locker artifacts | REST API |
| **Local filesystem** | Upload storage (`public/uploads/`) | Disk |

---

## 8. Video Generation

| Provider | Model | Role | Env |
|----------|-------|------|-----|
| **Kling.ai** | `kling-2.6-motion` | Primary video generation | `KLING_API_KEY` |
| **Remotion** | — | Programmatic video rendering | Self-hosted |
| **NVIDIA Cosmos** | Cosmos Predict 2.5 | Planned: world generation | Self-hosted |
| **Napkin AI** | — | Planned: diagram/visual generation | API key TBD |

---

## 9. Code Execution & Sandboxing

| Provider | Role | Env |
|----------|------|-----|
| **E2B** | Cloud code sandbox (multi-language) | `E2B_API_KEY` |
| **Code Ang** (Chicken Hawk) | Sandboxed file ops in Docker | Internal |

---

## 10. Web Scraping & Crawling

| Provider | Role | Env |
|----------|------|-----|
| **Firecrawl** | Primary web scraper | `FIRECRAWL_API_KEY` |
| **Apify** | Scraper library fallback | `APIFY_API_KEY` |

---

## 11. Email

| Provider | Role | Env |
|----------|------|-----|
| **Resend** | Primary email delivery | `RESEND_API_KEY` |
| **SendGrid** | Fallback email | `SENDGRID_API_KEY` |

---

## 12. Analytics

| Provider | Role | Env |
|----------|------|-----|
| **PostHog** | Product analytics | `POSTHOG_KEY` |
| **Plausible** | Privacy-first analytics | `PLAUSIBLE_DOMAIN` |

---

## 13. Workflow Automation

| Provider | Role | Protocol |
|----------|------|----------|
| **n8n** | PMO pipeline, deployment workflows, Boomer_Ang dispatch | REST API + webhooks |
| **Composio** | Unified API integrations | REST API |

**Env:** `N8N_URL`, `N8N_API_KEY`, `COMPOSIO_API_KEY`

---

## 14. 3D / Visualization

| Provider | Role | Protocol |
|----------|------|----------|
| **Three.js** | Hangar 3D environment | Client-side |
| **NVIDIA Omniverse** | Planned: SmelterOS 3D layer | TBD |

---

## 15. AI Design & UI Generation

| Provider | Role | Protocol |
|----------|------|----------|
| **Google Stitch** | UI component generation from prompts | Cloud API |
| **Nano Banana Pro** | Design system standards | Internal |

---

## 16. Infrastructure

| Service | Role | Location |
|---------|------|----------|
| **Hostinger VPS** (76.13.96.107) | n8n, Chicken Hawk, agent containers | VPS |
| **GCP** (ai-managed-services) | Cloud Run, GCS, Vertex AI | Cloud |
| **Nginx** | Reverse proxy | VPS |
| **Certbot** | SSL certificates (Let's Encrypt) | VPS |
| **Docker** | Container orchestration | VPS + Cloud Run |

---

## 17. Internal Services

| Service | Port | Purpose |
|---------|------|---------|
| **UEF Gateway** | 3001 | All external tool access, LLM proxy |
| **ACHEEVY Service** | 3003 | Orchestration, chat |
| **House of Ang** | 3002 | Agent registry |
| **Scout Hub** | 5001 | Per\|Form prospects |
| **War Room** | 5003 | Recruiting pipeline |
| **Boost\|Bridge** | 7001 | Simulation/trial |
| **Veritas** | 7001 | Content ingest/report |
| **Estate Scout** | 6001 | Real estate scouting |
| **Chicken Hawk Core** | 4001 (planned: 8081) | Execution engine |
| **Chicken Hawk Policy** | 4002 | Policy enforcement |
| **Chicken Hawk Audit** | 4003 | Audit logging |
| **Chicken Hawk Voice** | 4004 | Voice pipeline |
| **AVVA NOON / SmelterOS** | 9020 / 4100 | OS governance / Puter runtime |
| **PersonaPlex** | 8998 | Full-duplex voice (planned) |
| **Parakeet ASR** | 9030 | Speech recognition (planned) |
| **LUC Engine** | 9010 | Token cost tracking |
| **ByteRover** | 7000 | Context tree / RAG |

---

## Routing Map (Who Calls What)

```
User → ACHEEVY → UEF Gateway → [LLM / Voice / Search / etc.]
User → ACHEEVY → Chicken Hawk → [Code Ang / Stitch / ORACLE]
User → ACHEEVY → n8n → [Workflow / Boomer_Ang dispatch]
AVVA NOON → [Puter / LUC / Metrics / Audit]
OpsConsole_Ang → [CommonGround / Health / Telemetry]
```

Every external call goes through Port Authority (UEF Gateway).
No direct service exposure. No exceptions.
