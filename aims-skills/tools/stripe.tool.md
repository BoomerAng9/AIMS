---
id: "stripe"
name: "Stripe"
type: "tool"
category: "payments"
provider: "Stripe"
description: "Payment processing and subscription management — powers the 3-6-9 billing model."
env_vars:
  - "STRIPE_SECRET_KEY"
  - "STRIPE_PUBLISHABLE_KEY"
  - "STRIPE_WEBHOOK_SECRET"
  - "STRIPE_PRICE_STARTER"
  - "STRIPE_PRICE_PRO"
  - "STRIPE_PRICE_ENTERPRISE"
docs_url: "https://docs.stripe.com/api"
aims_files:
  - "aims-skills/lib/stripe.ts"
  - "backend/uef-gateway/src/billing/index.ts"
  - "backend/uef-gateway/src/integrations/index.ts"
---

# Stripe — Payments Tool Reference

## Overview

Stripe powers all payment processing for AIMS. It implements the **3-6-9 billing model** (Starter/Pro/Enterprise tiers) with subscription management, webhooks, and usage-based billing via LUC integration.

## API Key Setup

| Variable | Required | Where to Get | Purpose |
|----------|----------|--------------|---------|
| `STRIPE_SECRET_KEY` | Yes | https://dashboard.stripe.com/apikeys | Server-side API calls |
| `STRIPE_PUBLISHABLE_KEY` | Yes | Same | Client-side Stripe.js |
| `STRIPE_WEBHOOK_SECRET` | Yes | Dashboard > Developers > Webhooks | Verify webhook signatures |
| `STRIPE_PRICE_STARTER` | Yes | Dashboard > Products > Pricing | Starter plan price ID |
| `STRIPE_PRICE_PRO` | Yes | Same | Pro plan price ID |
| `STRIPE_PRICE_ENTERPRISE` | Yes | Same | Enterprise plan price ID |

**Apply in:** `infra/.env.production`

**Setup script:** `cd aims-skills && npm run setup:stripe` — Creates products and price IDs in your Stripe account.

## API Reference

### Base URL
```
https://api.stripe.com/v1
```

### Auth Header
```
Authorization: Bearer $STRIPE_SECRET_KEY
```

### Key Endpoints

**Create Checkout Session:**
```http
POST /checkout/sessions
{
  "mode": "subscription",
  "line_items": [{ "price": "$STRIPE_PRICE_PRO", "quantity": 1 }],
  "success_url": "https://plugmein.cloud/dashboard?session_id={CHECKOUT_SESSION_ID}",
  "cancel_url": "https://plugmein.cloud/pricing"
}
```

**Create Customer Portal Session:**
```http
POST /billing_portal/sessions
{
  "customer": "cus_xxx",
  "return_url": "https://plugmein.cloud/dashboard"
}
```

**Webhook Events to Handle:**
- `checkout.session.completed` — New subscription
- `customer.subscription.updated` — Plan change
- `customer.subscription.deleted` — Cancellation
- `invoice.payment_failed` — Payment failure

## 3-6-9 Billing Model

| Tier | Price ID Var | Monthly | Features |
|------|-------------|---------|----------|
| Starter (3) | `STRIPE_PRICE_STARTER` | $3/mo | Basic AI tools, limited runs |
| Pro (6) | `STRIPE_PRICE_PRO` | $6/mo | Full AI suite, priority routing |
| Enterprise (9) | `STRIPE_PRICE_ENTERPRISE` | $9/mo | Unlimited, custom agents, SLA |

## LUC Integration

Every billable operation (LLM calls, compute, storage) is metered by the LUC engine and reconciled against the user's Stripe subscription tier. Overages are billed per the `luc/types.ts` rate table.

## Webhook Setup

1. Create endpoint in Stripe Dashboard: `https://plugmein.cloud/api/webhooks/stripe`
2. Select events: `checkout.session.completed`, `customer.subscription.*`, `invoice.*`
3. Copy signing secret to `STRIPE_WEBHOOK_SECRET`

## Troubleshooting

| Issue | Fix |
|-------|-----|
| 401 Unauthorized | Check `STRIPE_SECRET_KEY` (starts with `sk_`) |
| Webhook signature mismatch | Verify `STRIPE_WEBHOOK_SECRET` matches dashboard |
| Price ID not found | Run `npm run setup:stripe` to create products |
| Test vs Live mode | Use `sk_test_` keys for dev, `sk_live_` for production |
