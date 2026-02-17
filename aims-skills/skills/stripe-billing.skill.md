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
description: "Guides agents on the 5-tier + 3-6-9 pricing model, subscription management, and LUC cost integration."
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

## Two-Axis Pricing Model

### Axis 1 — Plan Tier (what you get)

| Tier | Key Features |
|------|-------------|
| Pay-per-Use | Metered per execution — no monthly base |
| Buy Me a Coffee | Basic automations, voice summaries, research |
| Data Entry | Full voice suite, iAgent lite, analytics |
| Pro | All II repos, priority execution, API access |
| Enterprise | Highest allocations, SLA, dedicated Boomer_Ang |

### Axis 2 — Commitment Duration (3-6-9 model)

| Duration | Token Markup | Benefit |
|----------|-------------|---------|
| Pay-per-Use | 25% | No commitment |
| 3 months | 20% | Entry |
| 6 months | 15% | Balance |
| 9 months | 10% | Pay 9, get 12 months |

**IMPORTANT: No tier is "unlimited". Every tier has explicit, metered caps.**
Enterprise gets the highest allocations, not infinite ones.

## Common Questions

| Question | Answer |
|----------|--------|
| "How much does it cost?" | Show the tier matrix — plans range from Pay-per-Use to Enterprise |
| "What's included in Pro?" | Full AI suite, priority model routing, extended runs, API access |
| "Can I upgrade?" | Yes, proration handled automatically by Stripe |
| "How do I cancel?" | Customer portal link or ACHEEVY can initiate |

## Billing Flow

```
User asks about pricing
  → ACHEEVY explains tier + commitment options
  → User chooses plan + duration
  → Create Stripe Checkout Session
  → User completes payment on Stripe
  → Webhook fires: checkout.session.completed
  → LUC engine activates tier limits
  → User gets access
```

## Cost Awareness Rules

1. **Never process payments without explicit user consent**
2. **Always confirm plan selection before creating checkout session**
3. **Show price before redirect** — confirm total before Stripe redirect
4. **Test mode for dev** — Use `sk_test_` keys, never `sk_live_` in development
5. **Webhook verification** — Always verify Stripe signature before processing

## API Key Check

Before any billing operation:
```
if (!STRIPE_SECRET_KEY) → "Billing not configured. Contact support."
```

## LUC Integration

Each tier has usage limits enforced by the LUC engine.
All tiers have explicit, auditable caps — no tier uses -1 or "unlimited".
Overages are charged per the LUC rate table in `luc/types.ts`.
