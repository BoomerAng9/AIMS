# Operations Floor Compositor — Cloud Run Deployment

**Service:** Stage 8 + Stage 9 of the 3D Operations Floor pipeline
**Tech:** Node 20 + Remotion 4 + Chromium headless + FFmpeg
**Platform:** Google Cloud Run Service (CPU-bound, no GPU needed)
**Project:** `ai-managed-services`

Runs as a Cloud Run Service (NOT a Job) — renders are sub-minute stateless, scale-to-zero fits the workload. Unlike the Cosmos service, this one does **not** need GPU; Remotion's Chromium rendering is CPU-bound.

---

## Prerequisites

```bash
export PROJECT_ID="ai-managed-services"
export REGION="us-central1"
export REPO_NAME="operations-floor-repo"
export IMAGE_NAME="operations-floor-compositor"
export SERVICE_NAME="operations-floor-compositor"
export BUCKET_NAME="cosmos-operations-floor-artifacts"
```

## Phase 1 — GCP setup (one-time; reuses Cosmos bucket)

```bash
# Artifact Registry (shared with the Cosmos NIM image)
gcloud artifacts repositories describe $REPO_NAME --location=$REGION \
    || gcloud artifacts repositories create $REPO_NAME \
        --repository-format=docker --location=$REGION

# GCS bucket already exists from the Cosmos setup (same bucket used
# for both environment MP4s and composited outputs)
```

## Phase 2 — Build + push

```bash
cd services/operations-floor-compositor
docker build -t $REGION-docker.pkg.dev/$PROJECT_ID/$REPO_NAME/$IMAGE_NAME:latest .
gcloud auth configure-docker $REGION-docker.pkg.dev
docker push $REGION-docker.pkg.dev/$PROJECT_ID/$REPO_NAME/$IMAGE_NAME:latest
```

Build time: ~5 min (Chromium + Remotion bundles). Image size: ~800 MB.

## Phase 3 — Cloud Run Service

```bash
gcloud run deploy $SERVICE_NAME \
    --region=$REGION \
    --image=$REGION-docker.pkg.dev/$PROJECT_ID/$REPO_NAME/$IMAGE_NAME:latest \
    --platform=managed \
    --allow-unauthenticated \
    --cpu=4 \
    --memory=4Gi \
    --concurrency=1 \
    --timeout=600s \
    --min-instances=0 \
    --max-instances=3 \
    --set-env-vars=GCP_PROJECT_ID=$PROJECT_ID
```

**Concurrency = 1** — each Remotion render consumes full Chromium process memory; don't multiplex. Scale horizontally via `max-instances` instead.

**Timeout = 600s (10 min)** — well above actual render times (sub-60s for 6s @ 24fps), leaves headroom for cold-start bundle compile.

## Phase 4 — Wire UEF Gateway

Capture the service URL and set the env var:

```bash
COMPOSITOR_URL=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format='value(status.url)')
export OPERATIONS_FLOOR_COMPOSITOR_URL=$COMPOSITOR_URL
```

The UEF Gateway's `operations-floor/compositor-client.ts` reads this env var to dispatch compose requests.

## Endpoint contract

### `GET /health`

```json
{
  "status": "ok",
  "service": "operations-floor-compositor",
  "stage": "8+9",
  "project": "ai-managed-services",
  "node": "v20.x.x"
}
```

### `POST /compose`

```json
{
  "environmentVideoUrl": "https://storage.googleapis.com/.../cosmos-render.mp4",
  "characterCutoutUrl":  "https://storage.googleapis.com/.../character-matte.webm",
  "durationSeconds": 6,
  "fps": 24,
  "characterStartFrame": 0,
  "characterPositioning": {
    "anchorX": 0.5,
    "anchorY": 0.95,
    "scale": 0.72,
    "fadeInFrames": 12
  },
  "endLockupText": "ACHEEVY · DISPATCHING",
  "outputGcsPrefix": "gs://cosmos-operations-floor-artifacts/outputs/night-port-composed/",
  "sourceEventId": "evt-planner-001"
}
```

Response:

```json
{
  "output_video_gcs_uri": "gs://cosmos-operations-floor-artifacts/outputs/night-port-composed/composed.mp4",
  "duration_s": 6,
  "frame_count": 144,
  "size_bytes": 8421337,
  "source_event_id": "evt-planner-001"
}
```

## Cost profile

| SKU | Cost | Per 6s render |
|---|---|---|
| CPU (Cloud Run) | ~$0.024/vCPU-hr at 4 vCPUs = ~$0.096/hr | ~$0.0015 (55s render) |
| Memory | ~$0.0025/GB-hr × 4GB = ~$0.01/hr | ~$0.00015 |
| GCS egress (inbound video pulls) | ~$0.02/GB | negligible for 2x50MB inputs |
| **Total per render** | | **~$0.002** |

Scale-to-zero when idle. Cold-start of a fresh instance: ~15s (npm bundle load + first Chromium launch). Warm-start: ~500ms.

## Alpha / matting

Character cutout is expected to be produced by the `operations-floor-matting` service (Stage 7.5) — a VP9-alpha WebM with honest per-pixel alpha. Remotion's `<Video>` composites the alpha directly; there is no `mix-blend-mode` or colorkey step. Orchestrator flow:

```
Seedance character MP4
  → POST /matte (operations-floor-matting)
     → matted WebM in GCS
       → POST /compose (this service) with characterCutoutUrl
         → composed MP4 in GCS
```

If a caller passes a non-alpha clip as `characterCutoutUrl`, the scene still renders but edges will look wrong. That's a caller bug, not a scene bug — route through the matting service first.

## Gate 2.e exit criteria

- [ ] Container builds locally
- [ ] Image pushes to Artifact Registry
- [ ] Cloud Run Service deploys
- [ ] `/health` returns `status: "ok"`
- [ ] One `/compose` call with the Night Port fixture + a canned Seedance Port_Ang clip produces a watchable composited MP4 in GCS
- [ ] `compositor-client.ts` in UEF Gateway successfully calls the service end-to-end

## Teardown

```bash
gcloud run services delete $SERVICE_NAME --region=$REGION
```

No GPU to undeploy first — simpler than Cosmos/Vertex teardown.

## Related

- `backend/uef-gateway/src/operations-floor/compositor-client.ts` — TS client
- Stage 5 (Cosmos): `services/operations-floor-cosmos/` (parallel input)
- Stage 6 (Seedance): `backend/uef-gateway/src/operations-floor/seedance-client.ts` (parallel input)
- Pipeline audit: `aims-skills/skills/live-look-in/references/gate-1.6-pipeline-audit.md`
