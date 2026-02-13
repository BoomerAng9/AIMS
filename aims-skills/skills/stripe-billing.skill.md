---
id: "stripe-billing"
name: "Stripe Billing"
type: "skill"
status: "active"
triggers:
  - "payment"
  - "subscribe"
  - "billing"
  - "pricing"
  - "plan"
  - "upgrade"
  - "cancel subscription"
description: "Guides agents on the 3-6-9 pricing model, subscription management, and LUC cost integration."
execution:
  target: "api"
  route: "/api/billing"
dependencies:
  env:
    - "STRIPE_SECRET_KEY"
  files:
    - "aims-skills/tools/stripe.tool.md"
    - "aims-skills/lib/stripe.ts"
    - "aims-skills/luc/luc-adk.ts"
priority: "high"
---

# Stripe Billing Skill

## When This Fires

Triggers when a user asks about pricing, subscriptions, upgrades, or any payment-related operation.

## 3-6-9 Model Rules

| Question | Answer |
|----------|--------|
| "How much does it cost?" | $3 Starter / $6 Pro / $9 Enterprise per month |
| "What's included in Pro?" | Full AI suite, priority model routing, extended runs |
| "Can I upgrade?" | Yes, proration handled automatically by Stripe |
| "How do I cancel?" | Customer portal link or ACHEEVY can initiate |

## Billing Flow

```
User asks about pricing
  → ACHEEVY explains 3-6-9 model
  → User chooses plan
  → Create Stripe Checkout Session
  → User completes payment on Stripe
  → Webhook fires: checkout.session.completed
  → LUC engine activates tier limits
  → User gets access
```

## Cost Awareness Rules

1. **Never process payments without explicit user consent**
2. **Always confirm plan selection before creating checkout session**
3. **Show price before redirect** — "$6/month for Pro. Ready to subscribe?"
4. **Test mode for dev** — Use `sk_test_` keys, never `sk_live_` in development
5. **Webhook verification** — Always verify Stripe signature before processing

## API Key Check

Before any billing operation:
```
if (!STRIPE_SECRET_KEY) → "Billing not configured. Contact support."
if (!STRIPE_PRICE_PRO) → "Plans not set up. Run setup:stripe script."
```

## LUC Integration

Each tier has usage limits enforced by the LUC engine:
- **Starter:** 100 LLM calls/day, 1GB storage
- **Pro:** 1000 LLM calls/day, 10GB storage
- **Enterprise:** Unlimited calls, 100GB storage, priority routing

Overages charged per LUC rate table in `luc/types.ts`.
