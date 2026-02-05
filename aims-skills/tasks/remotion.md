---
id: "remotion"
name: "Remotion Video Generator"
type: "task"
status: "active"
triggers:
  - "video"
  - "render"
  - "remotion"
  - "composition"
  - "animation"
  - "clip"
  - "footage"
  - "motion"
description: "Generate and render video compositions using Remotion with Gemini-powered scripts."
execution:
  target: "api"
  route: "/api/skills/remotion"
  command: "npm run remotion:render"
dependencies:
  env:
    - "GEMINI_API_KEY"
  packages:
    - "@remotion/cli"
    - "@remotion/player"
    - "remotion"
  files:
    - "frontend/remotion/Root.tsx"
    - "frontend/remotion/compositions/"
    - "frontend/remotion.config.ts"
    - "frontend/lib/gemini-research.ts"
priority: "medium"
---

# Remotion Video Generator Task

## Available Compositions

| Composition | Duration | Description |
|-------------|----------|-------------|
| AIMSIntro | 5s | Landing intro with A.I.M.S. branding, gold/obsidian theme |
| FeatureShowcase | 10s | Staggered card animations showing 3 platform features |
| DeploymentAnimation | 8s | Terminal-style deployment progress animation |

## Studio Commands
```bash
cd frontend
npm run remotion:studio    # Opens at http://localhost:3001
npm run remotion:render    # Renders to output file
```

## Gemini-to-Video Pipeline
1. User provides a topic/prompt
2. `geminiResearch.research(prompt)` generates structured research
3. `geminiResearch.generateVideoScript(research)` creates scene-by-scene script
4. Script feeds into Remotion composition as props
5. Render produces video file

```typescript
import { geminiResearch } from "@/lib/gemini-research";

const research = await geminiResearch.research("How containerized AI works");
const script = await geminiResearch.generateVideoScript(research);
// script contains [Scene 1: Intro], [Scene 2: Key Point], etc.
```

## Creating New Compositions
1. Add `.tsx` file to `frontend/remotion/compositions/`
2. Register in `frontend/remotion/Root.tsx`
3. Export with `<Composition>` wrapper specifying fps, width, height, duration

## Config
- Output format: JPEG (set in remotion.config.ts)
- Overwrite output: enabled
