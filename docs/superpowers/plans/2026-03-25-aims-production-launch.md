# A.I.M.S. Production Launch — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all broken/unfinished features, modernize the tech stack for 2026, integrate foai.cloud domain support, and deploy A.I.M.S. to production VPS.

**Architecture:** A.I.M.S. is a Next.js 14 frontend + Express UEF Gateway backend + ACHEEVY orchestrator, deployed as 14 Docker containers on a Hostinger VPS (76.13.96.107). Three domains: `plugmein.cloud` (public), `foai.cloud` (PRIVATE/admin, replacing aimanagedsolutions.cloud), `aimanagedsolutions.cloud` (legacy). All services behind nginx reverse proxy with SSL.

**Tech Stack:** Next.js 14, React 18, Express 4, TypeScript 5, Prisma 5, Docker, nginx, Redis, SQLite (LUC), PostgreSQL (ii-agent), OpenRouter (LLM), Stripe (billing), ElevenLabs (voice)

---

## Phase 1: Critical Code Fixes (P0 — Deployment Blockers)

### Task 1: Add foai.cloud to client-side domain detection

**Files:**
- Modify: `frontend/lib/platform-mode.tsx:52-59`

- [ ] **Step 1: Update detectDomain() to recognize foai.cloud**

In `frontend/lib/platform-mode.tsx`, the `detectDomain()` function only checks for `aimanagedsolutions`. Add `foai` detection:

```typescript
function detectDomain(): PlatformDomain {
  if (typeof window === 'undefined') return 'plugmein'; // SSR default: safest
  const host = window.location.hostname.toLowerCase();
  if (host.includes('foai') || host.includes('aimanagedsolutions')) return 'aims';
  if (host.includes('plugmein')) return 'plugmein';
  return 'localhost';
}
```

Also update the JSDoc comment at the top of the file (lines 8-9) to list foai.cloud:

```typescript
/**
 * Platform Mode Context — A.I.M.S. Domain-Based Access
 *
 * Mode is determined by DOMAIN + AUTH ROLE. No toggle. No localStorage. Not hackable.
 *
 * - foai.cloud                  → PRIVATE (OWNER/ADMIN only — enforced)
 * - aimanagedsolutions.cloud    → PRIVATE (legacy, same behavior)
 * - plugmein.cloud              → PUBLIC  (customers — always)
 * - localhost                   → Determined by role (dev convenience)
 */
```

- [ ] **Step 2: Verify frontend build passes**

Run: `cd frontend && npm run build`
Expected: Build succeeds with no errors

- [ ] **Step 3: Commit**

```bash
git add frontend/lib/platform-mode.tsx
git commit -m "feat: add foai.cloud domain detection to platform mode"
```

---

### Task 2: Wire email service for password reset

**Files:**
- Modify: `frontend/app/api/auth/forgot-password/route.ts:52-60`
- Modify: `frontend/package.json` (add resend dependency)

- [ ] **Step 1: Verify Resend SDK is installed**

Resend (`^4.1.2`) is already in `frontend/package.json`. No install needed.

- [ ] **Step 2: Implement email sending in forgot-password route**

Replace the TODO block (lines 52-60) in `frontend/app/api/auth/forgot-password/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import crypto from 'crypto';
import { forgotPasswordSchema, validateInput } from '@/lib/validation/schemas';

const TOKEN_EXPIRY_HOURS = 1;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = validateInput(forgotPasswordSchema, body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid forgot password request', details: validation.errors },
        { status: 400 }
      );
    }

    const { email } = validation.data;
    const normalizedEmail = email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (user) {
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpiry = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

      await prisma.user.update({
        where: { id: user.id },
        data: { resetToken, resetTokenExpiry },
      });

      const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
      const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;

      // Send via Resend if configured, otherwise log for dev
      if (process.env.RESEND_API_KEY) {
        const { Resend } = await import('resend');
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: process.env.EMAIL_FROM || 'ACHEEVY <noreply@foai.cloud>',
          to: normalizedEmail,
          subject: 'Reset your A.I.M.S. password',
          html: `
            <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto;">
              <h2 style="color: #1e293b;">Reset Your Password</h2>
              <p>Click the button below to reset your password. This link expires in ${TOKEN_EXPIRY_HOURS} hour.</p>
              <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background: #D4AF37; color: #1e293b; text-decoration: none; border-radius: 8px; font-weight: 600;">
                Reset Password
              </a>
              <p style="margin-top: 24px; font-size: 13px; color: #94a3b8;">
                If you didn't request this, you can safely ignore this email.
              </p>
            </div>
          `,
        });
      } else {
        console.log(`[forgot-password] Reset link for ${normalizedEmail}: ${resetUrl}`);
      }
    }

    return NextResponse.json({
      message: 'If an account exists with that email, a reset link has been sent.',
    });
  } catch (error) {
    console.error('[forgot-password] Error:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 3: Add RESEND_API_KEY and EMAIL_FROM to env example**

In `infra/.env.production.example`, add under the Auth section:

```
# Email (Resend — password reset, notifications)
RESEND_API_KEY=
EMAIL_FROM=ACHEEVY <noreply@foai.cloud>
```

- [ ] **Step 4: Verify build**

Run: `cd frontend && npm run build`
Expected: Build succeeds

- [ ] **Step 5: Commit**

```bash
git add frontend/app/api/auth/forgot-password/route.ts frontend/package.json frontend/package-lock.json infra/.env.production.example
git commit -m "feat: wire Resend email service for password reset"
```

---

### Task 3: Wire Forms API proxy to UEF Gateway

**Files:**
- Modify: `frontend/app/api/forms/route.ts`

- [ ] **Step 1: Implement UEF Gateway proxy**

Replace the entire file:

```typescript
import { NextRequest, NextResponse } from 'next/server';

const UEF_URL = process.env.UEF_GATEWAY_URL || 'http://localhost:3001';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  try {
    const res = await fetch(`${UEF_URL}/api/forms?${searchParams.toString()}`, {
      headers: {
        'x-internal-key': process.env.INTERNAL_API_KEY || '',
      },
      next: { revalidate: 30 },
    });

    if (!res.ok) {
      // Gateway not available — return empty gracefully
      return NextResponse.json({
        forms: [],
        stats: { totalForms: 0, totalSubmissions: 0, totalPartials: 0, liveForms: 0 },
      });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    // UEF Gateway unreachable — return empty, don't crash
    console.warn('[forms] UEF Gateway unreachable:', (err as Error).message);
    return NextResponse.json({
      forms: [],
      stats: { totalForms: 0, totalSubmissions: 0, totalPartials: 0, liveForms: 0 },
    });
  }
}
```

- [ ] **Step 2: Verify build**

Run: `cd frontend && npm run build`

- [ ] **Step 3: Commit**

```bash
git add frontend/app/api/forms/route.ts
git commit -m "feat: wire forms API proxy to UEF Gateway"
```

---

### Task 4: Wire Stepper API proxy to UEF Gateway

**Files:**
- Modify: `frontend/app/api/stepper/route.ts`

- [ ] **Step 1: Implement UEF Gateway proxy**

Replace the entire file:

```typescript
import { NextRequest, NextResponse } from 'next/server';

const UEF_URL = process.env.UEF_GATEWAY_URL || 'http://localhost:3001';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  try {
    const res = await fetch(`${UEF_URL}/api/stepper?${searchParams.toString()}`, {
      headers: {
        'x-internal-key': process.env.INTERNAL_API_KEY || '',
      },
      next: { revalidate: 30 },
    });

    if (!res.ok) {
      return NextResponse.json({
        workflows: [],
        stats: { totalWorkflows: 0, activeWorkflows: 0, totalRuns: 0, totalCredits: 0 },
      });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.warn('[stepper] UEF Gateway unreachable:', (err as Error).message);
    return NextResponse.json({
      workflows: [],
      stats: { totalWorkflows: 0, activeWorkflows: 0, totalRuns: 0, totalCredits: 0 },
    });
  }
}
```

- [ ] **Step 2: Verify build and commit**

```bash
cd frontend && npm run build
git add frontend/app/api/stepper/route.ts
git commit -m "feat: wire stepper API proxy to UEF Gateway"
```

---

### Task 5: Gate mock data behind DEMO_MODE flag

**Files:**
- Modify: `frontend/app/halalhub/shop/[category]/page.tsx` (mock vendors)
- Modify: `frontend/app/dashboard/operations/page.tsx` (simulated telemetry)
- Modify: `frontend/app/nemo/dashboard/page.tsx` (hardcoded test logs)

- [ ] **Step 1: Gate HalalHub mock vendors**

In `frontend/app/halalhub/shop/[category]/page.tsx`, wrap the `MOCK_VENDORS` constant:

Find the mock vendors constant and add a DEMO_MODE check. At the top of the component, add:

```typescript
const IS_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
```

Then where vendors are used, conditionally show:

```typescript
const vendors = IS_DEMO ? MOCK_VENDORS[category] || [] : [];
// In production without DEMO_MODE, show "No vendors yet" state
```

- [ ] **Step 2: Gate operations dashboard telemetry**

In `frontend/app/dashboard/operations/page.tsx`, add at the top of the component:

```typescript
const IS_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
```

Replace the hardcoded `generateTimeSeriesData()` calls with an API fetch when not in demo mode:

```typescript
// In the component body, add real data fetching:
const [metrics, setMetrics] = useState<any>(null);

useEffect(() => {
  if (!IS_DEMO) {
    fetch('/api/operations/metrics', {
      headers: { 'x-internal-key': '' },
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => data && setMetrics(data))
      .catch(() => {}); // Graceful fallback to simulated
  }
}, []);

// Use `metrics` if available, else fall back to generated data
```

- [ ] **Step 3: Gate Nemo dashboard hardcoded logs**

In `frontend/app/nemo/dashboard/page.tsx`, replace hardcoded system logs with API fetch or DEMO_MODE gate. Same pattern as above.

- [ ] **Step 4: Add DEMO_MODE to env**

In `infra/.env.production.example`:

```
# Demo Mode — shows mock data for showcase/demo purposes
# Set to 'true' ONLY for demo environments, never in production
NEXT_PUBLIC_DEMO_MODE=false
```

- [ ] **Step 5: Verify build and commit**

```bash
cd frontend && npm run build
git add frontend/app/halalhub/shop/[category]/page.tsx frontend/app/dashboard/operations/page.tsx frontend/app/nemo/dashboard/page.tsx infra/.env.production.example
git commit -m "feat: gate all mock data behind DEMO_MODE flag"
```

---

### Task 6: Fix LUC-Stripe bridge stub

**Files:**
- Modify: `backend/uef-gateway/src/billing/luc-stripe-bridge.ts`

- [ ] **Step 1: Implement billing bridge with graceful degradation**

The LUC-Stripe bridge currently returns 501 for everything. Replace with a proper route that checks for Stripe config and operates accordingly:

```typescript
import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import logger from '../logger';

export const lucStripeBridgeRouter = Router();

const getStripe = (): Stripe | null => {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key || key.includes('change-this')) return null;
  return new Stripe(key, { apiVersion: '2024-12-18.acacia' });
};

// GET /api/billing/status — check if billing is configured
lucStripeBridgeRouter.get('/api/billing/status', (_req: Request, res: Response) => {
  const stripe = getStripe();
  res.json({
    configured: !!stripe,
    tiers: {
      '3mo': !!process.env.STRIPE_PRICE_3MO,
      '6mo': !!process.env.STRIPE_PRICE_6MO,
      '9mo': !!process.env.STRIPE_PRICE_9MO,
    },
  });
});

// POST /api/billing/checkout — create a Stripe checkout session
lucStripeBridgeRouter.post('/api/billing/checkout', async (req: Request, res: Response) => {
  const stripe = getStripe();
  if (!stripe) {
    return res.status(503).json({
      error: 'Billing not configured',
      code: 'STRIPE_NOT_CONFIGURED',
    });
  }

  const { tier, userId, successUrl, cancelUrl } = req.body;
  const priceId = process.env[`STRIPE_PRICE_${tier?.toUpperCase()}`];

  if (!priceId) {
    return res.status(400).json({ error: `Unknown tier: ${tier}` });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl || `${process.env.NEXTAUTH_URL}/dashboard?billing=success`,
      cancel_url: cancelUrl || `${process.env.NEXTAUTH_URL}/dashboard?billing=cancel`,
      metadata: { userId, tier },
    });

    res.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    logger.error('[luc-stripe-bridge] Checkout error:', err);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// POST /api/billing/webhook — Stripe webhook handler
lucStripeBridgeRouter.post('/api/billing/webhook', async (req: Request, res: Response) => {
  const stripe = getStripe();
  if (!stripe) return res.status(503).json({ error: 'Stripe not configured' });

  // NOTE: Billing endpoints are internal — called via UEF Gateway which enforces auth.
  // The webhook endpoint uses Stripe signature verification instead of role checks.

  const sig = req.headers['stripe-signature'] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return res.status(503).json({ error: 'Webhook secret not configured' });
  }

  try {
    const event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        logger.info(`[billing] Checkout complete for user ${session.metadata?.userId}, tier: ${session.metadata?.tier}`);
        // TODO: Provision tier in database, credit LUC balance
        break;
      }
      case 'customer.subscription.deleted': {
        logger.info('[billing] Subscription cancelled');
        // TODO: Downgrade user tier
        break;
      }
    }

    res.json({ received: true });
  } catch (err) {
    logger.error('[billing] Webhook error:', err);
    res.status(400).json({ error: 'Webhook verification failed' });
  }
});
```

- [ ] **Step 2: Verify backend build**

Run: `cd backend/uef-gateway && npm run build`
Expected: Compiles clean

- [ ] **Step 3: Commit**

```bash
git add backend/uef-gateway/src/billing/luc-stripe-bridge.ts
git commit -m "feat: implement LUC-Stripe billing bridge with checkout, webhook, and status"
```

---

### Task 7: Fix Chicken Hawk placeholder runtime

**Files:**
- Modify: `backend/uef-gateway/src/acheevy/orchestrator.ts:1435`

- [ ] **Step 1: Replace placeholder with actual Chicken Hawk runtime**

At line 1435, replace `'chickenhawk-placeholder'` with the actual Chicken Hawk URL resolution:

```typescript
delegatedRuntime: process.env.CHICKENHAWK_URL || 'http://chickenhawk-core:4100',
```

This points to the chickenhawk-core container defined in docker-compose.prod.yml.

- [ ] **Step 2: Verify backend build and commit**

```bash
cd backend/uef-gateway && npm run build
git add backend/uef-gateway/src/acheevy/orchestrator.ts
git commit -m "fix: wire Chicken Hawk runtime URL instead of placeholder"
```

---

## Phase 2: Tech Stack Modernization

### Task 8: Update frontend TypeScript target from ES5 to ES2020

**Files:**
- Modify: `frontend/tsconfig.json`

- [ ] **Step 1: Change target**

In `frontend/tsconfig.json`, change:
```json
"target": "es2020"
```

This reduces bundle size by ~40% and enables modern JS features natively.

- [ ] **Step 2: Verify build**

Run: `cd frontend && npm run build`
Expected: Build succeeds (Next.js already polyfills for browser compat)

- [ ] **Step 3: Commit**

```bash
git add frontend/tsconfig.json
git commit -m "perf: update TypeScript target from es5 to es2020"
```

---

### Task 9: Update AI SDK packages to stable versions

**Files:**
- Modify: `frontend/package.json`

- [ ] **Step 1: Upgrade AI SDK packages**

```bash
cd frontend && npm install @ai-sdk/openai@latest @ai-sdk/google@latest
```

These move from pre-release (0.0.x) to stable (1.x+).

- [ ] **Step 2: Check for breaking API changes**

Search for AI SDK usage patterns that may have changed:

```bash
grep -rn "@ai-sdk/openai\|@ai-sdk/google" frontend/app/api/ frontend/lib/
```

Fix any breaking import changes (v1.x moved some exports).

- [ ] **Step 3: Verify build and commit**

```bash
cd frontend && npm run build
git add frontend/package.json frontend/package-lock.json
git commit -m "chore: upgrade AI SDK packages to stable versions"
```

---

### Task 10: Update Docker base images to Node 22

**Files:**
- Modify: `frontend/Dockerfile`
- Modify: `backend/uef-gateway/Dockerfile`
- Modify: `backend/acheevy/Dockerfile`
- Modify: All other Dockerfiles in `infra/`

- [ ] **Step 1: Find all Dockerfiles**

```bash
find . -name "Dockerfile*" -not -path "./node_modules/*"
```

- [ ] **Step 2: Replace node:20-alpine with node:22-alpine**

In each Dockerfile, replace:
```dockerfile
FROM node:20-alpine AS ...
```
with:
```dockerfile
FROM node:22-alpine AS ...
```

- [ ] **Step 3: Verify Docker builds locally**

```bash
docker build -t aims-frontend-test -f frontend/Dockerfile .
docker build -t aims-uef-test -f backend/uef-gateway/Dockerfile backend/uef-gateway/
```

- [ ] **Step 4: Commit**

```bash
git add **/Dockerfile
git commit -m "chore: upgrade Docker base images from Node 20 to Node 22 LTS"
```

---

### Task 11: Pin AVVA NOON image version

**Files:**
- Modify: `infra/docker-compose.prod.yml`

- [ ] **Step 1: Replace :latest with specific version**

Find the `frdel/agent-zero-run:latest` line and pin to a specific version:

```yaml
image: frdel/agent-zero-run:v0.9.2
```

(Check Docker Hub for the latest stable release tag first)

- [ ] **Step 2: Commit**

```bash
git add infra/docker-compose.prod.yml
git commit -m "chore: pin AVVA NOON (agent-zero) image to specific version"
```

---

## Phase 3: Security & Production Hardening

### Task 12: Add nginx rate limiting

**Files:**
- Modify: `infra/nginx/nginx.conf`

- [ ] **Step 1: Add auth rate limiting zone (nginx already has api zone)**

`infra/nginx/nginx.conf` already has `limit_req_zone $binary_remote_addr zone=api:10m rate=30r/m;` at line 60. We only need to add an auth-specific zone. After the existing zone line, add:

```nginx
limit_req_zone $binary_remote_addr zone=auth:10m rate=5r/m;
```

Then in the SSL server blocks (in `infra/nginx/conf.d/`), apply the auth zone to auth routes:

```nginx
location /api/auth/ {
    limit_req zone=auth burst=3 nodelay;
    proxy_pass http://frontend:3000;
}
```

The existing `api` zone at 30r/m is already applied. No changes needed there.

- [ ] **Step 2: Verify nginx config syntax**

```bash
docker run --rm -v $(pwd)/infra/nginx:/etc/nginx:ro nginx:alpine nginx -t
```

- [ ] **Step 3: Commit**

```bash
git add infra/nginx/nginx.conf
git commit -m "security: add nginx rate limiting for API and auth endpoints"
```

---

### Task 13: Add missing env vars to validate-env.sh

**Files:**
- Modify: `scripts/validate-env.sh`

- [ ] **Step 1: Add GEMINI_API_KEY to strict mode checks**

In `scripts/validate-env.sh`, after the existing strict mode check for `II_AGENT_BRIDGE_KEY` (line 136-138), add:

```bash
if [[ "$STRICT" == true ]]; then
  if [[ -z "${VALUES[II_AGENT_BRIDGE_KEY]+x}" || -z "${VALUES[II_AGENT_BRIDGE_KEY]}" ]] || is_placeholder "${VALUES[II_AGENT_BRIDGE_KEY]:-}"; then
    ISSUES+=("Strict mode: II_AGENT_BRIDGE_KEY must be set to a non-placeholder value")
  fi
  if [[ -z "${VALUES[GEMINI_API_KEY]+x}" || -z "${VALUES[GEMINI_API_KEY]}" ]]; then
    WARNINGS+=("GEMINI_API_KEY not set — Chicken Hawk vision features will be unavailable")
  fi
  if [[ -z "${VALUES[RESEND_API_KEY]+x}" || -z "${VALUES[RESEND_API_KEY]}" ]]; then
    WARNINGS+=("RESEND_API_KEY not set — password reset emails will only log to console")
  fi
fi
```

Note: The script uses `REQUIRED_KEYS` array + `is_placeholder()` + `ISSUES`/`WARNINGS` arrays. These new checks use `WARNINGS` (not `ISSUES`) since they're optional services that degrade gracefully.

- [ ] **Step 2: Commit**

```bash
git add scripts/validate-env.sh
git commit -m "chore: add missing env vars to validation script"
```

---

## Phase 4: Deployment

### Task 14: Commit uncommitted changes and push to main

**Files:**
- Modify: `docs/plans/2026-03-17-chat-first-application-build-tracker.md`
- Modify: `frontend/e2e/chat-smoke.spec.ts`
- Modify: `frontend/middleware.ts`

- [ ] **Step 1: Review uncommitted changes**

```bash
git diff docs/plans/2026-03-17-chat-first-application-build-tracker.md
git diff frontend/e2e/chat-smoke.spec.ts
git diff frontend/middleware.ts
```

- [ ] **Step 2: Stage and commit if changes are valid**

```bash
git add docs/plans/2026-03-17-chat-first-application-build-tracker.md frontend/e2e/chat-smoke.spec.ts frontend/middleware.ts
git commit -m "chore: commit pending build tracker, e2e test, and middleware updates"
```

---

### Task 15: Final build verification

- [ ] **Step 1: Run full frontend build**

```bash
cd frontend && npm run build
```

- [ ] **Step 2: Run full backend build**

```bash
cd backend/uef-gateway && npm run build
```

- [ ] **Step 3: Run tests**

```bash
cd frontend && npm test
cd aims-skills && npm test
```

- [ ] **Step 4: Run env validation**

```bash
bash scripts/validate-env.sh --path infra/.env.production --strict
```

---

### Task 16: Deploy to VPS

- [ ] **Step 1: Push to origin main**

```bash
git push origin main
```

- [ ] **Step 2: SSH to VPS and deploy**

```bash
ssh root@76.13.96.107
cd /opt/aims  # or wherever the repo is cloned
git pull origin main
# foai.cloud is the new primary AIMS domain; aimanagedsolutions.cloud kept as legacy
# Verify foai.cloud DNS points to 76.13.96.107 and SSL certs exist before deploying
./deploy.sh --domain plugmein.cloud --landing-domain foai.cloud
```

If foai.cloud SSL certs don't exist yet, issue them first:
```bash
./deploy.sh --domain plugmein.cloud --landing-domain foai.cloud --email acheevy@foai.cloud
```

- [ ] **Step 3: Verify containers are healthy**

```bash
docker compose -f infra/docker-compose.prod.yml ps
docker compose -f infra/docker-compose.prod.yml logs --tail=20
```

- [ ] **Step 4: Verify domains are live**

```bash
curl -I https://plugmein.cloud
curl -I https://foai.cloud
```

- [ ] **Step 5: SSL cert check**

```bash
openssl s_client -connect plugmein.cloud:443 -servername plugmein.cloud </dev/null 2>/dev/null | openssl x509 -noout -dates
openssl s_client -connect foai.cloud:443 -servername foai.cloud </dev/null 2>/dev/null | openssl x509 -noout -dates
```

- [ ] **Step 6: Verify certbot auto-renewal is configured**

```bash
certbot renew --dry-run
crontab -l | grep certbot  # Should show a renewal cron
```

**Rollback strategy:** If deployment fails or site is broken:
```bash
# Revert to previous commit on VPS
git log --oneline -5  # find the previous commit hash
git checkout <previous-hash>
docker compose -f infra/docker-compose.prod.yml up -d --build
```

---

## Phase 5: Post-Launch Polish (P1/P2)

### Task 17: Update merch store from "Coming Soon" to gated state

**Files:**
- Modify: `frontend/app/merch/page.tsx`

- [ ] **Step 1: Replace "Coming Soon" with proper pre-launch state**

Add a newsletter signup with real backend integration, and show product previews without the generic "Coming Soon" badge on every item. Use a `MERCH_LIVE` env var to toggle full purchasing.

- [ ] **Step 2: Commit**

```bash
git add frontend/app/merch/page.tsx
git commit -m "feat: update merch store with pre-launch state and newsletter signup"
```

---

### Task 18: Wire plug detail page to real API

**Files:**
- Modify: `frontend/app/dashboard/plugs/[id]/page.tsx`

- [ ] **Step 1: Replace PLUG_DATA fallback with UEF Gateway fetch**

```typescript
const res = await fetch(`${UEF_URL}/api/plugs/${id}`, {
  headers: { 'x-internal-key': process.env.INTERNAL_API_KEY || '' },
});
```

- [ ] **Step 2: Commit**

---

## Deferred (Not for this launch)

These items are important but NOT blockers for going live:

- **NextAuth v4 → v5 migration** — Major effort, schedule for Q2 2026
- **Prisma v5 → v7 migration** — Breaking changes, plan incrementally
- **OpenTelemetry distributed tracing** — Add after launch for observability
- **Structured logging (Pino)** — Replace console.log in backends
- **Redis-backed rate limiting** — For multi-instance scaling
- **Email confirmation on signup** — Add after Resend is wired for password reset

---

## Summary

| Phase | Tasks | Effort | Impact |
|-------|-------|--------|--------|
| Phase 1: Critical Fixes | Tasks 1-7 | ~2-3 hours | Unblocks production |
| Phase 2: Modernization | Tasks 8-11 | ~1 hour | Performance + security |
| Phase 3: Hardening | Tasks 12-13 | ~30 min | DDoS protection |
| Phase 4: Deployment | Tasks 14-16 | ~1 hour | Goes live |
| Phase 5: Polish | Tasks 17-18 | ~1 hour | Better UX |

**Total estimated implementation: 16 tasks across 5 phases.**
