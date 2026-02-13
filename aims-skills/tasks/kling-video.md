---
id: "kling-video"
name: "Kling Video Generation"
type: "task"
status: "active"
triggers:
  - "generate video"
  - "kling"
  - "create video"
  - "video from text"
description: "Generate AI video from text prompts using Kling AI."
execution:
  target: "api"
  route: "/api/video/generate"
  command: ""
dependencies:
  env:
    - "KLING_API_KEY"
  files:
    - "frontend/lib/kling-video.ts"
    - "aims-skills/tools/kling-ai.tool.md"
priority: "medium"
---

# Kling Video Generation Task

## Endpoint
**POST** `/api/video/generate`

```json
{
  "prompt": "A futuristic AI dashboard with holographic displays",
  "duration": 5,
  "aspectRatio": "16:9"
}
```

## Pipeline
1. **Analyze** — Parse prompt for optimal video parameters
2. **Generate** — Submit to Kling AI (2-5 min processing)
3. **Poll** — Check generation status
4. **Return** — Video URL or buffer

## API Key
Set `KLING_API_KEY` in environment.
