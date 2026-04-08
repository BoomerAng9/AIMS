---
name: glm-5
description: |
  GLM-5 Z.ai Frontier Model routing and configuration.
  Use when: a task needs budget-friendly frontier reasoning, MIT-licensed model output,
  agentic engineering, or cost-effective high-quality inference via OpenRouter.
role: Specialist Executor
intent: Route budget frontier reasoning tasks to GLM-5's 744B MoE model for cost-effective high-quality inference.
kpis:
  - cost_per_task
  - hallucination_rate
  - routing_accuracy
status: active
priority: high
triggers:
  - glm
  - glm-5
  - zhipu
  - z.ai
  - chatglm
  - chinese model
  - cogvideo
  - cogview
  - agentic engineering
  - huawei trained
execution: sequential — classify task → verify budget fit → call GLM-5 via OpenRouter → validate response → log cost
dependencies:
  - OPENROUTER_API_KEY
---

# GLM-5 — Z.ai Frontier Model

Released 2026-02-11 by Zhipu AI (Z.ai). A 744B parameter Mixture-of-Experts model trained
on Huawei Ascend infrastructure. MIT licensed — all outputs are commercially usable with
no restrictions.

## Model Overview

| Property | Value |
|---|---|
| Parameters | 744B (MoE, ~120B active) |
| Context Window | 128K tokens |
| License | MIT |
| Training Hardware | Huawei Ascend 910B |
| Provider | OpenRouter |
| Model ID | `zhipu/glm-5` |

## Pricing

| Component | Input (per MTok) | Output (per MTok) |
|---|---|---|
| Text | $1.00 | $3.20 |

GLM-5 is one of the most cost-effective frontier models available. At $1.00/$3.20 per MTok,
it undercuts most competitors while delivering competitive benchmark performance.

## Routing Rules

1. **Use GLM-5 as the default budget frontier model** — for tasks that need strong reasoning
   but do not require the absolute best (use Gemini 3.1 Pro or Claude 4.6 for those).
2. **Prefer GLM-5 over GPT-4o** for cost-sensitive tasks — similar quality at lower price.
3. **Use for agentic engineering** — GLM-5 excels at multi-step tool-use and code generation
   tasks common in ACHEEVY workflows.
4. **MIT license advantage** — when the output must be redistributable or embedded in
   customer-facing exports, GLM-5's MIT license removes legal friction.
5. **Fallback to GLM-5** when primary models (Gemini 3.1 Pro, Claude 4.6) are rate-limited
   or unavailable.

## When NOT to Use GLM-5

- Tasks requiring >128K context window (use Gemini 3.1 Pro with 2M context).
- Tasks where absolute top-tier accuracy is critical (use Claude 4.6 Opus or Gemini 3.1 Pro high-thinking).
- Real-time streaming with sub-200ms first-token latency requirements.
- Image/audio multimodal input (GLM-5 is text-only; use CogView/CogVideo siblings for media generation).

## Anti-Patterns

- Routing GLM-5 for tasks that exceed its 128K context limit.
- Ignoring the MIT license benefit when producing exportable/customer-facing content.
- Using GLM-5 for safety-critical decisions without a secondary verification model.
- Not logging `cost_per_task` — the whole point of GLM-5 routing is cost optimization.

## Related Models (Zhipu Ecosystem)

| Model | Purpose |
|---|---|
| CogVideo X | Video generation |
| CogView 4 | Image generation |
| GLM-4 | Previous-gen text model |
