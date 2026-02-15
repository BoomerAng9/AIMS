---
id: "kling-ai"
name: "Kling AI"
type: "tool"
category: "video"
provider: "Kling AI"
description: "AI video generation from text prompts and image inputs."
env_vars:
  - "KLING_API_KEY"
docs_url: "https://docs.qingque.cn/d/home/eZQB2yXFSJOqbIGBAOC-bfHen"
aims_files:
  - "frontend/lib/kling-video.ts"
---

# Kling AI — Video Generation Tool Reference

## Overview

Kling AI generates videos from text prompts and image inputs. In AIMS it's used by the media Boomer_Ang for creating video content from research outputs and user descriptions.

## API Key Setup

| Variable | Required | Where to Get |
|----------|----------|--------------|
| `KLING_API_KEY` | Yes | Kling AI platform |

**Apply in:** `frontend/.env.local` or `infra/.env.production`

## AIMS Usage

```typescript
import { klingVideo } from '@/lib/kling-video';

// Analyze prompt for video generation
const analysis = await klingVideo.analyzePrompt('A futuristic AI dashboard');

// Generate video
const result = await klingVideo.generate({
  prompt: 'A futuristic AI dashboard with holographic displays',
  duration: 5,
  aspectRatio: '16:9',
});
```

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Generation timeout | Videos take 2-5 min; increase timeout |
| Low quality output | Improve prompt specificity |
