# Stripe Billing — Acceptance Criteria

## Functional Requirements

1. **Tier matrix**: 5 tiers (Pay-per-Use, Buy Me a Coffee, Data Entry, Pro, Enterprise)
2. **Commitment model**: 3-6-9 month durations with decreasing markup (25% → 20% → 15% → 10%)
3. **No unlimited tiers**: Every tier has explicit, auditable caps
4. **Consent required**: Payment never processed without explicit user confirmation
5. **Price confirmation**: Total shown to user before Stripe redirect
6. **Proration**: Tier upgrades handled via Stripe proration
7. **LUC activation**: Tier limits activated in LUC engine immediately after checkout
8. **Webhook verification**: Stripe signature verified on every webhook

## Non-Functional Requirements

1. **Checkout conversion**: Track and optimize conversion rate
2. **Webhook reliability**: Handle Stripe retries (3 over 72 hours)
3. **Test isolation**: `sk_test_` keys never in production environment
4. **Audit trail**: Every billing event logged with timestamp and actor

## Billing Flow Sequence

```
User → "How much?" → Present tier matrix
User → Selects plan + duration → Confirm price
User → Confirms → Create Stripe Checkout Session
User → Completes on Stripe → Webhook: checkout.session.completed
System → Verify signature → Activate LUC limits → Grant access
```

## Error Handling

| Error | Response |
|-------|----------|
| `STRIPE_SECRET_KEY` missing | Return config error, no billing operations |
| Checkout session creation fails | Return structured error, do not redirect |
| Webhook signature invalid | Reject event, log security warning |
| Payment declined | Notify user, do not activate tier |
| LUC activation fails post-payment | Alert ops, grant access manually pending fix |
