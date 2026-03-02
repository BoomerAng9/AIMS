# Blockwise AI — Design Document

**Date:** 2026-03-01
**Status:** Approved
**Author:** Claude Opus 4.6 + Owner
**Branch:** perf/voice-hooks-luc-io-vercel-cleanup

---

## 1. Vision

Blockwise AI is a standalone neighborhood intelligence and real estate investment platform — a product created BY A.I.M.S. It helps real estate professionals find properties, analyze neighborhoods deeper than Redfin/Zillow/MLS, run flip calculations via the LUC Real Estate Calculator, and automate K1 tax reporting — all with ACHEEVY as the AI assistant, powered by Mercury 2 and ElevenLabs voice.

Blockwise AI lives in its own repository and deploys as an A.I.M.S. Plug. It connects to the A.I.M.S. platform via APIs for LUC metering, Evidence Locker storage, and SDT token delivery.

**Core value proposition:** Users get investor-grade neighborhood intel, a validated flip calculator, and automated K1 tax documents — capabilities that competitors charge thousands for or don't offer at all.

---

## 2. Architecture

### Approach: Standalone Repo — A.I.M.S. Plug

Blockwise AI is a **standalone Next.js 14 application** in its own repository (`blockwise-ai/`). It is a **product created BY A.I.M.S.**, not built into A.I.M.S. It deploys as an A.I.M.S. Plug — a Docker container on the VPS (port 51000+ range) with its own nginx reverse proxy, health check, and lifecycle management.

**A.I.M.S. integration is via external APIs:**
- LUC API — flip calculations, metering, billing
- ACHEEVY API — orchestration, chat context
- Evidence Locker API — document storage with SHA-256 custody chain
- SDT API — Secure Drop Tokens for partner/investor access

**UI framework:** ElevenLabs UI component library (17 pre-built React components) + shadcn/ui + Tailwind CSS.

**Primary LLM:** Mercury 2 (Inception Labs) — 1,000 tok/sec, OpenAI-compatible, real-time property Q&A.

### Route Structure

```
/                    → Property Search & Map (home)
/analyze             → Deep Neighborhood Intel
/flip                → LUC Real Estate Calculator
/k1                  → K1 Tax Generator
```

### Data Pipeline (4 Tiers)

```
TIER 1: Google Maps APIs (geospatial + rendering)
├── Maps JavaScript API → interactive map canvas
├── Places API (New) → place search, amenities, details
├── Geocoding API → address ↔ lat/lng
├── Street View Static API → property thumbnails
├── Maps Elevation API → flood risk / terrain
└── Maps Grounding Lite → agentic map queries

TIER 2: Brave Search API (real-time intel)
├── "{address} property records" → tax + deed
├── "{address} recent sales" → off-market comps
├── "{neighborhood} crime statistics" → safety
├── "{zip} building permits 2025-2026" → dev trend
├── "{address} foreclosure auction" → deal sourcing
├── "{neighborhood} gentrification" → growth signal
└── "{city} zoning changes" → rezoning alerts
Metered via LUC: BRAVE_QUERIES key

TIER 3: Firecrawl (deep scraping)
├── County assessor sites → tax assessed values
├── County recorder → deed history, liens, titles
├── Realtor.com/Zillow listings → comp enrichment
├── City permit portals → active permit details
├── GreatSchools.org → school ratings + reviews
├── SpotCrime/CrimeMapping → incident data
├── WalkScore.com → walkability breakdown
├── Census.gov → demographics, income, occupancy
└── Local MLS IDX feeds → active/sold listings
Metered via LUC: API_CALLS key

TIER 4: Structured APIs (premium, when keys configured)
├── ATTOM Data → property records, comps, AVM, hazards
├── Mashvisor → rental/Airbnb estimates, neighborhood scores
├── First Street → flood/fire/wind/heat/air risk (1-10)
├── AirDNA → STR revenue, occupancy, ADR
├── BatchData → skip tracing, owner lookup, batch enrichment
├── HouseCanary → block-level AVM (validates ARV)
└── Google Solar API → roof solar potential (already enabled)

Fallback chain: Tier 4 → Tier 3 → Tier 2
(If ATTOM has comps, skip scraping. If not, Firecrawl. If blocked, Brave.)
```

### AI Model Stack

| Model | Purpose | Access |
|-------|---------|--------|
| Mercury 2 (Inception Labs) | Primary conversation LLM for Blockwise ACHEEVY chat — 1,000 tok/sec, real-time responses for property Q&A, neighborhood analysis, deal verdicts | Inception API (OpenAI-compatible) |
| Claude (fallback/complex) | ACHEEVY orchestration for multi-step tasks, complex analysis, K1 generation | Anthropic API |
| Gemini | NotebookLM backend, Maps Grounding | GCP Generative Language API |
| Nano Banana Pro 2 (Gemini 3.1 Flash Image) | Visual content — property cards, infographics, report graphics with precise text rendering | GCP Generative Language API |
| ElevenLabs Agent SDK | Conversational voice for ACHEEVY | ElevenLabs API |
| C1 Thesys | Generative UI for K1 review | Thesys API |

### LUC Metering

All API calls are metered through LUC. Brave queries use `BRAVE_QUERIES` key. Firecrawl scrapes and structured API calls use `API_CALLS` key. Google Maps calls are tracked separately.

---

## 3. Module 1 — Property Search & Map (`/dashboard/blockwise`)

Interactive Google Maps canvas with investor-grade filters and ACHEEVY chat panel with ElevenLabs voice.

### Layout

Three-column layout:
- **Left:** Filter panel (location, price range, property type, bedrooms, ARV range, deal status) + scrollable results list
- **Center:** Full-bleed Google Map with property pins showing instant ROI estimates
- **Right:** Collapsible ACHEEVY chat panel with ElevenLabs Agent SDK voice session

### Differentiators vs Redfin/Zillow

- **Deal Status filter** — Excellent/Good/Marginal/Pass based on 70% Rule
- **ARV Range filter** — search by potential value, not just asking price
- **Instant ROI estimate** on every pin before clicking
- **Street View embedded** in property cards
- **Voice-first AI** — tap mic, say "What's the crime rate on this block?"
- **Chat drives the map** — "Show me all properties under 200K in this zip" triggers filter update
- **Saved Searches** — ACHEEVY monitors and pushes new matches

### ACHEEVY Chat Panel

- Collapsible right panel, defaults open on desktop, floating mic button on mobile
- Context-aware — knows which property/pin is selected
- ElevenLabs Agent SDK for conversational voice
- Rich cards in chat (neighborhood scores, flip results, K1 summaries)
- Persistent across all Blockwise tabs

### Data Sources

- Google Maps JavaScript API — map rendering
- Google Places API (New) — property search, place details
- Google Geocoding API — address resolution
- Google Street View Static API — thumbnail previews
- Mashvisor/ATTOM/Brave — estimated ARV, rental estimates overlaid on pins

---

## 4. Module 2 — Deep Neighborhood Intel (`/dashboard/blockwise/analyze`)

Full block-level intelligence report when user clicks "Analyze" on any property.

### Block Score Algorithm (0-100)

| Category | Weight | Source |
|----------|--------|--------|
| Schools | 20% | GreatSchools avg rating normalized |
| Safety | 20% | Inverse crime rate + YoY trend |
| Appreciation | 25% | 1yr/3yr/5yr price growth + forecast |
| Livability | 20% | WalkScore + transit + grocery proximity |
| Development | 15% | Permit activity + gentrification signals |

### Intel Categories

1. **Comparable Sales** — Map view with subject (gold pin) + comps (blue pins), configurable radius (0.25mi-1mi) and period (3mo-12mo), table with address/sold$/$/sqft/date/delta
2. **Schools** — Assigned schools with ratings (1-10), avg commute time
3. **Safety** — Violent/property crime breakdown, YoY trend, sex offender proximity
4. **Demographics** — Population, median income, median age, owner-occupancy ratio
5. **Appreciation** — 1yr/3yr/5yr price growth, forecast
6. **Walkability** — Walk/transit/bike scores, nearest grocery distance
7. **Development** — Building permits (6mo count + avg $), new builds, rezoning alerts, gentrification signal

### ACHEEVY Verdict

AI synthesizes all 6 categories into a plain-English recommendation:
- STRONG BUY ZONE (Block Score 80+)
- WORTH INVESTIGATING (60-79)
- PROCEED WITH CAUTION (40-59)
- WALK AWAY (below 40)

With reasoning citing specific data points.

### Competitive Advantage Table

| Intel | Redfin | Zillow | MLS | Blockwise |
|-------|--------|--------|-----|-----------|
| Comp map with radius control | Partial | No | Partial | Full |
| Building permit activity | No | No | No | Yes |
| Gentrification trend | No | No | No | Yes |
| Crime trend (not just current) | No | Link out | No | YoY |
| Sex offender proximity | No | Link out | No | Yes |
| Owner-occupancy ratio | No | No | No | Yes |
| AI verdict | No | No | No | Yes |

### Data Sources

- Google Places (New) → nearby amenities, grocery, transit
- Google Geocoding → lat/lng for radius queries
- Google Maps Elevation → flood risk signal
- ATTOM → comp sales, tax records, property details, permits
- GreatSchools (via Firecrawl) → school ratings
- CrimeMapping/SpotCrime (via Firecrawl) → crime stats
- WalkScore (via Firecrawl or API) → walkability
- Census.gov (via Firecrawl) → demographics
- Brave Search → building permits, zoning, gentrification signals

---

## 5. Module 3 — LUC Real Estate Calculator (`/dashboard/blockwise/flip`)

The LUC Real Estate Calculator, built on Jake Leicht's flip methodology. All branding is LUC — no external branding.

### Existing Foundation

19 formulas already implemented in `aims-tools/luc/presets/real-estate-flip/formulas.json`:
- Purchase price, repair costs, ARV
- Loan amount, points, interest
- Holding costs, closing costs, commissions
- Total investment, cash required, profit, ROI
- Cash-on-cash return, max offer (70% Rule), deal status

### New Additions

| Feature | Description |
|---------|-------------|
| Auto-fill from Blockwise | Purchase price, ARV, repair estimates pre-populated from live data |
| AI-estimated repairs | Brave Search + Homesage.ai estimates based on property age/condition |
| Validated ARV | HouseCanary AVM + comp average displayed side-by-side, divergence flagged |
| Sensitivity analysis | Profit/ROI at 5 ARV scenarios (best/worst case) |
| OPM structuring | "Other People's Money" — shows cash in vs. HML coverage vs. total out-of-pocket |
| Comp validation panel | Comps from neighborhood analysis visible next to ARV field |

### Layout

Two-column:
- **Left:** Input fields organized by section (Property, Acquisition, Financing, Holding, Selling) with auto-fill indicators
- **Right:** Deal Verdict card (profit/ROI/cash-on-cash/max offer/deal status), Cost Breakdown chart, Sensitivity Analysis table, OPM Structuring panel, Comp Validation panel

### LUC Integration

Every calculation meters through LUC via the existing preset engine. New sensitivity and OPM fields extend the preset with ~6 additional formulas.

---

## 6. Module 4 — K1 Tax Generator (`/dashboard/blockwise/k1`)

Full Schedule K-1 (Form 1065) draft generation with three-layer pipeline.

### Pipeline

```
LAYER 1: Paperform (Secure Data Intake)
  → Embeddable branded form or standalone link
  → Entity info, property details (auto-filled from LUC calc),
    income fields, deduction uploads, filing status
  → Webhook fires on submit → UEF Gateway

LAYER 2: C1 Thesys (Generative UI Review & Editing)
  → Renders live interactive K1 document in ACHEEVY chat or full page
  → User can click any field to edit, or tell ACHEEVY conversationally
  → Real-time streaming updates

LAYER 3: Document Generation + Secure Delivery
  → PDF (Schedule K-1 + Tax Impact Summary + Deal Summary)
  → Google Doc (live in user's Drive via Drive API)
  → Google Sheets (financial breakdown)
  → NotebookLM notebook (K1 + deal data for Q&A + audio briefing)
  → Evidence Locker (SHA-256, custody chain)
  → Secure Drop Token for partner/investor access
```

### K1 Formula Engine (new formulas for LUC preset)

| Formula | Logic |
|---------|-------|
| Capital Gain Type | `holdingDays >= 365 ? "long_term" : "short_term"` |
| Depreciation (Building) | `(purchasePrice - landValue) / 27.5 * (holdingPeriodMonths / 12)` |
| Self-Employment Tax | `profit * 0.9235 * 0.153` (if active participant) |
| Federal Tax Estimate | `taxableIncome * marginalRate` (bracket lookup) |
| State Tax Estimate | `taxableIncome * stateIncomeTaxRate` (0% for TX, varies) |
| Net After-Tax Profit | `profit - federalTax - stateTax - selfEmploymentTax` |
| Passive Activity Check | `materialParticipation ? "active" : "passive"` |
| Property Tax Deduction | Auto-pulled from county records via Firecrawl/ATTOM |

### Differentiators

- Auto-populated from LUC flip calculation (zero re-entry)
- County tax records pulled live via Firecrawl
- State-aware (TX=0%, CA=13.3%, etc.)
- Entity-type aware (LLC vs S-Corp vs Partnership)
- Draft K1 PDF in IRS format
- Evidence Locker with audit trail
- CPA handoff via email with cover letter

### Disclaimer

All K1 documents include: "DRAFT — Review with your CPA before filing. This is an estimate for planning purposes. Not tax advice. Consult a licensed CPA for filing."

---

## 7. Document Export & Media Generation

### Google Docs Export

Every Blockwise document gets "Export to Google Docs" via Drive API HTML conversion:

```
Blockwise generates HTML document
    ↓
Google Drive API → files.create (mimeType: application/vnd.google-apps.document)
    ↓
User gets a live Google Doc in their Drive
```

### Export Formats

| Format | Method | Use Case |
|--------|--------|----------|
| Google Doc | Drive API (HTML → Doc) | Live collaboration, CPA review |
| PDF | Server-side render | Filing, Evidence Locker, printing |
| Google Sheets | Drive API (CSV → Sheet) | Comp tables, financial breakdowns |
| Email | Nodemailer + SDT | CPA handoff with secure link |

### Nano Banana Pro 2 — Visual Content Engine

Nano Banana Pro 2 (Gemini 3.1 Flash Image) generates polished visual assets with precise, legible text rendering. Accessed via the Gemini API (`generativelanguage.googleapis.com`, already enabled).

**Use cases in Blockwise:**

| Asset | Description |
|-------|-------------|
| Property Report Cards | Block Score, ARV, ROI, deal verdict as a single branded image — shareable on social |
| Neighborhood Infographics | 6-category intel grid as a visual infographic with text overlays |
| K1 Document Previews | Visual preview of the K1 form as an image before PDF generation |
| Comp Analysis Graphics | Comp table with property photos + price deltas as a visual summary |
| Deal Pipeline Cards | Saved deals rendered as visual cards for pipeline dashboards |
| Multi-Language Reports | Text rendered in 8+ languages for international investors |

**Integration flow:**
```
Blockwise assembles structured data (Block Score, comps, verdict)
    ↓
Prompt + data → Gemini 3.1 Flash Image (Nano Banana Pro 2)
    ↓
Returns branded image with precise text rendering
    ↓
Displayed in UI, exportable, shareable
```

### NotebookLM Integration — Audio & Research Engine

Primary media engine for Blockwise. Uses NotebookLM Enterprise API (released Sept 2025).

**Notebook creation flow:**
1. User clicks "Deep Research" on any property
2. Blockwise creates notebook via `notebooks.create`
3. Adds sources: neighborhood report, comp data, county records, crime/school/demographic data, LUC flip results, K1 projection
4. NotebookLM processes all sources with Gemini
5. User gets: AI Q&A, Audio Overview (podcast briefing), cited insights, shareable notebook

**Key features:**

| Feature | Blockwise Use Case |
|---------|-------------------|
| Audio Overview | 5-min podcast-style deal briefing. Listen while driving to the property |
| Source-Grounded Q&A | "What's the biggest risk?" answered with citations from actual data |
| Notebook Sharing | Share with partner, CPA, or lender. Everyone queries the same data |

**ACHEEVY integration:**
```
User: "Create a research notebook for the Main St deal"
ACHEEVY: Creates NotebookLM with neighborhood report, comps, tax records, flip analysis
User: "Generate an audio briefing"
ACHEEVY: Generates via Podcast API, audio player appears in chat via C1 Thesys
```

---

## 8. GCP APIs Required

| API | Status | Purpose |
|-----|--------|---------|
| Maps JavaScript API | Enabled | Map rendering |
| Places API (New) | Enabled | Property search, amenities |
| Geocoding API | Enabled | Address resolution |
| Street View Static API | Enabled | Property thumbnails |
| Maps Elevation API | Enabled | Flood risk |
| Maps Grounding Lite | Enabled | Agentic map queries |
| Google Solar API | Enabled | Roof solar potential |
| Vertex AI | Enabled | Model serving |
| Generative Language API | Enabled | Gemini + Nano Banana Pro 2 |
| Google Docs API | **Need to enable** | Doc creation |
| Google Drive API | **Need to enable** | File upload, conversion, sharing |
| Google Sheets API | **Need to enable** | Financial exports |
| NotebookLM Enterprise API | **Need to enable** | Notebooks, audio, sources |

### External API Keys Required

| Service | Key Env Var | Required? |
|---------|------------|-----------|
| Mercury 2 (Inception) | `MERCURY_API_KEY` | Yes |
| Google Maps | `NEXT_PUBLIC_GOOGLE_MAPS_KEY` | Yes |
| Brave Search | `BRAVE_API_KEY` | Yes (already configured) |
| Firecrawl | `FIRECRAWL_API_KEY` | Yes |
| Paperform | `PAPERFORM_API_KEY` | Yes |
| C1 Thesys | `THESYS_API_KEY` | Yes |
| ElevenLabs | `NEXT_PUBLIC_ELEVENLABS_AGENT_ID` | Yes (already configured) |
| ATTOM Data | `ATTOM_API_KEY` | Optional (Tier 4) |
| Mashvisor | `MASHVISOR_API_KEY` | Optional (Tier 4) |
| First Street | `FIRST_STREET_API_KEY` | Optional (Tier 4) |
| AirDNA | `AIRDNA_API_KEY` | Optional (Tier 4) |
| BatchData | `BATCHDATA_API_KEY` | Optional (Tier 4) |
| HouseCanary | `HOUSECANARY_API_KEY` | Optional (Tier 4) |

---

## 9. File Structure (Standalone Repo)

```
blockwise-ai/
├── app/                            → Next.js 14 App Router
│   ├── page.tsx                    → Property Search & Map (home)
│   ├── analyze/page.tsx            → Deep Neighborhood Intel
│   ├── flip/page.tsx               → LUC Real Estate Calculator
│   ├── k1/page.tsx                 → K1 Tax Generator
│   ├── layout.tsx                  → Root layout (ElevenLabs + Maps providers)
│   └── api/                        → API routes (backend)
│       ├── search/route.ts         → Property search aggregation
│       ├── analyze/route.ts        → Neighborhood analysis
│       ├── export/route.ts         → Google Drive/Docs/Sheets/PDF
│       ├── notebook/route.ts       → NotebookLM Enterprise
│       ├── visual/route.ts         → Nano Banana Pro 2
│       ├── k1-webhook/route.ts     → Paperform submission handler
│       ├── chat/route.ts           → Mercury 2 chat completions
│       └── health/route.ts         → Health check for Plug lifecycle
│
├── components/                     → React components
│   ├── PropertyMap.tsx             → Google Maps canvas + pins
│   ├── PropertyCard.tsx            → Pin click detail card
│   ├── FilterPanel.tsx             → Search filters
│   ├── BlockScoreCard.tsx          → Block Score (0-100) display
│   ├── CompMap.tsx                 → Comp sales map overlay
│   ├── NeighborhoodGrid.tsx        → 6-category intel grid
│   ├── VerdictCard.tsx             → ACHEEVY buy/hold/pass verdict
│   ├── FlipCalculator.tsx          → LUC flip form + results
│   ├── SensitivityTable.tsx        → ARV scenario analysis
│   ├── OpmCard.tsx                 → Other People's Money breakdown
│   ├── K1Form.tsx                  → K1 input/review UI
│   ├── K1Preview.tsx               → C1 Thesys rendered K1 doc
│   ├── ExportMenu.tsx              → Google Docs/PDF/Sheets/Email
│   ├── NanoBananaCard.tsx          → AI-generated visual report cards
│   ├── ChatPanel.tsx               → ACHEEVY + ElevenLabs (right panel)
│   └── ui/                         → ElevenLabs UI + shadcn components
│       ├── conversation.tsx        → ElevenLabs Conversation
│       ├── conversation-bar.tsx    → ElevenLabs ConversationBar
│       ├── voice-button.tsx        → ElevenLabs VoiceButton
│       ├── orb.tsx                 → ElevenLabs Orb visualizer
│       ├── message.tsx             → ElevenLabs Message bubble
│       ├── response.tsx            → ElevenLabs Response streaming
│       ├── audio-player.tsx        → ElevenLabs AudioPlayer
│       ├── transcript-viewer.tsx   → ElevenLabs TranscriptViewer
│       └── ... (shadcn/ui components)
│
├── lib/                            → Shared utilities
│   ├── types.ts                    → Blockwise type definitions
│   ├── google-maps.ts              → Maps API client + utilities
│   ├── neighborhood.ts             → Block Score algorithm
│   ├── comps.ts                    → Comp analysis helpers
│   ├── k1-formulas.ts              → K1 tax calculation engine
│   ├── flip-formulas.ts            → LUC flip calculation engine (19 formulas)
│   ├── mercury.ts                  → Mercury 2 LLM client (OpenAI-compatible)
│   ├── aims-api.ts                 → A.I.M.S. API client (LUC, Evidence Locker, SDT)
│   ├── brave-search.ts             → Brave Search API client
│   ├── firecrawl.ts                → Firecrawl scraping client
│   ├── notebooklm.ts               → NotebookLM Enterprise API client
│   ├── nano-banana.ts              → Nano Banana Pro 2 image generation
│   └── export.ts                   → Google Drive/Docs/Sheets export
│
├── data/                           → Static data & presets
│   ├── flip-formulas.json          → 19 LUC flip formulas (from aims-tools)
│   ├── k1-formulas.json            → K1 tax formulas
│   └── state-tax-rates.json        → State income tax rates
│
├── Dockerfile                      → A.I.M.S. Plug container
├── docker-compose.yml              → Local development
├── package.json
├── tailwind.config.ts
├── tsconfig.json
├── next.config.mjs
├── .env.example
└── CLAUDE.md                       → Project-specific Claude instructions
```

---

## 10. Design Decisions

| Decision | Choice | Reasoning |
|----------|--------|-----------|
| Architecture | Standalone repo / A.I.M.S. Plug | Blockwise is a product created BY A.I.M.S., not built into it. Own repo, own deploy, connects via APIs |
| UI framework | ElevenLabs UI component library + shadcn/ui | 17 pre-built voice-first components, modern chat UX |
| Primary LLM | Mercury 2 (Inception Labs) | 1,000 tok/sec, $0.25/$0.75 per 1M tokens, OpenAI-compatible |
| Fallback LLM | Claude (Anthropic) | Complex multi-step analysis, K1 generation |
| Map library | Google Maps JavaScript API (@vis.gl/react-google-maps) | All Maps APIs already enabled, best place data |
| Neighborhood data | 4-tier pipeline with fallback | Maximum coverage, degrades gracefully without paid APIs |
| Flip calculator | LUC formulas (bundled) | 19 formulas from aims-tools, bundled in repo |
| K1 intake | Paperform | Handles validation, uploads, partial saves, mobile |
| K1 review | C1 Thesys Generative UI | Interactive editing in chat, conversational corrections |
| Document export | Google Drive API (HTML conversion) | Simpler than Docs API, preserves formatting |
| Audio/Research | NotebookLM Enterprise | Audio overviews, source-grounded Q&A, shareable notebooks |
| Visual content | Nano Banana Pro 2 (Gemini 3.1 Flash Image) | #1 text-to-image, precise text rendering for report cards and infographics |
| Voice interface | ElevenLabs Agent SDK + UI components | Voice-first with Conversation, Orb, VoiceButton, ConversationBar |
| Video generation | Excluded (Veo 3.1) | NotebookLM audio overviews + Nano Banana visuals cover content needs |
| Branding | LUC (not Flip Secrets) | All calculator branding is LUC Real Estate Calculator |
| Deployment | A.I.M.S. Plug (Docker on VPS port 51000+) | Standard Plug lifecycle: provision → deploy → monitor → scale |
| A.I.M.S. connection | External APIs (LUC, ACHEEVY, Evidence Locker, SDT) | Clean separation, Blockwise can run independently |
