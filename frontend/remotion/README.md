# Prompting Videos with Claude Code

> Create videos just from prompting. This is the easy way to produce Remotion content for A.I.M.S.

## Prerequisites

- [Claude Code](https://claude.com/product/claude-code) (paid subscription)
- [Node.js](https://nodejs.org/en) v18+
- Remotion packages installed (`npm install` in `frontend/`)

## Quick Start (Existing Project)

This project already has Remotion wired up. No scaffolding needed.

### 1. Start the preview

```bash
cd frontend
npm run remotion:studio
```

This opens Remotion Studio at **http://localhost:3001** with all compositions in the sidebar.

### 2. Start Claude Code

Open a separate terminal:

```bash
cd /path/to/AIMS
claude
```

Now prompt a video. Claude Code will read the skill file (`aims-skills/skills/remotion-video.skill.md`) and follow the architecture automatically.

## Prompting Guide

### Simple prompts that work

```
"Create a 10-second promo video for A.I.M.S. showing the three main features"
"Make a social clip for the Book of V.I.B.E. — just the NIL and Elder scenes, 9:16 portrait"
"Build a deployment animation that shows Docker containers spinning up"
"Render the BookOfVibeIntro to MP4"
```

### Be specific about what you want

| What to specify | Example |
|----------------|---------|
| Duration | "Make it 15 seconds" |
| Format | "Portrait for TikTok" or "Square for Instagram" |
| Scene count | "3 scenes: intro, features, CTA" |
| Theme | "Use the AIMS gold/obsidian theme" or "Book of V.I.B.E. aesthetic" |
| Text content | "Headline should say 'Ship Faster'" |
| Transitions | "Fade between scenes" or "Slide transitions" |
| Output | "Render to MP4" or "Just build the composition, don't render" |

### Prompts for existing compositions

```
"Render BookOfVibeIntro-Landscape to out/vibe.mp4"
"Change the BookOfVibeIntro subtitle to 'The Origin Story'"
"Add a new scene to the Book of V.I.B.E. intro after the Elder scene"
```

## Starting Fresh (New Standalone Project)

If you want a standalone Remotion project separate from A.I.M.S.:

```bash
npx create-video@latest
```

Recommended settings:
- Select the **Blank** template
- Say **yes** to TailwindCSS
- Say **yes** to install Skills

Then:

```bash
cd my-video
npm install
npm run dev     # Start Remotion Studio
```

In a separate terminal:

```bash
cd my-video
claude          # Start Claude Code and prompt away
```

## Project Architecture

```
frontend/remotion/
├── Root.tsx                              # Composition registry
├── compositions/
│   ├── BookOfVibeIntro/                  # ✅ v4 pattern (schema + scenes)
│   │   ├── index.tsx                     # Main composition with TransitionSeries
│   │   ├── schema.ts                     # Zod schema for visual editing
│   │   ├── constants.ts                  # Scene timing
│   │   └── scenes/
│   │       ├── NilVoid.tsx               # Scene 1: The void
│   │       ├── FirstFrequency.tsx        # Scene 2: Energy burst
│   │       ├── ElderAwakens.tsx          # Scene 3: First consciousness
│   │       ├── AcheevyRises.tsx          # Scene 4: Pentaharmonic convergence
│   │       └── TitleCard.tsx             # Scene 5: Title reveal
│   ├── AIMSIntro.tsx                     # Legacy single-file compositions
│   ├── FeatureShowcase.tsx               # ↓
│   ├── DeploymentAnimation.tsx
│   ├── PortTransition.tsx
│   ├── AcheevyCharacter.tsx
│   ├── PlugMeIn.tsx
│   └── WelcomeVideo.tsx
├── components/animations/                # Shared animation primitives
│   ├── FadeIn.tsx
│   ├── SlideIn.tsx
│   └── TypewriterText.tsx
└── styles/
    ├── theme.ts                          # AIMS colors + V.I.B.E. palette
    ├── typography.ts                     # Font styles
    └── animations.ts                     # Spring presets
```

## Available Compositions

| Folder | ID | Resolution | Duration |
|--------|----|-----------|----------|
| BookOfVIBE | `BookOfVibeIntro-Landscape` | 1920x1080 | ~17s |
| BookOfVIBE | `BookOfVibeIntro-Portrait` | 1080x1920 | ~17s |
| AIMSPlatform | `AIMSIntro` | 1920x1080 | 5s |
| AIMSPlatform | `FeatureShowcase` | 1920x1080 | 10s |
| AIMSPlatform | `Deployment` | 1920x1080 | 8s |
| AIMSPlatform | `PortTransition` | 1920x1080 | 10s |
| AIMSPlatform | `AcheevyCharacter` | 1920x1080 | 6s |
| AIMSPlatform | `PlugMeIn` | 1920x1080 | 5s |
| AIMSPlatform | `WelcomeVideo` | 800x1080 | 6s |

## Commands

```bash
# Studio (visual preview + prop editing)
npm run remotion:studio

# Render specific composition
npm run remotion:render -- BookOfVibeIntro-Landscape out/vibe-intro.mp4

# Render with explicit CLI + quality settings
npx remotion render remotion/Root.tsx BookOfVibeIntro-Landscape out/vibe-hq.mp4 --codec h264 --crf 18

# Benchmark render speed
npx remotion benchmark remotion/Root.tsx BookOfVibeIntro-Landscape
```

## Rules for New Compositions

All compositions must follow the patterns in `aims-skills/skills/remotion-video.skill.md`:

1. **Zod schema** — every composition gets a `schema.ts` with typed props
2. **Scene folders** — scenes in `scenes/` subdirectory, not inline
3. **`useCurrentFrame()`** — all animations frame-driven, no CSS animations
4. **`staticFile()`** — all assets from `public/remotion/`
5. **`type` not `interface`** — for Remotion prop compatibility
6. **AIMS theme** — import colors from `styles/theme.ts`
7. **Multi-format** — register landscape + portrait variants
8. **No `as any`** — use Zod schemas on `<Composition>` instead

## Video Pipeline Options

| Pipeline | Flow | Best For |
|----------|------|----------|
| **Remotion-only** | Prompt → Claude builds composition → Render | Motion graphics, branded intros, data visualizations |
| **Kling.ai-only** | Prompt → Kling generates raw video | Photorealistic footage, cinematic shots |
| **Hybrid** | Gemini research → Script → Kling raw footage → Remotion overlays/branding | Full production videos with AI footage + branded polish |
