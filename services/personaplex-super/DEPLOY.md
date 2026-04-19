# PersonaPlex Super — GCP Vertex AI Deployment Guide

**Service:** PersonaPlex HEAVY tier — long-running agentic reasoning
**Model:** NVIDIA Nemotron-3-Super (MoE Hybrid Mamba-Transformer)
**Platform:** Google Cloud Vertex AI (custom container endpoint)
**GPU:** L4 for dev · A100 80GB for production
**Project:** `ai-managed-services`
**License:** NVIDIA Open Model License (commercial OK)

Sibling to the existing Nemotron-3-Nano endpoint (`PERSONAPLEX_NANO_ENDPOINT`, sometimes aliased as `PERSONAPLEX_ENDPOINT` for legacy callers). The two-tier router at `backend/uef-gateway/src/personaplex/` picks between them per task shape.

---

## Why two tiers, not a swap

Nemotron-3-Super is optimized for **agentic reasoning** — multi-step plans, adversarial evaluation, sustained deliberation. That's the workload profile for CRUCIBLE, FORGE plan synthesis, aiPLUG autonomous runtimes, TTD-DR research phases, Hermes Deep Think consensus.

Nemotron-3-Nano is the opposite profile — small, fast, cheap, good for short lookups and edge classification. Killing Nano to save one endpoint would regress latency-sensitive paths and balloon edge costs.

Two endpoints, one router, task-shape decides. See `backend/uef-gateway/src/personaplex/index.ts::selectTier` for the exact rules.

## Prerequisites

```bash
export PROJECT_ID="ai-managed-services"
export REGION="us-central1"
export REPO_NAME="personaplex-repo"
export IMAGE_NAME="personaplex-super"
export MODEL_DISPLAY_NAME="personaplex-super-nemotron-3-super"
export ENDPOINT_DISPLAY_NAME="personaplex-super"
```

## Phase 1 — GCP setup (one-time; skip if Nano endpoint already exists)

```bash
gcloud artifacts repositories create $REPO_NAME \
    --repository-format=docker --location=$REGION \
    --description="PersonaPlex Nemotron serving containers (Nano + Super)"
```

## Phase 2 — Container build

Follows the Nemotron NIM serving pattern. Fastest path: use NVIDIA's official Nemotron-Super NIM from NGC when available. Until then, build a thin FastAPI wrapper around the Hugging Face weights matching the existing Nano container's shape.

### Files
- `Dockerfile` — base pytorch + CUDA + Nemotron-3-Super weights
- `main.py` — FastAPI `/health` + `/predict` matching Vertex AI custom-container contract
- `requirements.txt` — FastAPI, uvicorn, torch, transformers, pydantic

### Build + push

```bash
cd services/personaplex-super
docker build -t $REGION-docker.pkg.dev/$PROJECT_ID/$REPO_NAME/$IMAGE_NAME:latest .
docker push $REGION-docker.pkg.dev/$PROJECT_ID/$REPO_NAME/$IMAGE_NAME:latest
```

## Phase 3 — Vertex AI model + endpoint

```bash
gcloud ai models upload \
    --region=$REGION \
    --display-name=$MODEL_DISPLAY_NAME \
    --container-image-uri=$REGION-docker.pkg.dev/$PROJECT_ID/$REPO_NAME/$IMAGE_NAME:latest \
    --container-ports=8080 \
    --container-predict-route=/predict \
    --container-health-route=/health

gcloud ai endpoints create \
    --region=$REGION \
    --display-name=$ENDPOINT_DISPLAY_NAME

ENDPOINT_ID=$(gcloud ai endpoints list --region=$REGION \
    --filter="displayName=$ENDPOINT_DISPLAY_NAME" --format='value(ENDPOINT_ID)')
MODEL_ID=$(gcloud ai models list --region=$REGION \
    --filter="displayName=$MODEL_DISPLAY_NAME" --format='value(MODEL_ID)')

# L4 for dev
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

For production, re-deploy with A100 80GB:
```bash
# --machine-type=a2-highgpu-1g --accelerator=count=1,type=nvidia-tesla-a100
```

## Phase 4 — Wire the router

Set the new env var alongside the existing Nano one:

```bash
export PERSONAPLEX_SUPER_ENDPOINT="projects/$PROJECT_ID/locations/$REGION/endpoints/$ENDPOINT_ID"
# Keep PERSONAPLEX_NANO_ENDPOINT (or legacy PERSONAPLEX_ENDPOINT) as-is
```

The router at `backend/uef-gateway/src/personaplex/index.ts` reads both env vars and dispatches:

```ts
import { endpointForProfile } from '@aims/uef-gateway/personaplex';

// CRUCIBLE Planner → Super
const { tier, endpoint } = endpointForProfile('crucible.planner');
// tier === 'super', endpoint === PERSONAPLEX_SUPER_ENDPOINT

// Light lookup → Nano
const { tier: t2, endpoint: e2 } = endpointForProfile('personaplex.light_lookup');
// t2 === 'nano', e2 === PERSONAPLEX_NANO_ENDPOINT
```

## Endpoint contract (matches Nano tier)

### GET /health

```json
{ "status": "ok", "gpu_available": true, "cuda_version": "12.8", "model_loaded": true, "model_variant": "Nemotron-3-Super" }
```

### POST /predict (Vertex AI custom container)

```json
{
  "instances": [
    {
      "prompt": "...",
      "max_tokens": 2048,
      "temperature": 0.2,
      "top_p": 0.95,
      "stream": false,
      "context_tokens": [...]
    }
  ]
}
```

Response mirrors the Nano endpoint — callers don't need to branch on tier past the router.

## Cost profile

| SKU | Hourly | Notes |
|---|---|---|
| L4 (dev) | ~$0.60/hr | Scale-to-zero. Appropriate for CRUCIBLE / TTD-DR dev runs. |
| A100 80GB (prod) | ~$3.67/hr | Use when Super is in the hot path for autonomous runtimes. |

**Scale-to-zero is mandatory during development** — Super workloads are bursty (CRUCIBLE cycles, TTD-DR phases) not steady-state.

## Gate for going live

- [ ] Container builds + pushes to Artifact Registry
- [ ] Vertex model uploads + endpoint creates + L4 deploy succeeds
- [ ] `/health` reports `gpu_available: true` + `model_variant: Nemotron-3-Super`
- [ ] One `/predict` call with a 10-turn reasoning fixture returns a coherent response
- [ ] `PERSONAPLEX_SUPER_ENDPOINT` set on every consuming service (UEF Gateway, Hermes, aiPLUG runtimes)
- [ ] `endpointForProfile('crucible.planner')` returns the Super endpoint in prod
- [ ] At least one live CRUCIBLE Planner call routes to Super and logs latency + cost

## Teardown (when needed)

```bash
# Stop GPU billing
gcloud ai endpoints undeploy-model $ENDPOINT_ID --region=$REGION --deployed-model-id=$DEPLOYED_MODEL_ID
gcloud ai endpoints delete $ENDPOINT_ID --region=$REGION
gcloud ai models delete $MODEL_ID --region=$REGION
```

## Related

- Router + profile catalog: `backend/uef-gateway/src/personaplex/index.ts`
- Tests (24/24): `backend/uef-gateway/src/__tests__/personaplex-router.test.ts`
- Nano tier DEPLOY: existing `services/personaplex/` (or aims-core/CLAUDE.md deployment pipeline section)
- Memory lock: `feedback_nemotron_super_two_tier_alignment`
