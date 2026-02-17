# Review: Recent Changes (Branch `claude/review-recent-changes-BzQqv`)

**Date:** 2026-02-16
**Scope:** 11 commits ahead of `main`, 44 files changed, ~3,700 lines added/modified

---

## Summary

This branch contains work across six major areas:
1. Security audit expansion (10 new findings)
2. Subscription/pricing model overhaul (5-tier + 3-6-9 commitment)
3. Infrastructure — SSL, CORS, nginx modernization
4. Landing page — domain-aware Hero reconstruction
5. LUC (Ledger Usage Control) engine updates
6. UI skill files and RESET-UI-SPEC design system doc

The changes are ambitious and cover billing, security, infra, and UI simultaneously. Below are the critical findings organized by severity.

---

## CRITICAL Issues (Fix Before Deploy)

### 1. Three Independent LUC Engines — No Shared Contract
The codebase has **three separate LUC implementations** with incompatible service key namespaces, different overage rates (differing by up to 10x), and no mapping between them:

| Layer | Service Key Examples | Overage Rates |
|-------|---------------------|---------------|
| `aims-skills/luc/` (ADK) | `brave_searches`, `elevenlabs_chars` | $0.01/search, $0.50/container-hr |
| `aims-tools/luc/` (v2) | `llm_tokens_in`, `brave_queries` | Credit-based, configurable |
| `frontend/lib/luc/` | `AI_CHAT`, `CODE_GEN` / `openrouter_tokens` | $0.005/search, $0.05/container-hr |

Usage tracked on the frontend will **never reconcile** with backend invoice generation. A unified service key enum and rate table are needed.

### 2. Build-Breaking Bug in `aims-tools/luc/luc.schemas.ts`
`PlanIdSchema` references `PLAN_IDS.FREE` and `PLAN_IDS.STARTER`, but `luc.constants.ts` defines plans as `P2P`, `COFFEE`, `DATA_ENTRY`, `PRO`, `ENTERPRISE`. The non-existent keys evaluate to `undefined`, causing Zod validation to crash at runtime. Masked by `@ts-nocheck` in both `luc.adapters.ts` and `luc.engine.ts`.

### 3. Runtime Crash: Fallback to Non-Existent `free` Plan
`frontend/lib/luc/luc-engine.ts` line 315: `LUC_PLANS[account.planId] || LUC_PLANS.free` — no `free` plan exists (lowest is `p2p`). The fallback returns `undefined`, crashing downstream code. Same issue in `createLUCAccount()` line 617 with default `planId = 'free'`.

### 4. Dual Tier Model Mismatch (Pricing vs. Subscription)
Two incompatible tier taxonomies coexist:
- **Pricing page** (`lib/stripe.ts`): P2P / 3-month ($19.99) / 6-month ($17.99) / 9-month ($14.99) — commitment duration axis
- **Subscription API** (`api/stripe/subscription/route.ts`): P2P / Coffee ($7.99) / Data Entry ($29.99) / Pro ($99.99) / Enterprise ($299) — feature tier axis

No mapping exists between them. A user subscribing from the pricing page will hit an API expecting different price IDs.

### 5. Internal Markup Rates Shipped to Browser
`frontend/lib/stripe.ts` exports `_INTERNAL_MARKUP_RATES` (10-25% markups per tier) with a comment saying "NEVER expose to user-facing UI." But it's exported from a client-side library imported by `"use client"` components. The values will appear in the JS bundle visible to anyone inspecting page source.

### 6. n8n Webhook — Zero Authentication (from Audit)
`frontend/app/api/n8n/webhook/route.ts` has no session check, no API key, no request signing. Allows arbitrary task dispatch and user impersonation via `userId` body parameter. Flagged as **Critical** in the security audit but not yet remediated.

---

## HIGH Issues

### 7. No HTTP-to-HTTPS Redirect for plugmein.cloud
`aimanagedsolutions.cloud` properly 301-redirects HTTP to HTTPS. `plugmein.cloud` does not — the HTTP server block serves the full application unencrypted even after SSL certs are provisioned. Session cookies and API tokens could be transmitted in the clear.

### 8. Missing Stripe Webhook Handler
`STRIPE_WEBHOOK_SECRET` is declared in config but no `/api/stripe/webhook` route exists. Payment events (subscription changes, failed payments, refunds) are silently dropped.

### 9. Stripe Empty Key Fallback
`frontend/app/api/stripe/subscription/route.ts`: if `STRIPE_SECRET_KEY` is unset, Stripe client silently initializes with an empty string instead of failing fast.

### 10. `tokensUsed` Always Returns 0
The subscription endpoint hardcodes `tokensUsed: 0` with a TODO comment. All UI showing usage progress or remaining allocation is permanently inaccurate.

### 11. Dead Invoice Code
`backend/uef-gateway/src/billing/index.ts`: all `TIER_CONFIGS` have `monthlyPrice: 0`, and `generateInvoiceLineItems()` checks `tier.monthlyPrice > 0` before adding a subscription line item. Subscription line items will never be generated.

### 12. Savings Ledger ID Collision Risk
`backend/uef-gateway/src/billing/index.ts` lines 286-288: three ledger entries created in the same synchronous call use `Date.now()` for IDs — all three get the same timestamp. Fine as long as prefixes (`sav-usr-`, `sav-plt-`, `sav-w3-`) are treated as part of the ID, but fragile.

### 13. Security Headers Lost in nginx `location` Blocks
Nginx's `add_header` in `location` blocks (e.g., `/_next/static/`) **replaces** all parent-level security headers (HSTS, X-Frame-Options, X-Content-Type-Options). Static file responses are served without security headers.

### 14. X-Frame-Options Conflict
Nginx sends `SAMEORIGIN`, middleware sends `DENY`. Duplicate headers with conflicting values — browser behavior is undefined.

---

## MEDIUM Issues

### 15. Frontend LUC Metering Uses In-Memory Storage
`frontend/app/api/luc/meter/route.ts` stores all quota state in `Map` objects. Every Next.js redeployment or serverless cold start loses all metering data. Comment says "replace with Redis/Postgres in production" but this IS the production route.

### 16. LUC `recommendPlan` Always Returns `'free'`
`aims-skills/luc/luc-adk.ts`: when `fitsWithinPlan` is true, `overageCost` is 0, so `savings` is always 0, and `savings > bestSavings` is always false. The recommendation engine never updates from its initial `'free'` value.

### 17. Negative Usage Possible in Meter Route
`app/api/luc/meter/route.ts` lines 356/419: `quota.used -= amount` during reservation cancel/commit can go negative with no `Math.max(0, ...)` guard.

### 18. Hero `useIsLandingDomain` Hydration Mismatch
Returns `true` on the server but could return `false` on the client (for `aimanagedsolutions.cloud`), causing a flash of wrong content during hydration.

### 19. Footer External Links Using `<Link>`
`Footer.tsx` uses Next.js `<Link>` for external URLs (Discord, GitHub, etc.) — should be `<a target="_blank" rel="noopener noreferrer">`. Social links also have inconsistent URLs (e.g., `/aims` vs `/BoomerAng9/AIMS`).

### 20. `demo.plugmein.cloud` Has No SSL Support
No SSL template, no cert request in deploy script. Traffic to demo is HTTP-only.

### 21. Hardcoded 8% Tax Rate
`aims-skills/luc/luc-adk.ts` line 207: `const tax = subtotal * 0.08` with "adjust per jurisdiction" comment but no mechanism to do so.

### 22. Newsletter Form is Non-Functional
`Footer.tsx`: email input and submit button have no `onSubmit` handler, no form wrapping, no validation. Clicking the button does nothing.

---

## LOW Issues

### 23. Unused Imports / Dead Exports
- `Zap` imported but unused in `Hero.tsx`
- `getAllServiceKeys` imported but unused in `LucPanel.tsx`
- `FeatureSection` export in `Hero.tsx` returns `null` — dead code

### 24. Hardcoded `#0A0A0A` and Repeated Inline Styles
- `#0A0A0A` background color appears in AcheevyChat, FloatingChat, ReadReceipt
- `fontFamily: 'var(--font-doto), "Doto", monospace'` repeated ~12 times in Hero
- Should be design tokens / Tailwind utility classes

### 25. Duplicated Constants
- Action Chain step data duplicated between Hero.tsx and AcheevyChat.tsx
- `APP_DOMAIN` duplicated between Hero.tsx and Footer.tsx

### 26. `ReadReceipt` Default State Contradiction
`expanded` defaults to `true` but docstring says "Default: collapsed / hidden." Should default to `false`.

### 27. Stale SSL Diagnostic Warning
`infra/ssl-diagnostic.sh` Section 8 warns that `ssl.conf.template` has no `www` support — but it does. The warning is outdated and misleading.

### 28. `useEffect` Missing Dependency
`frontend/hooks/useUserTier.ts` line 103: `refresh` called inside effect but not in dependency array.

### 29. Stripe API Version Cast
`as any` cast on Stripe API version `'2023-10-16'` suppresses type checking.

---

## Accessibility Gaps

1. **FloatingChat**: No focus trap or Escape key handler for the modal overlay
2. **AcheevyMessage**: Playback controls are hover-only (`opacity-0 group-hover:opacity-100`) — invisible to keyboard and screen reader users
3. **ReadReceipt**: Toggle button lacks `aria-expanded`; no `role="region"` on content
4. **Footer**: Social icon links have no `aria-label` — SVG-only, unreadable by screen readers
5. **Multiple components**: Interactive elements use `title` instead of `aria-label`

---

## Architecture Recommendations

1. **Unify LUC**: Pick `aims-tools/luc/` (v2) as the canonical engine. Create a shared `@aims/luc-types` package with one service key enum, one rate table, one quota schema. Wire the frontend meter route to call the v2 engine through the UEF Gateway.

2. **Resolve the Tier Model**: Decide whether tiers are commitment-based (3-6-9) or feature-based (Coffee/Data Entry/Pro/Enterprise). Map them together or pick one. Wire the pricing page and subscription API to the same product/price IDs.

3. **Move Markup Rates Server-Side**: Delete `_INTERNAL_MARKUP_RATES` from `frontend/lib/stripe.ts`. Apply markups only in `backend/uef-gateway/src/billing/`.

4. **Add HTTP-to-HTTPS Redirect**: After cert provisioning, replace the plugmein.cloud port-80 server block with a 301 redirect (matching aimanagedsolutions.cloud behavior).

5. **Implement Stripe Webhook Route**: Before accepting real payments, create `/api/stripe/webhook` with signature verification to handle subscription lifecycle events.

6. **Fix nginx Header Inheritance**: Use `include` directives or `map` variables to ensure security headers are present in all `location` blocks, not just the server level.

7. **Address Critical Security Findings**: The n8n webhook (C3), sandbox server (C1), and GCS SSRF (C2) from the audit should be remediated before any public deployment.

---

## What's Good

- **RESET-UI-SPEC.md** is a solid single-source-of-truth for layout/typography — clear breakpoints, enforced minimums, practical rules
- **9 UI archetype skill files** will enforce design consistency across future Claude Code sessions
- **SSL diagnostic script** is comprehensive and well-structured (9 sections, clear output)
- **Savings plan** with triple-ledger transparency is a differentiating feature
- **Hero domain-awareness** is a clean pattern for multi-domain branding
- **Security audit** is thorough — 18 findings with prioritized remediation steps
- **AcheevyMessage extraction** with `React.memo` is proper performance optimization
- **FloatingChat code splitting** via `next/dynamic` is well done
