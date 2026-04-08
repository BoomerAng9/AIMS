---
name: openrouter-llm
description: |
  OpenRouter LLM Routing and model selection.
  Use when: an agent needs to select the optimal LLM for a task, manage cost-per-token
  budgets, implement fallback chains, or route between model providers.
role: Primary Orchestrator
intent: Select optimal LLM model per task complexity with cost awareness and fallback chain.
kpis:
  - model_selection_accuracy
  - cost_per_task
  - fallback_activation_rate
status: active
priority: high
triggers:
  - model
  - llm
  - openrouter
  - which model
  - ai model
  - token cost
  - cheaper model
execution: sequential — classify task complexity → select model from table → check API key → call model → fallback if needed → log cost
dependencies:
  - OPENROUTER_API_KEY
---

# OpenRouter LLM Routing

This skill governs how ACHEEVY and all A.I.M.S. agents select the right LLM for each task.
OpenRouter is the primary gateway, with Vertex AI as a secondary provider and stub responses
as the last resort.

## Model Selection Table

| Task Type | Primary Model | Fallback | Cost Tier |
|---|---|---|---|
| **Complex reasoning / architecture** | `google/gemini-3.1-pro` (high thinking) | `anthropic/claude-opus-4-6` | High |
| **Code generation / analysis** | `google/gemini-3.1-pro` (medium thinking) | `anthropic/claude-sonnet-4` | Medium-High |
| **General conversation / chat** | `anthropic/claude-sonnet-4` | `zhipu/glm-5` | Medium |
| **Budget reasoning** | `zhipu/glm-5` | `google/gemini-flash-2.0` | Low |
| **Simple formatting / translation** | `google/gemini-flash-2.0` | Stub response | Very Low |
| **Visual reasoning / video** | `moonshot-ai/kimi-k2.5` | `google/gemini-3.1-pro` | High |
| **Multimodal (image + text)** | `google/gemini-3.1-pro` | `google/gemini-flash-2.0` | Medium |

## Cost Awareness Rules

1. **Always check task complexity before selecting a model.** Do not default to the most
   powerful model. A simple formatting task should use Gemini Flash, not Gemini 3.1 Pro.

2. **Log cost per task.** Every LLM call must emit `cost_per_task` with model ID, input tokens,
   output tokens, and estimated cost in USD.

3. **Set token budgets per task type.** Summarization: max 2K output tokens. Code generation:
   max 4K output tokens. Complex reasoning: max 8K output tokens. Never let a model run unbounded.

4. **Prefer OpenRouter over direct provider APIs.** OpenRouter provides unified billing, automatic
   failover, and consistent API format. Only use Vertex AI directly for Vertex-exclusive features.

5. **Monitor monthly spend.** If projected monthly spend exceeds budget, automatically downgrade
   non-critical tasks to cheaper models (GLM-5, Gemini Flash).

## Fallback Chain

```
Primary Model (OpenRouter)
  ↓ (if unavailable / rate-limited / error)
Vertex AI (same model or equivalent)
  ↓ (if unavailable)
OpenRouter fallback model (see table above)
  ↓ (if all models unavailable)
Stub response: "Service temporarily unavailable. Please try again."
```

Every fallback activation MUST be logged with:
- Original model attempted
- Failure reason (429, 500, timeout, etc.)
- Fallback model used
- Additional latency incurred

## API Key Check

Before any LLM call, verify:

```typescript
if (!process.env.OPENROUTER_API_KEY) {
  throw new Error("OPENROUTER_API_KEY is not set. Cannot route LLM calls.");
}
```

Never silently fail. Never use a hardcoded key. Never log the key value.

## Anti-Patterns

- Using Gemini 3.1 Pro (high thinking) for simple chat messages — use Claude Sonnet or GLM-5.
- Not implementing fallback chains — a single model failure should not break the entire workflow.
- Hardcoding model IDs in business logic — use the model selection table and route dynamically.
- Ignoring token budgets — unbounded generation wastes money and can produce low-quality tails.
- Calling OpenRouter without checking the API key first — produces cryptic auth errors downstream.
