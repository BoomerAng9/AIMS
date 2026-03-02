# Blockwise AI — Claude Code Project Instructions

## What This Is
Blockwise AI is a standalone neighborhood intelligence and real estate investment platform.
It is a product created BY A.I.M.S. — NOT built into A.I.M.S.

## Architecture
- **Frontend + Backend:** Next.js 14 (App Router) — single deployable unit
- **API Routes:** `app/api/` handles all backend logic (no separate server)
- **Primary LLM:** Mercury 2 (Inception Labs) via OpenAI-compatible SDK
- **Voice:** ElevenLabs Agent SDK + UI components
- **Maps:** Google Maps JavaScript API via @vis.gl/react-google-maps
- **Data Pipeline:** 4 tiers (Google Maps → Brave Search → Firecrawl → Structured APIs)
- **A.I.M.S. Connection:** External APIs (LUC metering, Evidence Locker, SDT)

## Key Files
- `lib/types.ts` — All TypeScript interfaces
- `lib/flip-formulas.ts` — LUC flip calculator (19 formulas, 70% Rule)
- `lib/k1-formulas.ts` — K1 tax calculator (10 formulas, 50 state rates)
- `lib/neighborhood.ts` — Block Score algorithm (0-100, 5 weighted categories)
- `lib/mercury.ts` — Mercury 2 LLM client (OpenAI-compatible)
- `lib/aims-api.ts` — A.I.M.S. API client (LUC, Evidence Locker, SDT)
- `lib/brave-search.ts` — Brave Search API (Tier 2 data)
- `lib/firecrawl.ts` — Firecrawl scraping (Tier 3 data)
- `lib/google-maps.ts` — Google Maps utilities
- `data/` — Static formula and rate data

## Routes
- `/` — Property Search & Map (home)
- `/analyze` — Deep Neighborhood Intel (Block Score)
- `/flip` — LUC Real Estate Calculator
- `/k1` — K1 Tax Generator

## Branding Rules
- All calculator branding is "LUC" — NEVER "Flip Secrets"
- ACHEEVY is the AI assistant name — always spelled ACHEEVY (double-E)
- Dark theme: #0A0A0F background, gold #D4A843 accents
- Glass card styling: bg-white/5 backdrop-blur-xl border-white/10

## Testing
```bash
npm run build    # Build check
npm run lint     # Lint check
```

## Deployment
Deploys as an A.I.M.S. Plug (Docker container):
```bash
docker build -t blockwise-ai .
docker run -p 3100:3000 --env-file .env.local blockwise-ai
```
