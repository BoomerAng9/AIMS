---
id: "remotion-video"
name: "Remotion Video Production"
type: "skill"
status: "active"
triggers:
  - "remotion"
  - "video"
  - "render"
  - "composition"
  - "animation"
  - "clip"
  - "footage"
  - "motion"
  - "video script"
  - "promo video"
  - "intro video"
description: "Production-quality Remotion video skill. Guides composition architecture, scene management, animation, and rendering using Remotion v4+ best practices."
execution:
  target: "internal"
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
priority: "high"
---

# Remotion Video Production Skill

> This skill is loaded whenever ACHEEVY receives a video/render/composition prompt.
> It enforces production-quality Remotion patterns and prevents the garbage-tier
> output of inline-everything compositions.

---

## 1. Project Structure (MANDATORY)

Every Remotion video lives inside `frontend/remotion/`. Follow this structure exactly:

```
frontend/remotion/
│
├── Root.tsx                         # Composition registry — registerRoot() lives here
│
├── compositions/                    # Each video type = its own folder
│   ├── MarketingPromo/
│   │   ├── index.tsx                # Main composition component
│   │   ├── schema.ts                # Zod schema for props
│   │   ├── metadata.ts              # calculateMetadata (dynamic duration, data fetching)
│   │   ├── scenes/                  # Discrete scenes within the video
│   │   │   ├── Intro.tsx
│   │   │   ├── Problem.tsx
│   │   │   ├── Solution.tsx
│   │   │   ├── CallToAction.tsx
│   │   │   └── Outro.tsx
│   │   ├── components/              # Composition-specific pieces
│   │   │   ├── FeatureCard.tsx
│   │   │   └── PricingBadge.tsx
│   │   └── constants.ts             # Timing + layout values for this composition
│   │
│   └── SocialClip/
│       ├── index.tsx
│       ├── schema.ts
│       └── scenes/
│
├── components/                      # SHARED across all compositions
│   ├── animations/
│   │   ├── FadeIn.tsx
│   │   ├── SlideIn.tsx
│   │   ├── ScaleIn.tsx
│   │   └── TypewriterText.tsx
│   ├── overlays/
│   │   ├── LowerThird.tsx
│   │   ├── Watermark.tsx
│   │   └── ProgressBar.tsx
│   ├── backgrounds/
│   │   ├── GradientBg.tsx
│   │   ├── ParticleBg.tsx
│   │   └── VideoBg.tsx
│   ├── transitions/
│   │   └── TransitionPresets.ts
│   └── layout/
│       ├── CenteredContent.tsx
│       ├── SplitScreen.tsx
│       └── SafeArea.tsx
│
├── styles/
│   ├── theme.ts                     # Colors, gradients, shadows
│   ├── typography.ts                # Font families, sizes, weights
│   └── animations.ts                # Spring presets, easing configs
│
├── hooks/
│   ├── useAnimatedValue.ts
│   └── useFontLoader.ts
│
└── utils/
    ├── timing.ts                    # seconds(), frames() helpers
    └── colors.ts
```

### Static Assets

All assets go in `frontend/public/remotion/` and are accessed via `staticFile()`:

```
frontend/public/remotion/
├── fonts/
├── images/
├── audio/
│   ├── music/
│   └── sfx/
└── video/
```

---

## 2. The Cardinal Rules

### Rule 1: ALL animations via `useCurrentFrame()`

CSS animations, CSS transitions, Tailwind animate utilities, and Motion (formerly Framer Motion) are **FORBIDDEN** in Remotion compositions. They do not render correctly in frame-by-frame rendering.

```typescript
// CORRECT
const frame = useCurrentFrame();
const opacity = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: "clamp" });

// WRONG — will NOT render in video output
<div className="animate-fadeIn" />
<motion.div animate={{ opacity: 1 }} />
```

### Rule 2: `type` not `interface` for props

Interfaces don't satisfy `Record<string, unknown>` which Remotion requires.

```typescript
// CORRECT
export type VideoProps = z.infer<typeof videoSchema>;

// WRONG — will cause TypeScript error with Composition
export interface VideoProps { ... }
```

### Rule 3: `staticFile()` for all assets

Never use raw paths. Remotion resolves assets from `public/` via `staticFile()`.

```typescript
import { staticFile } from "remotion";
const logo = staticFile("remotion/images/logo.png");
```

### Rule 4: Express timing in seconds * fps

Never hardcode frame numbers. This keeps compositions frame-rate independent.

```typescript
const { fps } = useVideoConfig();
const fadeIn = 1.5 * fps;   // 1.5 seconds at any fps
const hold = 3 * fps;       // 3 seconds
```

### Rule 5: No `as any` on Composition components

Use proper Zod schemas with `schema` prop instead of `as any` type casts.

---

## 3. Composition Registration (Root.tsx Pattern)

Every composition MUST have: Zod schema, defaultProps, and be grouped with `<Folder>`.

```typescript
import { Composition, Folder, registerRoot } from "remotion";
import { z } from "zod";

// Import compositions
import { MarketingPromo } from "./compositions/MarketingPromo";
import { marketingPromoSchema } from "./compositions/MarketingPromo/schema";

export const RemotionRoot: React.FC = () => (
  <>
    <Folder name="Marketing">
      <Composition
        id="MarketingPromo-Landscape"
        component={MarketingPromo}
        schema={marketingPromoSchema}
        defaultProps={{
          headline: "AI Managed Solutions",
          primaryColor: "#D4AF37",
          // ... all schema fields with defaults
        }}
        fps={30}
        width={1920}
        height={1080}
        durationInFrames={300}
      />
      <Composition
        id="MarketingPromo-Portrait"
        component={MarketingPromo}
        schema={marketingPromoSchema}
        defaultProps={{ /* same */ }}
        fps={30}
        width={1080}
        height={1920}
        durationInFrames={300}
      />
    </Folder>
  </>
);

registerRoot(RemotionRoot);
```

---

## 4. Schema Pattern (Every Composition Gets One)

```typescript
// compositions/MarketingPromo/schema.ts
import { z } from "zod";
import { zColor } from "@remotion/zod-types";

export const marketingPromoSchema = z.object({
  headline: z.string(),
  subheadline: z.string(),
  primaryColor: zColor(),
  accentColor: zColor(),
  logoUrl: z.string(),
  scenes: z.array(z.object({
    title: z.string(),
    body: z.string(),
    imageUrl: z.string().optional(),
  })),
  musicVolume: z.number().min(0).max(1).step(0.1),
  showWatermark: z.boolean(),
});

export type MarketingPromoProps = z.infer<typeof marketingPromoSchema>;
```

This gives you:
- **Visual editing in Remotion Studio** (color pickers, sliders, toggles)
- **Runtime validation** of prop data
- **Type inference** — no manual type definitions

---

## 5. Scene Architecture

### Use `<TransitionSeries>` for scene sequencing

```typescript
import { TransitionSeries } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { linearTiming, springTiming } from "@remotion/transitions";

export const MarketingPromo: React.FC<MarketingPromoProps> = (props) => {
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ backgroundColor: "#050505" }}>
      {/* Audio layer */}
      <Audio src={staticFile("remotion/audio/music/ambient.mp3")} volume={props.musicVolume} />

      {/* Scene sequence */}
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={3 * fps}>
          <IntroScene headline={props.headline} color={props.primaryColor} />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={slide({ direction: "from-right" })}
          timing={springTiming({ config: { damping: 200 } })}
        />

        <TransitionSeries.Sequence durationInFrames={4 * fps}>
          <ProblemScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: Math.round(0.5 * fps) })}
        />

        <TransitionSeries.Sequence durationInFrames={3 * fps}>
          <CTAScene accent={props.accentColor} />
        </TransitionSeries.Sequence>
      </TransitionSeries>

      {/* Persistent overlay */}
      {props.showWatermark && <Watermark />}
    </AbsoluteFill>
  );
};
```

### Scene Component Pattern

Each scene is a self-contained component that uses `useCurrentFrame()` relative to its own start:

```typescript
// scenes/Intro.tsx
export const IntroScene: React.FC<{ headline: string; color: string }> = ({ headline, color }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleScale = spring({ frame, fps, config: { damping: 200 } });
  const titleOpacity = interpolate(frame, [0, 0.5 * fps], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <div style={{
        transform: `scale(${titleScale})`,
        opacity: titleOpacity,
        color,
        fontSize: 72,
        fontFamily: "Inter",
        fontWeight: 700,
      }}>
        {headline}
      </div>
    </AbsoluteFill>
  );
};
```

---

## 6. Animation Toolkit

### Spring Presets (use from `styles/animations.ts`)

```typescript
export const springPresets = {
  smooth:  { damping: 200 },                          // Subtle reveals, text fades
  snappy:  { damping: 20, stiffness: 200 },            // UI elements, buttons
  bouncy:  { damping: 8 },                              // Playful logos, icons
  heavy:   { damping: 15, stiffness: 80, mass: 2 },    // Slow, weighty motion
  popIn:   { damping: 12, stiffness: 250 },             // Card entrances
};
```

### Reusable Animation Components

```typescript
// components/animations/FadeIn.tsx
export const FadeIn: React.FC<{
  children: React.ReactNode;
  delay?: number;       // frames to wait before starting
  duration?: number;    // frames for the fade
}> = ({ children, delay = 0, duration = 20 }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [delay, delay + duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return <div style={{ opacity }}>{children}</div>;
};
```

```typescript
// components/animations/SlideIn.tsx
export const SlideIn: React.FC<{
  children: React.ReactNode;
  from?: "left" | "right" | "top" | "bottom";
  delay?: number;
}> = ({ children, from = "left", delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame: Math.max(0, frame - delay),
    fps,
    config: { damping: 200 },
  });

  const axis = from === "left" || from === "right" ? "X" : "Y";
  const sign = from === "left" || from === "top" ? -1 : 1;
  const offset = interpolate(progress, [0, 1], [sign * 100, 0]);

  return (
    <div style={{ transform: `translate${axis}(${offset}px)`, opacity: progress }}>
      {children}
    </div>
  );
};
```

```typescript
// components/animations/TypewriterText.tsx
export const TypewriterText: React.FC<{
  text: string;
  charsPerSecond?: number;
  style?: React.CSSProperties;
}> = ({ text, charsPerSecond = 25, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const visibleChars = Math.floor((frame / fps) * charsPerSecond);

  return (
    <span style={style}>
      {text.slice(0, visibleChars)}
      {visibleChars < text.length && <span style={{ opacity: frame % 15 < 8 ? 1 : 0 }}>|</span>}
    </span>
  );
};
```

---

## 7. AIMS Design Theme

All AIMS compositions use the Circuit Box palette:

```typescript
// styles/theme.ts
export const aimsTheme = {
  colors: {
    ink: "#050505",
    obsidian: "#0A0A0A",
    gold: "#D4AF37",
    goldMuted: "#B8941F",
    chrome: "#C0C0C0",
    glass: "rgba(255, 255, 255, 0.05)",
    surface: "#1A1A1A",
    text: {
      primary: "#F8FAFC",
      secondary: "#94A3B8",
      muted: "#64748B",
    },
    signal: {
      green: "#22C55E",
      red: "#EF4444",
      amber: "#F59E0B",
      blue: "#3B82F6",
    },
  },
  gradients: {
    goldShine: "linear-gradient(135deg, #D4AF37 0%, #F5D76E 50%, #D4AF37 100%)",
    darkFade: "linear-gradient(180deg, #050505 0%, #1A1A1A 100%)",
    glassPanel: "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)",
  },
  shadows: {
    card: "0 4px 24px rgba(0, 0, 0, 0.5)",
    glow: "0 0 30px rgba(212, 175, 55, 0.3)",
    elevated: "0 20px 40px rgba(0, 0, 0, 0.7)",
  },
};
```

```typescript
// styles/typography.ts
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadDoto } from "@remotion/google-fonts/DotGothic16";

export const fonts = {
  heading: loadInter("normal", { weights: ["700"], subsets: ["latin"] }),
  body: loadInter("normal", { weights: ["400", "500"], subsets: ["latin"] }),
  mono: loadDoto("normal", { weights: ["400"], subsets: ["latin"] }),
};

export const textStyles = {
  h1: { fontFamily: fonts.heading.fontFamily, fontWeight: 700, fontSize: 72 },
  h2: { fontFamily: fonts.heading.fontFamily, fontWeight: 700, fontSize: 56 },
  h3: { fontFamily: fonts.heading.fontFamily, fontWeight: 700, fontSize: 42 },
  body: { fontFamily: fonts.body.fontFamily, fontWeight: 400, fontSize: 24 },
  bodyLg: { fontFamily: fonts.body.fontFamily, fontWeight: 500, fontSize: 32 },
  code: { fontFamily: fonts.mono.fontFamily, fontWeight: 400, fontSize: 20 },
};
```

---

## 8. Multi-Format Output

Register landscape, portrait, and square variants of the same composition:

```typescript
const FORMATS = {
  landscape: { width: 1920, height: 1080 },  // YouTube, web
  portrait:  { width: 1080, height: 1920 },  // TikTok, Reels, Stories
  square:    { width: 1080, height: 1080 },  // Instagram feed
} as const;
```

Inside compositions, adapt layout with `useVideoConfig()`:

```typescript
const { width, height } = useVideoConfig();
const isPortrait = height > width;
const headingSize = isPortrait ? 56 : 72;
```

---

## 9. Audio

```typescript
import { Audio, Sequence, staticFile, interpolate, useCurrentFrame } from "remotion";

// Background music with fade-in
const MusicTrack: React.FC<{ volume: number }> = ({ volume }) => {
  const frame = useCurrentFrame();
  const fadeIn = interpolate(frame, [0, 30], [0, volume], { extrapolateRight: "clamp" });
  return <Audio src={staticFile("remotion/audio/music/ambient.mp3")} volume={fadeIn} />;
};

// Sound effect at a specific moment
<Sequence from={60} durationInFrames={45}>
  <Audio src={staticFile("remotion/audio/sfx/whoosh.mp3")} volume={0.6} />
</Sequence>
```

---

## 10. calculateMetadata (Dynamic Duration)

When scene count or content is dynamic, use `calculateMetadata` instead of hardcoded `durationInFrames`:

```typescript
// compositions/MarketingPromo/metadata.ts
import { CalculateMetadataFunction } from "remotion";
import { MarketingPromoProps } from "./schema";

export const calculateMarketingMetadata: CalculateMetadataFunction<
  MarketingPromoProps
> = async ({ props }) => {
  const fps = 30;
  const introDuration = 3 * fps;
  const sceneDuration = 4 * fps;
  const outroDuration = 3 * fps;
  const transitionOverlap = 0.5 * fps;
  const sceneCount = props.scenes.length;

  const totalDuration =
    introDuration +
    (sceneCount * sceneDuration) -
    ((sceneCount - 1) * transitionOverlap) +
    outroDuration;

  return { durationInFrames: Math.round(totalDuration) };
};
```

---

## 11. Commands

```bash
# Open Remotion Studio (visual preview + prop editor)
cd frontend && npx remotion studio remotion/Root.tsx --port 3001

# Render a specific composition to MP4
cd frontend && npx remotion render remotion/Root.tsx <CompositionId> out/<name>.mp4

# Render at higher quality
cd frontend && npx remotion render remotion/Root.tsx <CompositionId> out/<name>.mp4 --codec h264 --crf 18

# Render portrait variant
cd frontend && npx remotion render remotion/Root.tsx MarketingPromo-Portrait out/promo-portrait.mp4

# Find optimal render concurrency
cd frontend && npx remotion benchmark remotion/Root.tsx <CompositionId>
```

---

## 12. Workflow: When User Asks for a Video

1. **Clarify the brief** — What is the video for? (promo, explainer, social clip, intro)
2. **Pick or create a composition** — Check existing compositions first. Create new one if needed.
3. **Follow the folder structure** — New composition = new folder under `compositions/` with `index.tsx`, `schema.ts`, `scenes/`.
4. **Use shared components** — Pull from `components/animations/`, `components/overlays/`, `components/backgrounds/`.
5. **Apply AIMS theme** — Import from `styles/theme.ts` and `styles/typography.ts`.
6. **Register in Root.tsx** — With Zod schema, defaultProps, Folder grouping, and format variants.
7. **Test in Studio** — `npx remotion studio remotion/Root.tsx --port 3001`
8. **Render** — `npx remotion render remotion/Root.tsx <id> out/<name>.mp4`

---

## 13. Quality Checklist

Before marking a composition "done":

- [ ] Uses Zod schema with `defaultProps` — no `as any`
- [ ] All timing expressed as `seconds * fps`, never hardcoded frame numbers
- [ ] All animations driven by `useCurrentFrame()` — zero CSS/Framer animations
- [ ] All assets via `staticFile()` — no raw paths
- [ ] Scenes are separate components in `scenes/` directory
- [ ] Shared animation components used where possible
- [ ] Theme colors from `styles/theme.ts`, not inline hex values
- [ ] Fonts loaded via `@remotion/google-fonts` or `delayRender` pattern
- [ ] Transitions between scenes via `@remotion/transitions`
- [ ] Plays correctly in Remotion Studio
- [ ] Registered with landscape + portrait variants where applicable
