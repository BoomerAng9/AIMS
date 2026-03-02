# Claude 4.6 — Acceptance Criteria

## Functional Requirements

1. **Model routing**: Tasks routed to correct model variant based on complexity
2. **Adaptive thinking**: All 4.6 models use `thinking: {type: "adaptive"}`, never `budget_tokens`
3. **Effort selection**: Effort level matches task complexity (low→routing, medium→general, high→analysis, max→hardest)
4. **Fast mode**: Only used for latency-critical voice/realtime scenarios, never batch
5. **Caching**: Prompt caching enabled for repeated system prompts (90% savings)
6. **Batch API**: Non-urgent bulk workloads use batch API (50% savings)
7. **No prefill**: Assistant message prefill not used on Opus 4.6 (400 error)

## Non-Functional Requirements

1. **Cost efficiency**: Model selection optimizes cost-to-quality ratio per task
2. **Logging**: Every invocation logs model, effort, tokens, latency
3. **Rate compliance**: Stay within API rate limits per tier

## Model Selection Matrix

| Task Type | Model | Effort | Features |
|-----------|-------|--------|----------|
| Core orchestration | Opus 4.6 | high/max | Adaptive thinking |
| Code review / debugging | Sonnet 4.6 | medium | Adaptive thinking |
| Classification / routing | Haiku 4.5 | low | Standard |
| Voice / realtime | Opus 4.6 | high | Fast mode |
| Bulk content (overnight) | Sonnet 4.6 | medium | Batch API |
| Security audit | Opus 4.6 | max | Adaptive thinking |
| UI testing | Sonnet 4.6 | medium | Computer use |
