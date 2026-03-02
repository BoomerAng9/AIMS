---
name: gemini-3.1-pro
description: |
  Gemini 3.1 Pro model routing and configuration.
  Use when: a task requires Gemini 3.1 Pro capabilities — deep reasoning, long-context
  analysis, code generation, or multimodal understanding — and the agent needs to select
  the correct thinking level and feature flags.
role: Specialist Executor
intent: Route tasks to Gemini 3.1 Pro with correct thinking level and feature flags for optimal cost-performance.
kpis:
  - model_selection_accuracy
  - cost_per_task
  - thinking_level_hit_rate
status: active
priority: high
triggers:
  - gemini
  - gemini 3.1
  - gemini pro
  - deep reasoning
  - long context
  - google model
  - thinking model
execution: sequential — classify task → select thinking level → configure feature flags → call model → validate response
dependencies:
  - OPENROUTER_API_KEY
  - GOOGLE_APPLICATION_CREDENTIALS
---

# Gemini 3.1 Pro

Released 2026-02-19. Google DeepMind's frontier reasoning model with configurable thinking
depth, 2M token context window, and native multimodal support.

## Model IDs

| Provider | Model ID | Notes |
|---|---|---|
| OpenRouter | `google/gemini-3.1-pro` | Preferred for cost routing |
| Vertex AI | `gemini-3.1-pro` | Use when Vertex-only features are needed |
| OpenRouter (thinking) | `google/gemini-3.1-pro:thinking` | Explicit thinking mode |

## Thinking Levels

Gemini 3.1 Pro supports configurable thinking depth. Select the correct level to balance
cost and quality:

| Level | When to Use | Cost Multiplier |
|---|---|---|
| **none** | Simple retrieval, formatting, translation | 1x |
| **low** | Summarization, basic analysis, template filling | ~1.3x |
| **medium** | Code generation, multi-step reasoning, document analysis | ~2x |
| **high** | Complex math, novel problem solving, architecture design | ~3x |

### Setting Thinking Level (OpenRouter)

```typescript
const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    model: "google/gemini-3.1-pro",
    messages: [{ role: "user", content: prompt }],
    provider: {
      thinking: { level: "medium" }  // none | low | medium | high
    }
  })
});
```

### Setting Thinking Level (Vertex AI)

```typescript
const response = await vertexAI.predict({
  endpoint: "gemini-3.1-pro",
  instances: [{ content: prompt }],
  parameters: {
    thinkingConfig: { thinkingLevel: "MEDIUM" }  // NONE | LOW | MEDIUM | HIGH
  }
});
```

## Pricing

| Component | Input (per MTok) | Output (per MTok) |
|---|---|---|
| Text | $1.25 | $10.00 |
| Thinking tokens | $1.25 | $10.00 |
| Image | $1.25 / image | N/A |
| Audio | $1.00 / min | N/A |

> Thinking tokens count toward output pricing. Higher thinking levels = more output tokens = higher cost.

## Routing Rules

1. **Default to `medium` thinking** for most ACHEEVY tasks (code gen, analysis, planning).
2. **Use `none` or `low`** for simple formatting, translation, or retrieval-augmented generation.
3. **Use `high`** only for novel architecture design, complex math proofs, or multi-constraint optimization.
4. **Prefer OpenRouter** for all Gemini calls unless Vertex-specific features (grounding, tuned models) are required.
5. **Fallback**: If Gemini 3.1 Pro is unavailable on OpenRouter, fall back to Claude 4.6 Sonnet, then GLM-5.

## Anti-Patterns

- Using `high` thinking for simple summarization tasks (wastes 3x tokens).
- Calling Vertex AI directly when OpenRouter is available (higher cost, slower cold start).
- Not setting a thinking level at all (defaults vary by provider and may change).
- Sending images to the non-multimodal endpoint.
- Ignoring the 2M context window limit — split documents larger than 1.5M tokens.
