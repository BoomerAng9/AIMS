"""
Matting backend abstraction.

The compositor calls a single interface and doesn't care which model
actually produces the alpha channel. Today that's rembg (CPU, fast,
pip-installable). When the GPU budget lands, BiRefNet or MODNet can
drop in behind the same interface without touching the caller.
"""

from __future__ import annotations

import io
import logging
import os
from abc import ABC, abstractmethod
from dataclasses import dataclass

import numpy as np
from PIL import Image

log = logging.getLogger(__name__)


@dataclass(frozen=True)
class MatteResult:
    """RGBA frame + diagnostic stats."""

    rgba_png: bytes
    width: int
    height: int
    # Fraction of pixels whose alpha > 0. Used for "empty matte"
    # detection — a frame where the model returned a fully transparent
    # output means the subject wasn't detected, which is a real failure
    # we want to surface rather than silently composite an empty frame.
    foreground_ratio: float


class MattingBackend(ABC):
    @abstractmethod
    def name(self) -> str: ...

    @abstractmethod
    def ready(self) -> bool:
        """True if the model is loaded and a matte call would succeed."""

    @abstractmethod
    def matte(self, frame_png: bytes) -> MatteResult: ...


class RembgBackend(MattingBackend):
    """
    rembg wrapping ONNX models (default: isnet-general-use — better
    edges than u2net for non-portrait subjects like Port_Ang in the
    Night Port control room).

    The model is cached in /models inside the container on first call.
    The rembg session is created eagerly in `load()` so /health can
    report an accurate ready state and Cloud Run cold-start cost is
    paid once per instance, not once per request.
    """

    def __init__(self, model_name: str | None = None) -> None:
        self._model_name = model_name or os.environ.get(
            "MATTING_REMBG_MODEL", "isnet-general-use"
        )
        self._session = None  # set in load()

    def name(self) -> str:
        return f"rembg:{self._model_name}"

    def ready(self) -> bool:
        return self._session is not None

    def load(self) -> None:
        # rembg is imported lazily so the module loads even without it
        # (makes unit tests that stub the backend cheap).
        from rembg import new_session  # type: ignore[import-not-found]

        log.info("matting.load start model=%s", self._model_name)
        self._session = new_session(self._model_name)
        log.info("matting.load done model=%s", self._model_name)

    def matte(self, frame_png: bytes) -> MatteResult:
        if self._session is None:
            raise RuntimeError("RembgBackend.load() must be called before matte()")

        from rembg import remove  # type: ignore[import-not-found]

        # rembg.remove returns RGBA PNG bytes when given PNG bytes.
        rgba_bytes = remove(frame_png, session=self._session)

        # Compute foreground_ratio without re-decoding when possible.
        with Image.open(io.BytesIO(rgba_bytes)) as im:
            im.load()
            if im.mode != "RGBA":
                im = im.convert("RGBA")
            w, h = im.size
            alpha = np.asarray(im.split()[-1], dtype=np.uint8)
            total = alpha.size
            nonzero = int(np.count_nonzero(alpha))
            ratio = nonzero / total if total else 0.0

        return MatteResult(
            rgba_png=rgba_bytes,
            width=w,
            height=h,
            foreground_ratio=ratio,
        )


def make_backend() -> MattingBackend:
    """Factory honoring MATTING_BACKEND env (default: rembg)."""
    backend = os.environ.get("MATTING_BACKEND", "rembg").lower()
    if backend == "rembg":
        return RembgBackend()
    # Placeholder for BiRefNet / MODNet when GPU Cloud Run is wired.
    # Explicit unknown-backend failure keeps silent typos from
    # silently falling through to a different model.
    raise ValueError(f"Unknown MATTING_BACKEND: {backend}")
