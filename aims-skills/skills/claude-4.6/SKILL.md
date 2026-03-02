---
name: claude-4.6
description: |
  Claude Opus 4.6 and Sonnet 4.6 — Anthropic's frontier models with adaptive thinking,
  1M context, agent teams, fast mode, and computer use. Use when: claude, opus, sonnet,
  adaptive thinking, agent teams, fast mode, computer use, claude code.
role: Specialist Executor
intent: Route tasks to the optimal Claude model variant with correct thinking effort and feature flags
kpis: [model_selection_accuracy, cost_per_task, adaptive_effort_hit_rate]
status: active
priority: critical
triggers:
  - claude
  - claude opus
  - claude sonnet
  - opus 4.6
  - sonnet 4.6
  - adaptive thinking
  - agent teams
  - fast mode
  - computer use
  - claude code
execution:
  target: internal
  route: ""
dependencies:
  env:
    - OPENROUTER_API_KEY
  apis:
    - https://openrouter.ai/api/v1
    - https://api.anthropic.com/v1
released: "2026-02-05"
---

# Claude 4.6 Skill

> Claude Opus 4.6: Released February 5, 2026
> Claude Sonnet 4.6: Released February 17, 2026

## Model Lineup

| Model | API ID | Context | Max Output | Input $/MTok | Output $/MTok |
|---|---|---|---|---|---|
| **Opus 4.6** | `claude-opus-4-6` | 200K (1M beta) | 128K | $5 | $25 |
| **Sonnet 4.6** | `claude-sonnet-4-6` | 200K (1M beta) | 64K | $3 | $15 |
| Haiku 4.5 | `claude-haiku-4-5-20251001` | 200K | 64K | $1 | $5 |

## Core Workflow — Model Routing

1. Classify incoming task by complexity and latency requirement
2. Select model + thinking effort per the Routing Rules below
3. Apply feature flags (fast mode, 1M context, computer use) as needed
4. Execute via Anthropic API or OpenRouter
5. Log model selection, effort level, and token usage

## Adaptive Thinking (Replaces Extended Thinking)

No more manual `budget_tokens`. The model dynamically decides reasoning depth.

| Effort Level | Description | Best For |
|---|---|---|
| `low` | Minimal reasoning | Classification, routing, extraction |
| `medium` | Balanced | General chat, summaries, standard code |
| `high` (default) | Deep reasoning | Complex analysis, debugging, research |
| `max` (**Opus only**) | Maximum depth | Hardest problems, novel algorithms, proofs |

```typescript
const response = await anthropic.messages.create({
  model: "claude-opus-4-6",
  max_tokens: 16000,
  thinking: { type: "adaptive" },
  messages: [{ role: "user", content: "..." }],
});
```

## Routing Rules for AIMS

```
IF task is core orchestration (deploy, provision, scale)
  → claude-opus-4-6, adaptive thinking, effort: high or max

IF task is code review, PR analysis, debugging
  → claude-sonnet-4-6, adaptive thinking, effort: medium

IF task is classification, intent detection, routing
  → claude-haiku-4.5 or gemini-3.0-flash (cheaper, faster)

IF task needs real-time voice response
  → claude-opus-4-6 fast mode (2.5x speed)

IF task is bulk content generation (overnight)
  → claude-sonnet-4-6 batch API (50% off)

IF task is security audit
  → claude-opus-4-6, adaptive thinking, effort: max

IF task is UI testing / computer use
  → claude-sonnet-4-6 with computer_use tool
```

## Key Features

See [references/api-patterns.md](references/api-patterns.md) for detailed API usage including:
- 1M context window (beta header)
- 128K max output (Opus)
- Fast mode (2.5x speed, 6x pricing)
- Compaction API (infinite conversations)
- Agent Teams (parallel sub-agents)
- Computer Use (72.7% OSWorld)
- Prompt caching (90% savings on cache reads)
- Batch API (50% discount)

## Anti-Patterns

- Do NOT use `budget_tokens` on 4.6 models — use adaptive thinking instead
- Do NOT prefill assistant messages on Opus 4.6 — returns 400 error
- Do NOT use Fast Mode for batch workloads — 6x pricing defeats the purpose
- Do NOT default to Opus for everything — Sonnet 4.6 beats previous Opus 4.5 in 59% of cases
- Do NOT ignore prompt caching — cache reads are 90% cheaper than fresh input
- Do NOT skip the `max` effort level for critical decisions — it's exclusive to Opus 4.6

## Quality Gates

- Model selection matches task complexity (don't use Opus for simple routing)
- Prompt caching enabled for repeated system prompts
- Batch API used for non-urgent bulk workloads
- Fast mode reserved for latency-critical voice/realtime scenarios
- Token usage logged for cost tracking

## Hooks

- **trigger:** Claude model invocation required
- **pre_gsd:** Validate API key, select optimal model + effort, check rate limits
- **post_gsd:** Log model, effort, tokens consumed, latency

## Limits

- Opus 4.6: 200K context (1M with beta header)
- Sonnet 4.6: 200K context (1M with beta header)
- Rate limits vary by tier (see Anthropic docs)
- Fast mode: research preview, may have availability constraints
