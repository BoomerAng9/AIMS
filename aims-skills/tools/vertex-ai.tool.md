---
id: "vertex-ai"
name: "Google Vertex AI"
type: "tool"
category: "ai"
provider: "Google Cloud"
description: "GCP-native path for Claude (via Model Garden) and Gemini models with enterprise SLAs."
env_vars:
  - "GOOGLE_CLOUD_PROJECT"
  - "GOOGLE_CLOUD_REGION"
  - "GOOGLE_APPLICATION_CREDENTIALS"
docs_url: "https://cloud.google.com/vertex-ai/docs"
aims_files:
  - "backend/uef-gateway/src/llm/vertex-ai.ts"
---

# Google Vertex AI — AI Model Tool Reference

## Overview

Vertex AI provides GCP-native access to both Anthropic Claude (via Model Garden) and Google Gemini models. This is the enterprise-grade path with GCP SLAs, billing integration, and Workload Identity support. In AIMS it's the first fallback before OpenRouter.

## API Key Setup

| Variable | Required | Where to Get | Default |
|----------|----------|--------------|---------|
| `GOOGLE_CLOUD_PROJECT` | Yes | GCP Console | `ai-managed-services` |
| `GOOGLE_CLOUD_REGION` | Yes | GCP Console | `us-central1` |
| `GOOGLE_APPLICATION_CREDENTIALS` | Yes | GCP IAM > Service Accounts | Path to JSON key file |

**Apply in:** `infra/.env.production`

**Auth options:**
1. Service Account JSON key (set path in `GOOGLE_APPLICATION_CREDENTIALS`)
2. Workload Identity (automatic on GKE/Cloud Run)
3. `gcloud auth application-default login` (development)

## API Reference

### Claude via Model Garden

```
POST https://{REGION}-aiplatform.googleapis.com/v1/projects/{PROJECT}/locations/{REGION}/publishers/anthropic/models/{MODEL}:rawPredict
Authorization: Bearer $(gcloud auth print-access-token)
```

### Gemini via Vertex AI

```
POST https://{REGION}-aiplatform.googleapis.com/v1/projects/{PROJECT}/locations/{REGION}/publishers/google/models/{MODEL}:generateContent
Authorization: Bearer $(gcloud auth print-access-token)
```

## Available Models

### Anthropic (via Model Garden)
| Model | Vertex ID | Input/1M | Output/1M | Context |
|-------|-----------|----------|-----------|---------|
| Claude Opus 4.6 | `claude-opus-4-6@20250514` | $5.00 | $25.00 | 1M |
| Claude Sonnet 4.5 | `claude-sonnet-4-5-v2@20250514` | $3.00 | $15.00 | 1M |
| Claude Haiku 4.5 | `claude-haiku-4-5@20250514` | $0.80 | $4.00 | 200K |

### Google Gemini (native)
| Model | Vertex ID | Input/1M | Output/1M | Context |
|-------|-----------|----------|-----------|---------|
| Gemini 3 Pro | `gemini-2.0-pro` | $1.25 | $10.00 | 1M |
| Gemini 3.0 Flash | `gemini-3.0-flash` | $0.10 | $0.40 | 1M |
| Gemini 2.5 Flash | `gemini-2.5-flash-preview-04-17` | $0.15 | $0.60 | 1M |

## AIMS Fallback Chain
```
Vertex AI (GCP native) → OpenRouter (200+ models) → Stub response
```

Vertex AI is tried first when `GOOGLE_APPLICATION_CREDENTIALS` is set. If it fails (auth error, quota), falls through to OpenRouter.

## AIMS Usage

```typescript
import { vertexChat } from './llm/vertex-ai';

const result = await vertexChat({
  model: 'claude-sonnet-4.5',
  messages: [{ role: 'user', content: 'Hello' }],
});
// Returns same LLMResult interface as OpenRouter
```

## GCP Project Setup

1. Enable Vertex AI API: `gcloud services enable aiplatform.googleapis.com`
2. Enable Model Garden (for Claude): GCP Console > Vertex AI > Model Garden > Anthropic
3. Create service account: `gcloud iam service-accounts create aims-vertex`
4. Grant role: `roles/aiplatform.user`
5. Download key JSON and set `GOOGLE_APPLICATION_CREDENTIALS`

## Troubleshooting

| Issue | Fix |
|-------|-----|
| 403 Permission denied | Check service account has `roles/aiplatform.user` |
| Claude not available | Enable Anthropic in Model Garden for your project |
| Region not supported | Use `us-central1` (widest model availability) |
| Quota exceeded | Request quota increase in GCP Console |
