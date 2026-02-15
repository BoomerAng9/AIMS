# SAM 2 (Segment Anything Model 2) — Vertex AI Deployment Guide

**Service:** Film Room (Gridiron Sandbox)
**Model:** Meta SAM 2 — Hiera Large checkpoint
**Platform:** Google Cloud Vertex AI
**GPU:** NVIDIA Tesla T4 ($0.35/hr)
**Project:** ai-managed-services

---

## Prerequisites

```bash
export PROJECT_ID="ai-managed-services"
export REGION="us-central1"
export REPO_NAME="perform-platform-repo"
export IMAGE_NAME="sam2-video-predictor"
export BUCKET_NAME="perform-model-artifacts"
```

## Phase 1: GCP Setup

```bash
# Create Artifact Registry for Docker image
gcloud artifacts repositories create $REPO_NAME \
    --repository-format=docker \
    --location=$REGION \
    --description="Docker repository for Perform Platform AI models"

# Create GCS Bucket for model weights
gsutil mb -l $REGION gs://$BUCKET_NAME
```

## Phase 2: Container Build

The SAM 2 container lives at `services/gridiron/sam2-deploy/`.

### Files

- `Dockerfile` — PyTorch 2.3.1 + CUDA 12.1 + SAM 2 from Meta's repo
- `requirements.txt` — FastAPI, OpenCV, torch, torchvision
- `main.py` — Prediction server (accepts video URL + click coords)

### Key Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/health` | GET | Health check (reports GPU availability) |
| `/predict` | POST | Video segmentation (accepts instances array) |

### Predict Request

```json
{
  "instances": [{
    "video_url": "https://storage.googleapis.com/.../highlight.mp4",
    "click_coords": [[500, 300]],
    "frame_rate": 30
  }]
}
```

## Phase 3: Build & Deploy

```bash
# Build and push to Artifact Registry
gcloud builds submit --tag $REGION-docker.pkg.dev/$PROJECT_ID/$REPO_NAME/$IMAGE_NAME:latest \
  services/gridiron/sam2-deploy/

# Upload model to Vertex AI
gcloud ai models upload \
  --region=$REGION \
  --display-name="sam2-film-room" \
  --container-image-uri=$REGION-docker.pkg.dev/$PROJECT_ID/$REPO_NAME/$IMAGE_NAME:latest \
  --container-predict-route="/predict" \
  --container-health-route="/health" \
  --container-ports=8080

# Create endpoint
gcloud ai endpoints create \
  --region=$REGION \
  --display-name="perform-film-room-endpoint"

# Deploy (T4 GPU, 1 replica)
gcloud ai endpoints deploy-model $ENDPOINT_ID \
  --region=$REGION \
  --model=$MODEL_ID \
  --display-name="sam2-deployment" \
  --machine-type="n1-standard-4" \
  --accelerator-type="NVIDIA_TESLA_T4" \
  --accelerator-count=1 \
  --min-replica-count=1 \
  --max-replica-count=1
```

## Phase 4: Connect to Film Room

Set the Vertex endpoint ID in your environment:

```bash
export VERTEX_SAM2_ENDPOINT_ID="your-endpoint-id"
```

The Film Room bridge (`services/gridiron/film-room`) will call this endpoint
via the Vertex AI prediction API.

---

*Per|Form Gridiron Sandbox — A.I.M.S.*
