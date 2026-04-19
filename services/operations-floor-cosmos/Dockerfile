# Operations Floor -- Cosmos-Transfer2.5 STUB service
# =====================================================
# Gate 2.c.1 deploy: slim FastAPI + Pydantic image that honors the
# Vertex AI custom-container contract (/health + /predict accepting
# instances[]), but returns a clear "inference_pending" 501 on
# /predict until the real cosmos-transfer1 wiring lands at Gate 2.c.2.
#
# Rationale: nvidia-cosmos/cosmos-transfer1 does NOT expose
# examples/inference.py -- the original Dockerfile assumed a CLI
# entry that doesn't exist. Real inference wiring requires adopting
# NVIDIA's own Dockerfile + their server/ dir + weight checkpoints,
# which is >30 min of integration work. This stub ships the endpoint
# contract first so the rest of the pipeline (Event Translator ->
# this -> Compositor -> Puter) can be validated end-to-end before
# real inference lands.
#
# Swap-in path at Gate 2.c.2: replace this Dockerfile with one based
# on nvidia-cosmos/cosmos-transfer1's own Dockerfile + weights mounted
# from GCS. The /predict contract stays identical -- no downstream
# consumer changes.

FROM python:3.11-slim-bookworm

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8080

WORKDIR /app

COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

COPY main.py /app/main.py
COPY cosmos_runner.py /app/cosmos_runner.py

EXPOSE 8080

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
