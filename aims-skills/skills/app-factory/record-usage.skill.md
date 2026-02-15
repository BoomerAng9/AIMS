---
id: "record-usage"
name: "Record Usage"
type: "skill"
status: "active"
triggers: ["usageUpsert", "record usage", "track usage"]
description: "Writes usage and pricing metrics: selected model, token usage, pricing tier, cost tracking."
execution:
  target: "api"
  route: "/api/acheevy/actions/record-usage"
priority: "high"
---

# Record Usage Skill

> Every model call and tool execution has a cost. Track it all.

## Action: `usageUpsert`

### What It Does
1. Records usage metrics for the current turn/action:
   - Selected model (OpenRouter model ID)
   - Token usage (prompt + completion, estimated and actual)
   - Pricing tier (nano/starter/pro/enterprise)
   - Cost in USD (estimated and actual)
2. Updates running totals in `users/{uid}/usage/{period}`
3. Checks against cost caps and overage thresholds
4. If `actual > estimate + buffer`, notifies user before proceeding

### Pricing Rules

| Rule | Value |
|------|-------|
| **Default model** | Low-cost (Gemini Flash / small OpenRouter model) until user explicitly upgrades |
| **Refundable buffer** | 25% of estimated cost (`buffer = 0.25 * estimated_cost`) |
| **Overage notification** | If `actual > estimate + buffer`, ACHEEVY must notify and ask permission to continue |
| **No-reveal** | Never disclose internal cost basis, raw pricing, or margin to the user |

### Overage Flow
```
1. Estimate cost before execution
2. Execute the action
3. Compare actual vs estimate
4. If actual > estimate + 25% buffer:
   a. Pause execution
   b. ACHEEVY: "This task used more resources than expected.
      The additional cost is approximately $X.
      Would you like me to continue?"
   c. Wait for explicit user approval
   d. If approved, continue; if not, halt
```

### Parameters
```json
{
  "session_id": "uuid",
  "user_id": "uid",
  "model_id": "openrouter:model_id",
  "tokens": {
    "prompt": 1234,
    "completion": 567
  },
  "estimated_cost_usd": 0.05,
  "actual_cost_usd": 0.048,
  "pricing_tier": "nano|starter|pro|enterprise",
  "action_type": "chat|tool_call|vertical_step"
}
```

### No-Reveal Canned Response
When asked about internal rates or costs:
> "I manage cost optimization behind the scenes to ensure you get the best value.
> Your usage is tracked against your plan tier, and I'll always notify you
> before any unexpected charges."
