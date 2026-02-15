"""
SAM 2 Film Room — Vertex AI Prediction Server

Accepts video URLs + player coordinates, runs SAM 2 segmentation,
and returns frame-by-frame player tracking data.

Deployed on Vertex AI with NVIDIA Tesla T4 GPU.
"""

import os
import torch
import cv2
import requests
from fastapi import FastAPI, Request
from typing import List, Dict, Any

app = FastAPI(title="SAM 2 Film Room", version="1.0.0")

CHECKPOINT = "./checkpoints/sam2_hiera_large.pt"
CONFIG = "sam2_hiera_l.yaml"
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

# Lazy load — model loads on first prediction request
_predictor = None


def get_predictor():
    global _predictor
    if _predictor is None:
        try:
            from sam2.build_sam import build_sam2_video_predictor
            print(f"Loading SAM 2 on {DEVICE}...")
            _predictor = build_sam2_video_predictor(CONFIG, CHECKPOINT, device=DEVICE)
            print("SAM 2 loaded successfully")
        except Exception as e:
            print(f"SAM 2 load failed: {e}")
            _predictor = None
    return _predictor


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "gpu": torch.cuda.is_available(),
        "device": DEVICE,
        "model_loaded": _predictor is not None,
    }


@app.post("/predict")
async def predict(request: Request) -> Dict[str, Any]:
    """
    Input JSON:
    {
      "instances": [
        {
          "video_url": "https://storage.googleapis.com/...",
          "click_coords": [[500, 300]],
          "frame_rate": 30
        }
      ]
    }
    """
    body = await request.json()
    instance = body["instances"][0]
    video_url = instance["video_url"]
    click_coords = instance.get("click_coords", [[500, 300]])
    frame_rate = instance.get("frame_rate", 30)

    predictor = get_predictor()
    if predictor is None:
        return {
            "predictions": [],
            "error": "SAM 2 model not loaded — check GPU and checkpoint",
        }

    # Download video temporarily
    local_video_path = "/tmp/game_film.mp4"
    try:
        with open(local_video_path, "wb") as f:
            resp = requests.get(video_url, timeout=60)
            resp.raise_for_status()
            f.write(resp.content)
    except Exception as e:
        return {"predictions": [], "error": f"Video download failed: {str(e)}"}

    try:
        # Initialize inference state
        inference_state = predictor.init_state(video_path=local_video_path)

        # Add initial player location (positive click = foreground)
        points = [list(coord) for coord in click_coords]
        labels = [1] * len(points)

        _, out_obj_ids, out_mask_logits = predictor.add_new_points(
            inference_state=inference_state,
            frame_idx=0,
            obj_id=1,
            points=points,
            labels=labels,
        )

        # Propagate mask across video
        results: List[Dict[str, Any]] = []
        for out_frame_idx, out_obj_ids, out_mask_logits in predictor.propagate_in_video(
            inference_state
        ):
            # Extract bounding box from mask
            mask = (out_mask_logits[0] > 0).cpu().numpy().squeeze()
            ys, xs = mask.nonzero()

            bbox = None
            if len(xs) > 0 and len(ys) > 0:
                bbox = {
                    "x": int(xs.min()),
                    "y": int(ys.min()),
                    "w": int(xs.max() - xs.min()),
                    "h": int(ys.max() - ys.min()),
                }

            results.append(
                {
                    "frame": out_frame_idx,
                    "player_isolated": len(xs) > 0,
                    "bounding_box": bbox,
                    "mask_area_pixels": int(mask.sum()),
                }
            )

        return {"predictions": results}

    except Exception as e:
        return {"predictions": [], "error": f"Inference failed: {str(e)}"}
    finally:
        # Cleanup
        if os.path.exists(local_video_path):
            os.remove(local_video_path)
