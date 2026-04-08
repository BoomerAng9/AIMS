# Sandbox Projects — Autonomous Architecture

**Version:** 1.0.0
**Date:** 2026-02-14
**Status:** Active

---

## Overview

Sandbox projects are **autonomous verticals** that run outside the main A.I.M.S. platform. They are self-contained products powered by the A.I.M.S. infrastructure but with their own:

- Route namespace (`/sandbox/{project}`)
- Agent teams (dedicated Boomer_Angs + Hawks)
- Data pipelines
- Docker services (own ports, own containers)
- UI themes (inherit brand tokens, customize accents)

They are **not** embedded dashboard pages. They are **independent experiences** discoverable from the Workshop.

---

## Shared Principles

1. **ACHEEVY-Orchestrated** — All sandbox projects report through the chain of command
2. **Evidence-Gated** — "No proof, no done" — every completed task requires attestation
3. **Voice-First** — Primary input is voice; text is secondary
4. **Artifact-Driven** — Every session produces a tangible output
5. **LUC-Tracked** — All token usage and costs flow through LUC billing

---

## Project Registry

### LIVE

| Project | Route | Ports | Status | Tagline |
|---------|-------|-------|--------|---------|
| **Per\|Form** | `/sandbox/perform` | 5001–5003 | LIVE | "AI Sports Scouting + NIL Intelligence" |
| **Blockwise AI** | `/sandbox/blockwise` | 5004–5005 | LIVE | "Wealth Tech for the Culture" |
| **Veritas** | `/sandbox/veritas` | 5006 | LIVE | "Business Plan Fact-Checking" |

### COMING

| Project | Route | Ports | Status | Tagline |
|---------|-------|-------|--------|---------|
| **Strategos** | `/sandbox/strategos` | TBD | COMING | "Census-Backed Customer Personas" |
| **Grant Scout** | `/sandbox/grant-scout` | TBD | COMING | "Government Contracts & Grants Matching" |
| **Content Engine** | `/sandbox/content-engine` | TBD | COMING | "Video → Multi-Platform Clips" |

---

## Per|Form — Sports Scouting & NIL Intelligence

### Architecture

```
Per|Form Sandbox
├── Scout Hub (Port 5001)
│   ├── Lil_Bull_Hawk (argues UNDERRATED)
│   ├── Lil_Bear_Hawk (argues OVERRATED)
│   ├── Data Sources: Brave API, Firecrawl, OpenRouter
│   └── Targets: 300 HS prospects + 551 college players
│
├── Film Room (Port 5002)
│   ├── Meta SAM 2 (Segment Anything Model 2)
│   ├── GPU: NVIDIA Tesla T4 on Vertex AI
│   └── Analyzes: speed bursts, separation distance, route sharpness
│
└── War Room (Port 5003)
    ├── Chicken Hawk mediates Bull vs Bear debate
    ├── Produces: blog posts, podcast clips, rankings
    └── Applies: GROC + Luke formula → P.A.I. Score
```

### P.A.I. Scoring Formula

```
Score = (P × 0.40) + (A × 0.30) + (I × 0.30)

P (Performance)  — 40% — Stats from Firecrawl (MaxPreps, ESPN, 247Sports)
A (Athleticism)  — 30% — Video analysis via SAM 2 on Vertex AI
I (Intangibles)  — 30% — Brave Search (news, interviews, social)
```

**Tiers:**
| Score | Tier | Label |
|-------|------|-------|
| 101+ | PRIME | Generational Talent |
| 90–100 | A+ | Elite Prospect |
| 80–89 | A | Starter Potential |
| 70–79 | B+ | High-Upside |
| 60–69 | B | Solid Contributor |
| 50–59 | C+ | Developmental |
| <50 | C | Project |

### Pipeline

```
INGEST → ENRICH → GRADE (GROC + Luke) → RANK → WRITE_BIO → RENDER_CARD → PUBLISH_CDN → VALIDATE
```

### NIL Valuation Model

**Weight Distribution:**
- On-Field Performance: 30%
- Social Reach: 25%
- Market Size: 15%
- Position & Sport: 15%
- Brand & Character: 10%
- Team Success: 5%

**Tier Brackets:**
| Tier | Range | Example |
|------|-------|---------|
| Generational | $2M+ | Top 5 national recruit |
| Elite | $500K–$2M | Power 5 starter |
| Rising Star | $100K–$500K | Breakout player |
| Contributor | $10K–$100K | Solid role player |
| Emerging | $1K–$10K | Walk-on with social presence |

### Frontend Routes

```
/sandbox/perform
├── / (Overview — athlete grid with P.A.I. scores)
├── /athlete/[id] (Detail — stats, video, debate, NIL)
├── /nil (NIL dashboard — deals, valuation, tiers)
├── /rankings (Per|Form official rankings)
├── /war-room (Live debate feed — Bull vs Bear)
└── /film-room (Video analysis viewer)
```

---

## Blockwise AI — Real Estate Deal Intelligence

### Architecture

```
Blockwise AI Sandbox
├── Deal Engine (Port 5004)
│   ├── Property discovery (voice-driven search)
│   ├── Market analysis (comparable sales, trends)
│   ├── Data Sources: MLS feeds, Brave Search, Firecrawl
│   └── Boss-Grunt model: Claude Opus → Sonar/Brave grunts
│
└── Funding Router (Port 5005)
    ├── OPM (Other People's Money) path calculation
    ├── Lender matching
    ├── 90-day close timeline generation
    └── Deal summary artifact production
```

### Pipeline

```
DISCOVER → ANALYZE → FUND_PATH → TIMELINE → SUMMARY_ARTIFACT
```

### Deal Analysis Outputs

| Metric | Description |
|--------|-------------|
| ARV | After Repair Value |
| Rehab Cost | Estimated renovation budget |
| Cash-on-Cash | Return on invested cash |
| Cap Rate | Net income / property value |
| OPM Score | Viability of other people's money funding |
| Risk Grade | A–F risk assessment |

### Frontend Routes

```
/sandbox/blockwise
├── / (Overview — deal finder with voice prompt)
├── /deal/[id] (Detail — property analysis, OPM paths)
├── /portfolio (User's tracked deals)
├── /funding (OPM education + lender directory)
└── /timeline (90-day close plan builder)
```

---

## Veritas — Business Plan Fact-Checking

### Architecture

```
Veritas Sandbox
└── Fact Engine (Port 5006)
    ├── Document ingestion (PDF, DOCX, voice summary)
    ├── Claim extraction
    ├── Multi-source verification (Brave, Firecrawl, census data)
    ├── Variance detection ($180M error detection case study)
    └── Confidence-scored fact report
```

### Frontend Routes

```
/sandbox/veritas
├── / (Overview — upload or describe your business plan)
├── /report/[id] (Fact-check report with confidence scores)
└── /history (Previous verifications)
```

---

## Adding a New Sandbox Project

### Checklist

1. **Define** the vertical in `aims-skills/acheevy-verticals/`
2. **Create** Docker service(s) in `infra/docker-compose.sandbox.yml`
3. **Register** ports in the service registry
4. **Create** frontend routes under `/sandbox/{project-name}/`
5. **Assign** Boomer_Ang team + chain-of-command role cards
6. **Implement** the pipeline (Phase A: conversational → Phase B: execution)
7. **Wire** LUC cost tracking
8. **Add** to the project registry in this document
9. **Showcase** on `/discover` page

### Required Files

```
frontend/app/sandbox/{project}/
├── page.tsx          — Overview/landing
├── layout.tsx        — Sandbox-specific layout
└── [detail]/page.tsx — Detail views

backend/uef-gateway/src/{project}/
├── contracts/index.ts — Type contracts
├── pipeline/          — Pipeline stages
└── agents/            — Hawk/Boomer_Ang definitions

infra/
├── docker-compose.sandbox.yml — Container definitions
└── .env.sandbox               — Sandbox-specific env vars

aims-skills/acheevy-verticals/
└── {project}.vertical.md — Vertical definition (Phase A + B)
```

---

## Docker Compose Reference

```yaml
# infra/docker-compose.sandbox.yml
version: "3.8"

services:
  # ── Per|Form ──
  perform-scout-hub:
    build: ../services/gridiron/scout-hub
    ports: ["5001:5001"]
    networks: [sandbox-network]
    environment:
      - BRAVE_API_KEY=${BRAVE_API_KEY}
      - FIRECRAWL_API_KEY=${FIRECRAWL_API_KEY}
      - OPENROUTER_API_KEY=${OPENROUTER_API_KEY}

  perform-film-room:
    build: ../services/gridiron/film-room
    ports: ["5002:5002"]
    networks: [sandbox-network]
    environment:
      - GCP_PROJECT_ID=${GCP_PROJECT_ID}
      - VERTEX_AI_LOCATION=${VERTEX_AI_LOCATION}

  perform-war-room:
    build: ../services/gridiron/war-room
    ports: ["5003:5003"]
    networks: [sandbox-network]
    depends_on: [perform-scout-hub, perform-film-room]

  # ── Blockwise AI ──
  blockwise-deal-engine:
    build: ../services/blockwise/deal-engine
    ports: ["5004:5004"]
    networks: [sandbox-network]
    environment:
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - BRAVE_API_KEY=${BRAVE_API_KEY}

  blockwise-funding-router:
    build: ../services/blockwise/funding-router
    ports: ["5005:5005"]
    networks: [sandbox-network]
    depends_on: [blockwise-deal-engine]

  # ── Veritas ──
  veritas-fact-engine:
    build: ../services/veritas/fact-engine
    ports: ["5006:5006"]
    networks: [sandbox-network]

networks:
  sandbox-network:
    driver: bridge
```

---

*Each sandbox project is an autonomous business that happens to run on A.I.M.S. rails. Design them like products, not features.*
