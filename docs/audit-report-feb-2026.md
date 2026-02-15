# AIMS Security Audit & Integration Report — Feb 2026

> **Initial audit:** Jules (Feb 15, 2026)
> **Reviewed & upgraded by:** Claude Code (Feb 15, 2026)
> **Review method:** Every Jules claim cross-checked against source code. Additional deep sweep performed across all API routes, webhook handlers, auth flows, and deployment configs.

---

## Executive Summary

The AIMS codebase has **significant security gaps** across multiple layers. The initial Jules audit caught the most visible issues but missed critical webhook, auth, and integration problems. This upgraded report adds **10 new findings** on top of Jules' original 8.

| Severity | Jules Found | Claude Added | Total |
|----------|-------------|--------------|-------|
| **Critical** | 2 | 1 | **3** |
| **High** | 1 | 3 | **4** |
| **Medium** | 3 | 4 | **7** |
| **Low** | 2 | 2 | **4** |
| **Total** | **8** | **10** | **18** |

**Jules Accuracy: 7/8 claims confirmed. 1 false positive (build failure claim was wrong).**

**Integration Status:**
- **Kling AI:** FAILED — Direct API call, violates Gateway policy
- **Stripe Webhooks:** FAILED — Handler missing entirely
- **Discord Webhook:** FAILED — Signature verification not implemented
- **Telegram Webhook:** FAILED — Secret token validation not implemented
- **n8n Webhook:** FAILED — Zero authentication
- **Remotion:** VERIFIED
- **LUC Storage Chain:** VERIFIED (with race condition warning)
- **Dashboard Routes:** VERIFIED (but missing auth)
- **ACHEEVY Brain:** VERIFIED

---

## Security Findings

### Critical

#### C1. Unauthenticated Command Execution & SSRF in Sandbox Server
**File:** `backend/ii-agent/src/ii_sandbox_server/main.py`
**Status:** CONFIRMED by source code review

The `ii_sandbox_server` is a standalone FastAPI app with **zero authentication**. It binds to `0.0.0.0:8100` and is port-mapped in docker-compose.

- **No auth on any endpoint** — `/sandboxes/run-cmd`, `/sandboxes/create`, `/sandboxes/read-file`, `/sandboxes/download-file` are all open
- **SSRF via `/sandboxes/upload-file-from-url`** (line 365) — accepts arbitrary URL, fetches with `httpx.AsyncClient()`, no allowlist, no private-IP blocking
- **SSRF via `/sandboxes/download-to-presigned-url`** (line 395) — PUTs sandbox data to any URL the caller provides
- **Exposed port** — `docker-compose.stack.yaml` line 109 maps `8100:8100` to the host

Unlike the UEF Gateway (which has `requireApiKey` middleware), this server has no protective layer.

#### C2. SSRF in GCS Storage Provider
**File:** `backend/ii-agent/src/ii_agent/storage/gcs.py` (lines 34-42)
**Status:** CONFIRMED

```python
def write_from_url(self, url: str, path: str, content_type: str | None = None) -> str:
    blob = self.bucket.blob(path)
    with requests.get(url, stream=True) as response:  # No URL validation
        response.raise_for_status()
        blob.upload_from_file(response.raw, content_type=content_type)
    return blob.public_url
```

Accepts arbitrary URLs. If reachable from any user-facing flow, this is an SSRF vector to internal services or GCP metadata (`169.254.169.254`).

#### C3. n8n Webhook — Zero Authentication (NEW)
**File:** `frontend/app/api/n8n/webhook/route.ts` (lines 14-47)
**Status:** NEW FINDING

POST handler has **no `getServerSession()` call, no API key check, no request signing**. Anyone who discovers this endpoint can:
- Dispatch PMO tasks to backend systems
- Impersonate any user via the `userId` body parameter
- Trigger workflows in any `pmoOffice` / `executionLane`

**Risk:** Arbitrary task dispatch and user impersonation.

---

### High

#### H1. IDOR in LUC Meter (GET + POST)
**File:** `frontend/app/api/luc/meter/route.ts`
**Status:** CONFIRMED — worse than originally reported

**GET handler** (line 178):
```typescript
const userId = searchParams.get("userId") || session.user.email;
```

**POST handler** (line 235):
```typescript
const { action, userId = session.user.email, ... } = body;
```

Both handlers accept a caller-supplied `userId` without ownership verification. An authenticated user can read *and modify* any other user's usage quotas.

#### H2. Kling AI Bypasses UEF Gateway
**File:** `frontend/lib/kling-video.ts` (line 53)
**Status:** CONFIRMED

```typescript
private baseUrl = "https://api.klingai.com/v1";
```

Direct `fetch()` calls to Kling at lines 163 and 218. Violates the core architecture rule: "All tool access goes through Port Authority (UEF Gateway)." This means Kling usage is **unmetered, unlogged, and unenforced**.

#### H3. Missing Stripe Webhook Handler (NEW)
**Status:** NEW FINDING

`STRIPE_WEBHOOK_SECRET` is declared in:
- `infra/.env.production.example`
- `backend/uef-gateway/src/integrations/index.ts`
- `aims-skills/tools/index.ts`

But **no `/api/stripe/webhook` route exists**. There is no handler to receive Stripe events (payment success, subscription changes, disputes). When implemented, it must include `stripe.webhooks.constructEvent()` signature verification to prevent spoofed events.

#### H4. Stripe Empty Key Fallback (NEW)
**File:** `frontend/app/api/stripe/subscription/route.ts` (line 13)
**Status:** NEW FINDING

```typescript
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { ... });
```

If `STRIPE_SECRET_KEY` is unset, Stripe client silently operates with an empty string. Should throw on startup, not fail silently in production.

---

### Medium

#### M1. Missing Authentication — Sellers & Shopping Routes
**Files:** `frontend/app/api/sellers/route.ts`, `frontend/app/api/shopping/route.ts`
**Status:** CONFIRMED

Neither file calls `getServerSession()`. Currently return demo data, but are publicly accessible and allow mock action triggers.

#### M2. Race Condition in LUC Server Storage
**File:** `frontend/lib/luc/server-storage.ts` (lines 197-213)
**Status:** CONFIRMED

Classic TOCTOU: `getHistory()` → modify in memory → `saveHistory()` with no file lock. Under concurrent `Promise.all` flushes, writes will overwrite each other.

#### M3. Next.js Dependency Vulnerability
**File:** `frontend/package.json`
**Status:** CONFIRMED

`npm audit` flags high-severity CVE in `next` (14.2.35) — DoS via Image Optimizer and HTTP deserialization.

#### M4. Discord Webhook — No Signature Verification (NEW)
**File:** `frontend/app/api/discord/webhook/route.ts` (line 42)
**Status:** NEW FINDING

`DISCORD_PUBLIC_KEY` is imported (line 14) but **never used** for signature verification. The handler accepts `await req.json()` without validating the `X-Signature-Ed25519` / `X-Signature-Timestamp` headers. Webhook messages can be spoofed.

#### M5. Telegram Webhook — No Secret Token Validation (NEW)
**File:** `frontend/app/api/telegram/webhook/route.ts`
**Status:** NEW FINDING

No `X-Telegram-Bot-Api-Secret-Token` header check. Telegram updates can be spoofed by anyone who knows the endpoint URL.

#### M6. Edge Relay Path Bypass via `.startsWith()` (NEW)
**File:** `frontend/app/api/edge/relay/route.ts` (line 58)
**Status:** NEW FINDING

Path allowlist uses `.startsWith()`:
```typescript
const ALLOWED = ['/acheevy/execute', '/acheevy/classify', '/llm/chat', '/health', '/luc/balance'];
```

This means `/acheevy/execute-anything-else` would pass validation. Should use exact match or regex with anchors.

#### M7. Deploy Dock IDOR (NEW)
**File:** `frontend/app/api/deploy-dock/route.ts` (line 97)
**Status:** NEW FINDING

Authenticates that a user is logged in but does not enforce ownership. User A could view/modify User B's deployments.

---

### Low

#### L1. Public Exposure of Branding Logos
**File:** `backend/ii-agent/src/ii_agent/storage/gcs.py` (lines 152-156)
**Status:** CONFIRMED

`blob.make_public()` is called unconditionally. Any file uploaded via `upload_and_get_permanent_url` becomes publicly accessible.

#### L2. Client IP Spoofing in Middleware
**File:** `frontend/middleware.ts` (lines 126-133)
**Status:** CONFIRMED

```typescript
function getClientIP(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    request.headers.get('cf-connecting-ip') ||
    '127.0.0.1'
  );
}
```

Rate limits keyed by this IP (line 327). Spoofable via `x-forwarded-for` header if not behind a trusted proxy that strips it.

#### L3. Dev Mode Password Bypass (NEW)
**File:** `frontend/lib/auth.ts` (line 102)
**Status:** NEW FINDING

```typescript
if (isOwnerEmail(credentials.email) && process.env.NODE_ENV !== 'production') {
    return { id: 'owner-dev', name: 'ACHEEVY Operator (Dev)', email: credentials.email, ... }
```

Owner emails can log in without a password when `NODE_ENV !== 'production'`. If NODE_ENV is accidentally misconfigured on a public-facing instance, this is an auth bypass.

#### L4. Fire-and-Forget Error Swallowing (NEW)
**File:** `frontend/app/api/edge/relay/route.ts` (line 99)
**Status:** NEW FINDING

`.catch(() => {})` silently drops errors. Failed relays are never logged, masking potential malicious activity or misconfigurations.

---

## Corrections to Jules Report

#### FALSE: Build failure in buy-in-bulk/page.tsx
**Jules claimed:** `'Settings' is not defined. react/jsx-no-undef`
**Actual:** `Settings` is properly imported from `lucide-react` on line 20. No build failure exists from this reference.

---

## Integration Findings

### Broken / Missing Integrations

| Integration | File | Issue |
|-------------|------|-------|
| Kling AI | `frontend/lib/kling-video.ts:53` | Direct API call, bypasses UEF Gateway |
| Stripe Webhooks | (missing) | No webhook handler exists |
| Discord Webhook | `frontend/app/api/discord/webhook/route.ts` | Signature not verified |
| Telegram Webhook | `frontend/app/api/telegram/webhook/route.ts` | Secret token not validated |
| n8n Webhook | `frontend/app/api/n8n/webhook/route.ts` | Zero auth |

### Misconfigured Integrations

| Integration | File | Issue |
|-------------|------|-------|
| LUC Storage | `frontend/lib/luc/server-storage.ts` | Race condition under concurrent writes |
| Edge Relay | `frontend/app/api/edge/relay/route.ts` | `.startsWith()` path bypass |
| Deploy Dock | `frontend/app/api/deploy-dock/route.ts` | Missing user ownership check |

### Verified Working

| Integration | File | Status |
|-------------|------|--------|
| Remotion | `frontend/remotion/Root.tsx` | All compositions registered (Landscape + Portrait) |
| Dashboard Nav | `frontend/components/DashboardNav.tsx` | "Garage to Global" + "Buy in Bulk" links present |
| ACHEEVY Brain | `aims-skills/ACHEEVY_BRAIN.md` | Skills/hooks/tasks consistent with filesystem |
| .gitignore | `.gitignore` (root) | `.env`, `.env.*`, `.pem`, `.key` all covered |
| MCP Retry | `backend/ii-agent/src/ii_tool/mcp/server.py` | tenacity backoff, no injection risk |
| Deployment Hub | `backend/uef-gateway/src/deployment-hub/` | Chain-of-command gates, no arbitrary spawn |

---

## Recommendations — Prioritized

### Immediate (do before next deploy)

1. **Add auth to `ii_sandbox_server`** — API key middleware or restrict to Docker-internal network only (remove port mapping from docker-compose)
2. **Block SSRF endpoints** — Add URL allowlist + private IP blocklist to `upload_file_from_url` and `download_to_presigned_url`
3. **Add auth to n8n webhook** — `getServerSession()` or shared secret validation
4. **Fix LUC Meter IDOR** — Force `userId = session.user.email` on both GET and POST handlers

### High Priority

5. **Route Kling through UEF Gateway** — Replace direct `api.klingai.com` calls with gateway-proxied calls
6. **Implement Stripe webhook handler** — Create `/api/stripe/webhook` with `stripe.webhooks.constructEvent()` signature verification
7. **Fix Stripe empty key fallback** — Throw on missing key instead of `|| ''`
8. **Verify Discord webhook signatures** — Use the already-imported `DISCORD_PUBLIC_KEY` with `nacl` verification
9. **Verify Telegram webhook tokens** — Check `X-Telegram-Bot-Api-Secret-Token` header

### Medium Priority

10. **Add auth to `/api/sellers` and `/api/shopping`** — `getServerSession()` before serving data
11. **Fix LUC storage race condition** — File lock or atomic write (write to tmp + rename)
12. **Upgrade Next.js** — Patch high-severity CVE
13. **Fix edge relay path validation** — Exact match instead of `.startsWith()`
14. **Fix deploy dock IDOR** — Enforce user ownership on deployment records

### Low Priority

15. **Audit `make_public()` usage** — Ensure only intended assets are made public
16. **Harden middleware IP detection** — Document proxy trust chain, consider Cloudflare `cf-connecting-ip` priority
17. **Remove dev auth bypass** — Use proper test accounts instead
18. **Add logging to fire-and-forget relay** — Replace `.catch(() => {})` with actual error logging
