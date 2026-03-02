# Acceptance Criteria — gemini-3.1-pro

## Model Selection

- [ ] Gemini 3.1 Pro is selected only for tasks that match its strength profile (deep reasoning, long context, multimodal, code generation).
- [ ] Simpler tasks are routed to cheaper models (GLM-5, Gemini Flash) rather than defaulting to Pro.
- [ ] `model_selection_accuracy` KPI is tracked per invocation.

## Thinking Level

- [ ] Every Gemini 3.1 Pro call explicitly sets a thinking level (`none`, `low`, `medium`, or `high`).
- [ ] `none`/`low` is used for retrieval, formatting, and translation tasks.
- [ ] `medium` is used for code generation, analysis, and multi-step reasoning.
- [ ] `high` is used only for architecture design, complex math, and multi-constraint optimization.
- [ ] `thinking_level_hit_rate` KPI confirms correct level selection vs. task complexity.

## Cost Control

- [ ] OpenRouter is the default provider for Gemini 3.1 Pro calls.
- [ ] Vertex AI is used only when Vertex-specific features (grounding, tuned models) are required.
- [ ] `cost_per_task` KPI is emitted per invocation with thinking token breakdown.
- [ ] No unmonitored `high` thinking calls — each must be justified by task complexity.

## Fallback Chain

- [ ] If Gemini 3.1 Pro is unavailable on OpenRouter, fallback to Claude 4.6 Sonnet.
- [ ] If Claude 4.6 Sonnet is unavailable, fallback to GLM-5.
- [ ] Fallback activations are logged and counted in `fallback_activation_rate`.

## Feature Flags

- [ ] Multimodal inputs (images, audio) use the correct endpoint and pricing tier.
- [ ] Context window usage is monitored — documents exceeding 1.5M tokens are split before submission.
- [ ] Thinking mode responses include thought signature parsing for observability.

## Error Handling

- [ ] API errors (429, 500, 503) trigger automatic retry with exponential backoff.
- [ ] Invalid thinking level values are caught before API call and logged.
- [ ] Missing `OPENROUTER_API_KEY` produces a clear error, not a silent failure.
