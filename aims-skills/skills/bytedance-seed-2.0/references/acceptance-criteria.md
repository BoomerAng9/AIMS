# Acceptance Criteria — bytedance-seed-2.0

## Functional Requirements

### FR-1: Model Routing
- [ ] Default task routing sends non-specialized tasks to Seed 2.0 LLM
- [ ] Escalation path works: Seed -> Claude Sonnet -> Claude Opus on low-confidence output
- [ ] Video generation tasks route to Seaweed
- [ ] TTS tasks route to Seed-TTS
- [ ] Music generation tasks route to Seed Music
- [ ] Tasks exceeding 128K tokens route to a model with larger context window

### FR-2: API Integration
- [ ] Volcano Engine API calls go through the UEF Gateway model router
- [ ] `VOLCANO_ENGINE_API_KEY` env var is read by UEF Gateway
- [ ] Response format is normalized to the unified response schema regardless of model
- [ ] Rate limits are enforced (100 RPM for LLM, 10 concurrent for video)

### FR-3: Cost Controls
- [ ] LUC billing engine meters all Seed API calls
- [ ] Cost-per-task metrics are emitted for every API call
- [ ] Budget alerts fire when Seed spending exceeds configured thresholds

### FR-4: Safety Gates
- [ ] Safety-critical decisions (Chicken Hawk compliance, deploy auth) never route to Seed
- [ ] ORACLE gates are applied to all Seed outputs in production pipelines
- [ ] Seed outputs in FDH Develop phase are verified before progressing to Hone

## Non-Functional Requirements

### NFR-1: Performance
- [ ] Seed LLM response latency is under 5 seconds for typical tasks (< 4K tokens)
- [ ] Video generation returns a status URL within 10 seconds (async completion)

### NFR-2: Reliability
- [ ] If Volcano Engine API is down, model router falls back to next available model
- [ ] API errors are retried up to 3 times with exponential backoff
- [ ] Timeout is enforced at 60 seconds per LLM call, 300 seconds per video job

### NFR-3: Security
- [ ] Volcano Engine API key is never exposed to the client side
- [ ] API calls are authenticated and encrypted (HTTPS only)

### NFR-4: Observability
- [ ] Every model routing decision is logged with reasoning
- [ ] Cost, latency, and success/failure metrics are emitted per call
- [ ] Model routing accuracy KPI is tracked and reportable
