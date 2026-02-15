---
id: "gridiron-film-analysis"
name: "Film Room Analysis"
type: "skill"
status: "active"
triggers: ["analyze film", "film review", "tape review", "sam2 analysis", "watch film"]
description: "Sends prospect highlight footage to SAM 2 (Vertex AI) for player segmentation and motion analysis."
execution:
  target: "api"
  route: "/api/gridiron/film-room/analyze"
priority: "high"
---

# Film Room Analysis Skill

> Sends game footage to SAM 2 on Vertex AI for visual grading.

## Action: `gridiron_film_analysis`

### What It Does
1. Accepts a video URL + player coordinates (click on player in frame 0)
2. Film Room bridge sends to Vertex AI SAM 2 endpoint (NVIDIA Tesla T4)
3. SAM 2 segments the player across all frames (jersey tracking)
4. Returns metrics:
   - **Speed bursts** — number of acceleration events
   - **Avg separation** — yards of separation from defenders
   - **Route sharpness** — crispness of route running (0-100)
   - **Play recognition** — reaction time indicator (0-100)
5. Results fed back to War Room Boomer_Angs for final evaluation

### Parameters
```json
{
  "prospectName": "string",
  "videoUrl": "string (GCS or public URL)",
  "clickCoords": [[x, y]],
  "analysisType": "FULL_GAME | HIGHLIGHT_REEL | SINGLE_PLAY"
}
```

### ACHEEVY Communication
> "Sending tape to the Film Room — SAM 2 is tracking the player now. I'll have the breakdown shortly."
