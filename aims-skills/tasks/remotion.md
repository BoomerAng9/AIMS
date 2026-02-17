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
    - "remotion"
    - "@remotion/cli"
    - "@remotion/player"
    - "@remotion/transitions"
    - "@remotion/zod-types"
    - "@remotion/google-fonts"
    - "zod"
  files:
    - "frontend/remotion/Root.tsx"
    - "frontend/remotion/compositions/"
    - "frontend/remotion/components/"
    - "frontend/remotion/styles/"
    - "frontend/remotion.config.ts"
    - "frontend/lib/gemini-research.ts"
priority: "medium"
---

# Remotion Video Generator Task

> For the full production skill (architecture, rules, patterns), see `skills/remotion-video.skill.md`.
> This file is the executable task registry — what compositions exist and how to run them.

## Available Compositions

### BookOfVIBE Folder

| Composition | Resolution | Duration | Description |
|-------------|-----------|----------|-------------|
| BookOfVibeIntro-Landscape | 1920x1080 | ~17s | 5-scene V.I.B.E. origin story: The Void → First Frequency → Elder → ACHEEVY → Title Card |
| BookOfVibeIntro-Portrait | 1080x1920 | ~17s | Same intro, portrait format for TikTok/Reels/Stories |

### AIMSPlatform Folder (Legacy)

| Composition | Resolution | Duration | Description |
|-------------|-----------|----------|-------------|
| AIMSIntro | 1920x1080 | 5s | Landing intro with A.I.M.S. branding, gold/obsidian theme |
| FeatureShowcase | 1920x1080 | 10s | Staggered card animations showing 3 platform features |
| Deployment | 1920x1080 | 8s | Terminal-style deployment progress animation |
| PortTransition | 1920x1080 | 10s | Ken Burns port dock with HUD overlay |
| AcheevyCharacter | 1920x1080 | 6s | Character entrance with particles and speech bubble |
| PlugMeIn | 1920x1080 | 5s | Wireframe rings + connector pulse animation |
| WelcomeVideo | 800x1080 | 6s | Auth page right-column video (portrait) |

## Commands

```bash
# Open Remotion Studio (visual preview + prop editor)
cd frontend && npm run remotion:studio

# Render a specific composition to MP4
cd frontend && npm run remotion:render -- BookOfVibeIntro-Landscape out/book-of-vibe-intro.mp4

# Render with explicit CLI
cd frontend && npx remotion render remotion/Root.tsx BookOfVibeIntro-Landscape out/book-of-vibe-intro.mp4

# Render at higher quality
cd frontend && npx remotion render remotion/Root.tsx BookOfVibeIntro-Landscape out/vibe-hq.mp4 --codec h264 --crf 18

# Render portrait variant
cd frontend && npx remotion render remotion/Root.tsx BookOfVibeIntro-Portrait out/vibe-portrait.mp4

# Find optimal render concurrency
cd frontend && npx remotion benchmark remotion/Root.tsx BookOfVibeIntro-Landscape
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

Follow the structure in `skills/remotion-video.skill.md`:

1. Create folder under `frontend/remotion/compositions/<Name>/`
2. Add `schema.ts` (Zod schema), `index.tsx` (main component), `constants.ts` (timing)
3. Add scene components in `scenes/` subdirectory
4. Register in `frontend/remotion/Root.tsx` with Zod schema, defaultProps, and Folder grouping
5. Add landscape + portrait variants

## Shared Resources

| Resource | Path | Purpose |
|----------|------|---------|
| Theme | `frontend/remotion/styles/theme.ts` | AIMS Circuit Box palette + V.I.B.E. character colors |
| Typography | `frontend/remotion/styles/typography.ts` | Font families, sizes, weights |
| Spring Presets | `frontend/remotion/styles/animations.ts` | smooth, snappy, bouncy, heavy, popIn, dramatic |
| FadeIn | `frontend/remotion/components/animations/FadeIn.tsx` | Opacity fade with delay/duration |
| SlideIn | `frontend/remotion/components/animations/SlideIn.tsx` | Directional slide with spring |
| TypewriterText | `frontend/remotion/components/animations/TypewriterText.tsx` | Character-by-character reveal |

## Config

- Output format: JPEG (set in `frontend/remotion.config.ts`)
- Overwrite output: enabled
- Default fps: 30
- Default resolution: 1920x1080 (landscape), 1080x1920 (portrait)
