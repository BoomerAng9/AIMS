---
id: "stripe"
name: "Stripe"
type: "tool"
category: "payments"
provider: "Stripe"
description: "Payment processing, subscription management, agent commerce, and x402 micropayments — powers the 3-6-9 billing model. API version: 2026-01-28.clover."
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
  - "backend/uef-gateway/src/billing/x402.ts"
  - "backend/uef-gateway/src/billing/agent-commerce.ts"
  - "backend/uef-gateway/src/billing/persistence.ts"
  - "backend/uef-gateway/src/integrations/index.ts"
---

# Stripe — Payments Tool Reference

## Overview

Stripe powers all payment processing for AIMS. It implements the **3-6-9 billing model** (Starter/Pro/Enterprise tiers) with subscription management, webhooks, usage-based billing via LUC integration, **agent commerce** (ACP + x402), and the **Stripe Agent Toolkit** as an MCP server for ACHEEVY.

- **Current API:** `2026-01-28.clover` (Accounts v2 GA, agentic commerce, stablecoin payouts)
- **SDK:** `stripe` npm package v14.x
- **Agent Toolkit MCP:** `@stripe/agent-toolkit` or `https://mcp.stripe.com` (hosted)

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

## Payment Architecture (Stripe-Only)

```
┌─────────────────────────────────────────────────────────────┐
│                    AIMS Payment Stack                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Layer 1: Human Subscriptions                               │
│  └── Stripe Billing (3-6-9 tiers)                          │
│      └── checkout/route.ts → webhook/route.ts              │
│                                                             │
│  Layer 2: Usage Metering                                    │
│  └── Stripe Meters API (compute, API calls, storage)       │
│      └── LUC engine → billing/index.ts                     │
│                                                             │
│  Layer 3: Agent-to-Agent Payments                           │
│  └── X-402 Protocol (USDC micropayments via HTTP headers)  │
│      └── billing/x402.ts → Stripe PaymentIntents verify    │
│                                                             │
│  Layer 4: ACHEEVY Billing Ops                               │
│  └── Stripe Agent Toolkit (MCP server)                     │
│      └── Create payment links, track usage, manage billing │
│                                                             │
│  Layer 5: Marketplace Splits (future)                       │
│  └── Stripe Connect (platform + plug creator revenue)      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Stripe Agent Toolkit — MCP Server for ACHEEVY

ACHEEVY uses the Stripe Agent Toolkit as an MCP (Model Context Protocol) server to manage billing programmatically.

### Setup Options

**Option A: Hosted MCP (recommended for production)**
```
MCP Server URL: https://mcp.stripe.com
Auth: OAuth via Stripe Dashboard
```

**Option B: Local MCP via npx**
```bash
npx @stripe/mcp --tools=all --api-key=$STRIPE_SECRET_KEY
```

**Option C: SDK Integration**
```typescript
import { StripeAgentToolkit } from '@stripe/agent-toolkit/ai-sdk';

const toolkit = new StripeAgentToolkit({
  secretKey: process.env.STRIPE_SECRET_KEY!,
  configuration: {
    actions: {
      paymentLinks: { create: true },
      products: { create: true },
      prices: { create: true },
      customers: { create: true, read: true },
      invoices: { create: true, read: true },
      subscriptions: { read: true },
      balance: { read: true },
    },
  },
});
```

### Available Tools (via MCP)

| Tool | Purpose | ACHEEVY Use Case |
|------|---------|-----------------|
| `create_payment_link` | Generate one-time or recurring payment URLs | Plug deployment billing |
| `create_product` | Register new billable products | New plug types |
| `create_price` | Set pricing for products | Dynamic pricing |
| `create_customer` | Register paying agents/users | New user onboarding |
| `list_invoices` | Query billing history | Usage reports |
| `retrieve_balance` | Check platform balance | Financial dashboard |
| `create_meter_event` | Record usage for metered billing | LUC token tracking |
| `create_checkout_session` | Start checkout flow | Subscription upgrades |

## Agent Commerce Protocols

### ACP (Agentic Commerce Protocol)
- Co-developed by Stripe + OpenAI (Apache 2.0)
- Agent sends `CreateCheckoutRequest` → seller responds with cart
- Uses Shared Payment Tokens (SPT) for agent-initiated payments
- Live in ChatGPT since Sep 2025

### x402 Protocol
- Stripe x402 integration launched Feb 2026
- Agent hits endpoint → gets 402 → pays USDC on Base → gets access
- Funds land in Stripe balance (tax, refunds, compliance handled)
- AIMS implements x402 gate middleware: `billing/x402.ts`

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

**Verify Payment Intent (used by x402 + agent-commerce):**
```http
GET /payment_intents/pi_xxx
# Returns: { status: "succeeded", amount: 500, currency: "usd" }
```

**Webhook Events to Handle:**
- `checkout.session.completed` — New subscription
- `customer.subscription.updated` — Plan change
- `customer.subscription.deleted` — Cancellation
- `invoice.payment_failed` — Payment failure

## 3-6-9 Billing Model

| Tier | Commitment | Monthly | Tokens/mo | Agents | Concurrent |
|------|-----------|---------|-----------|--------|-----------|
| P2P | None | $0 + per-use | 0 (metered) | 0 | 1 |
| 3mo | 3 months | $19.99 | 100K | 5 | 2 |
| 6mo | 6 months | $17.99 | 250K | 15 | 5 |
| 9mo | 9 months (12 delivered) | $14.99 | 500K | 50 | 25 |

## LUC Integration

Every billable operation (LLM calls, compute, storage) is metered by the LUC engine and reconciled against the user's Stripe subscription tier. Overages are billed per the overage rate table. Task multipliers (1.0x–3.0x) are applied based on operation type.

## Billing Persistence

All billing state is persisted to SQLite:
- `billing_provisions` — user tier assignments (from Stripe webhook)
- `payment_sessions` — agent commerce checkout sessions
- `x402_receipts` — validated payment receipts (replay protection)
- `agent_wallets` — per-agent LUC balances
- `agent_transactions` — transaction history

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
| Agent commerce confirm fails | Ensure `STRIPE_SECRET_KEY` is set for PaymentIntent verification |
