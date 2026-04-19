# Cosmos-Transfer2.5 — GCP Vertex AI Deployment Guide

**Service:** Operations Floor — Stage 5 photoreal environment render
**Model:** NVIDIA Cosmos-Transfer2.5 (Sim-to-Real world foundation model)
**Platform:** Google Cloud Vertex AI (custom container endpoint)
**GPU:** L4 for dev ($0.60/hr), A100 80GB for prod ($3.67/hr)
**Project:** `ai-managed-services`
**License:** Apache 2.0 (code) + NVIDIA Open Model License (weights)

Mirrors the SAM2 deployment pattern at `services/gridiron/SAM2_DEPLOY.md`.

---

## Prerequisites

```bash
export PROJECT_ID="ai-managed-services"
export REGION="us-central1"
export REPO_NAME="cosmos-transfer-repo"
export IMAGE_NAME="cosmos-transfer25"
export BUCKET_NAME="cosmos-operations-floor-artifacts"
export MODEL_DISPLAY_NAME="cosmos-transfer25-v1"
export ENDPOINT_DISPLAY_NAME="operations-floor-cosmos-transfer25"
```

Authorization required:
- `gcloud auth login`
- Project `ai-managed-services` accessible
- Artifact Registry Admin, Storage Admin, Vertex AI Admin roles on the deploying principal

## Phase 1: GCP setup (one-time)

```bash
# Artifact Registry for the container
gcloud artifacts repositories create $REPO_NAME \
    --repository-format=docker \
    --location=$REGION \
    --description="Cosmos-Transfer2.5 NIM wrapper for 3D Operations Floor"

# GCS bucket for input videos + output photoreal renders
gsutil mb -l $REGION gs://$BUCKET_NAME

# IAM: grant Vertex AI service agent read access to the bucket
gsutil iam ch \
    serviceAccount:service-$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')@gcp-sa-aiplatform.iam.gserviceaccount.com:objectViewer \
    gs://$BUCKET_NAME
```

## Phase 2: Container build

The Cosmos wrapper lives at `services/operations-floor-cosmos/`.

### Files

- `Dockerfile` — PyTorch 2.3.1 + CUDA 12.8.1 + FFmpeg + Cosmos-Transfer2.5 from NVIDIA's Apache-2 source
- `requirements.txt` — FastAPI, OpenCV, torch, torchvision, pillow, google-cloud-storage
- `main.py` — FastAPI prediction server (Vertex AI custom container contract)
- `cosmos_runner.py` — wraps the Cosmos-Transfer2.5 inference CLI

### Build + push

```bash
cd services/operations-floor-cosmos

# Build locally (first build is ~30min — downloads PyTorch + CUDA + Cosmos weights)
docker build -t $REGION-docker.pkg.dev/$PROJECT_ID/$REPO_NAME/$IMAGE_NAME:latest .

# Push to Artifact Registry
gcloud auth configure-docker $REGION-docker.pkg.dev
docker push $REGION-docker.pkg.dev/$PROJECT_ID/$REPO_NAME/$IMAGE_NAME:latest
```

## Phase 3: Vertex AI model + endpoint

```bash
# Upload the container as a Vertex model
gcloud ai models upload \
    --region=$REGION \
    --display-name=$MODEL_DISPLAY_NAME \
    --container-image-uri=$REGION-docker.pkg.dev/$PROJECT_ID/$REPO_NAME/$IMAGE_NAME:latest \
    --container-ports=8080 \
    --container-predict-route=/predict \
    --container-health-route=/health

# Create the endpoint
gcloud ai endpoints create \
    --region=$REGION \
    --display-name=$ENDPOINT_DISPLAY_NAME

ENDPOINT_ID=$(gcloud ai endpoints list --region=$REGION \
    --filter="displayName=$ENDPOINT_DISPLAY_NAME" --format='value(ENDPOINT_ID)')
MODEL_ID=$(gcloud ai models list --region=$REGION \
    --filter="displayName=$MODEL_DISPLAY_NAME" --format='value(MODEL_ID)')

# Deploy the model to the endpoint with L4 GPU (dev tier)
gcloud ai endpoints deploy-model $ENDPOINT_ID \
    --region=$REGION \
    --model=$MODEL_ID \
    --display-name=$MODEL_DISPLAY_NAME-l4 \
    --machine-type=g2-standard-4 \
    --accelerator=count=1,type=nvidia-l4 \
    --min-replica-count=0 \
    --max-replica-count=1 \
    --traffic-split=0=100
```

For production scale up:

```bash
# Replace --machine-type + --accelerator with A100 80GB
# gcloud ai endpoints deploy-model ... \
#     --machine-type=a2-highgpu-1g \
#     --accelerator=count=1,type=nvidia-tesla-a100
```

## Phase 4: Wire UEF Gateway

After deployment, capture the endpoint ID:

```bash
echo "COSMOS_TRANSFER25_ENDPOINT_ID=$ENDPOINT_ID" >> ~/.env.operations-floor
```

Set the env var on the UEF Gateway (container, VPS, or Cloud Run instance):

```bash
# Used by backend/uef-gateway/src/operations-floor/cosmos-client.ts
export COSMOS_TRANSFER25_ENDPOINT_ID="projects/.../locations/us-central1/endpoints/..."
export GCP_PROJECT_ID="ai-managed-services"
export GCP_REGION="us-central1"
```

## Endpoint contract

### `/health` — GET

Returns `200 OK` with JSON:

```json
{
  "status": "ok",
  "gpu_available": true,
  "cuda_version": "12.8.1",
  "cosmos_version": "transfer2.5-v1",
  "model_loaded": true
}
```

### `/predict` — POST (Vertex AI custom container contract)

Request:

```json
{
  "instances": [
    {
      "video_gcs_uri": "gs://cosmos-operations-floor-artifacts/inputs/proxy-video.mp4",
      "prompt": "Cinematic wide shot of a futuristic night port...",
      "negative_prompt": "humans, people, characters, text, logos, ...",
      "multicontrol_spec": {
        "depth": { "enabled": true, "strength": 0.85, "source_gcs_uri": "gs://.../depth.exr" },
        "edge":  { "enabled": true, "strength": 0.70, "source_gcs_uri": "gs://.../canny/" }
      },
      "inference": {
        "guidance": 3.0,
        "steps": 30,
        "seed": 2604180001
      },
      "output_gcs_prefix": "gs://cosmos-operations-floor-artifacts/outputs/night-port-v1/"
    }
  ]
}
```

Response:

```json
{
  "predictions": [
    {
      "output_video_gcs_uri": "gs://.../outputs/night-port-v1/render.mp4",
      "frame_count": 144,
      "duration_s": 6.0,
      "inference_latency_s": 42.7,
      "gpu_seconds_used": 42.7,
      "seed": 2604180001,
      "model": "cosmos-transfer25-v1"
    }
  ],
  "deployedModelId": "..."
}
```

## Cost model

| SKU | Hourly | Notes |
|---|---|---|
| L4 (dev) | ~$0.60/hr | g2-standard-4 machine. Min replicas 0 (scale-to-zero). Fine for dry-run benchmarking. |
| A100 80GB (prod) | ~$3.67/hr | a2-highgpu-1g machine. Use once pilot loop is green. |
| Artifact Registry storage | ~$0.10/GB-month | Container image is ~15GB (PyTorch + CUDA + Cosmos weights) |
| GCS storage | ~$0.02/GB-month | Input proxy video + output photoreal = ~200MB per render |
| Egress | standard GCP | Keep UEF Gateway and Vertex in the same region |

**Per-render cost (L4, dry-run):** ~$0.007 for 6s output (42s inference × $0.60/3600).
**Per-render cost (A100, prod):** ~$0.043 for 6s output (42s inference × $3.67/3600 — estimated, benchmark at Gate 2.c.3).

## Teardown

```bash
# Undeploy the model (stops billing GPU)
gcloud ai endpoints undeploy-model $ENDPOINT_ID --region=$REGION \
    --deployed-model-id=$DEPLOYED_MODEL_ID

# Delete the endpoint
gcloud ai endpoints delete $ENDPOINT_ID --region=$REGION

# Delete the model
gcloud ai models delete $MODEL_ID --region=$REGION
```

**IMPORTANT:** `undeploy-model` stops the GPU billing. `endpoints delete` alone does not — always undeploy first.

## Verification

After deploy:

```bash
# Health check (no GPU spend — endpoint-level check)
gcloud ai endpoints invoke-custom-command $ENDPOINT_ID \
    --region=$REGION --http-method=GET --path=/health

# Run one inference against the Night Port fixture
# (Upload proxy-video.mp4 + depth.exr + canny/ to GCS first)
gcloud ai endpoints predict $ENDPOINT_ID \
    --region=$REGION \
    --json-request=test-fixtures/night-port-predict-request.json
```

Expected: JSON response with `output_video_gcs_uri` and `inference_latency_s` logged.

## Gate 2.c exit criteria

- [ ] Container builds locally without errors
- [ ] Image pushes to Artifact Registry
- [ ] Vertex AI Model uploads + endpoint creates
- [ ] Model deploys to endpoint with L4 GPU
- [ ] `/health` returns `gpu_available: true` + `model_loaded: true`
- [ ] One inference call against the Night Port fixture returns a watchable MP4 in GCS
- [ ] `cosmos-client.ts` in UEF Gateway successfully calls the endpoint end-to-end

Gate 2.c is green when all seven pass. Then move to Gate 2.d (Seedance i2v for character motion).

## Related

- `backend/uef-gateway/src/operations-floor/cosmos-client.ts` — TS client
- `backend/uef-gateway/fixtures/operations-floor/night-port/` — test fixture
- `aims-skills/skills/live-look-in/references/gate-1.6-pipeline-audit.md` — E5 edge this service serves
- `aims-skills/skills/live-look-in/references/gate-2-kickoff.md` — Gate 2 scope
