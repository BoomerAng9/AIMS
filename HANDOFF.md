# A.I.M.S. Frontend Handoff — Feb 2026

## How to Get Current

```bash
cd /path/to/AIMS
git pull origin main
cd frontend && npm run build   # verify clean build
```

---

## What Changed (Recent Sessions)

### 1. VPS-First Architecture (infra)
- All core services deploy to AIMS VPS (`76.13.96.107` / `srv1328075.hstgr.cloud`)
- Cloud Run deploys removed from CI — `cloudbuild.yaml` is build+push only
- SSL via host certbot (apt) — certs at `/etc/letsencrypt`, bind-mounted into nginx
- First-time cert: `./deploy.sh --domain plugmein.cloud --landing-domain aimanagedsolutions.cloud --email admin@aimanagedsolutions.cloud`
- PersonaPlex inference on GCP Vertex AI Endpoints (GPU), not Cloud Run

### 2. Landing Page Rewritten (`frontend/app/page.tsx`)
- Uses shared `SiteHeader`, domain-aware `Hero.tsx`, and `Footer` components
- **AIMS is the product, not Per|Form** — Per|Form is one vertical
- Arena removed from Live Now cards
- New sections on landing page:
  - **Hero** — domain-aware (plugmein.cloud = lore, aimanagedsolutions.cloud = functions)
  - **Live Now** — 6 cards: Chat, Dashboard, Per|Form, Conference Directory, Integrations, Sandbox
  - **Conferences** — All 9 conferences (Power 4 + Group of 5) with team color dots, team counts, links to `/sandbox/perform/directory`
  - **Big Board** — All 10 prospects with P.A.I. scores, tiers, trends, positions, NIL estimates
  - **Why AIMS** — 4 platform pillars (25 AI Agents, Managed Ops, Vibe Coding, No Proof No Done)
  - **Roadmap** — 8 items with status badges
  - **Final CTA** — Chat with ACHEEVY + Open Dashboard

### 3. Pricing Page Split (`frontend/app/pricing/page.tsx`)
- AIMS platform pricing separated from Per|Form sports pricing
- Title: "A.I.M.S. Pricing" (was "Per|Form Pricing")
- CTA: "Ready to get started?" (was "Ready to Per|Form?")
- All 4 subscription models (Creator, Partner, Families, All-In-One) unchanged

### 4. CI Pipeline Simplified
- `cloudbuild.yaml`: build + push 4 images to Artifact Registry (gateway, frontend, research-ang, router-ang)
- No Cloud Run deploy steps — VPS pulls images via `deploy.sh`
- `.github/workflows/deploy.yml`: renamed to "CI — Build & Push Images"

---

## What Still Needs Work (Priority Order)

### HIGH — Must use design skills docs
Read these files before making any UI changes:
- `aims-skills/skills/stitch-nano-design.skill.md` — Full design system (colors, typography, layout, texture, motion)
- `aims-skills/skills/ui-interaction-motion.skill.md` — Interaction patterns

Also load all aims-*-ui skill packs when building UI. Available skills:
- `aims-global-ui` — Global design system rules
- `aims-landing-ui` — Landing page layout
- `aims-chat-ui` — Chat UI pattern
- `aims-auth-onboarding-ui` — Auth flows
- `aims-command-center-ui` — Agent command center
- `aims-crm-ui` — CRM views
- `aims-finance-analytics-ui` — Finance dashboards
- `aims-workflow-ui` — Workflow builder
- `aims-content-tools-ui` — Content/research tools

### HIGH — Landing Page Polish
1. Apply the design system from `stitch-nano-design.skill.md` to the landing page
2. The conference cards need real team data displayed better — show team names not just color dots
3. The Big Board table needs mobile responsiveness work
4. Hero component backgrounds: verify images exist at `/public/images/acheevy/elder-ceremony-hero.jpeg` and `/public/assets/port_dock_brand.png`

### HIGH — Per|Form Feature Completion
1. Conference Directory (`/sandbox/perform/directory`) — works, has 131 teams with full data
2. Big Board (`/sandbox/perform/big-board`) — works, fetches from `/api/perform/prospects`
3. Prospect detail pages (`/sandbox/perform/prospects/[slug]`) — needs scouting report UI
4. Content feed (`/sandbox/perform/content`) — exists but needs real content

### MEDIUM — Auth + Payments
1. Sign-in (`/sign-in`) and sign-up (`/sign-up`) pages exist but need Google OAuth
2. Stripe integration for the 3-6-9 pricing model
3. Subscription management in dashboard settings

### MEDIUM — Chat with ACHEEVY
1. Chat page (`/chat`) needs to connect to UEF Gateway
2. Model selection, voice input, file attachments — all need backend wiring
3. Thread history persistence

### LOW — Other Features
1. Workshop pages (Life Scenes, Moment Studio, Money Moves, Creator Circles)
2. Dashboard sub-pages (most are placeholder shells)
3. House of Ang, Circuit Box, Model Garden — need backend integration

---

## Key Architecture Notes

- **VPS**: `76.13.96.107` (`srv1328075.hstgr.cloud`) — all core services in Docker
- **Domain routing**: `plugmein.cloud` = lore site, `aimanagedsolutions.cloud` = functions site
- Both domains serve the same Next.js app, differentiated client-side via `useIsLandingDomain()` hook
- `SiteHeader.tsx` shows different nav links per domain
- `Hero.tsx` shows different content per domain (lore vs action chain)
- All Per|Form data: `frontend/lib/perform/conferences.ts` (131 teams, static), `frontend/app/api/perform/prospects/route.ts` (10 seed prospects, falls back from Scout Hub)
- Per|Form types/styles: `frontend/lib/perform/types.ts` (TIER_STYLES, TREND_STYLES, getScoreColor)
- **SSL**: Host certbot (apt), certs bind-mounted into nginx container
- **CI**: GitHub Actions → Cloud Build → Artifact Registry (build+push only, no deploys)
- **GPU inference**: Vertex AI Endpoints for PersonaPlex/Nemotron

---

## Build & Test

```bash
cd frontend && npm run build    # Frontend — must pass
cd ../backend/uef-gateway && npm run build  # Backend
cd ../../aims-skills && npm test  # Skills
```

---

## Branch

All work is on `main`. Feature branches merge via PR.
