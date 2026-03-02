# Acceptance Criteria — kimi-k2.5

## Visual Reasoning

- [ ] Kimi K2.5 is selected only for tasks requiring visual understanding (images, video, UI screenshots, charts).
- [ ] Text-only tasks are never routed to K2.5 — cheaper models are used instead.
- [ ] `visual_reasoning_accuracy` KPI is tracked via downstream validation or human review.

## Agent Swarm Tasks

- [ ] K2.5 structured agentic output is correctly parsed and consumed by downstream agents.
- [ ] Multi-agent task decomposition produces actionable sub-tasks with clear assignments.
- [ ] `agent_task_completion_rate` KPI tracks end-to-end success of swarm tasks initiated by K2.5.

## Video Input

- [ ] Video clips are submitted directly to K2.5 without external frame extraction preprocessing.
- [ ] Temporal events and scene transitions are correctly identified in video analysis output.

## Cost Control

- [ ] `cost_per_inference` is logged for every K2.5 call with token/frame counts.
- [ ] Simple image tasks (labeling, classification) are routed to Gemini Flash or Vision API, not K2.5.
- [ ] K2.5 is not used when a smaller multimodal model can achieve acceptable results.

## Authentication & Access

- [ ] `HF_TOKEN` is configured and valid before K2.5 calls are attempted.
- [ ] Missing or expired `HF_TOKEN` produces a clear error message, not a silent failure.

## License Compliance

- [ ] Modified MIT license terms are respected when redistributing K2.5 model outputs.
- [ ] License attribution is included in any customer-facing exports that use K2.5 output.

## Error Handling

- [ ] Inference timeouts (expected with 1T model) are handled with appropriate timeout values.
- [ ] Malformed image/video inputs are validated before submission to avoid wasted API calls.
- [ ] Rate limit errors trigger retry with exponential backoff.
