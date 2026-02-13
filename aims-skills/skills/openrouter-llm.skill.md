---
id: "openrouter-llm"
name: "OpenRouter LLM Routing"
type: "skill"
status: "active"
triggers:
  - "model"
  - "llm"
  - "openrouter"
  - "which model"
  - "ai model"
  - "token cost"
  - "cheaper model"
description: "Guides agents on model selection, cost awareness, and the LLM fallback chain."
execution:
  target: "internal"
  route: ""
dependencies:
  files:
    - "aims-skills/tools/openrouter.tool.md"
    - "backend/uef-gateway/src/llm/openrouter.ts"
    - "backend/uef-gateway/src/llm/vertex-ai.ts"
priority: "high"
---

# OpenRouter LLM Routing Skill

## When This Fires

Triggers when any agent needs to select a model, estimate costs, or understand the LLM routing chain.

## Model Selection Rules

### By Task Complexity

| Task Type | Recommended Model | Tier | Why |
|-----------|-------------------|------|-----|
| Simple routing/classification | `gemini-3.0-flash` | Fast | $0.10/M input, fastest |
| General chat/responses | `claude-sonnet-4.5` | Standard | Best quality/cost balance |
| Complex reasoning/coding | `claude-opus-4.6` | Premium | Most capable, 1M context |
| Research summaries | `gemini-3-pro` | Standard | Good at synthesis, large context |
| Quick extraction/parsing | `claude-haiku-4.5` | Fast | Fast, cheap, good enough |
| Budget-sensitive batch work | `llama-3.3-70b` | Economy | $0.10/M, no API cost |

### Cost Awareness Rules

1. **Never use Premium tier for simple tasks** — Classification, routing, and yes/no questions use Fast tier
2. **Default to Gemini Flash** — The gateway default (`gemini-3.0-flash`) is correct for 80% of routing decisions
3. **Escalate only when needed** — Start with Fast/Standard, upgrade to Premium only for complex multi-step reasoning
4. **Track costs per job** — Every `LLMResult.cost.usd` feeds into LUC for per-job billing
5. **Monitor token usage** — `LLMResult.tokens.total` must be logged for every call

### Fallback Chain

```
1. Vertex AI (if GOOGLE_APPLICATION_CREDENTIALS set)
   ↓ on failure
2. OpenRouter (if OPENROUTER_API_KEY set)
   ↓ on failure
3. Stub response (returns error message, never silent)
```

### API Key Check

Before making any LLM call, verify:
```typescript
if (!process.env.OPENROUTER_API_KEY) {
  // Fall back to heuristic mode — no real LLM calls
  // Log warning: agents operating in degraded mode
}
```

## Anti-Patterns

- Do NOT hardcode model IDs in frontend code — always route through UEF Gateway
- Do NOT use Premium models for logging/telemetry
- Do NOT retry 402 errors (payment required) — alert user to add credits
- Do NOT stream when response is <100 tokens — overhead exceeds benefit
