# Acceptance Criteria — glm-5

## Model Routing

- [ ] GLM-5 is selected for budget frontier reasoning tasks where cost optimization is a priority.
- [ ] Tasks exceeding 128K tokens are routed to a model with a larger context window (e.g., Gemini 3.1 Pro).
- [ ] GLM-5 is not used for multimodal tasks (images, audio) — text-only routing enforced.
- [ ] `routing_accuracy` KPI is tracked per invocation.

## Cost Optimization

- [ ] `cost_per_task` is logged for every GLM-5 call with input/output token counts.
- [ ] GLM-5 is preferred over GPT-4o for cost-sensitive tasks of comparable complexity.
- [ ] Total GLM-5 spend is monitored against monthly budget thresholds.

## Quality & Safety

- [ ] `hallucination_rate` is tracked via downstream validation or user feedback.
- [ ] Safety-critical decisions are not solely dependent on GLM-5 output — a secondary verification model is used.
- [ ] Outputs intended for customer-facing use leverage the MIT license for redistribution clarity.

## Fallback Behavior

- [ ] GLM-5 serves as a fallback when Gemini 3.1 Pro or Claude 4.6 are rate-limited or unavailable.
- [ ] Fallback activations are logged with reason (rate limit, timeout, error).
- [ ] Fallback chain order is documented: Primary model -> GLM-5 -> stub response.

## Error Handling

- [ ] Missing `OPENROUTER_API_KEY` produces a clear error message.
- [ ] API errors (429, 500, 503) trigger retry with exponential backoff.
- [ ] Context window overflow is detected before API call and handled gracefully.
