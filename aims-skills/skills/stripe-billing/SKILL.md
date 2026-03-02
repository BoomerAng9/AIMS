---
name: stripe-billing
description: |
  Stripe billing — 5-tier + 3-6-9 pricing model, subscription management,
  LUC cost integration. Use when: payment, subscribe, billing, pricing, upgrade, cancel.
role: Specialist Executor
intent: Manage subscriptions, process payments, and enforce tier-based usage limits via Stripe + LUC
kpis: [checkout_conversion_rate, churn_rate, revenue_per_user, luc_overage_rate]
status: active
priority: high
triggers:
  - payment
  - subscribe
  - billing
  - pricing
  - plan
  - upgrade
  - cancel subscription
execution:
  target: api
  route: /api/billing
dependencies:
  env:
    - STRIPE_SECRET_KEY
  files:
    - aims-skills/tools/stripe.tool.md
    - aims-skills/lib/stripe.ts
    - aims-skills/luc/luc-adk.ts
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
| Enterprise | Highest allocations, SLA, dedicated Specialist Executor |

### Axis 2 — Commitment Duration (3-6-9 model)

| Duration | Token Markup | Benefit |
|----------|-------------|---------|
| Pay-per-Use | 25% | No commitment |
| 3 months | 20% | Entry |
| 6 months | 15% | Balance |
| 9 months | 10% | Pay 9, get 12 months |

**IMPORTANT: No tier is "unlimited". Every tier has explicit, metered caps.**
Enterprise gets the highest allocations, not infinite ones.

## Core Workflow

1. User asks about pricing or initiates payment flow
2. Present tier matrix with commitment options
3. User selects plan + duration
4. Create Stripe Checkout Session (with explicit price confirmation)
5. User completes payment on Stripe hosted page
6. Webhook fires: `checkout.session.completed`
7. LUC engine activates tier limits
8. User gets access to selected tier

## Cost Awareness Rules

1. **Never process payments without explicit user consent**
2. **Always confirm plan selection before creating checkout session**
3. **Show price before redirect** — confirm total before Stripe redirect
4. **Test mode for dev** — Use `sk_test_` keys, never `sk_live_` in development
5. **Webhook verification** — Always verify Stripe signature before processing

## Common Questions

| Question | Answer |
|----------|--------|
| "How much does it cost?" | Show the tier matrix — plans range from Pay-per-Use to Enterprise |
| "What's included in Pro?" | Full AI suite, priority model routing, extended runs, API access |
| "Can I upgrade?" | Yes, proration handled automatically by Stripe |
| "How do I cancel?" | Customer portal link or ACHEEVY can initiate |

## LUC Integration

Each tier has usage limits enforced by the LUC engine.
All tiers have explicit, auditable caps — no tier uses -1 or "unlimited".
Overages are charged per the LUC rate table in `luc/types.ts`.

## Quality Gates

- Payment flows require explicit user consent at every step
- Stripe webhook signatures verified before processing
- Test keys (`sk_test_`) never used in production
- LUC tier limits activated immediately after successful checkout

## Hooks

- **trigger:** Billing or pricing intent detected
- **pre_gsd:** Validate `STRIPE_SECRET_KEY`, determine user's current tier
- **post_gsd:** Log billing event, update LUC tier limits

## Limits

- Stripe API rate limits: 100 read requests/sec, 25 write requests/sec
- Webhook delivery: 3 retries over 72 hours on failure
- Checkout session expires after 24 hours

## API Key Check

```
if (!STRIPE_SECRET_KEY) → "Billing not configured. Contact support."
```
