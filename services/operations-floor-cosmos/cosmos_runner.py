"""
Cosmos-Transfer2.5 runner — thin wrapper around the Apache-2 inference CLI.

Keeps main.py decoupled from the Cosmos source layout. When NVIDIA
publishes an official Cosmos-Transfer2.5 NIM, swap this module out for
a thin HTTPS proxy — the main.py contract stays identical.
"""

from __future__ import annotations

import json
import os
import subprocess
from pathlib import Path
from typing import Any

COSMOS_REPO_ROOT = Path(os.environ.get("COSMOS_REPO_ROOT", "/cosmos"))
MODEL_VARIANT = os.environ.get("COSMOS_MODEL_VARIANT", "transfer2.5")


class CosmosRuntimeError(RuntimeError):
    """Surfaces non-zero exit or missing outputs from the Cosmos CLI."""


def cosmos_version_info() -> dict[str, Any]:
    """Used by /health. Reports GPU + CUDA + Cosmos + model-loaded state."""
    gpu_available = _gpu_available()
    cuda_version = os.environ.get("CUDA_VERSION", _probe_cuda())
    return {
        "gpu_available": gpu_available,
        "cuda_version": cuda_version,
        "cosmos_version": MODEL_VARIANT,
        "model_loaded": _weights_present(),
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
    """
    Invoke the Cosmos-Transfer2.5 CLI with a synthesized params file.
    Returns the path to the rendered MP4.
    """
    output_dir.mkdir(parents=True, exist_ok=True)
    params_path = output_dir / "spec.json"
    prompt_path = output_dir / "prompt.json"

    # Cosmos CLI reads both params (with controls) and prompt from disk
    _write_prompt(prompt_path, prompt, negative_prompt)
    _write_params(
        params_path=params_path,
        prompt_rel=str(prompt_path),
        video_path=video_path,
        output_dir=output_dir,
        multicontrol=multicontrol,
        guidance=guidance,
        steps=steps,
        seed=seed,
    )

    inference_entry = COSMOS_REPO_ROOT / "examples" / "inference.py"
    if not inference_entry.exists():
        raise CosmosRuntimeError(
            f"Cosmos inference entry not found at {inference_entry}. "
            "Check COSMOS_REPO_ROOT and the image build."
        )

    cmd = [
        "python",
        str(inference_entry),
        "--params_file",
        str(params_path),
    ]

    proc = subprocess.run(
        cmd,
        capture_output=True,
        text=True,
        timeout=int(os.environ.get("COSMOS_INFERENCE_TIMEOUT", "900")),
    )

    if proc.returncode != 0:
        raise CosmosRuntimeError(
            f"cosmos exit {proc.returncode}: {proc.stderr[-2000:]}"
        )

    # Cosmos writes rendered MP4(s) into the output_dir. Pick the one.
    mp4s = sorted(output_dir.glob("*.mp4"))
    if not mp4s:
        raise CosmosRuntimeError(
            f"cosmos completed but no MP4 in {output_dir}: "
            f"stdout={proc.stdout[-500:]}"
        )
    return mp4s[-1]


# ─── Internals ───────────────────────────────────────────────────────


def _write_prompt(path: Path, prompt: str, negative: str) -> None:
    path.write_text(
        json.dumps({"prompt": prompt, "negative_prompt": negative}, indent=2)
    )


def _write_params(
    *,
    params_path: Path,
    prompt_rel: str,
    video_path: Path,
    output_dir: Path,
    multicontrol: dict[str, dict[str, Any]],
    guidance: float,
    steps: int,
    seed: int,
) -> None:
    # Shape matches the robot_multicontrol_spec.json pattern scraped in
    # the Gate 1 Cosmos Transfer2.5 quickstart recon.
    params = {
        "prompt_path": prompt_rel,
        "output_dir": str(output_dir),
        "video_path": str(video_path),
        "guidance": guidance,
        "steps": steps,
        "seed": seed,
        "controls": {
            name: {
                "enabled": spec.get("enabled", False),
                "strength": spec.get("strength", 0.0),
                "source": spec.get("source_path"),
            }
            for name, spec in multicontrol.items()
        },
    }
    params_path.write_text(json.dumps(params, indent=2))


def _gpu_available() -> bool:
    try:
        import torch

        return bool(torch.cuda.is_available())
    except Exception:
        return False


def _probe_cuda() -> str:
    try:
        import torch

        return torch.version.cuda or "unknown"
    except Exception:
        return "unknown"


def _weights_present() -> bool:
    weights = Path(os.environ.get("COSMOS_MODEL_PATH", "/cosmos-weights"))
    # Minimum-viable check: directory exists and has at least one
    # checkpoint-sized file (>100MB).
    if not weights.exists():
        return False
    try:
        for p in weights.rglob("*"):
            if p.is_file() and p.stat().st_size > 100_000_000:
                return True
    except Exception:
        return False
    return False
