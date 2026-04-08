# Boost|Bridge — Ecosystem Architecture

> "Productively Fun." We use AI to solve problems, not just generate content.
> We bridge the gap between human creativity and AI execution.

## Identity

| | Old (Veritas) | New (Boost|Bridge) |
|---|---|---|
| **Vibe** | Stiff, corporate, "the firm" | Educated, chill, culturally fluent |
| **Role** | Research verifier | Human companion + simulation lab |
| **Tone** | "Per our analysis..." | "Let's remix this strategy" |
| **Quality Framework** | Six Sigma (named) | "High Standards" / "Top Tier" (same rigor, different framing) |
| **Output** | Risk reports | Simulation data, field reports, accredited badges |

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│                        USERS                                  │
│          Web Dashboard  ·  Discord  ·  API Direct             │
└──────────┬──────────────────┬──────────────────┬─────────────┘
           │                  │                  │
     ┌─────▼─────┐    ┌──────▼──────┐    ┌──────▼──────┐
     │ THE CROWD  │    │ THE PROVING │    │  THE DOJO   │
     │ Synthetic  │    │   GROUND    │    │ P2P Training│
     │  Persona   │    │ Trial Run   │    │ & Accredit- │
     │  Engine    │    │Orchestrator │    │   ation     │
     └─────┬─────┘    └──────┬──────┘    └──────┬──────┘
           │                  │                  │
     ┌─────▼──────────────────▼──────────────────▼─────────────┐
     │              BOOST|BRIDGE SERVER (Bun, port 7001)        │
     │                                                          │
     │   LLM: Claude via OpenRouter (no more Perplexity)        │
     │   Search: Brave Search API (grounded data)               │
     │   Integrity: SHA-256 hash chain (badge verification)     │
     └─────┬──────────────────┬──────────────────┬─────────────┘
           │                  │                  │
     ┌─────▼─────┐    ┌──────▼──────┐    ┌──────▼──────┐
     │  Discord   │    │  Discord    │    │  Discord    │
     │ #synthetic │    │ #market-    │    │#accredit-   │
     │ -feedback  │    │  sims       │    │ation-log    │
     │            │    │ #agent-     │    │             │
     │            │    │  roast      │    │             │
     └────────────┘    └─────────────┘    └─────────────┘
```

---

## The Three Pillars

### A. Synthetic Persona Engine — "The Crowd"

**Purpose:** Evaluate market presence via simulation, not just scraping.

**How it works:**
1. User submits product/idea description + target demographic
2. Engine generates 5-1,000 synthetic personas with specific demographics, biases, spending habits
3. Each persona "experiences" the product and gives brutally honest feedback
4. System aggregates: NPS score, willingness to use/pay, friction points, delight points
5. Companion generates executive summary and actionable recommendations

**Six Sigma Connection:** This is Measure/Analyze on steroids. Instead of small sample surveys, you get statistically significant synthetic data instantly.

**API Endpoints:**
- `POST /api/crowd/simulate` — Start simulation
- `GET /api/crowd/job/:id` — Poll status
- `GET /api/crowd/stream/:id` — SSE real-time events
- `GET /api/crowd/reports` — List completed reports
- `GET /api/crowd/report/:id` — Full report detail

### B. Trial Run Orchestrator — "The Proving Ground"

**Purpose:** Bridge between synthetic simulation and real-world validation.

**How it works:**
1. User creates trial config (product, target demo, duration, hypotheses)
2. Engine generates recruitment plan + onboarding flow
3. Real trial users enroll, go through checkpoints
4. System tracks completion, friction, drop-off
5. Generates "Field Report" with funnel analysis and next steps

**API Endpoints:**
- `POST /api/trial/create` — Create trial
- `GET /api/trial/:id` — Get trial details
- `POST /api/trial/:id/enroll` — Enroll participant
- `POST /api/trial/:id/feedback` — Submit participant feedback
- `POST /api/trial/:id/report` — Generate field report

### C. P2P Training Dojo — "The Standard"

**Purpose:** Peer-to-Peer training with AI-evaluated accreditation.

**How it works:**
1. Instructor submits curriculum (lessons, assessment)
2. AI evaluates against "Black Belt" standards (7 criteria, 100-point scale, 70 to certify)
3. Learners take courses and assessments
4. AI grades responses (including practical/short-answer via LLM)
5. Passing learners earn SHA-256 verified "Boost Badges"

**Belt Tiers:**
| Tier | Requirement |
|------|-------------|
| White Belt | Completed a course |
| Blue Belt | Passed assessment with 80%+ |
| Black Belt | Created and taught a certified course |
| Sensei | 3+ Black Belt certifications with 4.5+ rating |

**Certification Criteria (100 points):**
| Criteria | Max Score |
|----------|-----------|
| Content Depth | 20 |
| Practical Application | 20 |
| Assessment Quality | 15 |
| Structure & Flow | 15 |
| Clarity & Accessibility | 15 |
| Resource Quality | 10 |
| Originality | 5 |

**API Endpoints:**
- `POST /api/dojo/curriculum` — Submit curriculum
- `POST /api/dojo/curriculum/:id/evaluate` — Trigger Black Belt review
- `POST /api/dojo/curriculum/:id/grade` — Grade learner assessment
- `GET /api/dojo/badges` — List all badges
- `GET /api/dojo/curricula` — List all curricula
- `GET /api/badge/verify/:id` — Verify badge integrity

---

## Discord Server Architecture

### Categories & Channels

**THE LOUNGE (Culture & Connection)**
| Channel | Type | Purpose |
|---------|------|---------|
| #dap-up | Text | Welcome & intros |
| #the-cypher | Text | General chat, culture, off-topic |
| #aux-cord | Text | Music & vibes while working |

**THE LAB (Simulations)**
| Channel | Type | Webhook |
|---------|------|---------|
| #synthetic-feedback | Text | Receives Crowd simulation results |
| #market-sims | Text | Live simulation event logs |
| #agent-roast | Text | Adversarial persona critiques |

**THE DOJO (P2P Training)**
| Channel | Type | Webhook |
|---------|------|---------|
| #training-floor | Text | Live P2P sessions |
| #curriculum-dev | Forum | Course material collaboration |
| #accreditation-log | Text | Badge issuance notifications |

**THE BRIDGE (Support & Build)**
| Channel | Type | Purpose |
|---------|------|---------|
| #bridge-support | Text | Platform help |
| #build-log | Forum | Journey sharing |
| #feature-remix | Forum | Community feature voting |

### Discord Bot Commands

| Command | Description |
|---------|-------------|
| `/simulate` | Run a Crowd simulation from Discord |
| `/verify-badge` | Verify a Boost Badge by ID |
| `/leaderboard` | View Dojo leaderboard |
| `/setup-server` | Create channel structure (admin only) |

### Discord Roles

| Role | Color | Description |
|------|-------|-------------|
| Companion | Purple | AI bot — automated posts |
| Builder | Blue | Active platform user |
| White Belt | White | Completed a course |
| Blue Belt | Blue | 80%+ assessment score |
| Black Belt | Dark | Created certified course |
| Sensei | Gold | 3+ Black Belt certs |
| Trial Runner | Green | Currently in a trial |

---

## Technical Stack

| Component | Technology |
|-----------|------------|
| Runtime | Bun |
| Server | Bun.serve() HTTP |
| LLM | Claude via OpenRouter |
| Search | Brave Search API |
| Discord | discord.js v14 |
| Integrity | SHA-256 hash chain (Web3-ready) |
| Frontend | Next.js 15 (App Router) |
| Container | Docker (oven/bun:1-alpine) |
| Port | 7001 |

## Environment Variables

```env
# Required
OPENROUTER_API_KEY=          # LLM access (Claude)
BRAVE_API_KEY=               # Grounded search

# Optional — Companion model override
BB_COMPANION_MODEL=anthropic/claude-sonnet-4-20250514

# Optional — Discord
DISCORD_BOT_TOKEN=           # Bot token for slash commands
DISCORD_GUILD_ID=            # Server ID
DISCORD_WEBHOOK_SYNTHETIC=   # Webhook for #synthetic-feedback
DISCORD_WEBHOOK_ACCREDITATION= # Webhook for #accreditation-log
DISCORD_WEBHOOK_MARKET_SIMS= # Webhook for #market-sims
DISCORD_WEBHOOK_AGENT_ROAST= # Webhook for #agent-roast

# Frontend proxy
BOOST_BRIDGE_URL=http://localhost:7001
```

## Running

```bash
# Service
cd services/boost-bridge
bun install
bun run dev           # Dev with hot reload
bun run start         # Production

# Discord bot (separate process)
bun run discord

# Docker
docker build -t boost-bridge .
docker run -p 7001:7001 --env-file .env boost-bridge
```

---

## What Changed from Veritas

1. **No more Perplexity** — Replaced with Brave Search + Claude. Stop paying middlemen.
2. **No more "Boss-Grunt"** — Now "Companion" (Claude) + engine-specific agents (Personas, Evaluators).
3. **No more corporate tone** — "Productively Fun." Educated but not stiff.
4. **Three engines instead of one** — Crowd, Proving Ground, Dojo.
5. **Discord-native** — Not just a dashboard. The community IS the platform.
6. **Accreditation** — SHA-256 verified badges. Skills you can prove.
