# NtNtN Engine — Category 2: Animation & Motion Libraries

> How things move. The life and personality of the interface.

---

## Motion (formerly Framer Motion)

### Overview
The declarative animation library for React, Vue, and vanilla JavaScript. Provides gesture
recognition, layout animations, scroll-linked animations, spring physics, and AnimatePresence
for mount/unmount transitions. Rebranded from "Framer Motion" to "Motion" in 2025 as an
independent project at motion.dev — now framework-agnostic. 18M+ monthly npm downloads.

- **Current:** Motion 12.34 (install: `npm i motion`, was `framer-motion`)
- **Bundle:** ~30KB (tree-shakeable)
- **Frameworks:** React, Vue, vanilla JavaScript
- **A.I.M.S. Status:** Primary animation library — used on all pages

### Core API

#### Components
- `<motion.div>` — Any HTML/SVG element with animation capabilities
- `<AnimatePresence>` — Animate components as they enter/exit the DOM
- `<Reorder.Group>` / `<Reorder.Item>` — Drag-to-reorder lists
- `<LayoutGroup>` — Coordinate layout animations across components
- `<LazyMotion>` — Code-split animation features for smaller bundles

#### Hooks
- `useScroll()` — Track scroll progress of page or element
- `useTransform()` — Map one motion value range to another
- `useSpring()` — Create spring-based motion values
- `useMotionValue()` — Create imperative motion values
- `useInView()` — Detect when element enters viewport
- `useAnimate()` — Imperative animation control
- `useMotionValueEvent()` — Listen to motion value changes
- `useDragControls()` — Programmatic drag initiation
- `useVelocity()` — Track velocity of a motion value

#### Props
- `animate` — Target animation state
- `initial` — Initial state (before animation)
- `exit` — Exit state (used with AnimatePresence)
- `variants` — Named animation states
- `transition` — Animation timing config (spring, tween, inertia)
- `whileHover` — State while hovering
- `whileTap` — State while pressing
- `whileDrag` — State while dragging
- `whileInView` — State while in viewport
- `layout` — Enable automatic layout animations
- `layoutId` — Shared layout animation identifier
- `drag` — Enable drag (`true`, `"x"`, `"y"`)
- `dragConstraints` — Limit drag area
- `style` — Supports motion values for reactive styling

### Key Techniques

#### 1. Variants (State-Based Animation)
```tsx
const card = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
  hover: { scale: 1.05, boxShadow: "0 10px 30px rgba(0,0,0,0.2)" },
};

<motion.div
  variants={card}
  initial="hidden"
  animate="visible"
  whileHover="hover"
  transition={{ type: "spring", stiffness: 300, damping: 20 }}
/>
```

#### 2. Scroll-Linked Animation
```tsx
const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [0, 1, 0]);
const scale = useTransform(scrollYProgress, [0, 0.5], [0.8, 1]);

<motion.div ref={ref} style={{ opacity, scale }} />
```

#### 3. Layout Animation
```tsx
// Items smoothly animate to new positions when list changes
{items.map(item => (
  <motion.div key={item.id} layout transition={{ type: "spring", damping: 25 }}>
    {item.content}
  </motion.div>
))}

// Shared element transition between components
<motion.div layoutId="hero-image" /> // In component A
<motion.div layoutId="hero-image" /> // In component B — animates between them
```

#### 4. AnimatePresence (Mount/Unmount)
```tsx
<AnimatePresence mode="wait">
  {isVisible && (
    <motion.div
      key="modal"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
    />
  )}
</AnimatePresence>
```

#### 5. Spring Physics
```tsx
// Natural, physical motion
transition={{ type: "spring", mass: 1, stiffness: 200, damping: 20 }}

// Quick and snappy
transition={{ type: "spring", stiffness: 500, damping: 30 }}

// Slow and bouncy
transition={{ type: "spring", stiffness: 100, damping: 10, mass: 2 }}
```

#### 6. Gesture Animations
```tsx
<motion.button
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
  drag="x"
  dragConstraints={{ left: -100, right: 100 }}
  onDragEnd={(_, info) => {
    if (info.offset.x > 100) handleSwipeRight();
  }}
/>
```

### Picker_Ang Notes
- **Default for all A.I.M.S. builds** — ecosystem alignment, now multi-framework
- Strongest in: layout animations, gestures, scroll-linked, variants, `useScroll` hardware-accelerated
- Weakest in: Complex multi-element timelines (GSAP is better here)
- Works with React, Vue, and vanilla JavaScript (no longer React-only)

---

## GSAP (GreenSock Animation Platform)

### Overview
The professional animation platform — framework-agnostic, battle-tested, used by
NASA, Google, Apple. Excels at complex timelines, scroll-driven choreography, and SVG animation.

- **Current:** GSAP 3.14.2
- **Bundle:** ~25KB core + plugins (ScrollTrigger ~20KB, SplitText ~10KB)
- **License:** 100% FREE including ALL plugins (SplitText, MorphSVG, DrawSVG, etc.) — Webflow acquisition made everything free
- **A.I.M.S. Status:** Secondary — used when Motion can't handle the complexity

### Core API

#### Methods
- `gsap.to()` — Animate TO target values
- `gsap.from()` — Animate FROM values (starts at specified, ends at current)
- `gsap.fromTo()` — Animate FROM one set TO another
- `gsap.set()` — Instant property set (no animation)
- `gsap.timeline()` — Sequence multiple animations
- `gsap.quickTo()` — Pre-configured tween for rapid updates (mouse tracking)
- `gsap.registerPlugin()` — Load plugins (ScrollTrigger, SplitText, etc.)

#### Plugins
- **ScrollTrigger** — Scroll-linked animation controller (pin, scrub, snap, batch)
- **SplitText** — Split text into chars/words/lines for animation (FREE)
- **MorphSVG** — Morph between SVG paths (FREE)
- **DrawSVG** — Animate SVG stroke drawing (FREE)
- **MotionPath** — Animate elements along SVG paths (FREE)
- **Flip** — First-Last-Invert-Play layout animations
- **Observer** — Unified input detection (scroll, touch, pointer)
- **TextPlugin** — Animate text content changes

### Key Techniques

#### 1. Timeline (Choreographed Sequences)
```js
const tl = gsap.timeline({ defaults: { duration: 0.5, ease: "power2.out" } });

tl.from(".hero-title", { y: 50, opacity: 0 })
  .from(".hero-subtitle", { y: 30, opacity: 0 }, "-=0.3")   // overlap by 0.3s
  .from(".hero-cta", { scale: 0.8, opacity: 0 }, "-=0.2")
  .from(".hero-image", { x: 100, opacity: 0 }, "<");          // same time as previous
```

#### 2. ScrollTrigger (Scroll-Linked)
```js
gsap.to(".parallax-bg", {
  y: -200,
  scrollTrigger: {
    trigger: ".hero",
    start: "top top",
    end: "bottom top",
    scrub: 1,            // smooth scrubbing (1 second lag)
    pin: true,           // pin the section
    snap: 0.5,           // snap to halfway
    markers: true,       // debug markers (remove in prod)
  }
});
```

#### 3. SplitText (Per-Character/Word Animation)
```js
const split = new SplitText(".headline", { type: "chars, words" });

gsap.from(split.chars, {
  opacity: 0,
  y: 20,
  rotateX: -90,
  stagger: 0.02,
  duration: 0.5,
  ease: "back.out",
});
```

#### 4. Batch (Scroll Reveals at Scale)
```js
ScrollTrigger.batch(".reveal-item", {
  onEnter: (elements) => {
    gsap.from(elements, {
      opacity: 0,
      y: 40,
      stagger: 0.1,
      duration: 0.6,
    });
  },
  once: true,
});
```

#### 5. Flip (Layout Transitions)
```js
const state = Flip.getState(".grid-item"); // Capture current positions
// ... change layout (filter, sort, resize) ...
Flip.from(state, {
  duration: 0.6,
  ease: "power1.inOut",
  stagger: 0.05,
  absolute: true,
});
```

### React Integration
```tsx
// Use useGSAP hook from @gsap/react
import { useGSAP } from "@gsap/react";

function Component() {
  const container = useRef(null);

  useGSAP(() => {
    gsap.from(".box", { x: -100, opacity: 0, stagger: 0.1 });
  }, { scope: container }); // Scoped to container

  return <div ref={container}>...</div>;
}
```

### Picker_Ang Notes
- Choose over Motion when: Complex timelines, SVG animation, SplitText, scroll pinning
- Strongest in: ScrollTrigger pinning/scrubbing, timeline choreography, SVG morphing
- Weakest in: React layout animations (Motion's layoutId is better)
- NOW 100% FREE — no more Club GreenSock paywall for SplitText, MorphSVG, etc.
- Can coexist with Motion in the same project (different elements)

---

## Anime.js

### Overview
Lightweight JavaScript animation library — v4 is a major rewrite with ESM-first architecture,
built-in springs, Draggable API, and Scroll Observer. Consistent 60fps on thousands of DOM elements.

- **Current:** Anime.js v4.3.6 (breaking change from v3 — new import API)
- **Bundle:** ~17KB
- **License:** MIT (free)

### Key Techniques
```js
// v4 API (new — ESM imports)
import { animate, stagger } from 'animejs';

animate('.element', {
  translateX: 250,
  rotate: '1turn',
  duration: 1000,
  ease: 'inOutQuad',
  delay: stagger(100),
});
```

- Timeline sequencing
- SVG path animation (`strokeDashoffset`)
- Stagger with grid support
- **Built-in physics springs** (new in v4)
- **Draggable API** (new in v4)
- **Scroll Observer** for scroll-triggered animations (new in v4)
- **WAAPI sync** with automatic `persist: true` (v4.3.4)
- **`createLayout()`** for layout animations (v4.3.0)

### Picker_Ang Notes
- Choose when: Simple animations, no React dependency, small bundle
- Avoid when: Complex scroll-linked animation, layout animations, React projects (use FM)

---

## Motion (Vanilla JS API)

### Overview
The vanilla JavaScript API of Motion (formerly "Motion One") — the same library as the React
API above, but for non-React use. Built on the Web Animations API — hardware-accelerated by default.
Now unified under the `motion` package alongside the React and Vue APIs.

- **Current:** Motion 12.34 (same package: `npm i motion`)
- **Bundle:** ~3KB (vanilla API only)
- **License:** MIT

### Key API
```js
import { animate, scroll, inView, spring } from "motion";

// Basic animation
animate(".box", { x: 100, opacity: 1 }, { duration: 0.5 });

// Scroll-linked (hardware-accelerated in v12.34+)
scroll(animate(".progress", { scaleX: [0, 1] }));

// Viewport detection
inView(".element", ({ target }) => {
  animate(target, { opacity: 1, y: [20, 0] });
});
```

### Picker_Ang Notes
- Choose when: Need animation outside React, bundle size is critical, WAAPI performance
- This IS the same library as "Motion for React" — just the vanilla/Vue API surface

---

## Lottie / DotLottie

### Overview
Render After Effects animations on the web via JSON export. Designers create in AE,
export with Bodymovin, developers play on web.

- **Current:** lottie-web, DotLottie (compressed format)
- **Bundle:** lottie-web ~250KB (light variant ~150KB), DotLottie player ~45KB
- **Format:** JSON (Lottie) or .lottie (DotLottie — compressed, multi-animation)

### Key Techniques
```tsx
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

<DotLottieReact
  src="/animations/loading.lottie"
  loop
  autoplay
  speed={1.5}
  onComplete={() => console.log("done")}
/>
```

- Scroll-synced playback (`useScroll` + `setFrame`)
- Interactive segments (play specific frame ranges)
- Hover-triggered animations
- Icon micro-animations

### Picker_Ang Notes
- Choose when: Designer has After Effects animations, icon animations, loading states
- Avoid when: Simple CSS animations would suffice, large/complex scenes (file size)

---

## Rive

### Overview
Real-time interactive animation platform with state machines. Animations are designed
in the Rive editor and controlled at runtime via input bindings.

- **Current:** Rive runtime
- **Bundle:** ~160KB (WASM runtime)
- **Format:** `.riv` (binary, optimized)

### Key Techniques
```tsx
import { useRive, useStateMachineInput } from "@rive-app/react-canvas";

function AnimatedButton() {
  const { rive, RiveComponent } = useRive({
    src: "/button.riv",
    stateMachines: "ButtonState",
    autoplay: true,
  });
  const hoverInput = useStateMachineInput(rive, "ButtonState", "isHovered");

  return (
    <RiveComponent
      onMouseEnter={() => hoverInput && (hoverInput.value = true)}
      onMouseLeave={() => hoverInput && (hoverInput.value = false)}
    />
  );
}
```

- State machines for complex interactive logic
- Input bindings (boolean, number, trigger)
- Mesh deformation for character animation
- Blend states for smooth transitions between animations

### Picker_Ang Notes
- Choose when: Interactive characters, game-like UI, complex state-driven animation
- Avoid when: Simple transitions (overkill), need to modify animation in code (Rive is editor-first)

---

## CSS Animations & Transitions

### Overview
Native browser animation — zero JS, zero dependencies, best performance.
Every animation that CAN be CSS-only SHOULD be CSS-only.

### Key Techniques

#### 1. Transitions
```css
.button {
  transition: background-color 200ms ease-out, transform 150ms ease-out;
}
.button:hover {
  background-color: #D4AF37;
  transform: scale(1.02);
}
```

#### 2. Keyframe Animations
```css
@keyframes fadeSlideUp {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}
.card { animation: fadeSlideUp 0.5s ease-out both; }
```

#### 3. CSS Scroll-Driven Animations (Modern)
```css
.progress-bar {
  animation: growWidth linear;
  animation-timeline: scroll();
}
@keyframes growWidth { from { width: 0; } to { width: 100%; } }
```

#### 4. @starting-style (Entry Animations)
```css
dialog[open] {
  opacity: 1;
  transform: scale(1);
  transition: opacity 0.3s, transform 0.3s;

  @starting-style {
    opacity: 0;
    transform: scale(0.95);
  }
}
```

#### 5. View Transition API
```css
::view-transition-old(hero) { animation: fadeOut 0.3s; }
::view-transition-new(hero) { animation: fadeIn 0.3s; }
.hero { view-transition-name: hero; }
```

### Picker_Ang Notes
- **Always the first choice** for simple transitions (hover, focus, state changes)
- Use for: hover effects, loading spinners, simple reveals, progress bars
- Upgrade to Motion when: gestures needed, layout animations, complex choreography
- Upgrade to GSAP when: timeline sequences, SVG manipulation, scroll pinning

---

## Web Animations API (WAAPI)

### Overview
The browser's native programmatic animation API — what CSS animations are built on,
but controllable from JavaScript.

```js
const animation = element.animate(
  [
    { transform: "translateX(0)" },
    { transform: "translateX(300px)" },
  ],
  { duration: 500, easing: "ease-out", fill: "forwards" }
);

animation.pause();
animation.playbackRate = 2;
animation.reverse();
animation.finished.then(() => console.log("done"));
```

### Picker_Ang Notes
- Choose when: Need JS control without library, performance-critical, framework-agnostic
- Avoid when: Need spring physics, gestures, layout animations (use Motion)

---

## Spring Animation Physics

### Overview
Spring-based animation models physical spring behavior (mass, tension, friction, damping)
instead of fixed durations and easing curves. Creates natural, interruptible motion.

### Parameters
| Parameter | Effect | Typical Range |
|-----------|--------|--------------|
| **mass** | Heavier = slower, more momentum | 0.5 - 5 |
| **stiffness** | Higher = faster snap to target | 100 - 1000 |
| **damping** | Higher = less oscillation | 5 - 50 |
| **velocity** | Initial speed (inherited from gesture) | -1000 - 1000 |

### Presets
```
Snappy:    { stiffness: 500, damping: 30 }
Gentle:    { stiffness: 100, damping: 15 }
Bouncy:    { stiffness: 200, damping: 10 }
Stiff:     { stiffness: 1000, damping: 40 }
Molasses:  { stiffness: 50,  damping: 20, mass: 3 }
```

### Available In
- Motion (`type: "spring"`)
- React Spring (`useSpring`)
- GSAP (custom ease)
- Motion One (`spring()`)

### Picker_Ang Notes
- **Always prefer springs over tween/ease for interactive elements**
- Springs are interruptible — user can grab mid-animation
- Springs have no fixed duration — they settle naturally
- Use tween (duration + ease) only for decorative, non-interactive animation

---

## Library Comparison Matrix

| Library | Bundle | React | Vue | Svelte | Vanilla | Scroll | Gesture | Layout | Spring |
|---------|--------|-------|-----|--------|---------|--------|---------|--------|--------|
| **Motion** | 30KB | Yes | Yes | No | Yes | Yes | Yes | Yes | Yes |
| **GSAP** | 25KB+ | Plugin | Yes | Yes | Yes | Excellent | No | Flip | No |
| **Anime.js** | 17KB | No | Yes | Yes | Yes | No | No | No | No |
| **Motion (vanilla)** | 3KB | No | Yes | Yes | Yes | Yes | No | No | Yes |
| **Lottie** | 45KB+ | Yes | Yes | Yes | Yes | Manual | No | No | No |
| **Rive** | 160KB | Yes | Yes | No | Yes | Manual | State | No | No |
| **CSS** | 0KB | N/A | N/A | N/A | N/A | Native | No | No | No |
| **WAAPI** | 0KB | N/A | N/A | N/A | N/A | No | No | No | No |
