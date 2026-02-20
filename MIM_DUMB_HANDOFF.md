# M.I.M. D.U.M.B. — Antigravity Handoff (Feb 20, 2026)

## Make It Mine — Deep Universal Meticulous Build

> **Philosophy:** Deep research, Universal applicability, Meticulous execution, Build real software.
> **Owner:** ACHEEVY / ACHIEVEMOR
> **Scope Doc:** `docs/MIM_DUMB_SCOPE.md`
> **Existing Build:** `docs/mim-builds/SUPERAGENT_DUMB_MANIFEST.md` (Deep Scout — Superagent clone plan)

---

## What M.I.M. D.U.M.B. Is

The platform capability that takes any idea or product and builds it from scratch:

```
User: "I want to build X" or "Clone that product"
    ↓
Phase 1: IDEA VALIDATION (4-step chain)
  → Raw Idea → Gap Analysis → Audience Resonance → Expert Perspective
    ↓
Phase 2: DEEP RESEARCH (Search + Extract + Plan)
  → Brave/Tavily/Serper search → LLM extraction → Clone Plan + Adaptation Plan
    ↓
Phase 3: CLONE & CUSTOMIZE (MakeItMine Engine)
  → Template selection → Industry preset → Feature overrides → Branding → ProjectSpec
    ↓
Phase 4: METICULOUS BUILD (Chicken Hawk Executor)
  → LUC pre-flight → Code generation → ORACLE 7-Gate verification → BAMARAM receipt
    ↓
Phase 5: DEPLOY & DELIVER
  → CDN deployment → Custom domain → Analytics → User receives working product
```

---

## File Map — What Exists Today

### Core Pipeline (ALL BUILT)

| File | Lines | What It Does |
|------|-------|-------------|
| `aims-skills/skills/idea-validation.skill.ts` | 258 | 4-step idea validation chain (capture, gaps, audience, expert) |
| `frontend/app/api/make-it-mine/route.ts` | 351 | POST endpoint: Search + Extract + Plan pipeline |
| `backend/uef-gateway/src/make-it-mine/index.ts` | 590 | Clone & Customize engine — 6 industry presets, terminology mapping, feature overrides |
| `backend/uef-gateway/src/templates/index.ts` | — | PlugTemplates library — base app archetypes |
| `backend/uef-gateway/src/oracle/index.ts` | — | ORACLE 8-Gate verification framework |
| `backend/uef-gateway/src/luc/index.ts` | — | LUC cost engine — 3-6-9 billing multipliers |

### UI Pages (BUILT)

| File | Lines | What It Does |
|------|-------|-------------|
| `frontend/app/dashboard/make-it-mine/page.tsx` | 99 | M.I.M. Hub — project type picker (Web App, Mobile, Automation, DIY) |
| `frontend/app/dashboard/make-it-mine/diy/page.tsx` | 792 | DIY Voice+Vision mode — camera + mic + hands-free guidance |
| `frontend/lib/diy/types.ts` | 200 | TypeScript types for DIY module |

### Execution Layer (BUILT)

| File | Lines | What It Does |
|------|-------|-------------|
| `aims-skills/skills/chicken-hawk/chicken-hawk-executor.skill.md` | 368 | Chicken Hawk build executor spec — task decomposition, tool access, ORACLE gates |
| `backend/ii-agent/src/ii_agent/server/branding/` | 4 files | ii-agent M.I.M. branding — white-label CSS vars (app name, colors, logo, favicon) |

### Evidence

| File | What It Proves |
|------|---------------|
| `evidence/make-it-mine-demo.json` | Smoke test: Brave Search works, pipeline chain responds 200 OK |
| `docs/mim-builds/SUPERAGENT_DUMB_MANIFEST.md` | Full Phase 2 manifest for Superagent/Deep Scout clone |

### NOT BUILT YET

| File/Feature | Priority | What's Needed |
|--------------|----------|--------------|
| `frontend/app/dashboard/make-it-mine/web-app/` | P1 | Sub-route for web app builds |
| `frontend/app/dashboard/make-it-mine/mobile-app/` | P2 | Sub-route for mobile app builds |
| `frontend/app/dashboard/make-it-mine/automation/` | P2 | Sub-route for automation builds |
| CDN deployment pipeline | P1 | Push generated sites to CDN with custom domain |
| ORACLE 7-gate production enforcement | P1 | Wire gates into real build pipeline |
| BAMARAM receipt generation | P2 | Completion receipts with evidence artifacts |
| ByteRover context tree | P2 | Codebase context querying for Chicken Hawk |
| Stitch CLI / Nano Banana Pro integration | P2 | UI component generation |
| Plug Marketplace (browse/purchase generated apps) | P3 | Public gallery + payments |
| Scrollytelling report renderer | P1 | Interactive scroll-driven reports (Deep Scout killer feature) |

---

## Industry Presets (6 Built)

All presets live in `backend/uef-gateway/src/make-it-mine/index.ts`:

| Industry | Key Features | Terminology Swaps |
|----------|-------------|-------------------|
| **Construction** | project-tracking, bid-management, safety-compliance, subcontractor-portal, progress-photos | Product→Project, Customer→Client, Order→Work Order |
| **Healthcare** | patient-portal, appointment-scheduling, EHR, HIPAA, telehealth, prescription-management | Product→Service, Customer→Patient, Order→Appointment |
| **Real Estate** | property-listings, virtual-tours, mortgage-calculator, agent-profiles, lead-capture | Product→Property, Customer→Client, Listing→Property Listing |
| **Legal** | case-management, document-management, time-billing, client-portal, conflict-checks | Product→Service, Customer→Client, Order→Engagement |
| **Education** | course-management, student-portal, assignment-submission, grading, video-lessons | Product→Course, Customer→Student, Order→Enrollment |
| **Fitness** | class-scheduling, membership-management, workout-tracking, nutrition-plans, leaderboard | Product→Program, Customer→Member, Order→Booking |

New industries: add entry to `INDUSTRY_PRESETS` in the clone engine. No other changes needed.

---

## API Endpoints (LIVE)

### POST `/make-it-mine/clone` (UEF Gateway)

Clone a template with industry customizations:

```json
{
  "templateId": "saas-starter",
  "projectName": "DentalFlow",
  "industry": "healthcare",
  "branding": {
    "primaryColor": "#2563eb",
    "companyName": "DentalFlow Inc",
    "domain": "dentalflow.app"
  },
  "featureOverrides": {
    "add": ["telehealth", "hipaa-compliance"],
    "remove": ["generic-dashboard"]
  },
  "terminologyMap": { "Customer": "Patient", "Order": "Appointment" }
}
```

### GET `/make-it-mine/suggest?templateId=saas-starter&industry=healthcare`

Get industry-specific customization suggestions.

### POST `/api/make-it-mine` (Frontend Pipeline)

Full research pipeline:

```json
{
  "productIdea": "AI scheduling assistant for dentists",
  "targetUrl": "https://example-competitor.com",
  "industry": "Healthcare SaaS"
}
```

Returns: `{ research, clonePlan, adaptationPlan, evidence }`

---

## Deep Scout — The First M.I.M. Build (Superagent Clone)

Full manifest at `docs/mim-builds/SUPERAGENT_DUMB_MANIFEST.md`

**Target:** Clone Airtable's Superagent (superagent.com) — AI business research platform
**Codename:** DEEP SCOUT
**Status:** Phase 2 Complete (Research + Extract + Plan done)

**Our angle:** "Superagent researches. ACHEEVY researches AND builds."
Superagent stops at the report. ACHEEVY generates the report, then feeds it into Chicken Hawk to build the actual product described in the research.

### Deep Scout Architecture (Planned)

```
/dashboard/deep-scout          → Research input + prompt selection
/dashboard/deep-scout/[id]     → Live agent execution stream (SSE)
/report/[id]                   → Interactive scrollytelling report
/slides/[id]                   → Interactive slide deck
/discover                      → Public gallery of generated research
```

### Deep Scout Agents (Planned)

| Agent | Role |
|-------|------|
| PlannerAgent | Breaks question into 5-20 parallel research tasks |
| WebSearchAgent | Brave/Tavily/Serper searches |
| DataSourceAgent | Premium API queries (FactSet, Crunchbase, SEC) |
| FinancialAgent | SEC filings, earnings, financials |
| CompetitiveAgent | Competitor analysis |
| SynthesisAgent | Combines all findings |
| RenderAgent | Generates interactive output (scrollytelling, slides, docs) |

### Deep Scout Pricing (Proposed)

| Tier | Price | Includes |
|------|-------|---------|
| Free | $0 | 5 reports/month, text-only |
| Scout | $19/mo | 50 reports, interactive reports + slides |
| Builder | $49/mo | Unlimited reports + 5 full builds/month |
| Enterprise | $199/mo | Unlimited everything, premium data, self-hosted |

---

## Execution Chain (How It All Connects)

```
User → ACHEEVY Chat → Intent: "I want to build X"
  ↓
ACHEEVY classifies as `plug-factory:custom` or `skill:mim`
  ↓
Orchestrator → IdeaValidationSkill (4 steps)
  ↓
Orchestrator → M.I.M. Research Pipeline (search → extract → plan)
  ↓
Orchestrator → MakeItMine.clone() (template + industry preset)
  ↓
Orchestrator → II-Agent (fullstack) or Chicken Hawk (manifest)
  ↓
ORACLE 7-Gate verification
  ↓
BAMARAM receipt → User receives working product
```

---

## LLM Routing for M.I.M. Builds

| Task | Primary Model | Fallback |
|------|--------------|---------|
| Idea Validation (4-step) | Chat model (user-selected) | Claude Sonnet via OpenRouter |
| Research Pipeline (Extract + Plan) | `google/gemini-2.5-flash` | Any OpenRouter model |
| Deep Research / M.I.M. analysis | `google/gemini-3-pro` | `openrouter/kimi-k2.5` |
| Standard code generation | `claude-opus-4-5` via OpenRouter | `google/gemini-3-flash-thinking` |
| UI generation (Stitch) | Nano Banana Pro | `zhipuai/glm-4.7-image` |

---

## Env Vars Needed

| Var | Status | Used By |
|-----|--------|---------|
| `BRAVE_API_KEY` | Provisioned | Research pipeline primary search |
| `TAVILY_API_KEY` | Needs key | Research pipeline fallback |
| `SERPER_API_KEY` | Needs key | Research pipeline fallback |
| `OPENROUTER_API_KEY` | Wired | LLM routing for all agents |
| `FIRECRAWL_API_KEY` | Not provisioned | Deep scraping (non-blocking, Brave fallback) |

---

## What's Wired But Not Live

| Component | Blocker |
|-----------|---------|
| Brave Search in M.I.M. pipeline | `BRAVE_API_KEY` needs to be set in production |
| Tavily fallback search | `TAVILY_API_KEY` not yet provisioned |
| Serper fallback search | `SERPER_API_KEY` not yet provisioned |
| Chicken Hawk execution | In docker-compose, needs VPS deploy |
| ii-agent execution | In docker-compose, needs VPS deploy |

---

## Next Steps (Priority Order)

### P1 — Ship the Core Loop

1. **Wire Idea Validation into ACHEEVY chat** — Skill exists (258L), just needs intent classification → skill trigger
2. **Deploy M.I.M. pipeline to VPS** — API routes exist, need production env vars
3. **Build `/dashboard/make-it-mine/web-app/` sub-route** — First project type after DIY
4. **CDN deployment pipeline** — Generated sites need a delivery target
5. **ORACLE 7-gate enforcement** — Framework exists in `oracle/index.ts`, needs real gate runners

### P2 — Deep Scout (Superagent Clone)

6. **Research engine core** — Multi-agent orchestrator with SSE streaming
7. **Scrollytelling report renderer** — The killer feature (interactive scroll-driven reports)
8. **Wire research → Chicken Hawk build** — Research output feeds into `MakeItMine.clone()`
9. **Discover gallery** — Public showcase of generated research

### P3 — Marketplace + Scale

10. **Plug Marketplace** — Browse/purchase generated apps
11. **BAMARAM receipt system** — Completion receipts with evidence
12. **ByteRover context tree** — Codebase querying for smarter builds
13. **Premium data sources** — SEC EDGAR, Crunchbase, FactSet

---

## Build & Test

```bash
cd frontend && npm run build                    # Frontend
cd ../backend/uef-gateway && npm run build      # Gateway (includes M.I.M. engine)
cd ../../aims-skills && npm test                # Skills (includes idea-validation)
```

## Test M.I.M. Locally

```bash
# Research pipeline
curl -X POST http://localhost:3000/api/make-it-mine \
  -H "Content-Type: application/json" \
  -d '{"productIdea":"AI scheduling for dentists","industry":"Healthcare SaaS"}'

# Clone engine (via gateway)
curl -X POST http://localhost:3001/make-it-mine/clone \
  -H "Content-Type: application/json" \
  -d '{"templateId":"saas-starter","projectName":"DentalFlow","industry":"healthcare"}'

# Suggestions
curl http://localhost:3001/make-it-mine/suggest?templateId=saas-starter&industry=healthcare
```

---

*Canonical scope: `docs/MIM_DUMB_SCOPE.md` | First build manifest: `docs/mim-builds/SUPERAGENT_DUMB_MANIFEST.md`*

*— ACHIEVEMOR / A.I.M.S.*
