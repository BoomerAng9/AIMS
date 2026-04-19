# Operations Floor Matting — Cloud Run Deployment

**Service:** Stage 7.5 of the 3D Operations Floor pipeline
**Tech:** Python 3.11 + FastAPI + rembg (ONNX) + ffmpeg
**Platform:** Google Cloud Run Service (CPU-only; no GPU required)
**Project:** `foai-aims`

Unblocks AIMS#232 by replacing the `mix-blend-mode: screen` fake alpha in the Compositor with a real character cutout. Runs as a Cloud Run Service that takes the Seedance character MP4 URL and returns a VP9-alpha WebM on GCS that the Remotion scene can composite over the Cosmos environment with honest edge alpha.

## Prerequisites

```bash
export PROJECT_ID="foai-aims"
export REGION="us-central1"
export REPO_NAME="operations-floor-repo"
export IMAGE_NAME="operations-floor-matting"
export SERVICE_NAME="operations-floor-matting"
export BUCKET_NAME="cosmos-operations-floor-artifacts"
```

`foai-aims` (NOT `ai-managed-services` — that project has no billing attached; see AIMS#229 closure notes).

## Phase 1 — GCP setup (reuses Compositor repo + bucket)

```bash
gcloud artifacts repositories describe $REPO_NAME --location=$REGION \
  || gcloud artifacts repositories create $REPO_NAME \
       --repository-format=docker --location=$REGION \
       --project=$PROJECT_ID
```

## Phase 2 — Secret: matting auth token

Public matting endpoint = anyone on the internet burning our CPU and GCS egress. Generate a long random token and store it in Secret Manager:

```bash
# 48 bytes → 64 base64-url chars, plenty for a bearer
python -c "import secrets; print(secrets.token_urlsafe(48))" \
  | gcloud secrets create matting-auth-token --data-file=- --project=$PROJECT_ID
```

Grant the Cloud Run runtime service account read access:

```bash
RUN_SA="$(gcloud run services describe $SERVICE_NAME --region=$REGION --format='value(spec.template.spec.serviceAccountName)' 2>/dev/null || echo $(gcloud config get-value core/account))"

gcloud secrets add-iam-policy-binding matting-auth-token \
  --member="serviceAccount:${RUN_SA}" \
  --role="roles/secretmanager.secretAccessor" \
  --project=$PROJECT_ID
```

## Phase 3 — Build + push

```bash
cd services/operations-floor-matting
gcloud auth configure-docker $REGION-docker.pkg.dev
docker build -t $REGION-docker.pkg.dev/$PROJECT_ID/$REPO_NAME/$IMAGE_NAME:latest .
docker push $REGION-docker.pkg.dev/$PROJECT_ID/$REPO_NAME/$IMAGE_NAME:latest
```

Build ~4 min (model pre-download + wheel compile). Image ~1.4 GB (rembg + ONNX runtime + ffmpeg).

## Phase 4 — Cloud Run deploy

```bash
gcloud run deploy $SERVICE_NAME \
  --project=$PROJECT_ID \
  --region=$REGION \
  --image=$REGION-docker.pkg.dev/$PROJECT_ID/$REPO_NAME/$IMAGE_NAME:latest \
  --platform=managed \
  --cpu=4 \
  --memory=4Gi \
  --concurrency=1 \
  --timeout=900s \
  --min-instances=0 \
  --max-instances=3 \
  --no-allow-unauthenticated \
  --set-env-vars="GCP_PROJECT_ID=$PROJECT_ID,MATTING_MAX_SOURCE_MB=200,MATTING_MAX_FRAMES=600" \
  --set-secrets="MATTING_AUTH_TOKEN=matting-auth-token:latest"
```

- `--concurrency=1` — each request peaks at ~4 GB RAM during frame extraction + matte. Don't multiplex.
- `--timeout=900s` — 6s/24fps = 144 frames × ~1s matte = ~2.5 min worst case, plus download + encode + upload.
- `--no-allow-unauthenticated` — combined with the bearer-token check in `main.py`, this is belt + suspenders: IAM OR token rejects anonymous callers.
- `--max-instances=3` — cap to prevent a runaway compositor from spinning up an unbounded fleet.

## Phase 5 — Wire UEF Gateway

```bash
MATTING_URL=$(gcloud run services describe $SERVICE_NAME --project=$PROJECT_ID --region=$REGION --format='value(status.url)')

# Gateway reads these two envs to dispatch matte calls.
firebase functions:secrets:set OPERATIONS_FLOOR_MATTING_URL
firebase functions:secrets:set OPERATIONS_FLOOR_MATTING_TOKEN
# Paste MATTING_URL and the secret value from Phase 2 when prompted.
```

The compositor client (`backend/uef-gateway/src/operations-floor/matting-client.ts`) reads these.

## Endpoint contract

### `GET /health`

```json
{ "status": "ok", "backend": "rembg:isnet-general-use", "ready": true }
```

Returns `warming` with `ready: false` during the first ~15s of a cold start before `lifespan()` finishes loading the ONNX session.

### `POST /matte`

Authorization: `Bearer ${MATTING_AUTH_TOKEN}`

```json
{
  "source_url": "https://storage.googleapis.com/bucket/character.mp4",
  "output_gcs_uri": "gs://cosmos-operations-floor-artifacts/matte/night-port-v1.webm",
  "source_event_id": "evt-planner-001",
  "empty_matte_threshold": 0.002
}
```

Success:

```json
{
  "output_gcs_uri": "gs://cosmos-operations-floor-artifacts/matte/night-port-v1.webm",
  "duration_s": 6.0,
  "frame_count": 144,
  "size_bytes": 1234567,
  "backend": "rembg:isnet-general-use",
  "source_event_id": "evt-planner-001",
  "avg_foreground_ratio": 0.187
}
```

Failure modes (all surface a distinct HTTP status):

- `401` — missing / bad bearer
- `413` — source > `MATTING_MAX_SOURCE_MB` (default 200 MB) OR frames > `MATTING_MAX_FRAMES` (default 600)
- `422` — `avg_foreground_ratio` below `empty_matte_threshold` (subject likely not detected — failing loud is the point)
- `502` — source fetch HTTP error
- `500` — ffmpeg / rembg / GCS upload error

## Observability

Every successful `/matte` call logs:

```
matte.done event=<id> frames=<n> fg=<ratio> elapsed=<s> size=<bytes>
```

Cloud Logging query:

```
resource.type="cloud_run_revision"
resource.labels.service_name="operations-floor-matting"
jsonPayload.message=~"matte\\.done"
```

## Cost profile

- Cold start: ~12–15s (ONNX model load)
- Warm render (6s @ 24fps, 144 frames): ~90–150s on 4 vCPU
- Cloud Run CPU: 4 vCPU × 2 min × $0.024/vCPU-hr ≈ **$0.003 per 6s clip**
- GCS: negligible for the WebM outputs (~1–3 MB each)

Scales to zero between engagements.

## Teardown

```bash
gcloud run services delete $SERVICE_NAME --region=$REGION --project=$PROJECT_ID
gcloud secrets delete matting-auth-token --project=$PROJECT_ID
```

## Upgrade path: swap rembg → BiRefNet (GPU)

1. Add a `BiRefNetBackend(MattingBackend)` class in `matting_backend.py`.
2. Extend `make_backend()` to honor `MATTING_BACKEND=birefnet`.
3. Rebuild on a `nvidia/cuda:12.4.0-runtime-ubuntu22.04` base image; add `torch` + `safetensors` deps.
4. Deploy to Cloud Run with `--gpu=1 --gpu-type=nvidia-l4 --cpu=4 --memory=16Gi`.
5. Set `MATTING_BACKEND=birefnet` at deploy time.

Callers don't change — the contract is the same.
