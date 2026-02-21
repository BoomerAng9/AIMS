---
name: aims-animated-web
description: >
  A.I.M.S. animated website patterns: scroll-driven animations, viewport reveals,
  parallax, 3D effects, scrollytelling, and interactive micro-animations. Use this
  skill whenever building or updating any A.I.M.S. page that warrants animation —
  especially landing pages, marketing surfaces, and feature showcases.
allowed-tools: Read, Glob, Grep, Edit, Write
---

# A.I.M.S. Animated Web Skill

Build beautiful, interactive, animated websites for A.I.M.S. — matching the quality
of sites like Huly.io — using code-first animation techniques. No Framer, no Webflow,
no drag-and-drop builders. Pure Next.js + Framer Motion + CSS + Canvas.

Use **together with** `aims-global-ui` and the relevant archetype skill (e.g., `aims-landing-ui`).

## When to Use

Activate this skill when:

- Building or redesigning any public-facing A.I.M.S. page (landing, marketing, Plug intros).
- The user asks for "animated", "interactive", "scroll effects", "parallax", or "3D" on any page.
- Building feature showcases, product tours, or demo sections.
- The user references Huly.io, Antigravity-style sites, or "award-winning" web design.

Do NOT use this for:

- Internal dashboards where animation would slow down workflows.
- Data-heavy CRM or analytics pages (use subtle `aims-global-ui` transitions only).
- Remotion video compositions (those follow the Remotion system, not this skill).

---

## Philosophy: When to Animate

Animation should **clarify, guide, and delight** — never distract or delay.

| Context | Animate? | Technique |
|---------|----------|-----------|
| Hero section on landing page | **Yes** — staggered reveal, parallax, scroll-linked | heroStagger, parallax, scrollReveal |
| Feature cards appearing on scroll | **Yes** — viewport reveal with stagger | scrollReveal + staggerContainer |
| Navigation bar | **Minimal** — fade/slide on scroll direction change | CSS transition or fade variant |
| Data tables, form inputs | **No** — instant state changes | Use `aims-global-ui` micro-feedback only |
| Page transitions | **Yes** — crossfade between routes | fade or scaleFade with AnimatePresence |
| CTA buttons | **Subtle** — hover lift, tap feedback | hoverLiftGlow, tapScale |
| Background elements | **Yes if decorative** — slow ambient motion | float, parallax, gradient shift |
| Loading states | **Yes** — skeleton shimmer or pulse | CSS shimmer keyframe |

**Rule of thumb:** If removing the animation makes the page harder to understand or navigate, the animation is justified. If removing it changes nothing, skip it.

---

## Animation Stack (What We Use)

### Primary: Framer Motion (already installed)
- State-driven variants from `@/lib/motion`
- `useScroll`, `useTransform`, `useInView` for scroll-driven animations
- `AnimatePresence` for mount/unmount
- `motion.div` for gesture feedback (hover, tap, drag)
- `useMotionValueEvent` for scroll-linked logic

### Secondary: CSS Animations (via Tailwind keyframes)
- Ambient loops (`animate-float`, `animate-pulse-gold`)
- Shimmer/skeleton loading states
- Simple transitions that don't need JS orchestration

### Advanced (add when needed):
- **HTML5 Canvas** — for scroll-linked image sequences (Apple-style scrollytelling)
- **Three.js / React Three Fiber** (already installed) — for 3D hero elements
- **Rive** (`@rive-app/react-canvas`) — for complex vector animations (Huly.io-style)
- **GSAP + ScrollTrigger** — only if Framer Motion scroll primitives prove insufficient

### What We Do NOT Use
- Framer (the platform) — we write code directly
- Webflow — we write code directly
- Lottie — prefer Rive for better performance (WASM runtime, smaller files)
- Inline magic numbers — all timing uses `@/lib/motion/tokens`

---

## Core Animation Patterns

### 1. Scroll Reveal (Viewport Entry)

Elements fade/slide into view when they enter the viewport. The most common pattern.

```tsx
"use client";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { scrollReveal, staggerContainer, staggerItem } from "@/lib/motion";

function FeatureSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.section
      ref={ref}
      variants={staggerContainer}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
    >
      <motion.h2 variants={staggerItem}>Features</motion.h2>
      <motion.div variants={staggerItem}>Card 1</motion.div>
      <motion.div variants={staggerItem}>Card 2</motion.div>
    </motion.section>
  );
}
```

**Rules:**
- Always use `once: true` so elements don't re-hide on scroll-up.
- Use `margin: "-80px"` to `-120px` so animation triggers slightly before full visibility.
- Stagger children with `staggerContainer` + `staggerItem`.

### 2. Parallax Scrolling

Background layers move at different speeds than foreground content.

```tsx
"use client";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

function ParallaxHero() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const textY = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <section ref={ref} className="relative h-screen overflow-hidden">
      <motion.div
        className="absolute inset-0 bg-cover bg-center"
        style={{ y: bgY }}
      />
      <motion.div
        className="relative z-10 flex items-center justify-center h-full"
        style={{ y: textY, opacity }}
      >
        <h1>Hero Title</h1>
      </motion.div>
    </section>
  );
}
```

**Rules:**
- Keep parallax offset subtle (20-50% max displacement).
- Always pair with `overflow-hidden` on the container.
- Fade out content as it scrolls away to avoid overlap with next section.

### 3. Scroll-Linked Image Sequence (Scrollytelling)

Apple-style frame-by-frame animation driven by scroll position. Uses HTML5 Canvas.

```tsx
"use client";
import { useScroll, useTransform, useMotionValueEvent } from "framer-motion";
import { useRef, useEffect, useState, useCallback } from "react";

function ScrollSequence({ frameCount, basePath }: {
  frameCount: number;
  basePath: string; // e.g., "/images/sequence/frame-"
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [images, setImages] = useState<HTMLImageElement[]>([]);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const frameIndex = useTransform(
    scrollYProgress,
    [0, 1],
    [0, frameCount - 1]
  );

  // Preload all frames
  useEffect(() => {
    const loaded: HTMLImageElement[] = [];
    for (let i = 0; i < frameCount; i++) {
      const img = new Image();
      img.src = `${basePath}${String(i).padStart(4, "0")}.webp`;
      loaded.push(img);
    }
    setImages(loaded);
  }, [frameCount, basePath]);

  const render = useCallback((index: number) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const img = images[Math.round(index)];
    if (ctx && img?.complete) {
      canvas!.width = img.naturalWidth;
      canvas!.height = img.naturalHeight;
      ctx.drawImage(img, 0, 0);
    }
  }, [images]);

  useMotionValueEvent(frameIndex, "change", render);

  return (
    <div ref={containerRef} className="h-[400vh] relative">
      <div className="sticky top-0 h-screen flex items-center justify-center">
        <canvas
          ref={canvasRef}
          className="max-w-full max-h-full object-contain"
        />
      </div>
    </div>
  );
}
```

**Rules:**
- Container height = `[N]vh` where N controls scroll speed (300vh–500vh typical).
- Use `.webp` format for frames (smaller than PNG, fast decode).
- Preload frames on mount; show a loading skeleton until ready.
- Add text overlays with absolute positioning that fade in/out at specific scroll ranges.

### 4. Text Reveal / Typewriter

Progressive text reveal for hero headlines or feature callouts.

```tsx
"use client";
import { motion } from "framer-motion";

function TypeReveal({ text, className }: { text: string; className?: string }) {
  return (
    <motion.span
      className={className}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.03 } },
      }}
    >
      {text.split("").map((char, i) => (
        <motion.span
          key={i}
          variants={{
            hidden: { opacity: 0, y: 10 },
            visible: { opacity: 1, y: 0 },
          }}
        >
          {char === " " ? "\u00A0" : char}
        </motion.span>
      ))}
    </motion.span>
  );
}
```

For scroll-triggered text reveals, combine with `useInView`.

### 5. 3D Card Tilt on Hover

Mouse-tracking 3D perspective tilt for feature/product cards.

```tsx
"use client";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

function TiltCard({ children }: { children: React.ReactNode }) {
  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);

  const rotateX = useSpring(useTransform(y, [0, 1], [8, -8]), {
    stiffness: 300, damping: 30,
  });
  const rotateY = useSpring(useTransform(x, [0, 1], [-8, 8]), {
    stiffness: 300, damping: 30,
  });

  function handleMouse(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width);
    y.set((e.clientY - rect.top) / rect.height);
  }

  function handleLeave() {
    x.set(0.5);
    y.set(0.5);
  }

  return (
    <motion.div
      onMouseMove={handleMouse}
      onMouseLeave={handleLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
        perspective: 1000,
      }}
      className="rounded-card border border-wireframe-stroke bg-surface/80 backdrop-blur-sm p-6"
    >
      {children}
    </motion.div>
  );
}
```

**Rules:**
- Max rotation: 8-12 degrees. More feels seasick.
- Always spring-dampen the rotation (stiffness 200-400, damping 25-35).
- Reset to center on mouse leave.
- Add `will-change: transform` for GPU acceleration.

### 6. Horizontal Scroll Section

Horizontal scrolling gallery within a vertical page flow.

```tsx
"use client";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

function HorizontalScroll({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });
  const x = useTransform(scrollYProgress, [0, 1], ["0%", "-75%"]);

  return (
    <section ref={containerRef} className="h-[300vh] relative">
      <div className="sticky top-0 h-screen flex items-center overflow-hidden">
        <motion.div className="flex gap-8 pl-8" style={{ x }}>
          {children}
        </motion.div>
      </div>
    </section>
  );
}
```

### 7. Gradient Shift / Ambient Background

Slow-moving gradient backgrounds for visual depth.

```css
/* Add to Tailwind keyframes */
@keyframes gradient-shift {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}
.animate-gradient {
  background-size: 200% 200%;
  animation: gradient-shift 8s ease-in-out infinite;
}
```

### 8. Scroll Progress Indicator

Visual progress bar showing how far user has scrolled through a section.

```tsx
"use client";
import { motion, useScroll } from "framer-motion";

function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-0.5 bg-gold origin-left z-50"
      style={{ scaleX: scrollYProgress }}
    />
  );
}
```

---

## Huly.io-Inspired Patterns

Huly.io (built by Pixel Point) achieves its premium feel through:

1. **Rive animations** for complex vector interactions (state-machine driven, WASM runtime).
2. **Dark background with vibrant accent gradients** (blue-to-purple, magenta highlights).
3. **Generous whitespace** between sections with scroll-triggered reveals.
4. **Smooth section transitions** — content fades and slides in as you scroll, never jumps.
5. **Feature demos embedded inline** — not screenshots, but animated recreations.
6. **Micro-interactions on hover** — cards lift, borders glow, icons animate.

### To replicate for A.I.M.S.:
- Use our existing dark palette (obsidian/ink backgrounds) with gold accent gradients.
- Apply `scrollReveal` + `staggerContainer` to every major section.
- Add `hoverLiftGlow` to feature cards (already in our variants).
- Use `parallax` on hero backgrounds.
- Embed animated feature demos using Framer Motion (or Rive for complex ones).
- Add gradient mesh backgrounds with subtle `animate-gradient` shift.

### Rive Integration (When Needed)

If a section requires complex vector animation beyond what Framer Motion provides (character animations, complex state machines, interactive illustrations):

```bash
npm install @rive-app/react-canvas
```

```tsx
import { useRive, Layout, Fit, Alignment } from "@rive-app/react-canvas";

function RiveAnimation({ src }: { src: string }) {
  const { RiveComponent } = useRive({
    src,
    autoplay: true,
    layout: new Layout({ fit: Fit.Contain, alignment: Alignment.Center }),
  });
  return <RiveComponent className="w-full h-[400px]" />;
}
```

**Rive optimization for Next.js:**
- Self-host the WASM runtime (don't load from unpkg CDN).
- Preload WASM with `<link rel="preload">` in layout.
- Store `.riv` files in `public/animations/`.

---

## Scroll-Driven Variants (Add to @/lib/motion)

These variants extend the existing AIMS motion system for scroll/viewport patterns:

```typescript
// In frontend/lib/motion/variants.ts — scroll-driven additions

/** Viewport reveal — fade + slide up on scroll entry */
export const scrollReveal: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
  },
};

/** Viewport reveal from left */
export const scrollRevealLeft: Variants = {
  hidden: { opacity: 0, x: -60 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
  },
};

/** Viewport reveal from right */
export const scrollRevealRight: Variants = {
  hidden: { opacity: 0, x: 60 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
  },
};

/** Scale reveal — element grows into view */
export const scrollRevealScale: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  },
};

/** Blur reveal — element un-blurs as it appears */
export const scrollRevealBlur: Variants = {
  hidden: { opacity: 0, filter: "blur(10px)", y: 20 },
  visible: {
    opacity: 1,
    filter: "blur(0px)",
    y: 0,
    transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
  },
};
```

---

## Scroll-Driven Tokens (Add to @/lib/motion)

```typescript
// In frontend/lib/motion/tokens.ts — scroll-specific additions

/** Scroll-driven transition presets */
export const scrollTransition = {
  /** Standard scroll reveal */
  reveal: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const },
  /** Slow cinematic reveal */
  cinematic: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as const },
  /** Quick pop-in for smaller elements */
  pop: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const },
};

/** IntersectionObserver margin presets for useInView */
export const viewportMargin = {
  /** Trigger early — element enters 100px before visible */
  early: "-100px",
  /** Standard — trigger at ~80px before visible */
  standard: "-80px",
  /** Late — trigger only when nearly fully visible */
  late: "-20px",
};
```

---

## Reusable Scroll Components

Create these in `frontend/components/motion/` for reuse across pages:

| Component | Purpose | File |
|-----------|---------|------|
| `ScrollReveal` | Wrapper that fades children in on viewport entry | `ScrollReveal.tsx` |
| `ParallaxSection` | Section with parallax background layer | `ParallaxSection.tsx` |
| `TiltCard` | Mouse-tracking 3D tilt card | `TiltCard.tsx` |
| `TypeReveal` | Character-by-character text animation | `TypeReveal.tsx` |
| `ScrollProgress` | Fixed progress bar for section/page scroll | `ScrollProgress.tsx` |
| `HorizontalScroll` | Vertical-to-horizontal scroll gallery | `HorizontalScroll.tsx` |

All components must:
- Be `"use client"` (they use hooks).
- Accept `className` prop for style overrides.
- Respect `prefers-reduced-motion` (skip animation, show content instantly).
- Use tokens from `@/lib/motion` (no magic numbers).

---

## Accessibility Requirements

1. **`prefers-reduced-motion`**: All scroll animations must degrade gracefully.
   ```tsx
   const prefersReduced = typeof window !== "undefined"
     ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
     : false;
   // If true: show content without animation, set once: true immediately
   ```

2. **No content hidden behind animation**: If animation fails or is disabled, all content must still be visible and readable.

3. **No seizure triggers**: No rapidly flashing elements (>3 flashes/sec).

4. **Scroll hijacking**: Never override native scroll behavior. Parallax and scroll-linked animations must work WITH native scroll, not replace it.

---

## Performance Rules

1. **GPU-only properties**: Animate only `transform` and `opacity` where possible. Avoid animating `width`, `height`, `top`, `left`, `margin`, `padding`.

2. **`will-change`**: Add `will-change: transform` to parallax layers and frequently animated elements. Remove it when animation completes.

3. **Lazy load heavy animations**: Use `useInView` to mount Three.js scenes or Rive components only when in viewport.

4. **Image sequences**: Use `.webp` format, preload in batches, show skeleton while loading.

5. **Bundle size**: Don't import GSAP globally. If GSAP is needed for one section, dynamic-import it:
   ```tsx
   const gsap = await import("gsap");
   const ScrollTrigger = (await import("gsap/ScrollTrigger")).default;
   gsap.default.registerPlugin(ScrollTrigger);
   ```

6. **Frame budget**: Scroll-linked animations must not cause jank. Test with Chrome DevTools Performance tab — target <16ms per frame.

---

## Inspiration-Driven Workflow

When building animated pages, follow this process (inspired by Antigravity workflow):

1. **Find inspiration** — Browse Landbook, Awwwards, Dribbble, or reference sites like Huly.io.
2. **Identify patterns** — Which animation techniques are used? (parallax? scroll reveal? 3D tilt?)
3. **Map to AIMS components** — Use existing variants and components from this skill.
4. **Build section by section** — Start with hero, then supporting sections, then micro-interactions.
5. **Test scroll performance** — Chrome DevTools > Performance > scroll through the page.
6. **Test reduced motion** — Enable `prefers-reduced-motion` in DevTools and verify all content is visible.
7. **Test mobile** — Animations should be simpler on mobile (reduce parallax, skip 3D tilt on touch).

---

## Quick Reference: Which Variant to Use

| I want to... | Use this variant | From |
|--------------|-----------------|------|
| Fade in on scroll | `scrollReveal` | `@/lib/motion` |
| Stagger a list of cards on scroll | `staggerContainer` + `staggerItem` | `@/lib/motion` |
| Hero headline entrance | `heroStagger` + `heroItem` | `@/lib/motion` |
| Card hover effect | `hoverLiftGlow` or `cardLift` | `@/lib/motion` |
| Button tap feedback | `tapScale` or `tapScaleSmall` | `@/lib/motion` |
| Modal/overlay appear | `scaleFade` | `@/lib/motion` |
| Sidebar slide in | `slideLeft` or `slideRight` | `@/lib/motion` |
| Dropdown menu | `fadeDown` | `@/lib/motion` |
| Parallax background | Use `useScroll` + `useTransform` | Framer Motion hooks |
| Image sequence on scroll | Canvas + `useScroll` pattern | See Section 3 above |
| 3D tilt on hover | `TiltCard` component | `components/motion/` |
| Text typewriter | `TypeReveal` component | `components/motion/` |
| Ambient floating | `animate-float` | Tailwind class |
| Gold pulse glow | `animate-pulse-gold` | Tailwind class |

Always combine this skill with `aims-global-ui` and the relevant archetype skill.
