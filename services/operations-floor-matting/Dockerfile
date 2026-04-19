# syntax=docker/dockerfile:1.7
#
# Operations Floor Matting Service
# --------------------------------
# Python FastAPI + rembg (ONNX) + ffmpeg. CPU-only; the isnet-general-use
# model runs in ~0.8–1.2s/frame on 2 vCPUs, which matches Cloud Run's
# CPU-only pricing envelope. Swap to a GPU image + BiRefNet when we have
# budget for Cloud Run GPU.

FROM python:3.11-slim-bookworm AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    U2NET_HOME=/models \
    PORT=8080

# --- System deps ---------------------------------------------------------
# ffmpeg: frame extraction + VP9-alpha encode
# libgomp1 + libglib2.0-0: ONNX runtime CPU requires them
# tini: PID-1 reaper so SIGTERM from Cloud Run propagates cleanly
RUN apt-get update \
 && apt-get install -y --no-install-recommends \
        ffmpeg \
        libgomp1 \
        libglib2.0-0 \
        tini \
        ca-certificates \
 && rm -rf /var/lib/apt/lists/*

# --- App --------------------------------------------------------------
WORKDIR /app

# Install deps first for layer cache.
COPY requirements.txt ./
RUN pip install --require-hashes=false -r requirements.txt

# Pre-download the default rembg model so cold-start doesn't hit the
# network. Swap MATTING_REMBG_MODEL at deploy time to use a different
# one — the pre-download is a cache, not a lock.
RUN mkdir -p /models \
 && python -c "from rembg import new_session; new_session('isnet-general-use')"

COPY main.py matting_backend.py ./

# Non-root — rembg + ffmpeg don't need root; Cloud Run doesn't require it.
RUN useradd --uid 1001 --create-home --shell /usr/sbin/nologin matte \
 && chown -R matte:matte /app /models
USER matte

EXPOSE 8080

# tini reaps zombie ffmpeg children when a worker dies mid-render.
ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080", "--workers", "1"]
