#!/usr/bin/env bash
#
# Night Port — Control Bundle Generator (Gate 2.b)
# =================================================
# Produces the binary derivatives Cosmos-Transfer2.5 needs, from the
# source hero still at cti-hub/public/deploy/night-port-hero.jpg.
#
# Outputs (all land in the fixture directory alongside this script):
#   proxy-video.mp4  — 6s slow dolly-in via FFmpeg zoompan
#   depth.exr        — MiDaS monocular depth estimation (single-pass)
#   canny/*.png      — OpenCV Canny edge maps, one per proxy frame
#
# Requirements:
#   - FFmpeg 6+
#   - Python 3.10+ with: torch, timm, opencv-python, numpy, openexr
#   - MiDaS model weights downloaded on first run (auto-downloads)
#
# Usage:
#   bash scripts/generate-control-bundle.sh
#
# Env overrides:
#   HERO_SRC      — path to source hero (default: ../../../../../cti-hub/public/deploy/night-port-hero.jpg)
#   OUT_DIR       — where derivatives land (default: .. the fixture dir)
#   FPS           — output video fps (default: 24)
#   DURATION      — video duration seconds (default: 6)

set -euo pipefail

FIXTURE_DIR="$(cd "$(dirname "$0")/.." && pwd)"
HERO_SRC="${HERO_SRC:-$FIXTURE_DIR/../../../../../cti-hub/public/deploy/night-port-hero.jpg}"
OUT_DIR="${OUT_DIR:-$FIXTURE_DIR}"
FPS="${FPS:-24}"
DURATION="${DURATION:-6}"

# Preflight — tool checks
command -v ffmpeg >/dev/null 2>&1 || { echo "[error] ffmpeg not found — install FFmpeg 6+"; exit 1; }
command -v python3 >/dev/null 2>&1 || { echo "[error] python3 not found"; exit 1; }

[[ -f "$HERO_SRC" ]] || { echo "[error] hero not found at $HERO_SRC"; exit 1; }

echo "[night-port] generating control bundle from: $HERO_SRC"
echo "[night-port] output dir: $OUT_DIR"
mkdir -p "$OUT_DIR/canny"

# ─── Step 1: proxy-video.mp4 via FFmpeg zoompan ──────────────────────
# Slow dolly-in: starts at full frame, ends ~30% zoom. Centered crop.
# Matches the camera-pose.json keyframe sequence (z: 10 → 4).
TOTAL_FRAMES=$((FPS * DURATION))
echo "[night-port] step 1/3 — proxy-video.mp4 ($DURATION s @ ${FPS}fps, $TOTAL_FRAMES frames)"

ffmpeg -y -loglevel error \
  -loop 1 -framerate "$FPS" -i "$HERO_SRC" \
  -vf "zoompan=z='min(zoom+0.0015,1.3)':d=$TOTAL_FRAMES:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1024x1024:fps=$FPS" \
  -c:v libx264 -pix_fmt yuv420p -t "$DURATION" -movflags +faststart \
  "$OUT_DIR/proxy-video.mp4"

# ─── Step 2: per-frame Canny edges ───────────────────────────────────
# Extract frames, run Canny on each, drop to canny/ subdir.
echo "[night-port] step 2/3 — Canny edge PNGs → $OUT_DIR/canny/"

python3 - "$OUT_DIR/proxy-video.mp4" "$OUT_DIR/canny" <<'PYEOF'
import sys, os, cv2
video_path, out_dir = sys.argv[1], sys.argv[2]
os.makedirs(out_dir, exist_ok=True)
cap = cv2.VideoCapture(video_path)
idx = 0
while True:
    ok, frame = cap.read()
    if not ok:
        break
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    edges = cv2.Canny(gray, 100, 200)
    cv2.imwrite(os.path.join(out_dir, f"{idx:04d}.png"), edges)
    idx += 1
cap.release()
print(f"  wrote {idx} Canny frames")
PYEOF

# ─── Step 3: depth.exr via MiDaS ─────────────────────────────────────
# Single-pass depth on the hero still (not per-frame — Gate 2.b shortcut).
# Per-frame depth lands at Gate 3 when Lyra emits authoritative depth.
echo "[night-port] step 3/3 — depth.exr (MiDaS, single-pass on hero still)"

python3 - "$HERO_SRC" "$OUT_DIR/depth.exr" <<'PYEOF'
import sys, cv2, numpy as np, torch

try:
    import OpenEXR, Imath
except ImportError:
    print("[warn] OpenEXR Python bindings not installed — writing depth.png instead")
    OpenEXR = None

hero_path, out_path = sys.argv[1], sys.argv[2]
img = cv2.cvtColor(cv2.imread(hero_path), cv2.COLOR_BGR2RGB)

# MiDaS via torch hub
model_type = "MiDaS_small"  # light variant for dev boxes without big GPU
midas = torch.hub.load("intel-isl/MiDaS", model_type)
device = "cuda" if torch.cuda.is_available() else "cpu"
midas.to(device).eval()
transforms = torch.hub.load("intel-isl/MiDaS", "transforms").small_transform

with torch.no_grad():
    inp = transforms(img).to(device)
    prediction = midas(inp)
    prediction = torch.nn.functional.interpolate(
        prediction.unsqueeze(1),
        size=img.shape[:2],
        mode="bicubic",
        align_corners=False,
    ).squeeze()

depth = prediction.cpu().numpy().astype(np.float32)
# Normalize to 0..1 for deterministic downstream interpretation
depth_norm = (depth - depth.min()) / (depth.max() - depth.min() + 1e-8)

if OpenEXR:
    h, w = depth_norm.shape
    header = OpenEXR.Header(w, h)
    header["channels"] = {"Z": Imath.Channel(Imath.PixelType(Imath.PixelType.FLOAT))}
    exr = OpenEXR.OutputFile(out_path, header)
    exr.writePixels({"Z": depth_norm.tobytes()})
    exr.close()
    print(f"  wrote {out_path} (EXR, {w}x{h})")
else:
    fallback_path = out_path.replace(".exr", ".png")
    cv2.imwrite(fallback_path, (depth_norm * 65535).astype(np.uint16))
    print(f"  wrote {fallback_path} (16-bit PNG fallback)")
PYEOF

echo ""
echo "═══ Night Port control bundle ready ═══"
echo "  $OUT_DIR/proxy-video.mp4"
echo "  $OUT_DIR/canny/*.png"
echo "  $OUT_DIR/depth.exr (or depth.png if OpenEXR bindings missing)"
echo ""
echo "Next: point Cosmos-Transfer2.5 at multicontrol-spec.json."
