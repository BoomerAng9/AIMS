# A.I.M.S. — HONEST STATUS REPORT

> **Generated:** 2026-02-22 | **Source:** 4 independent code audits + build verification
> **Build:** TypeScript clean, Next.js 199 pages, 260/261 tests pass

---

## THE TRUTH

A lot of work has been done. A lot of work was also **claimed done but isn't**.
This document is the single source of truth. No sugarcoating.

---

## WHAT IS ACTUALLY REAL AND WORKING

### Plug Engine (PaaS Core) — SHIP IT
| Component | Evidence |
|-----------|----------|
| Docker API integration | `dockerode` — pull, create, start, stop, remove, inspect |
| Port allocation | Persistent to `/var/lib/aims/port-allocator.json`, survives restarts |
| Instance persistence | SQLite `plug_instances` table, migration 006 |
| Health monitoring | Background sweeps every 30s, real HTTP checks, 1000-event history |
| 25+ API endpoints | spin-up, stop, restart, decommission, export, health, monitoring |
| 30+ plug catalog entries | Real Docker image URIs (openclaw, agent-zero, deerflow, n8n, etc.) |
| Nginx proxy generation | Writes to `/etc/nginx/conf.d/plugs/` |
| Full lifecycle | provision → deploy → monitor → scale → decommission |
| Export bundles | docker-compose + env + nginx + setup script |

### Billing Metering — WORKS (with caveats)
| Component | Evidence |
|-----------|----------|
| `meterAndRecord()` | Writes to SQLite after every agent execution (index.ts:2609) |
| 5 SQLite billing tables | billing_provisions, payment_sessions, x402_receipts, agent_wallets, agent_transactions |
| Guest user policy | Enforced: estimates only, no execution, no metering |
| Affordability gate | `canAfford()` reads SQLite before allowing execution |
| Spending limits | Per-transaction, hourly, daily via SQLite aggregation |
| Transaction audit trail | Every debit/credit recorded |
| Stripe webhook | Provisions tiers, credits LUC, marks sessions complete |
| Stripe checkout | Creates real Stripe sessions when keys configured |
| X402 protocol | Replay protection via SQLite receipts |

### Frontend — REAL (not a mockup)
| Component | Evidence |
|-----------|----------|
| Auth | NextAuth + credentials + Google/Discord OAuth, 3-step signup |
| Chat w/ ACHEEVY | Real LLM streaming (10+ models via OpenRouter), voice I/O |
| Plug Catalog UI | Browse, search, deploy, instance management |
| Dashboard | Health checks, quick-access tiles |
| Deploy Dock | Build → Assign → Launch with proof-linked events |
| LUC Metering UI | Usage tracking, cost estimation |
| Per\|Form Sports | NFL draft hub, big board, news ticker, Film Room |
| 93+ pages | All build successfully |
| 100+ API routes | Real backend connectivity |

### Backend Core — REAL
| Component | Evidence |
|-----------|----------|
| UEF Gateway | 2,920 lines, 100+ routes, 42 domain modules |
| SQLite | WAL mode, 10+ tables, 6 versioned migrations, TTL cleanup |
| Auth middleware | Ownership-based RBAC, role matrix |
| Security middleware | Helmet, CORS, rate limiting, API key auth, correlation IDs |
| ORACLE 8-gate | Technical, security, strategy, documentation, effort, judge |
| Memory system | SQLite persistence, relevance scoring, TTL |
| Backup/restore | Snapshots, SHA-256 integrity, restore drills |
| Security testing | SAST + SCA scanning |

---

## WHAT IS BROKEN

### 1. In-Memory / SQLite Dual-Layer Wallet Problem
**File:** `backend/uef-gateway/src/payments/agent-payments.ts`

`agentPayments` maintains in-memory `Map<string, AgentWallet>` alongside SQLite stores.
- `canAfford()` reads SQLite (good)
- `creditWallet()` updates in-memory AND SQLite (fragile)
- `getOrCreateWallet()` creates in-memory only (NO SQLite write)
- **Payment tokens (APT) are IN-MEMORY ONLY** — lost on restart
- On restart: in-memory wallets reset to 1000 LUC, SQLite is correct but they diverge

**FIX:** Remove in-memory Maps entirely. Make all reads/writes go through SQLite stores.

### 2. Dev-Mode Stripe Bypasses
- `agent-commerce.ts:304-307` — If no `STRIPE_SECRET_KEY` + `NODE_ENV !== 'production'`: accepts ANY payment
- `agent-commerce.ts:458-461` — If no `STRIPE_WEBHOOK_SECRET` + `NODE_ENV !== 'production'`: accepts unsigned webhooks
- `x402.ts:249-257` — Non-Stripe payment IDs accepted without verification in ALL environments

**FIX:** Reject all unverified payments regardless of environment. Log warnings, don't silently accept.

### 3. ACHEEVY Standalone Service is Hollow
**File:** `backend/acheevy/`

The separate ACHEEVY container (port 3003) is a shell:
- In-memory session store (lost on restart)
- Intent analyzer is regex-only
- No actual command execution
- No billing/metering integration
- The UEF Gateway's `/api/acheevy/chat` does the real work via OpenRouter

**FIX:** Either wire ACHEEVY service to real execution or remove it and consolidate into UEF Gateway.

### 4. 1 Failing Test
**File:** `src/__tests__/openrouter.test.ts`
- "returns stub response when not configured" — test expectation mismatch

**FIX:** Update test to match current stub behavior.

---

## WHAT IS FAKE / NEVER IMPLEMENTED

### Coinbase Payment Verification
**File:** `billing/agent-commerce.ts:315-321`
- Accepts any `txHash` without chain verification
- Has TODO: "Verify txHash on Base chain via Coinbase CDP API"
- **Never implemented**

### Invoice Generation
**File:** `billing/index.ts`
- `generateInvoiceLineItems()` — defined, never called
- `generateSavingsLedgerEntries()` — defined, never called
- `calculateFees()` — defined, never called

### Integration Activation
**File:** `backend/uef-gateway/src/integrations/`
- 15 integration definitions exist (SendGrid, Resend, Stripe, PayPal, etc.)
- **No actual provisioning** — just catalog entries
- **No env injection** — env vars not applied to running instances

### Agent Execution
- Agent registry works (list, get, CRUD)
- **No actual agent execution** — routes to external services that don't execute
- **No swarm orchestration** — no multi-agent coordination
- Lil_Hawks templates defined but not executed

### ACHEEVY as Service Orchestrator
- ACHEEVY can chat and classify intents
- **Cannot deploy containers** — doesn't call plug engine
- **Cannot execute builds** — doesn't call Chicken Hawk
- **Cannot manage instances** — no PaaS dispatch wiring

---

## DEAD CODE (defined, exported, never called)

| Function | File | What It Does |
|----------|------|-------------|
| `checkAllowance()` | billing/index.ts | Validates tier ceiling — needs monthly billing cron |
| `calculateFees()` | billing/index.ts | Maintenance + transaction fees — needs invoice flow |
| `generateSavingsLedgerEntries()` | billing/index.ts | Triple-ledger savings — needs invoice flow |
| `generateInvoiceLineItems()` | billing/index.ts | Invoice generation — needs billing cron |
| `paymentSessionStore.listByAgent()` | billing/persistence.ts | List sessions per agent — needs admin dashboard |
| `paymentSessionStore.expireStaleSessions()` | billing/persistence.ts | Cleanup expired sessions — needs cron |
| `x402ReceiptStore.isValid()` | billing/persistence.ts | Check receipt expiration — needs middleware call |
| `x402ReceiptStore.cleanup()` | billing/persistence.ts | Remove expired receipts — needs cron |
| `POST /api/payments/agent/usage` | agent-commerce.ts | Calculates cost but doesn't persist |

---

## WHAT BLOCKS LAUNCH

| Blocker | Severity | What's Needed |
|---------|----------|---------------|
| Never deployed to VPS | CRITICAL | Run `deploy.sh`, smoke test live |
| Google OAuth credentials | CRITICAL | Need `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` from user |
| Payment tokens lost on restart | HIGH | Persist APT to SQLite |
| In-memory wallet duplication | HIGH | Remove Maps, use SQLite only |
| Dev-mode payment bypasses | HIGH | Reject unverified in all environments |
| ACHEEVY can't execute commands | MEDIUM | Wire PaaS dispatch into chat flow |
| Coinbase verification fake | MEDIUM | Implement or remove Coinbase option |
| Observability not persisted | LOW | In-memory metrics reset on restart |
| Integrations not activatable | LOW | Wire catalog to env injection |

---

## THE PLAN — ORDERED COMPLETION LIST

Based on the AIMS_PLAN.md phases and the audit findings, here is what needs to be done, in order:

### ROUND 1: FIX WHAT'S BROKEN (Critical Path)
- [ ] **1.1** Remove in-memory wallet Maps from `agent-payments.ts` — all reads/writes through SQLite
- [ ] **1.2** Persist payment tokens (APT) to SQLite — add `payment_tokens` table in migration 007
- [ ] **1.3** Harden Stripe bypasses — reject unverified payments in ALL environments, not just production
- [ ] **1.4** Fix the x402 non-Stripe ID acceptance — require verification for all payment IDs
- [ ] **1.5** Fix the 1 failing OpenRouter test
- [ ] **1.6** Wire dead billing cron functions — `expireStaleSessions()`, `x402ReceiptStore.cleanup()` on interval

### ROUND 2: COMPLETE PAYMENTS (Revenue Path)
- [ ] **2.1** Wire `checkAllowance()` into monthly billing check (cron or n8n trigger)
- [ ] **2.2** Wire `calculateFees()` + `generateInvoiceLineItems()` into invoice generation flow
- [ ] **2.3** Create Stripe subscription plans (3mo, 6mo, 9mo) in Stripe dashboard + wire plan IDs
- [ ] **2.4** Wire Stripe subscription checkout to frontend pricing page
- [ ] **2.5** Implement or remove Coinbase payment verification (either verify on-chain or drop the option)
- [ ] **2.6** Wire `POST /api/payments/agent/usage` to actually persist usage records
- [ ] **2.7** Add wallet endpoint authentication — currently anyone can credit any agent

### ROUND 3: WIRE ACHEEVY TO EXECUTION (The Mission)
- [ ] **3.1** Wire ACHEEVY chat to plug engine — "spin up X" triggers `POST /api/plug-instances/spin-up`
- [ ] **3.2** Wire ACHEEVY to instance management — "stop X", "what's running", "show me health"
- [ ] **3.3** Wire ACHEEVY to Chicken Hawk — "build me X" triggers build execution
- [ ] **3.4** Wire health monitor alerts to ACHEEVY — unhealthy instances trigger user notifications
- [ ] **3.5** Consolidate or remove standalone ACHEEVY service (port 3003) — UEF Gateway handles chat

### ROUND 4: COMPLETE PHASE 2 (Core Loop)
- [ ] **4.1** Voice I/O end-to-end test (Groq STT → ACHEEVY → ElevenLabs TTS)
- [ ] **4.2** Get Google OAuth credentials and configure
- [ ] **4.3** Full auth → chat → LLM response → voice playback integration test
- [ ] **4.4** VPS deploy via `deploy.sh` + live smoke test

### ROUND 5: COMPLETE PHASE 3 (Revenue Verticals)
- [ ] **5.1** Phase B execution — connect vertical completion to Chicken Hawk dispatch
- [ ] **5.2** n8n workflow triggers for automation verticals
- [ ] **5.3** Hawk scheduling via n8n cron triggers
- [ ] **5.4** Per|Form lobby with live gridiron data

### ROUND 6: COMPLETE PHASE 4 (PaaS Operations)
- [ ] **6.1** ACHEEVY dispatch wiring for PaaS ops (done in Round 3)
- [ ] **6.2** Per-user instance isolation (dedicated Docker networks)
- [ ] **6.3** Instance resource monitoring (CPU, memory, disk per container)
- [ ] **6.4** Wire integration catalog to actual env injection on plug deploy

### ROUND 7: PHASE 5 (Autonomy)
- [ ] **7.1** Cloud Run job configs for Chicken Hawk
- [ ] **7.2** n8n → Cloud Run dispatch pipeline
- [ ] **7.3** CDN deploy pipeline for generated sites
- [ ] **7.4** LiveSim WebSocket real-time agent feed
- [ ] **7.5** PersonaPlex full-duplex voice integration
- [ ] **7.6** NtNtN → Chicken Hawk → Plug instance end-to-end pipeline

### ROUND 8: PHASE 6 (Polish + Scale)
- [ ] **8.1** Circuit Metrics dashboard wired to per-instance real data
- [ ] **8.2** Persistent observability (time-series backend or SQLite aggregation)
- [ ] **8.3** Load testing and VPS capacity planning
- [ ] **8.4** Auto-scaling policies for plug instances
- [ ] **8.5** Multi-VPS deployment support

---

## SCORE

| Category | Real | Partial | Fake/Missing | Dead Code |
|----------|------|---------|--------------|-----------|
| Plug Engine | 10 | 1 | 0 | 0 |
| Billing/Payments | 10 | 3 | 2 | 9 functions |
| Frontend | 15 | 2 | 0 | 0 |
| Backend Core | 12 | 3 | 2 | 0 |
| **Total** | **47** | **9** | **4** | **9 functions** |

**Overall: ~75% real, ~15% partial, ~7% fake, ~3% dead code**

The platform is real. The PaaS core works. The billing metering works. The frontend is production-grade.
But there are broken seams, hollow services, and claimed-complete items that aren't.
This document is the truth. Let's fix it.
