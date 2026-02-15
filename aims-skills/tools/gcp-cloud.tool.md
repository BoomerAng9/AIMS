---
id: "gcp-cloud"
name: "Google Cloud Platform"
type: "tool"
category: "cloud"
provider: "Google Cloud"
description: "GCP services including Cloud Storage, Vision API, and Cloud Build for AIMS."
env_vars:
  - "GOOGLE_APPLICATION_CREDENTIALS"
  - "GOOGLE_CLOUD_PROJECT"
docs_url: "https://cloud.google.com/docs"
aims_files:
  - "backend/acheevy/src/vision/google-vision.ts"
  - "cloudbuild.yaml"
---

# Google Cloud Platform — Cloud Tool Reference

## Overview

GCP hosts several AIMS services: Vertex AI for LLM inference, Cloud Storage for file uploads, Vision API for image analysis, and Cloud Build for CI/CD. Project ID: `ai-managed-services`.

## API Key Setup

| Variable | Required | Where to Get | Purpose |
|----------|----------|--------------|---------|
| `GOOGLE_APPLICATION_CREDENTIALS` | Yes | GCP Console > IAM | Path to service account JSON |
| `GOOGLE_CLOUD_PROJECT` | Yes | GCP Console | `ai-managed-services` |

**Apply in:** `infra/.env.production`

## Services Used

### Cloud Storage
```typescript
import { Storage } from '@google-cloud/storage';
const storage = new Storage();
const bucket = storage.bucket('aims-uploads');
await bucket.upload(filePath);
```

### Vision API
```typescript
// backend/acheevy/src/vision/google-vision.ts
import vision from '@google-cloud/vision';
const client = new vision.ImageAnnotatorClient();
const [result] = await client.labelDetection(imagePath);
```

### Cloud Build
Config: `cloudbuild.yaml` — Builds Docker images and deploys to GCR.

## GCP Project Setup

```bash
# Set project
gcloud config set project ai-managed-services

# Enable APIs
gcloud services enable aiplatform.googleapis.com
gcloud services enable vision.googleapis.com
gcloud services enable storage.googleapis.com
gcloud services enable cloudbuild.googleapis.com

# Create service account
gcloud iam service-accounts create aims-service \
  --display-name "AIMS Service Account"

# Grant roles
gcloud projects add-iam-policy-binding ai-managed-services \
  --member "serviceAccount:aims-service@ai-managed-services.iam.gserviceaccount.com" \
  --role "roles/aiplatform.user"
```

## Troubleshooting

| Issue | Fix |
|-------|-----|
| 403 Permission denied | Check service account roles |
| Credentials not found | Verify `GOOGLE_APPLICATION_CREDENTIALS` path |
| API not enabled | Run `gcloud services enable <api>` |
