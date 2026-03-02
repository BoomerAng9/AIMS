# Acceptance Criteria — gcp-services

## Service Selection

- [ ] Agent selects the correct GCP service for the task type (Vertex AI for inference, Vision API for image tasks, Cloud Storage for uploads, Cloud Build for CI).
- [ ] No Vertex AI calls are made for tasks that OpenRouter can handle at lower cost.
- [ ] Gemini Flash is used instead of Gemini Pro for Vision API tasks unless Pro-level accuracy is explicitly required.

## Authentication

- [ ] All server-to-server calls use Application Default Credentials (ADC) via `GOOGLE_APPLICATION_CREDENTIALS`.
- [ ] No service account keys are embedded in source code, Docker images, or committed to version control.
- [ ] Cloud Run and Cloud Build tasks use their attached service accounts (no manual key injection).

## Cost Optimization

- [ ] OpenRouter is preferred over Vertex AI for standard LLM inference.
- [ ] Cloud Storage is used only for user-uploaded files and artifact delivery, not ephemeral data.
- [ ] Cloud Build is triggered only on git push to main, not on PRs or manual triggers.
- [ ] GCP budget alerts are configured at 50%, 80%, and 100% thresholds.

## Error Handling

- [ ] Auth failures (`GOOGLE_APPLICATION_CREDENTIALS` missing or invalid) produce a clear error message and do not crash the service.
- [ ] Service selection mismatches are logged for skill improvement.
- [ ] `auth_failure_rate` KPI is tracked and reported.

## Logging & Observability

- [ ] Every GCP call logs the service used, latency, and cost estimate.
- [ ] `service_selection_accuracy` and `cost_per_gcp_call` KPIs are emitted per invocation.
