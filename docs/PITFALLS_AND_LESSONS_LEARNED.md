# A.I.M.S. — Pitfalls, Mistakes & Lessons Learned

> **Purpose:** Feed this into SOP for project launches and PRD templates so we never repeat these.
> **Compiled:** 2026-02-19 | **Source:** 68 PRs, 200+ commits, full infra/config audit, npm audits, code annotations

---

## Table of Contents

1. [CI/CD Pipeline Disasters](#1-cicd-pipeline-disasters)
2. [Deployment & Infrastructure Failures](#2-deployment--infrastructure-failures)
3. [Frontend Build Breaks](#3-frontend-build-breaks)
4. [Security Vulnerabilities & Leaks](#4-security-vulnerabilities--leaks)
5. [Dependency Hell](#5-dependency-hell)
6. [AI/LLM Integration Pitfalls](#6-aillm-integration-pitfalls)
7. [Performance Anti-Patterns](#7-performance-anti-patterns)
8. [Branching & PR Chaos](#8-branching--pr-chaos)
9. [Configuration Drift & Hardcoded Values](#9-configuration-drift--hardcoded-values)
10. [Missing/Incomplete Features](#10-missingincomplete-features)
11. [Nginx & Networking Gotchas](#11-nginx--networking-gotchas)
12. [Docker & Container Issues](#12-docker--container-issues)
13. [Audit Report Findings (Broken Integrations)](#13-audit-report-findings)
14. [npm Vulnerability Summary](#14-npm-vulnerability-summary)
15. [SOP Recommendations](#15-sop-recommendations)

---

## 1. CI/CD Pipeline Disasters

### 1.1 Cloud Build Substitution Naming (PR #65)
- **What happened:** Cloud Build rejects user-defined substitutions that don't start with `_`. We used `SHORT_SHA` — build failed silently.
- **Fix:** Renamed to `_SHORT_SHA` in both `cloudbuild.yaml` and `deploy.yml`.
- **Lesson:** Always prefix custom Cloud Build substitutions with `_`. Built-in vars (like `$SHORT_SHA`) are reserved.

### 1.2 Cloud Build STRICT Mode Rejection (commit 71a99f3)
- **What happened:** Added `_VPS_DOMAIN` substitution but never used it in any step. Cloud Build's STRICT mode rejects unused substitutions.
- **Fix:** Removed the unused substitution.
- **Lesson:** Every substitution declared must be consumed. Test locally with `gcloud builds submit --dry-run` if available.

### 1.3 Backend Lint Errors Killing Pipeline (PR #66)
- **What happened:** 22 ESLint errors (`no-unused-vars`, `no-var-requires`) across 13 backend files caused the `backend-lint` step to fail, killing the entire Cloud Build pipeline.
- **Fix:** Removed unused imports, dead functions, unused variable assignments.
- **Lesson:** Run `npm run lint` before pushing. Add a pre-commit hook for lint.

### 1.4 Broken Git Submodule Pointers (PR #58)
- **What happened:** Repo had two gitlink entries (mode 160000) — `AIMS` (self-referencing!) and `vendor/common-ground-core` — with no `.gitmodules` file. This broke `actions/checkout@v4` with exit code 128.
- **Fix:** Removed the broken gitlink entries, re-added common-ground-core properly.
- **Lesson:** Never add a repo as a submodule of itself. Always check `.gitmodules` matches gitlink entries. Run `git submodule status` in CI before checkout.

### 1.5 npm Peer Dependency Conflict (PR #59)
- **What happened:** `@remotion/zod-types@4.0.422` requires `zod@3.22.3` (exact), but `zod@^3.22.4` resolved to 3.25.76. `npm ci` failed with ERESOLVE.
- **Fix:** Added `frontend/.npmrc` with `legacy-peer-deps=true`.
- **Lesson:** Pin exact versions for dependencies with strict peer requirements. Test `npm ci` (not `npm install`) in CI — it's stricter.

### 1.6 PORT Reserved on Cloud Run (commit 00fbb20)
- **What happened:** Set `PORT` in Cloud Run `--set-env-vars`. PORT is reserved and auto-set by `--port` flag. Deploy failed.
- **Fix:** Removed PORT from env vars; rely on Cloud Run's `--port 3001`.
- **Lesson:** Cloud Run reserves: PORT, K_SERVICE, K_REVISION, K_CONFIGURATION. Never set these manually.

### 1.7 better-sqlite3 Build Failure in Alpine (commit bec22b6)
- **What happened:** Added `npm install` as a pre-build Cloud Build step with `node:20-alpine`. `better-sqlite3` requires native compilation tools (python3, make, g++) not present in alpine.
- **Fix:** Removed redundant pre-build npm steps — Dockerfiles handle build internally with multi-stage builds that include build tools.
- **Lesson:** Never run npm install outside the Dockerfile when native modules are involved. Let the Dockerfile control the build environment.

---

## 2. Deployment & Infrastructure Failures

### 2.1 SSH Password Auth Failures (PR #62)
- **What happened:** VPS deployment via password-based SSH failed 10+ consecutive times in GitHub Actions. Password auth is unreliable in automated pipelines (PAM issues, shell encoding, timeout).
- **Fix:** Switched to SSH key-based auth (`VPS_SSH_KEY` secret).
- **Lesson:** Never use password auth for automated deployments. Always use SSH keys or service accounts.

### 2.2 VPS → Cloud Run → VPS Flip-Flop (PRs #57, #62, #64, #68)
- **What happened:** Started with VPS deploy → switched to Cloud Run → parts went back to VPS. Caused 4+ PRs of churn and config conflicts.
- **Fix:** Settled on hybrid: VPS for full Docker Compose stack, Cloud Run for scalable gateway + frontend.
- **Lesson:** Decide deployment target BEFORE coding. Document it in the PRD. Don't change mid-sprint.

### 2.3 Health Check False Negatives (commit a1b2cc7)
- **What happened:** nginx health check pings `http://127.0.0.1:80/` which proxies to UEF gateway. If gateway is down, nginx is marked unhealthy even though nginx is fine.
- **Fix:** Added a direct `/health` endpoint in nginx that returns 200 without proxying.
- **Lesson:** Health checks must verify the container itself, not downstream dependencies. Use a dedicated `/healthz` path that doesn't proxy.

### 2.4 Missing IAM Roles (commit 9a56f71)
- **What happened:** Cloud Build service account lacked `run.admin`, `iam.serviceAccountUser`, and `artifactregistry.writer` roles. Deploys failed with permission denied.
- **Fix:** Added `gcloud projects add-iam-policy-binding` commands to setup script.
- **Lesson:** Document all required IAM roles in a setup checklist. Verify before first deploy.

### 2.5 GitGuardian Flagging Vendored Code (PR #60)
- **What happened:** Vendored `common-ground-core` contained secret patterns that triggered GitGuardian alerts.
- **Fix:** Removed vendored copy, re-added as proper submodule.
- **Lesson:** Never vendor third-party code without scanning for secrets first. Use git submodules or package managers.

---

## 3. Frontend Build Breaks

### 3.1 Missing postcss.config.js (PR #16)
- **What happened:** Without `postcss.config.js`, `@tailwind` directives in `globals.css` were never processed by PostCSS. Zero CSS output in Docker production builds. Site rendered with no styles.
- **Fix:** Added the missing config file (6 lines).
- **Lesson:** Test Docker production builds locally before pushing. `npm run build` in dev mode can mask missing PostCSS config.

### 3.2 Invalid 'Doto' Font Import (PRs #3, #6, #10, #11)
- **What happened:** `next/font/google` was configured with `Doto` — a font that doesn't exist in Google Fonts. Build crashed. This bug was independently discovered in 4 separate PRs.
- **Fix:** Replaced with `Roboto_Mono`.
- **Lesson:** Validate font names against Google Fonts API before importing. Add a build check.

### 3.3 useSearchParams Without Suspense (commit 9471a38)
- **What happened:** Next.js 14 App Router requires `useSearchParams` to be wrapped in a `<Suspense>` boundary. Static generation failed on sign-in and chat pages.
- **Fix:** Wrapped in Suspense + added `export const dynamic = 'force-dynamic'`.
- **Lesson:** Any client hook that reads URL state in Next.js App Router needs Suspense. Add an ESLint rule or project convention.

### 3.4 Missing Lucide-React Import (commit 548b94e)
- **What happened:** Used `<Settings />` icon on buy-in-bulk page but forgot to import from `lucide-react`. Build failed.
- **Fix:** Added the import.
- **Lesson:** Enable TypeScript strict mode + `noUnusedLocals`. Run full build before committing new pages.

### 3.5 Hallucinated V.I.B.E. Lore (commit 5949a78)
- **What happened:** AI-generated lore content included hallucinated character names, backstories, and world details that contradicted the actual Character Bible.
- **Fix:** Replaced with real content from the canonical Character Bible.
- **Lesson:** AI-generated creative content MUST be reviewed against source material. Never auto-commit AI prose without human review.

### 3.6 Broken Image Paths (PR #68)
- **What happened:** 6 image paths in `governance.ts` pointed to files that didn't exist. House of Ang page showed broken images.
- **Fix:** Fixed paths to match actual file locations.
- **Lesson:** Use a build-time image existence check or import images as modules so missing files cause build errors.

---

## 4. Security Vulnerabilities & Leaks

### 4.1 Sentry PII Leak (PR #34)
- **What happened:** ii-agent had `sendDefaultPii: true` in Sentry config, leaking user IP addresses to Sentry's servers.
- **Fix:** Removed the flag.
- **Lesson:** Audit all telemetry/observability configs for PII flags. Default should be `sendDefaultPii: false`.

### 4.2 Kling AI Bypasses UEF Gateway (audit report)
- **What happened:** `frontend/lib/kling-video.ts` makes direct API calls to `api.klingai.com`, bypassing the UEF Gateway's rate limiting, auth, and audit logging.
- **Status:** Still unresolved.
- **Lesson:** ALL external API calls must route through the UEF Gateway (Port Authority pattern).

### 4.3 Unverified Webhooks (audit report)
- **What happened:** Discord, Telegram, and n8n webhook handlers accept requests without signature/secret verification. Anyone can forge requests.
- **Status:** Still unresolved.
- **Lesson:** Every webhook endpoint must verify the sender's signature before processing.

### 4.4 LUC Meter IDOR (audit report)
- **What happened:** LUC meter had a hardcoded "starter" plan — no user-specific plan lookup. Could return wrong data.
- **Fix:** PR #39 replaced with Prisma lookup from user profile.
- **Lesson:** Never hardcode user-specific values. Always query from the authenticated user's context.

### 4.5 Edge Relay Path Bypass (audit report)
- **What happened:** `frontend/app/api/edge/relay/route.ts` uses `.startsWith()` for path validation, which can be bypassed with path traversal.
- **Status:** Still unresolved.
- **Lesson:** Use allowlists, not prefix matching, for path validation. Normalize paths before checking.

### 4.6 Deploy Dock Missing Ownership Check (audit report)
- **What happened:** Deploy Dock API has no user ownership verification. Any authenticated user could manage any other user's deployments.
- **Status:** Still unresolved.
- **Lesson:** Every mutation endpoint must verify `resource.ownerId === authenticatedUser.id`.

### 4.7 Rate Limiter Memory Leak (PR #45)
- **What happened:** `rateLimitStore` in middleware was an unbounded `Map`. Under sustained traffic, memory grows without limit until the process OOMs.
- **Fix:** Added periodic cleanup (10s interval, 10K max entries).
- **Lesson:** Every in-memory store needs a TTL and max-size policy. Prefer Redis for rate limiting in production.

---

## 5. Dependency Hell

### 5.1 Remotion + Zod Version Conflict
- **What happened:** Remotion requires exact `zod@3.22.3`. Project used `zod@^3.22.4` which resolved to 3.25.76. npm ci failed.
- **Fix:** `legacy-peer-deps=true` in `.npmrc`.
- **Impact:** This masks ALL peer dependency warnings, not just zod. Could hide future breakage.
- **Lesson:** Prefer `overrides` in package.json to pin specific versions rather than disabling all peer dep checks.

### 5.2 Next.js 14.0.4 → 14.2.35 Security Bump (commit 3852c86)
- **What happened:** Original Next.js version had 5 known vulnerabilities. Bump required testing all pages.
- **Lesson:** Start with the latest patch version of your chosen major. Set up Dependabot.

### 5.3 62 npm Vulnerabilities (Current State)
- **Frontend:** 29 vulnerabilities (12 moderate, 17 high) — `next`, `minimatch` ReDoS, `ai` SDK filetype bypass, `fast-xml-parser` DoS
- **Backend:** 33 vulnerabilities (1 low, 1 moderate, 31 high) — `minimatch` ReDoS through eslint/jest trees, `qs` DoS
- **Key blocker:** `minimatch` ReDoS fans through eslint, jest, and Next.js dependency trees. Fixing requires eslint 10.x (breaking).
- **Lesson:** Run `npm audit` in CI and fail on high/critical. Address vulnerabilities weekly, not at launch.

---

## 6. AI/LLM Integration Pitfalls

### 6.1 Model Slug Mismatches (commit 084aeac)
- **What happened:** Frontend sent model IDs like `openrouter/google/gemini-2.0-flash` but the gateway expected `google/gemini-2.0-flash-001`. Requests silently fell back to default model.
- **Fix:** Aligned slugs across frontend model catalog and gateway routing.
- **Lesson:** Define a single source of truth for model IDs. Validate model slugs at the gateway with a strict allowlist.

### 6.2 Groq Deprecation (commit 6c17f4f)
- **What happened:** Built STT pipeline on Groq Whisper. Groq's API changed/became unreliable. Had to rip out and replace with ElevenLabs Scribe v2 + Deepgram Nova.
- **Lesson:** Never build on a single STT/TTS provider. Implement the provider pattern with a fallback chain from day 1.

### 6.3 OpenRouter Streaming Broken (commit 084aeac)
- **What happened:** OpenRouter streaming was using a mock/polling approach instead of actual SSE. Messages appeared all at once instead of streaming.
- **Fix:** Implemented real SSE streaming with proper `ReadableStream` piping.
- **Lesson:** Test streaming behavior manually — unit tests don't catch SSE buffering issues.

### 6.4 Hardcoded LLM Plan (PR #39)
- **What happened:** LUC meter route returned a hardcoded "starter" plan for all users instead of their actual subscription tier.
- **Fix:** Query Prisma for the user's actual plan.
- **Lesson:** Stub data must be flagged with `// STUB: replace before launch` and tracked in a launch checklist.

---

## 7. Performance Anti-Patterns

### 7.1 AcheevyChat 60fps Re-renders (PRs #10, #11, #17, #18, #20, #21, #22, #26, #32, #52, #54, #56, #67)
- **What happened:** 13 PRs (8 from Bolt, 5 from other agents) all tried to fix the same problem: AcheevyChat re-rendered the entire message list 60 times per second during voice playback/recording. Each Bolt PR created a new branch with a slightly different approach.
- **Fix:** PR #68 consolidated all approaches into one clean implementation: custom `areEqual` memo comparator, memoized VoiceWaveform, `voiceOutputRef` stale-closure fixes.
- **Lesson:** Assign one owner per performance issue. Automated agents (Bolt) need duplicate-detection or they'll churn out competing PRs indefinitely.

### 7.2 Synchronous File I/O in Server Storage (PRs #41, #42, #46)
- **What happened:** `server-storage.ts` used `fs.readFileSync`/`fs.writeFileSync`, blocking the event loop on every LUC read/write.
- **Fix:** Replaced with `fs.promises` async I/O (PR #46).
- **Lesson:** Never use `*Sync` methods in Node.js server code. Add an ESLint rule: `no-sync`.

### 7.3 Sequential Promise Execution (PRs #40, #47, #49)
- **What happened:** Multiple places used sequential `for` loops for independent async operations (flushing events, exporting CSV, exporting data).
- **Fix:** Replaced with `Promise.all` for concurrent execution.
- **Lesson:** When async operations are independent, always use `Promise.all`. Review code for sequential awaits in loops.

### 7.4 Monolithic localStorage (PR #44)
- **What happened:** All LUC accounts stored in a single localStorage JSON blob. Every update re-serialized the entire object.
- **Fix:** Split into individual keys. 400x faster updates.
- **Lesson:** Don't store collections as single JSON blobs in localStorage. Use individual keys or IndexedDB.

---

## 8. Branching & PR Chaos

### 8.1 8 Competing Bolt Branches for Same Fix
- **Branches:** `bolt/optimize-acheevy-chat-*`, `perf/memoize-chat-*`, `bolt-optimization-*`, `bolt-perf-*`
- **What happened:** Bolt (automated agent) created 8 separate branches over 14 days, all attempting to memoize AcheevyChat. Each was slightly different. Most were closed without merging.
- **Cost:** 8 PRs created, reviewed, and closed. Developer confusion. Merge conflicts.
- **Lesson:** Automated agents need: (1) deduplication — check if a similar PR exists before creating one, (2) rate limiting — max 1 PR per component per day, (3) human approval gate before PR creation.

### 8.2 Mega-Commits Without Description (PRs #13, #27, #30, #33, #55, #60)
- **What happened:** Several PRs with 50-400+ changed files had only the default template body (no description). Example: PR #60 deleted 71,059 lines with no explanation.
- **Lesson:** Require PR descriptions in the template (use `required` label or CI check). Block merges without a summary.

### 8.3 Self-Referencing Submodule (PR #58)
- **What happened:** The AIMS repo was added as a submodule of itself (`AIMS` gitlink pointing to the same repo).
- **Lesson:** Add a CI check: `git submodule foreach` should never resolve to the current repo URL.

---

## 9. Configuration Drift & Hardcoded Values

### 9.1 Dual VPS IP Confusion
- **cloudbuild.yaml** has `_VPS_HOST=76.13.96.107`
- **CLAUDE.md** documents AIMS VPS as `31.97.138.45`
- **Lesson:** Single source of truth for infrastructure IPs. Use env vars or a shared config, not hardcoded values in multiple files.

### 9.2 deploy.sh sed -i Idempotency
- **What happened:** `deploy.sh` mutates `.env.production` in-place with `sed -i`. Running with different domains without resetting leaves stale values.
- **Lesson:** deploy.sh should template from `.env.production.template` → `.env.production` instead of mutating in place.

### 9.3 Demo SSL Not Wired to deploy.sh
- **What happened:** `demo-ssl.conf.template` exists but `deploy.sh` has no `--demo-domain` flag. Must be manually configured.
- **Lesson:** If it exists in config, it must be in the deploy script. No manual steps in production deploys.

### 9.5 Global PORT=3001 Leaking Into Frontend (Live Deploy, Feb 19)
- **What happened:** `.env.production` had `PORT=3001` (intended for the UEF gateway). Docker Compose passes ALL env vars from the env file to every service. The Next.js frontend picked up `PORT=3001` and listened on 3001 instead of its default 3000. But the health check was still pinging `http://localhost:3000` — so the frontend was marked **unhealthy** forever despite being perfectly functional on port 3001.
- **sed didn't stick:** An earlier `sed -i '/^PORT=3001/d'` ran, but the deploy script re-wrote `.env.production` afterward, restoring the line. The fix had to be applied *after* all file mutations completed, then containers `--force-recreate`d.
- **Fix:** Removed `PORT=` from `.env.production` entirely. The UEF gateway Dockerfile sets its own `ENV PORT=3001` internally. Never rely on a global PORT in the env file.
- **Lesson:** (1) Never put `PORT=` in a shared `.env` file — each service should define its own port in its Dockerfile. (2) When a container is "unhealthy," always compare the health check target port vs the actual listening port. (3) `sed` fixes don't persist if another process re-writes the file afterward.

### 9.6 n8n Empty Password Prevents Startup
- **What happened:** `.env.production` has `N8N_AUTH_PASSWORD=` (blank). The compose file maps it to `N8N_BASIC_AUTH_PASSWORD=${N8N_AUTH_PASSWORD}` with **no default fallback** (unlike `N8N_BASIC_AUTH_USER` which defaults to `aims`). With `N8N_BASIC_AUTH_ACTIVE=true` and an empty password, n8n refuses to start or crash-loops.
- **Additional risk:** n8n v1.x deprecated `N8N_BASIC_AUTH_*` in favor of the newer user management system. Using `n8nio/n8n:latest` means the image version is unpinned — a new pull could break the auth config entirely.
- **Fix needed:** Set `N8N_AUTH_PASSWORD` to a real value. Pin n8n image to a specific version (e.g., `n8nio/n8n:1.76.1`).
- **Lesson:** (1) Every env var in docker-compose that has no `:-default` MUST be validated in deploy.sh's pre-flight check. (2) Never use `:latest` for production images — pin to a specific version.

### 9.7 SSL Session Cache Name Collisions
- **What happened:** Three SSL configs use different cache names (`SSL`, `LANDING_SSL`, `DEMO_SSL`) but this is undocumented and could cause confusion if someone copies a template.
- **Lesson:** Document SSL session cache naming convention in the nginx readme.

---

## 10. Missing/Incomplete Features

### Current Status (AIMS_PLAN.md as of 2026-02-18)

| Status | Count | Items |
|--------|-------|-------|
| DONE | ~11 | VPS deploy, health checks, Prisma, nginx, chat page, streaming, LUC, Redis, Deploy Dock, Arena, 3D |
| PARTIAL | 10 | Voice I/O, Auth (needs Google OAuth creds), Revenue verticals, Single ACHEEVY UI, Onboarding, Per\|Form lobby, Stripe, n8n, LiveSim, Chicken Hawk |
| MISSING | 4 | Cloud Run Jobs, CDN pipeline, PersonaPlex voice, Competitor parity |

### Critical Blockers
- **Auth:** Google OAuth requires `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` — not yet provisioned
- **Voice I/O:** Keys cemented but end-to-end flow (STT → LLM → TTS) never tested
- **Stripe:** Keys cemented but no webhook handler, no plan setup in Stripe dashboard
- **Full flow test:** auth → chat → LLM → voice never verified end-to-end

### Unresolved TODOs in Code
| File | TODO | Impact |
|------|------|--------|
| `diy-handler.ts:109` | Generate TTS audio URL | DIY voice responses broken |
| `login.tsx:232` | Implement email/password login | ii-agent login non-functional |
| `register/route.ts:59` | Store business metadata in workspace | Registration data lost |
| `diy/page.tsx:457,472` | TTS playback + Web Speech API | Voice features stubbed |
| `auth.ts:148` | Sync user to Firestore | Firebase extensions broken |

---

## 11. Nginx & Networking Gotchas

### 11.1 SSE Buffering (PR #68)
- **What happened:** nginx's default `proxy_buffering on` caused AI chat responses to buffer until completion, then dump all at once. No streaming UX.
- **Fix:** Added `proxy_buffering off; proxy_cache off; proxy_read_timeout 120s` on `/api/gateway/`.
- **Lesson:** ANY endpoint that uses SSE or streaming MUST have buffering explicitly disabled in the nginx proxy config.

### 11.2 HTTP/2 Directive Syntax (commit 16d1a64)
- **What happened:** Used deprecated `listen 443 ssl http2;` syntax. Modern nginx (1.25.1+) requires a separate `http2 on;` directive.
- **Fix:** Updated templates.
- **Lesson:** Check nginx version in your Docker image before copying config from StackOverflow.

### 11.3 www → Apex Redirect (SSL template)
- **What happened:** Needed separate server blocks for `www.plugmein.cloud` → `plugmein.cloud` redirect, each requiring its own SSL cert with SANs.
- **Lesson:** Include `www.` variant in certbot SAN list from the start. Don't discover this after the cert is already issued.

### 11.4 CORS Origin Missing (commit 18e7d2f)
- **What happened:** `aimanagedsolutions.cloud` was not in the CORS allowed origins list. Frontend on that domain couldn't call the API.
- **Fix:** Added to CORS config.
- **Lesson:** Every domain you deploy to must be in CORS. Use env vars for origin lists, not hardcoded arrays.

---

## 12. Docker & Container Issues

### 12.1 Prisma + SQLite Volume Mounts
- **What happened:** Prisma generates the SQLite DB at build time, but Docker volumes mount over the build output at runtime, making the DB disappear.
- **Fix:** Run `prisma migrate deploy` at container startup, not build time.
- **Lesson:** Stateful data (databases, uploads) must use named volumes with initialization scripts, not build-time generation.

### 12.2 Non-Root User Compatibility
- **What happened:** Services running as `user: "1000:1000"` couldn't write to directories owned by root. Logs and data dirs failed.
- **Fix:** Added `mkdir -p && chown` in Dockerfiles.
- **Lesson:** If you set `user:` in docker-compose, ensure all writable paths are owned by that user in the Dockerfile.

### 12.3 Resource Limits Inconsistency
- **What happened:** Some services (house-of-ang, acheevy, demo-frontend) have CPU/memory limits. Others (nginx, frontend, uef-gateway, redis) do not. A runaway process in an unlimited container could starve the VPS.
- **Lesson:** Set resource limits on ALL containers, especially on a shared VPS.

---

## 13. Audit Report Findings

From `docs/audit-report-feb-2026.md`:

### Critical
- **SSRF in sandbox server** — user-controlled URLs not validated
- **Missing auth on ACHEEVY API routes** — guest mode too permissive

### High
- **IDOR in LUC meter** — fixed (PR #39)
- **Kling AI bypasses gateway** — still open
- **Unverified webhooks** (Discord, Telegram, n8n) — still open

### Medium
- **Edge relay path bypass** — `.startsWith()` instead of allowlist
- **Deploy Dock no ownership check** — any user can manage any deployment
- **LUC storage race condition** — concurrent writes can corrupt data

### Low
- **Rate limiter memory leak** — fixed (PR #45)

---

## 14. npm Vulnerability Summary

### Frontend (29 vulnerabilities)
| Severity | Count | Key Packages |
|----------|-------|-------------|
| High | 17 | `next` (Image Optimizer DoS, RSC deserialization DoS), `minimatch` ReDoS, `fast-xml-parser` DoS |
| Moderate | 12 | `ai` SDK filetype bypass, `ajv` ReDoS, `nanoid` predictability, `jsondiffpatch` XSS |

### Backend (33 vulnerabilities)
| Severity | Count | Key Packages |
|----------|-------|-------------|
| High | 31 | `minimatch` ReDoS (fans through eslint + jest trees) |
| Moderate | 1 | `ajv` ReDoS |
| Low | 1 | `qs` arrayLimit bypass |

### Quick Fixes Available
- `npm audit fix` (non-breaking): `fast-xml-parser`, `qs`
- Everything else requires major version bumps (`eslint` 10.x, `next` 16.x, `ai` 6.x)

---

## 15. SOP Recommendations

### Pre-Development Checklist
- [ ] Deployment target decided and documented (VPS vs Cloud Run vs hybrid)
- [ ] All IAM roles/permissions provisioned and verified
- [ ] SSH keys (not passwords) configured for all automated access
- [ ] Domain names, SSL SANs, and CORS origins listed
- [ ] Single source of truth for model IDs, API keys, and infrastructure IPs
- [ ] `.npmrc` configured; `npm audit` passing or exceptions documented
- [ ] Automated agents (Bolt, Jules, Copilot) rate-limited and deduplicated

### Pre-Commit Checklist
- [ ] `npm run build` passes (frontend AND backend)
- [ ] `npm run lint` passes
- [ ] `npm audit` has no new high/critical vulnerabilities
- [ ] No `*Sync` methods in server code
- [ ] No hardcoded user-specific values (plans, IDs, secrets)
- [ ] All external API calls route through UEF Gateway
- [ ] All webhook endpoints verify sender signatures
- [ ] PR has a description (not just the template)

### Pre-Deploy Checklist
- [ ] Docker production build tested locally
- [ ] All env vars validated (deploy.sh pre-flight)
- [ ] No global `PORT=` in shared `.env` files — each service owns its port via Dockerfile
- [ ] Every env var referenced in docker-compose with no `:-default` has a non-empty value
- [ ] All Docker images pinned to specific versions (no `:latest` in production)
- [ ] SSL certs include all domain SANs (including www, demo)
- [ ] Health checks verify the container itself, not downstream deps
- [ ] Health check port matches the actual port the service listens on
- [ ] Resource limits set on ALL containers
- [ ] `postcss.config.js` present (Tailwind)
- [ ] Fonts validated against Google Fonts API
- [ ] All TODO/STUB comments resolved or tracked in issue tracker

### Post-Deploy Checklist
- [ ] End-to-end flow: auth → chat → LLM response → voice playback
- [ ] SSE streaming verified (not buffered)
- [ ] All pages load images without 404s
- [ ] CORS working from all deployed domains
- [ ] Webhooks receiving and verifying signatures
- [ ] `npm audit` clean or exceptions documented
- [ ] Rate limiting verified (both nginx and Express)
- [ ] Memory/CPU usage within resource limits

---

## Appendix: PR Timeline (Key Events)

| Date | PR(s) | Event |
|------|-------|-------|
| Feb 02 | #1 | Initial project kick-off (Copilot, abandoned) |
| Feb 04 | #2-#7 | Frontend UI fixes, ORACLE framework, first build passes |
| Feb 05-06 | #8-#12 | Branding integration, CI pipeline, ESLint + Jest, CODEOWNERS |
| Feb 07 | #13-#16 | VPS deploy, postcss fix, chat unlock, guest mode |
| Feb 08 | #19 | n8n PMO routing, chain-of-command pipeline |
| Feb 10-12 | #20-#23 | Voice I/O, file uploads, Bolt memoization attempts (3 closed) |
| Feb 13 | #25-#28 | ACHEEVY Chat + Voice production upgrade, V.I.B.E. lore, dual-domain |
| Feb 14 | #29-#35 | Deployment Hub, Boomer_Ang brains, Sentry PII kill, identity engine |
| Feb 15 | #36-#53 | Mass PR day: 18 PRs (Bolt, Jules, Claude). Performance optimizations, security audit, Kling AI, LUC fixes |
| Feb 16-17 | #54-#62 | More Bolt PRs, SSH key switch, pricing rewrite, submodule fix, peer dep fix |
| Feb 18 | #63-#66 | Cloud Build pipeline: 4 PRs of fixes (substitutions, lint, PORT, better-sqlite3) |
| Feb 19 | #67-#68 | UI optimization consolidation, VPS deployment hardening |
| Feb 19 | (live) | VPS live deploy: PORT=3001 leak → frontend unhealthy, sed fix didn't persist, n8n empty password crash loop. All 10 containers healthy after manual fix. Both domains live on HTTPS. |

---

*This document should be the starting point for the A.I.M.S. Launch SOP and future PRDs.*
