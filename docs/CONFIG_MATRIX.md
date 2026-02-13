# A.I.M.S. Configuration & Secrets Matrix

**Date:** 2026-02-13
**Branch:** `claude/review-recent-changes-Gc4LU`
**Scope:** Every environment variable, API key, and secret across all subsystems

---

## Executive Summary

The project follows good security practices: server-side secrets are never exposed to the client, `NEXT_PUBLIC_` prefix is used correctly for client-safe values, and `.env` files are `.gitignore`d. No hardcoded secrets found in committed code.

---

## 1. Frontend Environment Variables (`frontend/.env.example`)

### LLM & AI Services

| Variable | Client-Exposed | Used In | Risk | Required |
|----------|---------------|---------|------|----------|
| `OPENROUTER_API_KEY` | No (Server) | `lib/ai/openrouter.ts`, `api/chat/route.ts`, `api/make-it-mine/route.ts` | SAFE | **YES** — core chat |
| `OPENROUTER_BASE_URL` | No (Server) | `lib/ai/openrouter.ts` | SAFE — URL only | No — defaults to `https://openrouter.ai/api/v1` |

### Voice Stack

| Variable | Client-Exposed | Used In | Risk | Required |
|----------|---------------|---------|------|----------|
| `ELEVENLABS_API_KEY` | No (Server) | `lib/services/elevenlabs.ts`, `api/voice/tts/route.ts`, `api/voice/voices/route.ts` | SAFE | **YES** — TTS primary |
| `NEXT_PUBLIC_ELEVENLABS_AGENT_ID` | Yes (Client) | `components/AcheevyAgent.tsx`, `app/integrations/page.tsx` | SAFE — non-sensitive ID | No |
| `DEEPGRAM_API_KEY` | No (Server) | `api/voice/stt/route.ts`, `api/voice/tts/route.ts`, `lib/services/deepgram.ts` | SAFE | **YES** — STT/TTS fallback |
| `GROQ_API_KEY` | No (Server) | `api/transcribe/route.ts`, `api/voice/stt/route.ts`, `lib/services/groq.ts` | SAFE | **YES** — STT primary |

### Search APIs

| Variable | Client-Exposed | Used In | Risk | Required |
|----------|---------------|---------|------|----------|
| `BRAVE_API_KEY` | No (Server) | `lib/search/brave.ts` | SAFE | For Make It Mine |
| `TAVILY_API_KEY` | No (Server) | `lib/services/search.ts` | SAFE | Fallback search |
| `SERPER_API_KEY` | No (Server) | `lib/services/search.ts` | SAFE | Fallback search |

### Payments

| Variable | Client-Exposed | Used In | Risk | Required |
|----------|---------------|---------|------|----------|
| `STRIPE_SECRET_KEY` | No (Server) | `api/stripe/checkout/route.ts`, `lib/stripe.ts` | **CRITICAL** | For payments |
| `STRIPE_PUBLISHABLE_KEY` | Yes (Client) | `lib/stripe.ts` | SAFE — designed for client | For payments |
| `STRIPE_WEBHOOK_SECRET` | No (Server) | `api/stripe/webhook/route.ts` | **CRITICAL** | For webhook verification |
| `STRIPE_PRICE_GARAGE` | No (Server) | `lib/stripe.ts` | SAFE — price ID | For subscriptions |
| `STRIPE_PRICE_COMMUNITY` | No (Server) | `lib/stripe.ts` | SAFE — price ID | For subscriptions |
| `STRIPE_PRICE_ENTERPRISE` | No (Server) | `lib/stripe.ts` | SAFE — price ID | For subscriptions |

### Auth

| Variable | Client-Exposed | Used In | Risk | Required |
|----------|---------------|---------|------|----------|
| `NEXTAUTH_SECRET` | No (Server) | NextAuth.js config | **CRITICAL** | **YES** |
| `NEXTAUTH_URL` | No (Server) | NextAuth.js config | SAFE — URL | **YES** |
| `GOOGLE_CLIENT_ID` | No (Server) | `api/auth/[...nextauth]/route.ts` | SAFE | For Google OAuth |
| `GOOGLE_CLIENT_SECRET` | No (Server) | `api/auth/[...nextauth]/route.ts` | **CRITICAL** | For Google OAuth |
| `GITHUB_CLIENT_ID` | No (Server) | Auth config | SAFE | For GitHub OAuth |
| `GITHUB_CLIENT_SECRET` | No (Server) | Auth config | **CRITICAL** | For GitHub OAuth |
| `DISCORD_CLIENT_ID` | No (Server) | Auth config | SAFE | For Discord OAuth |
| `DISCORD_CLIENT_SECRET` | No (Server) | Auth config | **CRITICAL** | For Discord OAuth |

### Database

| Variable | Client-Exposed | Used In | Risk | Required |
|----------|---------------|---------|------|----------|
| `DATABASE_URL` | No (Server) | Prisma client | **CRITICAL** | **YES** |

### Telegram

| Variable | Client-Exposed | Used In | Risk | Required |
|----------|---------------|---------|------|----------|
| `TELEGRAM_BOT_TOKEN` | No (Server) | `api/telegram/webhook/route.ts` | **CRITICAL** | For Telegram |
| `NEXT_PUBLIC_APP_URL` | Yes (Client) | Webhook URL construction | SAFE — public URL | **YES** |

### Gateway / Internal

| Variable | Client-Exposed | Used In | Risk | Required |
|----------|---------------|---------|------|----------|
| `NEXT_PUBLIC_UEF_GATEWAY_URL` | Yes (Client) | `lib/gateway.ts` | SAFE — URL | No — defaults to localhost |
| `UEF_GATEWAY_URL` | No (Server) | Server-side gateway calls | SAFE — URL | No |

---

## 2. Infrastructure Environment Variables (`infra/.env.example`)

| Variable | Used In | Default | Notes |
|----------|---------|---------|-------|
| `PORT` | UEF Gateway | `3001` | Gateway server port |
| `LOG_LEVEL` | UEF Gateway | `info` | Logging verbosity |
| `NODE_ENV` | All services | `production` | Environment mode |
| `CORS_ORIGIN` | UEF Gateway | `http://localhost:3000` | CORS whitelist |
| `AGENT_ZERO_URL` | Agent dispatch | `http://agent-zero:8080` | Disabled by default |
| `AGENT_BRIDGE_URL` | Agent bridge | `http://agent-bridge:3010` | Disabled by default |
| `FIREBASE_PROJECT_ID` | Firestore | — | Layer 4 persistence |
| `FIREBASE_CLIENT_EMAIL` | Firestore | — | Service account |
| `FIREBASE_PRIVATE_KEY` | Firestore | — | **CRITICAL** |
| `LLM_API_KEY` | Agent LLM calls | — | For backend agents |

---

## 3. Agent Bridge Environment Variables

| Variable | Default | Notes |
|----------|---------|-------|
| `PORT` | `3010` | Bridge server port |
| `AIMS_GATEWAY_URL` | `http://uef-gateway:3001` | UEF Gateway URL |
| `SANDBOX_AGENT_URL` | `http://agent-zero:80` | Sandbox agent target |
| `RATE_LIMIT_REQUESTS` | `100` | Requests per window |
| `RATE_LIMIT_WINDOW` | `60000` | Rate limit window (ms) |
| `ALLOWED_OPS` | `search,analyze,...` | Whitelisted operations |
| `BLOCKED_OPS` | `payment,transfer,...` | Blocked operations (NEVER allowed) |
| `INTERNAL_API_KEY` | — | Service-to-service auth |

---

## 4. n8n Bridge Variables

| Variable | Default | Used In | Notes |
|----------|---------|---------|-------|
| `N8N_REMOTE_URL` | `http://76.13.96.107:5678` | `lib/n8n-bridge.ts` | VPS 2 n8n instance |
| `N8N_API_KEY` | — | `lib/n8n-bridge.ts` | n8n API authentication |
| `N8N_AUTH_USER` | `aims` | `lib/n8n-bridge.ts` | Basic auth username |
| `N8N_AUTH_PASSWORD` | — | `lib/n8n-bridge.ts` | Basic auth password |

---

## 5. Docker Compose Hardcoded Defaults

| Service | Variable | Default | File |
|---------|----------|---------|------|
| UEF Gateway | `NODE_ENV` | `production` | `docker-compose.vps.yml` |
| UEF Gateway | `PORT` | `3001` | `docker-compose.vps.yml` |
| Agent Bridge | `PORT` | `3010` | `docker-compose.vps.yml` |
| Agent Bridge | `NODE_OPTIONS` | `--max-old-space-size=512` | `Dockerfile` |
| n8n | `N8N_PORT` | `5678` | `docker-compose.vps.yml` |
| Nginx | HTTPS port | `443` | `docker-compose.vps.yml` |
| Nginx | HTTP port | `80` | `docker-compose.vps.yml` |

---

## 6. Security Assessment

### No Hardcoded Secrets in Code

Verified: No API keys, tokens, or passwords are committed to the repository. All sensitive values use `process.env.*` lookups.

### Client-Exposed Variables (NEXT_PUBLIC_*)

Only these variables are exposed to the browser — all are safe:
- `NEXT_PUBLIC_ELEVENLABS_AGENT_ID` — non-sensitive agent identifier
- `NEXT_PUBLIC_APP_URL` — public application URL
- `NEXT_PUBLIC_UEF_GATEWAY_URL` — gateway URL (public endpoint)
- `STRIPE_PUBLISHABLE_KEY` — designed for client-side use by Stripe

### Critical Secrets (Never Expose)

| Secret | Subsystem |
|--------|-----------|
| `STRIPE_SECRET_KEY` | Payments |
| `STRIPE_WEBHOOK_SECRET` | Payments |
| `NEXTAUTH_SECRET` | Auth |
| `GOOGLE_CLIENT_SECRET` | Auth |
| `GITHUB_CLIENT_SECRET` | Auth |
| `DISCORD_CLIENT_SECRET` | Auth |
| `DATABASE_URL` | Database |
| `FIREBASE_PRIVATE_KEY` | Persistence |
| `TELEGRAM_BOT_TOKEN` | Messaging |
| `OPENROUTER_API_KEY` | LLM |
| `ELEVENLABS_API_KEY` | Voice |
| `DEEPGRAM_API_KEY` | Voice |
| `GROQ_API_KEY` | Voice |

### Recommendations

1. **Rotate** any keys that may have been exposed during development
2. **Add** `BRAVE_API_KEY` to production `.env` to activate Make It Mine search
3. **Verify** Stripe webhook secret is set in production
4. **Consider** adding `INTERNAL_API_KEY` to Agent Bridge for service-to-service auth
5. **Remove** hardcoded n8n IP (`76.13.96.107`) from code — use env var exclusively

---

*Generated by A.I.M.S. Config Matrix Audit — 2026-02-13*
