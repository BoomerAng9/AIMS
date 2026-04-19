"""
Cosmos-Transfer2.5 runner -- STUB (Gate 2.c.1).

Returns a 501 NOT_IMPLEMENTED response for every inference call with a
clear "inference_pending" body. /health reports stub_mode: true so
downstream consumers know not to await a real render.

Real inference wiring lands at Gate 2.c.2 after we adopt
nvidia-cosmos/cosmos-transfer1's own Dockerfile + weight mounts. The
return-shape contract defined here is identical to what the real
runner will produce, so swapping the implementation is a clean
substitution.
"""

from __future__ import annotations

from pathlib import Path
from typing import Any


class CosmosRuntimeError(RuntimeError):
    """Raised when the inference call cannot be serviced."""


class CosmosNotImplemented(CosmosRuntimeError):
    """Signals the Gate 2.c.1 stub path -- real inference not yet wired."""


def cosmos_version_info() -> dict[str, Any]:
    """Consumed by /health. Reports stub status honestly."""
    return {
        "gpu_available": False,
        "cuda_version": "none (stub)",
        "cosmos_version": "transfer2.5-stub-gate-2c-1",
        "model_loaded": False,
        "stub_mode": True,
        "note": (
            "Gate 2.c.1 STUB service. /predict returns 501 with "
            "inference_pending payload. Real inference wiring lands "
            "at Gate 2.c.2 -- adopt nvidia-cosmos/cosmos-transfer1 "
            "Dockerfile + weight mounts."
        ),
    }


def run_inference(
    *,
    video_path: Path,
    prompt: str,
    negative_prompt: str,
    multicontrol: dict[str, dict[str, Any]],
    guidance: float,
    steps: int,
    seed: int,
    output_dir: Path,
) -> Path:
    """Stub: always raises CosmosNotImplemented with a structured detail."""
    controls_enabled = [k for k, v in multicontrol.items() if v.get("enabled")]
    raise CosmosNotImplemented(
        "cosmos-transfer2.5 inference is not yet wired (Gate 2.c.1 stub). "
        "Call validates the endpoint contract only. Gate 2.c.2 will land "
        "the real runner that adopts nvidia-cosmos/cosmos-transfer1's "
        "Dockerfile + weight mounts. "
        f"Stub saw: video={video_path.name} prompt_len={len(prompt)} "
        f"guidance={guidance} steps={steps} seed={seed} "
        f"controls_enabled={controls_enabled}"
    )
