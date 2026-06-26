# Night Port — Cosmos-Transfer2.5 Control Bundle (Gate 2.b Fixture)

**Purpose:** Minimum-viable control bundle for Cosmos-Transfer2.5 Stage 5, so Gate 2's dry-run can exercise the photoreal-environment-render edge without Project Lyra / a headless 3D Proxy World Engine.

**Consumes:** Stage 3–4 outputs (skipped in Gate 2 — replaced by this fixture).
**Feeds:** Stage 5 — NVIDIA Cosmos-Transfer2.5 NIM on GCP Cloud Run GPU.

---

## What's here (committed)

| File | Role |
|---|---|
| `README.md` | This file |
| `prompt.json` | Text prompt Cosmos-Transfer2.5 consumes |
| `camera-pose.json` | Canonical camera fixture (Gate 3 will use this to drive the real Proxy World) |
| `multicontrol-spec.json` | Cosmos-Transfer2.5 params file — depth + edge combined control |
| `scripts/generate-control-bundle.sh` | Generates the binary derivatives (proxy video + depth + Canny) from the source hero image |

## What's NOT here (gitignored — produced by the generator script)

| Artifact | How it's produced |
|---|---|
| `proxy-video.mp4` | FFmpeg zoompan animation from `source-hero.jpg` (5–8s slow dolly-in) |
| `depth.exr` | MiDaS monocular depth estimation on the proxy video |
| `canny.png` frame sequence | OpenCV Canny on each proxy-video frame |

## Source hero

The source still lives outside this fixture directory at:

```
foai/cti-hub/public/deploy/night-port-hero.jpg
```

That file is the deploy-landing hero background (fixes the previously-missing `bg-cover bg-center` reference on `/deploy-landing`) AND the Gate 2.b source asset. One file, two uses. Do **not** duplicate it into this fixture — `generate-control-bundle.sh` reads from the canonical path.

## How to generate the binary derivatives

On a box with FFmpeg 6+, Python 3.10+, OpenCV, and PyTorch (any GPU helps but CPU works):

```bash
cd aims-core/backend/uef-gateway/fixtures/operations-floor/night-port
bash scripts/generate-control-bundle.sh
```

Outputs land in this directory:
- `proxy-video.mp4` — the input Cosmos-Transfer2.5 sees
- `depth.exr` — 16-bit depth map (per-frame if MiDaS runs per-frame, single if single-frame)
- `canny/` — directory of Canny edge PNGs, one per proxy-video frame

## How Cosmos consumes this

From the Cosmos-Transfer2.5 quickstart (`cosmos-transfer25-quickstart.json` recon 2026-04-18):

```bash
# From a GCP Cloud Run Service or any box with the Transfer2.5 NIM:
python examples/inference.py --params_file /path/to/multicontrol-spec.json
```

`multicontrol-spec.json` points at `proxy-video.mp4`, `prompt.json`, and the output directory. Cosmos derives internal control signals (or consumes pre-computed `depth.exr` + `canny/` if the NIM supports injected controls).

## The deliberate shortcuts (per gate-2-kickoff.md)

- **No Project Lyra.** Lyra (Gate 3) will replace this fixture with dynamically-generated 3D-proxy renders. For Gate 2's dry-run, the FFmpeg zoompan of a single still image provides enough camera motion for Cosmos to process.
- **No multi-scene library.** Night Port is the first and only scene. Other scenes (conference-room, ops-floor, break-room, ceo-office) land at Gate 4 productization.
- **No per-frame depth rigor.** Single-shot MiDaS on the hero still + FFmpeg-animated depth — not a proper volumetric depth pass per frame. Enough for the dry-run.
- **No Canny hyperparameter tuning.** Default OpenCV thresholds (100, 200). Tune at Gate 2.c if Cosmos rejects the edges.

## Upgrade path (Gate 3)

Replace this entire fixture with dynamic output from Project Lyra:

1. Lyra receives the Event Translator's `scene_hint: "night-port"` + `camera_intent` fields
2. Lyra builds the 3D scene (USD format, canonical geometry)
3. Lyra navigates the camera per `camera_intent`
4. Lyra emits `proxy-video.mp4` + true per-frame depth + per-frame Canny + authoritative camera-pose JSON
5. Cosmos consumes the Lyra bundle exactly the same way it consumes this fixture — interface contract is preserved

## References

- `vertical-run-a-company-3d-engagement.md` — full spec
- `gate-1.6-pipeline-audit.md` — E4 (Proxy → Control Emitter) and E5 (Control Emitter → Cosmos) are the edges this fixture stands in for
- `gate-2-kickoff.md` — Gate 2 scope including the explicit decision to shortcut Lyra
- `cti-hub/public/deploy/night-port-hero.jpg` — source still
