# M.I.M. D.U.M.B. Manifest — Superagent Clone
## Make It Mine — Deep Universal Meticulous Build

**Target Product:** Superagent by Airtable (superagent.com)
**Codename:** DEEP SCOUT
**Date:** February 19, 2026
**Pipeline Stage:** Phase 2 Complete (Research + Extract + Plan)

---

## PHASE 1: STRUCTURED FACTS (Extraction)

### Product Identity

| Field | Value |
|---|---|
| **Product Name** | Superagent |
| **Parent Company** | Airtable (acquired DeepSky/Gradient, Oct 2025) |
| **Launch Date** | January 27, 2026 |
| **Tagline** | "Think deeper." |
| **URL** | superagent.com |
| **Category** | AI-powered business research platform |
| **Built On** | DeepSky acquisition ($40M raised pre-acquisition) |
| **CTO** | David Azose (ex-OpenAI, led ChatGPT business products) |
| **CEO** | Howie Liu (Airtable founder) |

### What It Does

AI-powered business research assistant that takes complex questions and turns them into
interactive, presentation-ready deliverables using multi-agent orchestration.

**The core loop:**
1. User asks a business question
2. Coordinating agent builds a research plan
3. Specialized agents deploy in parallel (up to 20 sub-agents)
4. Each agent researches its domain (financials, competitors, market data, news)
5. System synthesizes into an interactive deliverable (not a wall of text)

### Target Audience

- **Primary:** Business professionals (founders, finance teams, sales, product, marketing)
- **Enterprise:** Fortune 100 companies (80% of Fortune 100 already on Airtable)
- **Secondary:** Analysts, consultants, investors doing market research
- **Expansion:** Anyone who needs deep research turned into polished output

### Key Features

| Feature | Description |
|---|---|
| **Super Reports** | Interactive scrollytelling websites with charts, data viz, and citations |
| **Super Slides** | Polished slide decks as interactive websites with pagination and charts |
| **Super Documents** | Professional document generation |
| **Website Generation** | Turn research into standalone websites |
| **Image Generation** | AI-generated visuals for reports |
| **Multi-Agent Orchestration** | Central orchestrator + parallel specialized agents |
| **Premium Data Sources** | FactSet, Crunchbase, SEC filings, earnings transcripts |
| **Citation Verification** | Every fact backed by verified, traceable sources |
| **Interactive Visualizations** | Dynamic charts, graphs, comparison tables, hover tooltips |
| **Discover/Gallery** | Browse what others have built (public research showcase) |

### Monetization

| Tier | Price | Details |
|---|---|---|
| Free | $0 | 10 free research reports |
| DeepSky Pro | $20/mo | 200 research runs/month |
| Overage | $0.50/run | Beyond monthly allotment |
| Power User | ~$200/mo | High-volume tier (details TBD) |
| Enterprise | Custom | Airtable integration, premium data sources |

### Tech Stack (Inferred)

| Layer | Technology |
|---|---|
| **Frontend** | React/Next.js (interactive scrollytelling, SPA behavior) |
| **Agent Framework** | Custom multi-agent orchestrator (DeepSky architecture) |
| **LLMs** | OpenAI, Anthropic, Google (multiple frontier models) |
| **Data Sources** | FactSet, Crunchbase, SEC EDGAR, earnings transcripts, web scraping |
| **Visualization** | D3.js or Recharts (interactive charts, filterable tables) |
| **Infrastructure** | Likely AWS/GCP (Airtable is AWS-heavy) |
| **Search** | Web search APIs + premium data provider APIs |
| **Output Rendering** | Server-side rendered HTML/CSS for reports, slides, websites |

### Competitors

| Competitor | Differentiation |
|---|---|
| **Perplexity AI** | Quick answers with citations, but no interactive deliverables |
| **Google Gemini Deep Research** | Google's search infrastructure, but output is text-heavy |
| **Claude Projects** | Persistent research environments, but manual synthesis |
| **Google NotebookLM** | Document-focused, no multi-agent orchestration |
| **MindStudio** | Custom agent builder, but no polished output generation |
| **ChatGPT Deep Research** | OpenAI's research mode, but output is markdown/text |
| **Manus AI** | General-purpose agent (being acquired by Meta) |

### Differentiators (What Makes Superagent Unique)

1. **Output quality** — Not text. Interactive scrollytelling with charts and citations.
2. **Multi-agent parallel execution** — Up to 20 agents working simultaneously
3. **Premium data sources** — FactSet, Crunchbase, SEC filings (not just web search)
4. **Airtable ecosystem** — 500K+ organizations, 80% Fortune 100 already customers
5. **Full execution visibility** — Users can watch agents work, see reasoning
6. **Boardroom-ready** — Output is presentation-quality, not raw AI text

---

## PHASE 2: CLONE PLAN — "DEEP SCOUT"

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  DEEP SCOUT — Architecture                                  │
│                                                             │
│  Frontend (Next.js 14 App Router)                           │
│  ├── /research — Research input + prompt selection          │
│  ├── /research/[id] — Live agent execution stream           │
│  ├── /report/[id] — Interactive scrollytelling report       │
│  ├── /slides/[id] — Interactive slide deck                  │
│  ├── /document/[id] — Professional document view            │
│  ├── /discover — Public gallery of generated research       │
│  └── /dashboard — User's research history + analytics       │
│                                                             │
│  Backend (Express / UEF Gateway extension)                  │
│  ├── /api/research — Create new research job                │
│  ├── /api/research/[id]/stream — SSE for live execution     │
│  ├── /api/research/[id]/status — Job status polling         │
│  ├── /api/research/[id]/output — Fetch generated output     │
│  ├── /api/discover — Public gallery feed                    │
│  └── /api/templates — Report/slide/doc templates            │
│                                                             │
│  Agent Orchestrator (Core Innovation)                       │
│  ├── PlannerAgent — Breaks question into research plan      │
│  ├── WebSearchAgent — Brave/Tavily/Serper searches          │
│  ├── DataSourceAgent — Premium API queries (FactSet, etc.)  │
│  ├── FinancialAgent — SEC filings, earnings, financials     │
│  ├── CompetitiveAgent — Competitor analysis                 │
│  ├── SynthesisAgent — Combines all findings                 │
│  └── RenderAgent — Generates interactive output             │
│                                                             │
│  Output Renderers                                           │
│  ├── ScrollytellingRenderer — Interactive report pages      │
│  ├── SlideRenderer — Paginated slide decks                  │
│  ├── DocumentRenderer — Professional docs (PDF export)      │
│  └── ChartEngine — D3/Recharts data visualizations          │
│                                                             │
│  Infrastructure                                             │
│  ├── Redis — Job queue, caching, rate limiting              │
│  ├── Firestore — Research history, user data                │
│  ├── GCS — Generated output storage (HTML, images, PDFs)    │
│  └── Cloud Run — Agent execution (burst capacity)           │
└─────────────────────────────────────────────────────────────┘
```

### Build Phases

#### Phase 1: Research Engine Core (Week 1-2)

| Task | Complexity | Details |
|---|---|---|
| Multi-agent orchestrator | HIGH | Central planner that decomposes questions into parallel research tasks |
| Web search integration | MEDIUM | Brave + Tavily + Serper with fallback chain (already partially built in M.I.M. pipeline) |
| LLM extraction pipeline | MEDIUM | Structured fact extraction from search results (already built) |
| Research plan generator | MEDIUM | Takes a question, outputs a research plan with 5-20 sub-tasks |
| Agent execution engine | HIGH | Parallel agent execution with SSE streaming to frontend |
| Evidence store | LOW | Firestore collection for research artifacts with citations |

#### Phase 2: Output Renderers (Week 2-3)

| Task | Complexity | Details |
|---|---|---|
| Scrollytelling report renderer | HIGH | HTML/CSS/JS generation for interactive scroll-driven reports |
| Chart/visualization engine | HIGH | D3.js or Recharts integration for dynamic data viz |
| Slide deck renderer | MEDIUM | Paginated HTML slides with keyboard navigation |
| Document renderer | MEDIUM | Professional document layout with PDF export |
| Template system | LOW | Predefined layouts for different report types |
| Citation system | MEDIUM | Inline citations with source links and hover previews |

#### Phase 3: Frontend Experience (Week 3-4)

| Task | Complexity | Details |
|---|---|---|
| Research input page | LOW | Question input + output type selector + industry context |
| Live execution stream | MEDIUM | SSE-driven UI showing agents working in real-time |
| Report viewer | HIGH | Full scrollytelling reader with responsive design |
| Slide viewer | MEDIUM | Slide deck viewer with arrow key navigation |
| Discover gallery | LOW | Public feed of generated research with thumbnails |
| User dashboard | LOW | Research history, favorites, analytics |

#### Phase 4: Premium Data Sources (Week 4-5)

| Task | Complexity | Details |
|---|---|---|
| SEC EDGAR integration | MEDIUM | 10-K, 10-Q, 8-K filing extraction |
| Crunchbase API | LOW | Company funding, investors, team data |
| Financial data API | MEDIUM | FactSet or Alpha Vantage for market data |
| News aggregation | LOW | Real-time news from multiple sources |
| Custom data connectors | LOW | Pluggable architecture for new data sources |

#### Phase 5: Polish + ORACLE Gates (Week 5-6)

| Task | Complexity | Details |
|---|---|---|
| Citation verification | MEDIUM | Automated fact-checking against source material |
| Output quality scoring | LOW | Automated quality assessment of generated reports |
| ORACLE 7-gate verification | HIGH | Full gate suite before any research goes live |
| Rate limiting + billing | MEDIUM | Usage tracking, tiered limits, payment integration |
| Public sharing + embeds | LOW | Shareable URLs for generated research |

### Required Services

| Service | Purpose | Status in A.I.M.S. |
|---|---|---|
| Brave Search API | Primary web search | Key provisioned |
| Tavily API | Fallback search + extract | Key needed |
| Serper API | Additional search fallback | Key needed |
| OpenRouter | LLM routing (multiple models) | Already wired |
| Firestore | Research history, user data | Already wired |
| GCS | Output artifact storage | Available |
| Redis | Job queue, caching | Already running |
| Cloud Run | Agent execution burst | Available |

### Recommended Stack

| Layer | Choice | Reason |
|---|---|---|
| Frontend | Next.js 14 (App Router) | Already our stack, SSR for reports |
| Charts | Recharts + D3.js | Recharts for standard charts, D3 for custom viz |
| Streaming | Server-Sent Events (SSE) | Already using SSE for ACHEEVY chat |
| Agent Orchestrator | Custom TypeScript | Extend existing ACHEEVY orchestrator |
| PDF Export | Puppeteer | Render HTML reports to PDF |
| Slide Navigation | Reveal.js or custom | Keyboard-driven slide presentations |
| Scrollytelling | Scrollama or custom | Scroll-driven narrative framework |
| Styling | Tailwind CSS | Already our stack |

---

## PHASE 3: ADAPTATION PLAN — How A.I.M.S. Does It Different

### Unique Angle

**Superagent researches. ACHEEVY researches AND builds.**

Superagent gives you a report. ACHEEVY gives you a report AND then builds the product
described in that report. The M.I.M. pipeline doesn't stop at research — it feeds directly
into Chicken Hawk to generate working software.

**The pitch:** "Superagent tells you about the EV market. ACHEEVY tells you about the
EV market, then builds you an EV comparison website, then deploys it to your custom domain."

### Differentiators

| # | Differentiator | Why It Matters |
|---|---|---|
| 1 | **Research → Build pipeline** | Superagent stops at the report. ACHEEVY feeds research into Chicken Hawk to generate working software. |
| 2 | **Industry-specific intelligence** | 6 built-in industry presets with terminology mapping — output speaks the customer's language, not generic business jargon |
| 3 | **Voice + Vision mode** | DIY projects get live camera + voice guidance. No competitor offers this. |
| 4 | **ORACLE verification** | Every output goes through 7 gates (security, compliance, UX, performance). Superagent has no equivalent quality gate system. |
| 5 | **Full execution transparency** | Users see every agent, every search, every decision — with cost tracking via LUC |
| 6 | **Cost-aware by design** | LUC pre-flight estimates cost before execution. Users never get surprise bills. |
| 7 | **Self-hosted option** | Deploy on your own infrastructure. Superagent is SaaS-only with no self-hosted path. |
| 8 | **ACHEEVY personality** | Not a generic chatbot. ACHEEVY has voice, personality, and continuity across sessions. |

### Target Niche

**Small business owners and solo founders who need research + execution, not just reports.**

Superagent targets enterprise analysts who read reports and make decisions.
ACHEEVY targets people who need the research AND the execution — they don't have a team
to hand the report off to.

**Specific niches:**
- Solo founders validating product ideas (research → build → deploy)
- Small agencies needing competitive intelligence + deliverables for clients
- Consultants who need to turn research into proposals AND prototypes
- Tradespeople who need DIY project guidance (voice + vision, unique to us)

### Brand Suggestions

| Element | Suggestion |
|---|---|
| Feature Name | "Deep Scout" (research) + "Deep Build" (execute) |
| Tagline | "Research it. Build it. Ship it." |
| Position | The only AI platform that goes from question to working product |
| Visual Identity | Dark glass UI (already built), gold accents, professional but approachable |

### Pricing Strategy

| Tier | Price | What You Get |
|---|---|---|
| **Free** | $0 | 5 research reports/month, text-only output |
| **Scout** | $19/mo | 50 reports/month, interactive reports + slides, basic data sources |
| **Builder** | $49/mo | Unlimited reports + 5 full builds/month (Chicken Hawk execution) |
| **Enterprise** | $199/mo | Unlimited everything, premium data sources, priority execution, self-hosted option |

**Key insight:** Superagent charges $20/mo for research only. We charge $49/mo for
research + build. The value gap is enormous — we're 2.5x the price but deliver 10x the value.

### Launch Steps

1. **Week 1-2:** Ship the research engine as a new route under `/dashboard/deep-scout`
2. **Week 3:** Add scrollytelling report renderer (the killer feature users share)
3. **Week 4:** Wire research output into Chicken Hawk for auto-build
4. **Week 5:** Add premium data sources (SEC, Crunchbase)
5. **Week 6:** Launch Discover gallery for public research showcase
6. **Week 7:** Add slide deck and document renderers
7. **Week 8:** Open billing, launch publicly

---

## PHASE 4: BUILD SPEC (Chicken Hawk Task File)

```yaml
# tasks/CHICKENHAWK-DEEP-SCOUT.yaml
agent: CHICKEN_HAWK
model: openrouter/claude-opus-4-5
fallback_model: google/gemini-3-flash-thinking
role: Build Executor — Deep Scout Module

tasks:
  - taskId: DS001
    name: Research Engine Core
    description: >
      Build multi-agent research orchestrator that decomposes business
      questions into parallel research tasks, executes them via web search
      and data source agents, and synthesizes findings into structured output.
    tools:
      - code-ang
      - bash-sandbox
      - firestore-write
    successCriteria:
      - Orchestrator decomposes question into 5+ parallel tasks
      - Web search returns results from 3+ sources
      - Synthesis produces structured JSON with citations
      - SSE stream shows real-time agent progress
    maxRetries: 10
    onFailure: REVISE

  - taskId: DS002
    name: Scrollytelling Report Renderer
    description: >
      Build HTML/CSS/JS renderer that takes structured research output
      and generates interactive scrollytelling reports with embedded charts,
      data tables, and citation links. Output is a standalone HTML page
      stored in GCS and served via CDN.
    tools:
      - code-ang
      - stitch-mcp
      - bash-sandbox
    successCriteria:
      - Report renders on mobile and desktop
      - Charts are interactive (hover, filter)
      - Citations link to source URLs
      - Lighthouse score >= 90
    maxRetries: 10
    onFailure: REVISE

  - taskId: DS003
    name: Research → Build Bridge
    description: >
      Wire research output into MakeItMine clone engine so that a
      completed research report can automatically generate a Chicken Hawk
      build manifest for the product described in the research.
    tools:
      - code-ang
      - firestore-write
    successCriteria:
      - Research output feeds into MakeItMine.clone()
      - Clone produces valid ProjectSpec
      - User can approve and trigger build from research view
    maxRetries: 5
    onFailure: REVISE
```

---

## Evidence Sources

| Source | URL | What We Got |
|---|---|---|
| Airtable Newsroom | airtable.com/newsroom/introducing-superagent | Launch announcement, feature list, architecture |
| TechCrunch | techcrunch.com (Jan 27, 2026 article) | Pricing, DeepSky backstory, competitive positioning |
| WebProNews | webpronews.com | Multi-agent architecture details, enterprise strategy |
| VentureBeat | venturebeat.com | Execution visibility, context problem solution |
| VKTR | vktr.com | Platform capabilities, Super Reports details |
| Sacra | sacra.com/c/airtable | Revenue ($478M ARR), growth metrics |
| Tracxn | tracxn.com | Company profile, competitor mapping |
| AIPure | aipure.ai/products/superagent-from-airtable | Feature review, pricing details |
| AI Agents Directory | aiagentsdirectory.com/agent/superagent | Alternatives and ratings |

---

## Decision Gate

**Should we build this?**

| Factor | Score | Notes |
|---|---|---|
| Market demand | 9/10 | AI research tools are exploding. $150-200B market. |
| Technical feasibility | 8/10 | We already have 60% of the pipeline (search, extract, LLM routing) |
| Competitive moat | 7/10 | Research → Build pipeline is unique. No competitor does both. |
| Revenue potential | 8/10 | $49/mo Builder tier with high retention (users build on their research) |
| Effort to ship | 6/10 | 6-8 weeks for full feature parity. Scrollytelling renderer is the hard part. |
| Strategic fit | 10/10 | This IS what M.I.M. was designed for. Deep Scout is M.I.M.'s killer app. |

**Verdict: BUILD IT.**

---

*This manifest was generated by the M.I.M. D.U.M.B. pipeline (Phase 2: Research + Extract + Plan).*
*Next step: Human approval → Phase 4 Chicken Hawk execution.*

*— ACHEEVY / A.I.M.S.*
