# Cosmos-Transfer2.5 — Vertex AI custom-container image
# =======================================================
# Serves NVIDIA Cosmos-Transfer2.5 (sim-to-real world foundation model)
# behind a FastAPI wrapper that matches the Vertex AI custom-container
# prediction contract (/health + /predict accepting instances[]).
#
# Base: PyTorch 2.3.1 + CUDA 12.8.1 matches Cosmos-Transfer2.5
# prerequisites (cosmos-prereqs.json, Gate 1 recon).
#
# Mirrors the SAM2 deployment pattern from services/gridiron/sam2-deploy.

FROM pytorch/pytorch:2.3.1-cuda12.1-cudnn8-devel

ENV DEBIAN_FRONTEND=noninteractive \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    NVIDIA_VISIBLE_DEVICES=all \
    NVIDIA_DRIVER_CAPABILITIES=compute,utility,video

# System deps: ffmpeg for video IO, git for Cosmos source clone,
# build-essential for any C extensions in Cosmos.
RUN apt-get update && apt-get install -y --no-install-recommends \
        ffmpeg \
        git \
        build-essential \
        libgl1 \
        libglib2.0-0 \
        curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Python deps (FastAPI server + GCS client + image/video utilities)
COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

# Cosmos-Transfer2.5 from the Apache-2 source. Pinned to a commit
# when v2.5 weights land; for now tracks main.
# TODO: replace with a pinned tag once NVIDIA publishes a stable
# Transfer2.5 release. Also replace with NVIDIA's NIM for Cosmos WFM
# once it publishes a Transfer2.5 variant (currently Predict1 only
# per Gate 1 recon).
RUN git clone --depth 1 https://github.com/nvidia-cosmos/cosmos-transfer1.git /cosmos \
    && cd /cosmos \
    && pip install --no-cache-dir -e .

# Model weights: download on first health check so container builds
# stay fast. Alternative: bake into image (~10GB addl) or mount from
# GCS at runtime. Runtime-mount from GCS is preferred for prod.
ENV COSMOS_MODEL_PATH=/cosmos-weights \
    COSMOS_MODEL_VARIANT=transfer2.5 \
    COSMOS_WEIGHTS_GCS_URI=gs://cosmos-operations-floor-artifacts/weights/transfer2.5/

# Our FastAPI wrapper
COPY main.py /app/main.py
COPY cosmos_runner.py /app/cosmos_runner.py

# Vertex AI expects the container to serve HTTP on PORT (default 8080).
# The predict/health routes are declared at Model upload time via
# --container-predict-route=/predict --container-health-route=/health.
ENV PORT=8080
EXPOSE 8080

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
