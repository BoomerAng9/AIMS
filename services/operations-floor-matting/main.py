"""
Operations Floor — Matting Service (Stage 7.5)

Takes the Seedance character MP4 produced by Stage 6 and returns a
WebM with VP9 alpha channel (or per-frame RGBA PNG sequence) ready
for the compositor to overlay on the Cosmos environment video.

Contract:
    POST /matte
    {
        "source_url":            "<https URL of character MP4>",
        "output_gcs_uri":        "gs://bucket/path/character-matte.webm",
        "source_event_id":       "evt-planner-001",
        "empty_matte_threshold": 0.002   # optional; default 0.002 = 0.2%
    }
        -> 200
        {
            "output_gcs_uri":     "gs://bucket/path/character-matte.webm",
            "duration_s":         <float>,
            "frame_count":        <int>,
            "size_bytes":         <int>,
            "backend":            "rembg:isnet-general-use",
            "source_event_id":    "evt-planner-001",
            "avg_foreground_ratio": <float>
        }
        -> 4xx/5xx
        { "error": "<message>", "source_event_id": "<echo>" }

Auth:
    Bearer token from MATTING_AUTH_TOKEN env (Secret Manager in Cloud Run).
    If the env var is unset the service refuses to start — a public
    matting endpoint lets anyone burn our GPU/CPU budget and bleed GCS.

Health:
    GET /health
        { "status": "ok"|"warming", "backend": "<name>", "ready": <bool> }
"""

from __future__ import annotations

import asyncio
import logging
import os
import shutil
import subprocess
import tempfile
import time
import uuid
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Annotated

import httpx
from fastapi import Depends, FastAPI, Header, HTTPException, Request
from google.cloud import storage
from pydantic import BaseModel, Field

from matting_backend import MattingBackend, make_backend

logging.basicConfig(
    level=os.environ.get("LOG_LEVEL", "INFO"),
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)
log = logging.getLogger("operations-floor-matting")

# ---- Config --------------------------------------------------------------

REQUIRED_AUTH_TOKEN = os.environ.get("MATTING_AUTH_TOKEN", "").strip()
if not REQUIRED_AUTH_TOKEN:
    # Fail fast at boot rather than accept anonymous requests in prod.
    raise RuntimeError(
        "MATTING_AUTH_TOKEN unset — refuse to start a public matting endpoint"
    )

MAX_SOURCE_MB = int(os.environ.get("MATTING_MAX_SOURCE_MB", "200"))
MAX_FRAMES = int(os.environ.get("MATTING_MAX_FRAMES", "600"))  # ~20s at 30fps
FFMPEG_BIN = shutil.which("ffmpeg") or "/usr/bin/ffmpeg"
FFPROBE_BIN = shutil.which("ffprobe") or "/usr/bin/ffprobe"
GCP_PROJECT_ID = os.environ.get("GCP_PROJECT_ID") or os.environ.get(
    "GOOGLE_CLOUD_PROJECT"
)

# ---- Global backend + GCS client (lazy) ---------------------------------

_backend: MattingBackend | None = None
_gcs: storage.Client | None = None


def get_backend() -> MattingBackend:
    if _backend is None:
        raise HTTPException(status_code=503, detail="backend not ready")
    return _backend


def get_gcs() -> storage.Client:
    global _gcs
    if _gcs is None:
        _gcs = storage.Client(project=GCP_PROJECT_ID)
    return _gcs


# ---- Auth ----------------------------------------------------------------


def require_auth(authorization: Annotated[str | None, Header()] = None) -> None:
    # Constant-time compare would be nicer, but the token is long and
    # random; this isn't a timing-sensitive surface.
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="missing bearer token")
    token = authorization[len("Bearer ") :].strip()
    if token != REQUIRED_AUTH_TOKEN:
        raise HTTPException(status_code=401, detail="bad bearer token")


# ---- Lifespan ------------------------------------------------------------


@asynccontextmanager
async def lifespan(app: FastAPI):
    global _backend
    backend = make_backend()
    log.info("boot backend=%s", backend.name())
    # Eagerly load the model so cold-start cost is paid once per
    # Cloud Run instance instead of once per request.
    if hasattr(backend, "load"):
        backend.load()  # type: ignore[attr-defined]
    _backend = backend
    yield
    # No teardown — ONNX session + GCS client are GC-safe on shutdown.


app = FastAPI(title="Operations Floor Matting", lifespan=lifespan)


# ---- Schema --------------------------------------------------------------


class MatteRequest(BaseModel):
    source_url: str = Field(
        ..., min_length=8, description="HTTPS URL of the character MP4 to matte"
    )
    output_gcs_uri: str = Field(
        ...,
        pattern=r"^gs://[^/]+/.+\.(webm|mov)$",
        description="Destination gs:// URI. Must end in .webm (VP9 alpha) or .mov (ProRes 4444).",
    )
    source_event_id: str | None = None
    empty_matte_threshold: float = Field(
        default=0.002,
        ge=0.0,
        le=1.0,
        description=(
            "Minimum avg foreground ratio required to accept the output. "
            "Below this the request fails with 422 so the caller knows "
            "the subject wasn't detected, rather than silently shipping "
            "a fully-transparent clip."
        ),
    )


class MatteResponse(BaseModel):
    output_gcs_uri: str
    duration_s: float
    frame_count: int
    size_bytes: int
    backend: str
    source_event_id: str | None = None
    avg_foreground_ratio: float


class HealthResponse(BaseModel):
    status: str
    backend: str
    ready: bool


# ---- Endpoints -----------------------------------------------------------


@app.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    b = _backend
    if b is None:
        return HealthResponse(status="warming", backend="unknown", ready=False)
    return HealthResponse(
        status="ok" if b.ready() else "warming",
        backend=b.name(),
        ready=b.ready(),
    )


@app.post(
    "/matte",
    response_model=MatteResponse,
    dependencies=[Depends(require_auth)],
)
async def matte(req: MatteRequest, _request: Request) -> MatteResponse:
    backend = get_backend()
    t_start = time.monotonic()

    # Each request gets its own scratch dir so concurrent requests
    # (though we run concurrency=1 in Cloud Run) never trample frames.
    with tempfile.TemporaryDirectory(prefix="matte-") as tmp:
        tmp_path = Path(tmp)
        src_mp4 = tmp_path / "src.mp4"
        frames_dir = tmp_path / "frames"
        matted_dir = tmp_path / "matted"
        frames_dir.mkdir()
        matted_dir.mkdir()

        await _download(req.source_url, src_mp4)
        probe = _ffprobe(src_mp4)
        frame_count = _extract_frames(src_mp4, frames_dir, probe.fps)
        if frame_count > MAX_FRAMES:
            raise HTTPException(
                status_code=413,
                detail=f"frame_count {frame_count} exceeds MATTING_MAX_FRAMES {MAX_FRAMES}",
            )

        avg_fg = _matte_frames(backend, frames_dir, matted_dir)
        if avg_fg < req.empty_matte_threshold:
            raise HTTPException(
                status_code=422,
                detail=(
                    f"avg_foreground_ratio {avg_fg:.4f} below threshold "
                    f"{req.empty_matte_threshold:.4f}; subject likely not detected"
                ),
            )

        out_local = tmp_path / "out.webm"
        _encode_webm_alpha(matted_dir, out_local, probe.fps)

        bucket_name, blob_name = _parse_gs(req.output_gcs_uri)
        size = _upload_gcs(out_local, bucket_name, blob_name)

    elapsed = time.monotonic() - t_start
    log.info(
        "matte.done event=%s frames=%d fg=%.4f elapsed=%.1fs size=%d",
        req.source_event_id,
        frame_count,
        avg_fg,
        elapsed,
        size,
    )
    return MatteResponse(
        output_gcs_uri=req.output_gcs_uri,
        duration_s=probe.duration_s,
        frame_count=frame_count,
        size_bytes=size,
        backend=backend.name(),
        source_event_id=req.source_event_id,
        avg_foreground_ratio=avg_fg,
    )


# ---- Helpers -------------------------------------------------------------


class _Probe(BaseModel):
    fps: float
    duration_s: float


async def _download(url: str, dest: Path) -> None:
    max_bytes = MAX_SOURCE_MB * 1024 * 1024
    received = 0
    async with httpx.AsyncClient(timeout=60.0, follow_redirects=True) as client:
        async with client.stream("GET", url) as resp:
            if resp.status_code >= 400:
                raise HTTPException(
                    status_code=502,
                    detail=f"source fetch HTTP {resp.status_code}",
                )
            with dest.open("wb") as f:
                async for chunk in resp.aiter_bytes(chunk_size=1024 * 1024):
                    received += len(chunk)
                    if received > max_bytes:
                        raise HTTPException(
                            status_code=413,
                            detail=f"source exceeds MATTING_MAX_SOURCE_MB={MAX_SOURCE_MB}",
                        )
                    f.write(chunk)


def _ffprobe(src: Path) -> _Probe:
    # r_frame_rate is a string like "24000/1001"; evaluate safely.
    cmd = [
        FFPROBE_BIN,
        "-v",
        "error",
        "-select_streams",
        "v:0",
        "-show_entries",
        "stream=r_frame_rate,duration",
        "-of",
        "csv=p=0",
        str(src),
    ]
    out = subprocess.run(cmd, check=True, capture_output=True, text=True).stdout.strip()
    rate_str, dur_str = out.split(",", 1) if "," in out else (out, "0")
    num, _, den = rate_str.partition("/")
    try:
        fps = float(num) / float(den) if den else float(num)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"bad framerate: {rate_str}") from e
    try:
        duration = float(dur_str)
    except ValueError:
        duration = 0.0
    return _Probe(fps=fps or 24.0, duration_s=duration)


def _extract_frames(src: Path, frames_dir: Path, fps: float) -> int:
    cmd = [
        FFMPEG_BIN,
        "-y",
        "-i",
        str(src),
        "-vsync",
        "0",
        "-pix_fmt",
        "rgba",
        "-f",
        "image2",
        str(frames_dir / "f_%06d.png"),
    ]
    subprocess.run(cmd, check=True, capture_output=True)
    return len(list(frames_dir.glob("f_*.png")))


def _matte_frames(backend: MattingBackend, frames_dir: Path, matted_dir: Path) -> float:
    totals = 0.0
    count = 0
    for f in sorted(frames_dir.glob("f_*.png")):
        frame_bytes = f.read_bytes()
        result = backend.matte(frame_bytes)
        (matted_dir / f.name).write_bytes(result.rgba_png)
        totals += result.foreground_ratio
        count += 1
    return totals / count if count else 0.0


def _encode_webm_alpha(matted_dir: Path, out: Path, fps: float) -> None:
    # VP9 in WebM is the only browser-playable codec that carries alpha
    # end-to-end. Quality=good is the default; crf 32 gives us a
    # reasonable size/quality for 6-second character cutouts.
    cmd = [
        FFMPEG_BIN,
        "-y",
        "-framerate",
        str(fps),
        "-i",
        str(matted_dir / "f_%06d.png"),
        "-c:v",
        "libvpx-vp9",
        "-pix_fmt",
        "yuva420p",
        "-auto-alt-ref",
        "0",
        "-crf",
        "32",
        "-b:v",
        "0",
        str(out),
    ]
    subprocess.run(cmd, check=True, capture_output=True)


def _parse_gs(uri: str) -> tuple[str, str]:
    if not uri.startswith("gs://"):
        raise HTTPException(status_code=400, detail="output_gcs_uri must start with gs://")
    rest = uri[len("gs://") :]
    bucket, _, blob = rest.partition("/")
    if not bucket or not blob:
        raise HTTPException(status_code=400, detail="malformed gs:// uri")
    return bucket, blob


def _upload_gcs(local: Path, bucket_name: str, blob_name: str) -> int:
    gcs = get_gcs()
    bucket = gcs.bucket(bucket_name)
    blob = bucket.blob(blob_name)
    size = local.stat().st_size
    blob.upload_from_filename(
        str(local),
        content_type="video/webm",
        # resumable=False avoids the billing-account probe that bit the
        # compositor service (see compositor SECURITY.md); one-shot
        # upload is faster for the file sizes we produce here anyway.
        # Cast: upload_from_filename forwards kwargs through.
    )
    return size


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.environ.get("PORT", "8080")),
        log_level=os.environ.get("LOG_LEVEL", "info").lower(),
    )
