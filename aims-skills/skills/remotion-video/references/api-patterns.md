# API Patterns: remotion-video

Extended code examples, theme definitions, and quality patterns extracted from the full skill reference.

## Animation Toolkit

### Fade In

```tsx
import { useCurrentFrame, useVideoConfig, interpolate } from 'remotion';

const FadeIn: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const opacity = interpolate(frame, [0, 0.5 * fps], [0, 1], {
    extrapolateRight: 'clamp',
  });
  return <div style={{ opacity }}>{children}</div>;
};
```

### Slide In From Left

```tsx
const SlideInLeft: React.FC<{ children: React.ReactNode; delay?: number }> = ({
  children,
  delay = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const startFrame = delay * fps;
  const translateX = interpolate(
    frame,
    [startFrame, startFrame + 0.5 * fps],
    [-100, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );
  const opacity = interpolate(
    frame,
    [startFrame, startFrame + 0.3 * fps],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );
  return (
    <div style={{ transform: `translateX(${translateX}%)`, opacity }}>
      {children}
    </div>
  );
};
```

### Scale Bounce

```tsx
import { spring } from 'remotion';

const ScaleBounce: React.FC<{ children: React.ReactNode; delay?: number }> = ({
  children,
  delay = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const scale = spring({
    frame: frame - delay * fps,
    fps,
    config: { damping: 12, stiffness: 200, mass: 0.5 },
  });
  return (
    <div style={{ transform: `scale(${scale})` }}>{children}</div>
  );
};
```

### Typewriter Text

```tsx
const Typewriter: React.FC<{ text: string; startFrame?: number }> = ({
  text,
  startFrame = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const charsPerSecond = 20;
  const elapsed = Math.max(0, frame - startFrame);
  const charsToShow = Math.floor((elapsed / fps) * charsPerSecond);
  const visibleText = text.slice(0, charsToShow);
  return (
    <span style={{ fontFamily: 'monospace' }}>
      {visibleText}
      {charsToShow < text.length && (
        <span style={{ opacity: frame % (fps / 2) < fps / 4 ? 1 : 0 }}>|</span>
      )}
    </span>
  );
};
```

## Full Theme & Typography Definitions

```ts
export const AIMS_VIDEO_THEME = {
  // Backgrounds
  darkBg: '#0A0A0F',
  cardBg: '#1A1A2E',
  glassBg: 'rgba(26, 26, 46, 0.8)',
  surfaceBg: '#16213E',

  // Gold palette
  gold: '#D4A843',
  goldLight: '#E8C96A',
  goldDark: '#B8922F',
  goldGlow: 'rgba(212, 168, 67, 0.3)',
  goldBorder: 'rgba(212, 168, 67, 0.2)',

  // Text
  textPrimary: '#F8FAFC',
  textSecondary: '#CBD5E1',
  textMuted: '#94A3B8',
  textDark: '#1E293B',

  // Status
  success: '#22C55E',
  error: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',
} as const;

export const AIMS_VIDEO_TYPOGRAPHY = {
  heading: {
    fontFamily: 'Inter, system-ui, sans-serif',
    fontWeight: 700,
    sizes: {
      xl: 72,    // Hero titles
      lg: 56,    // Section headers
      md: 42,    // Subsection headers
      sm: 32,    // Card titles
    },
  },
  body: {
    fontFamily: 'Inter, system-ui, sans-serif',
    fontWeight: 400,
    sizes: {
      lg: 24,    // Large body
      md: 20,    // Standard body
      sm: 16,    // Small body / captions
    },
  },
  mono: {
    fontFamily: 'JetBrains Mono, Fira Code, monospace',
    fontWeight: 400,
    sizes: {
      lg: 20,
      md: 16,
      sm: 14,
    },
  },
} as const;
```

## calculateMetadata Examples

### Dynamic Duration Based on Data

```tsx
import { CalculateMetadataFunction } from 'remotion';

type VideoProps = {
  items: Array<{ title: string; description: string }>;
  secondsPerItem: number;
};

export const calculateMetadata: CalculateMetadataFunction<VideoProps> = ({
  props,
}) => {
  const introFrames = 3 * 30; // 3 seconds
  const outroFrames = 3 * 30; // 3 seconds
  const itemFrames = props.items.length * props.secondsPerItem * 30;
  const transitionFrames = (props.items.length - 1) * 15; // 0.5s per transition

  return {
    durationInFrames: introFrames + itemFrames + transitionFrames + outroFrames,
    fps: 30,
    width: 1920,
    height: 1080,
  };
};
```

### Fetching Data for Composition

```tsx
export const calculateMetadata: CalculateMetadataFunction<VideoProps> = async ({
  props,
}) => {
  const response = await fetch(props.dataUrl);
  const data = await response.json();

  return {
    durationInFrames: data.scenes.length * 5 * 30, // 5 seconds per scene
    props: {
      ...props,
      scenes: data.scenes,
    },
  };
};
```

## Quality Checklist (Extended)

### Visual Quality
- [ ] No render artifacts (flickering, blank frames, cut-off text)
- [ ] Smooth transitions between all scenes (no jump cuts unless intentional)
- [ ] Text legible at target resolution (minimum 16px equivalent at 1080p)
- [ ] Gold accent used consistently for highlights and CTAs
- [ ] Glass-morphism effects render correctly (no transparency issues in video)
- [ ] Background elements don't distract from foreground content
- [ ] Consistent spacing and padding across all scenes

### Technical Quality
- [ ] All compositions render without errors (`npx remotion render` exits 0)
- [ ] No TypeScript errors in `frontend/remotion/` directory
- [ ] No `as any` casts
- [ ] All `staticFile()` references resolve to existing files
- [ ] Frame rate consistent (no dropped frames in output)
- [ ] Audio/video sync verified (if audio present)

### Brand Compliance
- [ ] A.I.M.S. logo present in intro and outro
- [ ] Color palette matches `AIMS_VIDEO_THEME` exactly
- [ ] Typography uses defined font families and sizes
- [ ] "AI Managed Solutions" tagline visible in relevant contexts
- [ ] No competing brand elements or unauthorized logos
