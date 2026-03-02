# Acceptance Criteria — openrouter-llm

## Model Selection

- [ ] Task complexity is assessed before model selection — no default to the most powerful model.
- [ ] Model selection matches the task type table (e.g., simple formatting uses Gemini Flash, not Gemini Pro).
- [ ] `model_selection_accuracy` KPI is tracked per invocation.
- [ ] Model IDs are not hardcoded in business logic — routing is dynamic via the selection table.

## Cost Awareness

- [ ] Every LLM call emits `cost_per_task` with model ID, input/output token counts, and estimated USD cost.
- [ ] Token budgets are enforced per task type (summarization: 2K, code gen: 4K, reasoning: 8K).
- [ ] Monthly spend is monitored and non-critical tasks are downgraded when budget thresholds are exceeded.
- [ ] OpenRouter is preferred over direct provider APIs for unified billing.

## Fallback Chain

- [ ] Fallback chain is implemented: Primary (OpenRouter) -> Vertex AI -> OpenRouter fallback model -> Stub.
- [ ] Every fallback activation is logged with original model, failure reason, fallback model, and latency delta.
- [ ] `fallback_activation_rate` KPI is tracked and reported.
- [ ] A single model failure never breaks the entire workflow — graceful degradation is always available.

## API Key Management

- [ ] `OPENROUTER_API_KEY` is validated before any LLM call — missing key throws a clear error.
- [ ] API keys are never hardcoded, logged, or included in error messages.
- [ ] Key rotation is supported without service restart (read from env on each call or use a secret manager).

## Error Handling

- [ ] API errors (429, 500, 502, 503) trigger retry with exponential backoff before falling back.
- [ ] Timeout handling is configured per model (larger models get longer timeouts).
- [ ] Token limit exceeded errors are caught and the request is truncated or split.

## Observability

- [ ] All LLM calls are logged with: model ID, task type, token counts, latency, cost, success/failure.
- [ ] Aggregated cost reports are available for daily/weekly/monthly review.
- [ ] Anomalous spending patterns (e.g., 3x daily average) trigger alerts.
