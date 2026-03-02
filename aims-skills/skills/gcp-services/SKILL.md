---
name: gcp-services
description: |
  GCP Service Selection guide for A.I.M.S. agents.
  Use when: an agent needs to call a GCP service, authenticate with Google Cloud,
  select between Vertex AI / Vision API / Cloud Storage / Cloud Build, or optimize
  GCP spend.
role: Specialist Executor
intent: Guide agents on which GCP service to use, authentication patterns, and cost optimization.
kpis:
  - service_selection_accuracy
  - cost_per_gcp_call
  - auth_failure_rate
status: active
priority: medium
triggers:
  - gcp
  - google cloud
  - cloud storage
  - vision api
  - cloud build
execution: sequential — identify service need → select service → authenticate → execute → log cost
dependencies:
  - GOOGLE_APPLICATION_CREDENTIALS
  - gcp-cloud.tool.md
  - vertex-ai.tool.md
  - google-oauth.tool.md
---

# GCP Service Selection

This skill provides the canonical reference for choosing, authenticating, and cost-optimizing
Google Cloud Platform services within the A.I.M.S. platform.

## Service Selection Guide

| Service | When to Use | Auth Method | Cost Tier |
|---|---|---|---|
| **Vertex AI** | Model serving, fine-tuning, GPU inference (PersonaPlex) | Service Account (ADC) | High |
| **Vision API** | Image labeling, OCR, safe-search moderation | Service Account (ADC) | Medium |
| **Cloud Storage** | User-uploaded files, artifact delivery, evidence locker blobs | Service Account (ADC) | Low |
| **Cloud Build** | CI/CD image builds triggered on git push to main | Service Account (Cloud Build SA) | Low |
| **OAuth 2.0** | End-user authentication, Google Sign-In | OAuth Client ID + Secret | Free |

## Authentication Pattern

All server-to-server calls MUST use Application Default Credentials (ADC):

```bash
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account-key.json"
```

- Never embed service account keys in code or Docker images.
- In Cloud Run / Cloud Build, ADC is automatic via the attached service account.
- On VPS, mount the key file and set the env var in `docker-compose.prod.yml`.

## Cost Optimization Rules

1. **Prefer OpenRouter over Vertex AI** for LLM inference unless the task explicitly requires
   a Vertex-hosted model (e.g., PersonaPlex / Nemotron).
2. **Use Gemini Flash for Vision tasks** — cheaper than the full Gemini Pro model and sufficient
   for image labeling, OCR, and moderation.
3. **Cloud Storage for user uploads only** — do not use GCS as a general-purpose file store.
   Use the VPS filesystem or Redis for ephemeral data.
4. **Cloud Build triggers on git push only** — never trigger builds manually or on PR events.
   Manual builds waste quota.
5. **Monitor billing alerts** — set up GCP budget alerts at 50%, 80%, and 100% of monthly budget.

## Anti-Patterns

- Calling Vertex AI for simple text generation that OpenRouter can handle at 10x lower cost.
- Storing temporary build artifacts in Cloud Storage instead of using Cloud Build cache.
- Using Vision API for tasks that Gemini Flash multimodal can handle natively.
- Hardcoding project IDs or service account emails in application code.
