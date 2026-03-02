---
name: remotion-video
description: |
  Remotion Video Production skill for A.I.M.S.
  Use when: building video compositions, rendering clips, creating animated promo/intro videos,
  managing scene architecture, or working with Remotion v4+ in the frontend.
role: Specialist Executor
intent: Guide production-quality Remotion v4+ video composition, scene management, animation, and rendering.
kpis:
  - render_success_rate
  - composition_quality_score
  - scene_reuse_rate
status: active
priority: high
triggers:
  - remotion
  - video
  - render
  - composition
  - animation
  - clip
  - footage
  - motion
  - video script
  - promo video
  - intro video
execution: sequential
dependencies:
  - GEMINI_API_KEY
  - "@remotion/cli"
  - "@remotion/player"
  - "@remotion/transitions"
  - "remotion"
  - "frontend/remotion/"
---

# Remotion Video Production

## Project Structure

```
frontend/remotion/
  Root.tsx              # Top-level <Composition> registry
  compositions/         # One file per video composition
  scenes/               # Reusable scene components
  components/           # Shared atoms (text blocks, overlays, logos)
  hooks/                # Custom hooks (useVideoData, useAudioSync)
  lib/                  # Utility functions (easing, color, math)
  assets/               # Static media (images, audio, fonts)
```

## Cardinal Rules

1. **Always use `useCurrentFrame()` and `useVideoConfig()`** for timing. Never use `requestAnimationFrame`, `setTimeout`, or CSS animation. All motion derives from the Remotion frame clock.

2. **Use `type` not `interface`** for all prop definitions. This keeps the codebase consistent with the rest of A.I.M.S. frontend conventions.

3. **Use `staticFile()` for all asset references.** Never use relative paths or `import` for media files. Place assets in `public/` and reference via `staticFile('filename.ext')`.

4. **Express timing in seconds * fps.** All durations and delays must be calculated as `seconds * fps` (e.g., `2 * 30 = 60 frames` for 2 seconds at 30fps). Never hard-code frame numbers without documenting the intended duration.

5. **No `as any` casts.** Type everything properly. If a type is missing, define it. If a library lacks types, create a `.d.ts` declaration file.

## Composition Registration Pattern

Every composition must be registered in `Root.tsx`:

```tsx
import { Composition } from 'remotion';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="PromoVideo"
        component={PromoVideo}
        durationInFrames={30 * 60}  // 60 seconds at 30fps
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          title: 'A.I.M.S.',
          subtitle: 'AI Managed Solutions',
        }}
      />
    </>
  );
};
```

## Scene Architecture with TransitionSeries

Use `@remotion/transitions` for scene sequencing:

```tsx
import { TransitionSeries, linearTiming } from '@remotion/transitions';
import { slide } from '@remotion/transitions/slide';

const MyVideo: React.FC = () => {
  return (
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={90}>
        <IntroScene />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        presentation={slide()}
        timing={linearTiming({ durationInFrames: 15 })}
      />
      <TransitionSeries.Sequence durationInFrames={120}>
        <MainContentScene />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        presentation={slide()}
        timing={linearTiming({ durationInFrames: 15 })}
      />
      <TransitionSeries.Sequence durationInFrames={90}>
        <OutroScene />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );
};
```

## A.I.M.S. Design Theme Colors

```ts
export const AIMS_VIDEO_THEME = {
  gold: '#D4A843',
  darkBg: '#0A0A0F',
  cardBg: '#1A1A2E',
  glassBg: 'rgba(26, 26, 46, 0.8)',
  text: '#F8FAFC',
  textMuted: '#94A3B8',
  accent: '#D4A843',
  accentGlow: 'rgba(212, 168, 67, 0.3)',
} as const;
```

## Multi-Format Output

Support these render targets:

| Format | Resolution | FPS | Use Case |
|--------|-----------|-----|----------|
| Landscape | 1920x1080 | 30 | Website hero, YouTube |
| Portrait | 1080x1920 | 30 | Instagram Stories, TikTok |
| Square | 1080x1080 | 30 | Instagram Feed, Twitter |
| Thumbnail | 1280x720 | 1 | Video thumbnails |

## Render Commands

```bash
# Preview
npx remotion preview frontend/remotion/index.ts

# Render single composition
npx remotion render frontend/remotion/index.ts PromoVideo out/promo.mp4

# Render with custom props
npx remotion render frontend/remotion/index.ts PromoVideo out/promo.mp4 \
  --props='{"title":"Custom Title"}'

# Render still frame (thumbnail)
npx remotion still frontend/remotion/index.ts PromoVideo out/thumb.png --frame=90
```

## References

- `references/api-patterns.md` — Animation toolkit examples, full theme/typography definitions, calculateMetadata examples, quality checklist
- `references/acceptance-criteria.md` — Acceptance criteria for this skill
