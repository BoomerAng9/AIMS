"""
Cosmos-Transfer2.5 — Vertex AI Prediction Server
=================================================
FastAPI wrapper that matches Vertex AI's custom-container prediction
contract: GET /health + POST /predict accepting {"instances": [...]}.

Each instance is a Cosmos-Transfer2.5 render request:
  - video_gcs_uri        (proxy video Cosmos enhances)
  - prompt               (text guidance)
  - negative_prompt
  - multicontrol_spec    (depth / edge / seg / blur settings)
  - inference            (guidance, steps, seed)
  - output_gcs_prefix    (where the rendered MP4 lands)

Downloads inputs from GCS, invokes cosmos_runner.run_inference, uploads
outputs to GCS, returns prediction metadata.

Deployed to Vertex AI per services/operations-floor-cosmos/DEPLOY.md.
"""

from __future__ import annotations

import logging
import os
import tempfile
import time
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException
from google.cloud import storage
from pydantic import BaseModel, Field

from cosmos_runner import run_inference, CosmosRuntimeError, cosmos_version_info

# ─── Logging ─────────────────────────────────────────────────────────

logging.basicConfig(
    level=os.environ.get("LOG_LEVEL", "INFO"),
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)
log = logging.getLogger("cosmos-transfer25")

# ─── FastAPI app ─────────────────────────────────────────────────────

app = FastAPI(
    title="Cosmos-Transfer2.5 Prediction Server",
    description="Vertex AI custom container for the 3D Operations Floor",
    version="1.0.0",
)

_gcs: storage.Client | None = None


def gcs_client() -> storage.Client:
    global _gcs
    if _gcs is None:
        _gcs = storage.Client()
    return _gcs


# ─── Pydantic request/response shapes ────────────────────────────────


class ControlSpec(BaseModel):
    enabled: bool = False
    strength: float = 0.0
    source_gcs_uri: str | None = None
    canny_low_threshold: int | None = None
    canny_high_threshold: int | None = None


class MulticontrolSpec(BaseModel):
    depth: ControlSpec = Field(default_factory=ControlSpec)
    edge: ControlSpec = Field(default_factory=ControlSpec)
    segmentation: ControlSpec = Field(default_factory=ControlSpec)
    blur: ControlSpec = Field(default_factory=ControlSpec)


class InferenceSettings(BaseModel):
    guidance: float = 3.0
    steps: int = 30
    seed: int = 0


class PredictInstance(BaseModel):
    video_gcs_uri: str
    prompt: str
    negative_prompt: str = ""
    multicontrol_spec: MulticontrolSpec = Field(default_factory=MulticontrolSpec)
    inference: InferenceSettings = Field(default_factory=InferenceSettings)
    output_gcs_prefix: str


class PredictRequest(BaseModel):
    instances: list[PredictInstance]


class PredictionResult(BaseModel):
    output_video_gcs_uri: str
    frame_count: int
    duration_s: float
    inference_latency_s: float
    gpu_seconds_used: float
    seed: int
    model: str


class PredictResponse(BaseModel):
    predictions: list[PredictionResult]
    deployedModelId: str | None = None


# ─── Health ──────────────────────────────────────────────────────────


@app.get("/health")
def health() -> dict[str, Any]:
    """Liveness + readiness. Called periodically by Vertex AI."""
    info = cosmos_version_info()
    return {
        "status": "ok",
        "gpu_available": info["gpu_available"],
        "cuda_version": info["cuda_version"],
        "cosmos_version": info["cosmos_version"],
        "model_loaded": info["model_loaded"],
    }


# ─── Predict ─────────────────────────────────────────────────────────


@app.post("/predict", response_model=PredictResponse)
def predict(req: PredictRequest) -> PredictResponse:
    if not req.instances:
        raise HTTPException(status_code=400, detail="instances is empty")

    results: list[PredictionResult] = []
    for inst in req.instances:
        results.append(_run_one(inst))

    return PredictResponse(
        predictions=results,
        deployedModelId=os.environ.get("DEPLOYED_MODEL_ID"),
    )


def _run_one(inst: PredictInstance) -> PredictionResult:
    t0 = time.monotonic()

    with tempfile.TemporaryDirectory(prefix="cosmos_") as tmpdir:
        tmp = Path(tmpdir)

        # Stage inputs locally
        video_path = _download(inst.video_gcs_uri, tmp / "proxy-video.mp4")
        control_paths: dict[str, Path] = {}
        for name in ("depth", "edge", "segmentation", "blur"):
            spec: ControlSpec = getattr(inst.multicontrol_spec, name)
            if spec.enabled and spec.source_gcs_uri:
                control_paths[name] = _download(
                    spec.source_gcs_uri, tmp / name
                )

        # Run Cosmos
        try:
            output_local = run_inference(
                video_path=video_path,
                prompt=inst.prompt,
                negative_prompt=inst.negative_prompt,
                multicontrol={
                    name: {
                        "enabled": getattr(
                            inst.multicontrol_spec, name
                        ).enabled,
                        "strength": getattr(
                            inst.multicontrol_spec, name
                        ).strength,
                        "source_path": str(control_paths[name])
                        if name in control_paths
                        else None,
                    }
                    for name in ("depth", "edge", "segmentation", "blur")
                },
                guidance=inst.inference.guidance,
                steps=inst.inference.steps,
                seed=inst.inference.seed,
                output_dir=tmp / "out",
            )
        except CosmosRuntimeError as e:
            log.exception("cosmos failure")
            raise HTTPException(status_code=500, detail=f"cosmos error: {e}")

        # Upload result
        out_uri = _upload(output_local, inst.output_gcs_prefix)

    latency = time.monotonic() - t0
    return PredictionResult(
        output_video_gcs_uri=out_uri,
        frame_count=_probe_frames(video_path) if video_path.exists() else 0,
        duration_s=_probe_duration(video_path)
        if video_path.exists()
        else 0.0,
        inference_latency_s=latency,
        gpu_seconds_used=latency,  # close-enough approximation
        seed=inst.inference.seed,
        model=os.environ.get("COSMOS_MODEL_VARIANT", "transfer2.5"),
    )


# ─── GCS helpers ─────────────────────────────────────────────────────


def _parse_gcs(uri: str) -> tuple[str, str]:
    if not uri.startswith("gs://"):
        raise ValueError(f"not a gs:// URI: {uri}")
    stripped = uri[len("gs://") :]
    bucket, _, key = stripped.partition("/")
    return bucket, key


def _download(gcs_uri: str, dest: Path) -> Path:
    bucket_name, key = _parse_gcs(gcs_uri)
    dest.parent.mkdir(parents=True, exist_ok=True)
    if key.endswith("/"):
        # Directory — download all objects under the prefix
        dest.mkdir(exist_ok=True)
        bucket = gcs_client().bucket(bucket_name)
        for blob in bucket.list_blobs(prefix=key):
            rel = blob.name[len(key) :]
            if not rel:
                continue
            target = dest / rel
            target.parent.mkdir(parents=True, exist_ok=True)
            blob.download_to_filename(str(target))
    else:
        blob = gcs_client().bucket(bucket_name).blob(key)
        blob.download_to_filename(str(dest))
    return dest


def _upload(local: Path, gcs_prefix: str) -> str:
    bucket_name, prefix = _parse_gcs(gcs_prefix)
    if not prefix.endswith("/"):
        prefix += "/"
    target_key = prefix + local.name
    gcs_client().bucket(bucket_name).blob(target_key).upload_from_filename(
        str(local)
    )
    return f"gs://{bucket_name}/{target_key}"


# ─── Video probing (lightweight) ─────────────────────────────────────


def _probe_frames(video: Path) -> int:
    import cv2  # local import to keep cold-start lean

    cap = cv2.VideoCapture(str(video))
    count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT) or 0)
    cap.release()
    return count


def _probe_duration(video: Path) -> float:
    import cv2

    cap = cv2.VideoCapture(str(video))
    fps = cap.get(cv2.CAP_PROP_FPS) or 24.0
    count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT) or 0)
    cap.release()
    return count / fps if fps > 0 else 0.0
