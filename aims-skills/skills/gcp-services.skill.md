---
id: "gcp-services"
name: "GCP Service Selection"
type: "skill"
status: "active"
triggers:
  - "gcp"
  - "google cloud"
  - "cloud storage"
  - "vision api"
  - "cloud build"
description: "Guides agents on which GCP service to use, authentication patterns, and cost optimization."
execution:
  target: "internal"
  route: ""
dependencies:
  env:
    - "GOOGLE_APPLICATION_CREDENTIALS"
  files:
    - "aims-skills/tools/gcp-cloud.tool.md"
    - "aims-skills/tools/vertex-ai.tool.md"
    - "aims-skills/tools/google-oauth.tool.md"
priority: "medium"
---

# GCP Service Selection Skill

## When This Fires

Triggers when agents need to use GCP services or make decisions about cloud infrastructure.

## Service Selection Guide

| Need | GCP Service | AIMS File |
|------|------------|-----------|
| LLM inference (Claude/Gemini) | Vertex AI | `backend/uef-gateway/src/llm/vertex-ai.ts` |
| Image analysis | Vision API | `backend/acheevy/src/vision/google-vision.ts` |
| File storage | Cloud Storage | `@google-cloud/storage` |
| CI/CD | Cloud Build | `cloudbuild.yaml` |
| User authentication | OAuth 2.0 | `frontend/lib/auth.ts` |

## Auth Pattern

All GCP services use the same service account:
```
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
GOOGLE_CLOUD_PROJECT=ai-managed-services
```

## Cost Rules

1. **Use Vertex AI only when OpenRouter is unavailable** — Vertex AI is billed to GCP project
2. **Prefer Gemini Flash for Vision tasks** — Cheaper than dedicated Vision API for simple cases
3. **Cloud Storage** — Use for user uploads only; don't store temp files
4. **Cloud Build** — Triggered by git push to main, not manual builds
