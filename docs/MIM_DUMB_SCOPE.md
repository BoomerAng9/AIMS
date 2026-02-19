# M.I.M. D.U.M.B.
## Make It Mine — Deep Universal Meticulous Build

**Version:** 1.0.0
**Owner:** ACHEEVY / ACHIEVEMOR
**Status:** Active Scope Document
**Last Updated:** February 2026

---

## What Is This Document?

This is the **master scope document** for the Make It Mine (M.I.M.) platform capability.
D.U.M.B. stands for **Deep Universal Meticulous Build** — the methodology ACHEEVY uses
to take any idea, product concept, or existing product and build it from scratch with
meticulous attention to every detail, universal applicability across industries, and
deep execution that goes beyond surface-level clones.

**D.U.M.B. is not a feature. It is the build philosophy.**

Every M.I.M. build follows this principle:
- **Deep** — Research exhaustively before writing one line of code
- **Universal** — Works for any industry, any vertical, any product type
- **Meticulous** — Every detail matters. Every gate must pass. No shortcuts.
- **Build** — Ship real, working software. Not mockups. Not demos.

---

## The M.I.M. Pipeline — End to End

```
User has an idea (or sees a product they want to clone/improve)
    ↓
┌─────────────────────────────────────────────────────┐
│  PHASE 1: IDEA VALIDATION (4-Step Chain)            │
│  ├── Step 1: Raw Idea Capture                       │
│  ├── Step 2: Gap Analysis (clarity, risk, gaps)     │
│  ├── Step 3: Audience Resonance (market fit)        │
│  └── Step 4: Expert Perspective (domain authority)  │
└─────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────┐
│  PHASE 2: DEEP RESEARCH (Search + Extract + Plan)   │
│  ├── Brave/Tavily/Serper search for target product  │
│  ├── LLM extraction of structured facts             │
│  │   (features, pricing, tech stack, competitors)   │
│  ├── Clone Plan (software architecture + phases)    │
│  └── Adaptation Plan (differentiation + branding)   │
└─────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────┐
│  PHASE 3: CLONE & CUSTOMIZE (MakeItMine Engine)     │
│  ├── Select base template from Template Library     │
│  ├── Apply industry preset (6 industries + custom)  │
│  ├── Feature overrides (add/remove capabilities)    │
│  ├── Terminology mapping (Product→Property, etc.)   │
│  ├── Branding (colors, logo, domain, company name)  │
│  └── Generate ProjectSpec                           │
└─────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────┐
│  PHASE 4: METICULOUS BUILD (Chicken Hawk Executor)  │
│  ├── LUC pre-flight cost estimate                   │
│  ├── ByteRover context tree query                   │
│  ├── Stitch UI generation (React components)        │
│  ├── Code Ang full-stack code generation             │
│  ├── ORACLE 7-Gate verification                     │
│  │   ├── Gate 1: Technical (tests pass)     [BLOCK] │
│  │   ├── Gate 2: Security (OWASP scan)      [BLOCK] │
│  │   ├── Gate 3: UX/Accessibility (Lighthouse)      │
│  │   ├── Gate 4: Performance (p95 latency)          │
│  │   ├── Gate 5: GDPR/CCPA compliance       [BLOCK] │
│  │   ├── Gate 6: M.I.M. manifest alignment          │
│  │   └── Gate 7: Documentation completeness         │
│  └── BAMARAM receipt issued on pass                 │
└─────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────┐
│  PHASE 5: DEPLOY & DELIVER                          │
│  ├── CDN deployment (multi-region)                  │
│  ├── Custom domain configuration                    │
│  ├── Analytics and monitoring wired                 │
│  └── User receives working product                  │
└─────────────────────────────────────────────────────┘
```

---

## What Exists Today (February 2026)

### Built and Working

| Component | Location | Status |
|---|---|---|
| Idea Validation Skill (4-step chain) | `aims-skills/skills/idea-validation.skill.ts` | Built, needs ACHEEVY chat integration |
| M.I.M. Research Pipeline (Search → Extract → Plan) | `frontend/app/api/make-it-mine/route.ts` | Built, needs search API keys |
| MakeItMine Clone Engine (6 industry presets) | `backend/uef-gateway/src/make-it-mine/index.ts` | Built and exposed at `/make-it-mine/clone` |
| M.I.M. Dashboard Hub (project type picker) | `frontend/app/dashboard/make-it-mine/page.tsx` | Built |
| DIY Voice+Vision Mode | `frontend/app/dashboard/make-it-mine/diy/page.tsx` | Built, needs camera/mic testing |
| Gateway routes (`/make-it-mine/clone`, `/make-it-mine/suggest`) | `backend/uef-gateway/src/index.ts` | Live |
| Template Library (base templates) | `backend/uef-gateway/src/templates/` | Built |
| ii-agent M.I.M. branding (white-label CSS vars) | `backend/ii-agent/src/ii_agent/server/branding/` | Built |
| Smoke test evidence | `evidence/make-it-mine-demo.json` | Verified |

### Wired But Not Live

| Component | What's Missing |
|---|---|
| Brave Search in M.I.M. pipeline | `BRAVE_API_KEY` needs to be set in production |
| Tavily fallback search | `TAVILY_API_KEY` needs to be set |
| Serper fallback search | `SERPER_API_KEY` needs to be set |
| Chicken Hawk execution | Just wired into docker-compose, needs VPS deploy |
| ii-agent execution | Just wired into docker-compose, needs VPS deploy |

### Not Built Yet

| Component | Priority | Effort |
|---|---|---|
| Web App sub-route (`/dashboard/make-it-mine/web-app`) | P1 | 3 days |
| Mobile App sub-route (`/dashboard/make-it-mine/mobile-app`) | P2 | 5 days |
| Automation sub-route (`/dashboard/make-it-mine/automation`) | P2 | 3 days |
| CDN deployment for generated sites | P1 | 3 days |
| ORACLE 7-gate production enforcement | P1 | 1 week |
| BAMARAM receipt generation | P2 | 2 days |
| ByteRover context tree | P2 | 1 week |
| Stitch CLI integration (Google Stitch) | P2 | 3 days |
| Plug Marketplace (browse/purchase generated apps) | P3 | 2 weeks |

---

## Industry Presets (6 Built + Extensible)

The MakeItMine Engine ships with 6 industry presets. Each includes features, terminology
maps, suggested pages, and suggested data models.

| Industry | Features | Terminology Swaps | Pages | Models |
|---|---|---|---|---|
| **Construction** | project-tracking, bid-management, safety-compliance, subcontractor-portal, progress-photos, document-management, time-tracking, equipment-tracking | Product→Project, Customer→Client, Order→Work Order, Invoice→Pay Application, Category→Trade, Listing→Bid, Review→Inspection, Cart→Estimate | project-tracker, bid-board, safety-log, daily-report | Project, Bid, SafetyLog, DailyReport, Subcontractor |
| **Healthcare** | patient-portal, appointment-scheduling, EHR, HIPAA compliance, telehealth, prescription-management, billing-insurance, lab-results | Product→Service, Customer→Patient, Order→Appointment, Invoice→Claim, Category→Specialty | patient-portal, appointments, health-records, telehealth | Patient, Appointment, HealthRecord, Prescription, Claim |
| **Real Estate** | property-listings, virtual-tours, mortgage-calculator, agent-profiles, saved-searches, neighborhood-data, document-signing, lead-capture | Product→Property, Customer→Client, Order→Transaction, Invoice→Closing Statement, Listing→Property Listing | listings, property-detail, agent-profile, mortgage-calc | Property, Agent, Transaction, Lead, Showing |
| **Legal** | case-management, document-management, time-billing, client-portal, calendar-scheduling, conflict-checks, trust-accounting, e-signature | Product→Service, Customer→Client, Order→Engagement, Category→Practice Area, Deal→Case | case-dashboard, documents, time-entries, client-portal | Case, Client, TimeEntry, Document, TrustAccount |
| **Education** | course-management, student-portal, assignment-submission, grading-system, attendance-tracking, video-lessons, discussion-forums, certificates | Product→Course, Customer→Student, Order→Enrollment, Invoice→Tuition, Category→Subject | courses, course-detail, student-dashboard, gradebook | Course, Student, Assignment, Grade, Enrollment |
| **Fitness** | class-scheduling, membership-management, workout-tracking, nutrition-plans, trainer-profiles, progress-photos, wearable-integration, leaderboard | Product→Program, Customer→Member, Order→Booking, Category→Class Type, Deal→Membership | schedule, class-detail, member-dashboard, progress | Member, Class, Booking, WorkoutLog, Membership |

**Adding new industries:** Add a new entry to `INDUSTRY_PRESETS` in
`backend/uef-gateway/src/make-it-mine/index.ts`. No other changes needed.

---

## The D.U.M.B. Build Methodology

### Deep

Before building anything, ACHEEVY must:
1. Run the 4-step Idea Validation chain (capture → gaps → audience → expert)
2. Execute the Search → Extract → Plan pipeline to understand the competitive landscape
3. Query ByteRover for existing patterns and prior art
4. Generate a LUC cost estimate before committing resources

### Universal

The build system is designed to work for ANY industry:
1. Industry presets provide 80% customization out of the box
2. Terminology mapping makes the same codebase speak the language of any vertical
3. Template library provides base architectures that adapt to any use case
4. Feature overrides let users add/remove capabilities without touching code

### Meticulous

Every output goes through the ORACLE 7-gate verification:
1. **No untested code ships** (Gate 1: all tests pass)
2. **No insecure code ships** (Gate 2: OWASP scan clean)
3. **No non-compliant code ships** (Gate 5: GDPR/CCPA)
4. **Every build gets a BAMARAM receipt** with evidence artifacts
5. **Every build is audited** via KYB Flight Recorder

### Build

The output is REAL, WORKING SOFTWARE:
1. Full-stack applications (React + backend)
2. Deployed to CDN with custom domain
3. Analytics and monitoring included
4. Ready for users on day one

---

## API Reference

### POST `/make-it-mine/clone`

Clone a template with industry customizations.

```json
{
  "templateId": "saas-starter",
  "projectName": "DentalFlow",
  "industry": "healthcare",
  "branding": {
    "primaryColor": "#2563eb",
    "secondaryColor": "#1e40af",
    "companyName": "DentalFlow Inc",
    "domain": "dentalflow.app"
  },
  "featureOverrides": {
    "add": ["telehealth", "hipaa-compliance"],
    "remove": ["generic-dashboard"]
  },
  "terminologyMap": {
    "Customer": "Patient",
    "Order": "Appointment"
  }
}
```

### GET `/make-it-mine/suggest?templateId=saas-starter&industry=healthcare`

Get industry-specific customization suggestions.

### POST `/api/make-it-mine` (Frontend Pipeline)

Run the full research pipeline.

```json
{
  "productIdea": "AI scheduling assistant for dentists",
  "targetUrl": "https://example-competitor.com",
  "industry": "Healthcare SaaS"
}
```

Returns: `{ research, clonePlan, adaptationPlan, evidence }`

---

## LLM Routing for M.I.M. Builds

| Task | Primary Model | Fallback |
|---|---|---|
| Idea Validation (4-step) | Chat model (user-selected) | Claude Sonnet via OpenRouter |
| Research Pipeline (Extract + Plan) | `google/gemini-2.5-flash` | Any OpenRouter model |
| Deep Research / M.I.M. analysis | `google/gemini-3-pro` | `openrouter/kimi-k2.5` |
| Standard code generation | `claude-opus-4-5` via OpenRouter | `google/gemini-3-flash-thinking` |
| UI generation (Stitch) | Nano Banana Pro | `zhipuai/glm-4.7-image` |

---

## Execution Chain

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

## File Map

| What | Path |
|---|---|
| Idea Validation Skill | `aims-skills/skills/idea-validation.skill.ts` |
| Research Pipeline (frontend) | `frontend/app/api/make-it-mine/route.ts` |
| Clone Engine (backend) | `backend/uef-gateway/src/make-it-mine/index.ts` |
| Dashboard Hub | `frontend/app/dashboard/make-it-mine/page.tsx` |
| DIY Voice+Vision | `frontend/app/dashboard/make-it-mine/diy/page.tsx` |
| DIY Types | `frontend/lib/diy/types.ts` |
| Chicken Hawk Executor Spec | `aims-skills/skills/chicken-hawk/chicken-hawk-executor.skill.md` |
| ii-agent Branding (M.I.M. CSS) | `backend/ii-agent/src/ii_agent/server/branding/` |
| Smoke Test Evidence | `evidence/make-it-mine-demo.json` |
| Template Library | `backend/uef-gateway/src/templates/` |
| ORACLE Gates | `backend/uef-gateway/src/oracle/` |
| LUC Cost Engine | `backend/uef-gateway/src/luc/` |

---

## What Structured Water Is

*Note: "Structured water" was mentioned by the user as a potential product idea to run
through the M.I.M. D.U.M.B. pipeline. It is not currently in the codebase.*

**Structured water** is a product category involving water filtration/restructuring devices
that claim to change water's molecular structure. This would be an example of running
the M.I.M. pipeline:

1. **Idea Validation:** "I want to sell structured water devices online"
2. **Research Pipeline:** Search competitors, extract features/pricing, identify gaps
3. **Clone & Customize:** Use e-commerce template, apply health/wellness industry preset
4. **Meticulous Build:** Generate full e-commerce site with product catalog, payment processing, educational content, compliance pages
5. **Deploy:** Working store on custom domain

This is exactly the kind of product M.I.M. D.U.M.B. is designed for — take any idea,
research it deeply, build it meticulously, deploy it universally.

---

*This document is the canonical scope reference for the M.I.M. D.U.M.B. build methodology.
All future M.I.M. work should reference this document.*

*— ACHIEVEMOR / A.I.M.S.*
