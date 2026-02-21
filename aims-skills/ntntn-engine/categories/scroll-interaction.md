# NtNtN Engine — Category 5: Scroll & Interaction Patterns

> How the page responds to the user's journey through content.

---

## CSS Scroll-Driven Animations (Native)

### Overview
Browser-native scroll-linked animations. No JavaScript required. Elements animate
based on scroll position using CSS `animation-timeline` and `view-timeline`.

- **Current:** Chrome 115+, Edge 115+, Safari 18+, Firefox (behind flag)
- **Approach:** Pure CSS — `animation-timeline: scroll()` or `view()`
- **Performance:** Best possible (compositor-driven, no main thread)

### Key Patterns
```css
/* Animate based on scroll position */
.progress-bar {
  animation: grow linear;
  animation-timeline: scroll();
}
@keyframes grow { from { width: 0%; } to { width: 100%; } }

/* Animate when element enters viewport */
.card {
  animation: fade-in linear both;
  animation-timeline: view();
  animation-range: entry 0% entry 100%;
}
@keyframes fade-in { from { opacity: 0; transform: translateY(30px); } }
```

### Picker_Ang Notes
- Choose when: Simple scroll effects, progressive enhancement, zero JS budget
- Avoid when: Complex choreography (use GSAP), need cross-browser (Safari partial)

---

## GSAP ScrollTrigger

### Overview
Professional scroll-animation controller. Pin sections, scrub animations to scroll
position, batch reveals, snap points. The gold standard for scroll choreography.

- **Current:** GSAP 3.14.2 (all plugins now 100% FREE — Webflow acquisition)
- **Approach:** Declarative scroll triggers attached to GSAP timelines
- **Bundle:** ~45KB for GSAP core + ScrollTrigger

### Key Patterns

#### 1. Basic ScrollTrigger
```ts
gsap.to('.hero-title', {
  scrollTrigger: {
    trigger: '.hero-section',
    start: 'top center',
    end: 'bottom top',
    scrub: true,
    markers: true, // debug only
  },
  y: -100,
  opacity: 0,
});
```

#### 2. Pin Section
```ts
ScrollTrigger.create({
  trigger: '.sticky-section',
  start: 'top top',
  end: '+=200%',
  pin: true,
  scrub: 1,
});
```

#### 3. Batch Reveals
```ts
ScrollTrigger.batch('.card', {
  onEnter: batch => gsap.to(batch, { opacity: 1, y: 0, stagger: 0.1 }),
  start: 'top 85%',
});
```

### Picker_Ang Notes
- Choose when: Complex scroll choreography, pinned sections, scrub animations
- Avoid when: Simple reveals (use Motion useInView), minimal bundle needs

---

## Motion Scroll Utilities

### Overview
Motion (formerly Framer Motion) provides scroll hooks — `useScroll`, `useTransform`,
`useInView` — for React-native scroll interactions.

- **Current:** Motion v12.34 (hardware-accelerated `useScroll` since v12.34)
- **Approach:** React hooks that map scroll progress to animated values
- **A.I.M.S. Status:** Default scroll handler for React/Next.js

### Key Patterns

#### 1. useScroll + useTransform (Parallax)
```tsx
const { scrollYProgress } = useScroll();
const y = useTransform(scrollYProgress, [0, 1], [0, -300]);
return <motion.div style={{ y }}>Parallax content</motion.div>;
```

#### 2. useInView (Scroll Reveal)
```tsx
const ref = useRef(null);
const isInView = useInView(ref, { once: true, margin: '-100px' });
return (
  <motion.div ref={ref}
    initial={{ opacity: 0, y: 50 }}
    animate={isInView ? { opacity: 1, y: 0 } : {}}
    transition={{ duration: 0.6 }}
  />
);
```

#### 3. Scroll-Linked Element Animation
```tsx
const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.8, 1, 0.8]);
const opacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0, 1, 1, 0]);
```

### Picker_Ang Notes
- **Default for React/Next.js scroll effects**
- Choose when: Parallax, reveals, progress-based animations in React
- Avoid when: Non-React project, need pinning/scrub (GSAP better)

---

## Lenis

### Overview
Smooth scroll library that enhances native scroll behavior. Adds momentum,
lerp-based smoothing, and scroll events without hijacking native scroll.

- **Current:** Lenis 1.3.17 (darkroom.engineering)
- **Approach:** Wraps native scroll with smooth interpolation
- **Performance:** Uses requestAnimationFrame, respects native scroll mechanics

### Key Patterns
```ts
const lenis = new Lenis({
  lerp: 0.1,          // Smoothing factor (0 = no smooth, 1 = instant)
  smoothWheel: true,
  orientation: 'vertical',
});

function raf(time: number) {
  lenis.raf(time);
  requestAnimationFrame(raf);
}
requestAnimationFrame(raf);
```

### Picker_Ang Notes
- Choose when: Smooth scrolling needed, creative/portfolio sites
- Avoid when: Performance-sensitive (adds overhead), mobile-heavy (native scroll better)

---

## Intersection Observer (Native)

### Overview
Browser API for detecting when elements enter or leave the viewport.
The foundation for lazy loading, scroll reveals, infinite scroll triggers.

- **Current:** Supported in all browsers
- **Performance:** Asynchronous — does not block main thread
- **No bundle:** Built into browsers

### Key Patterns
```ts
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target); // once: true
      }
    });
  },
  { threshold: 0.2, rootMargin: '-50px' }
);
document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
```

### Picker_Ang Notes
- Choose when: Simple lazy loading, basic reveals without animation libraries
- Avoid when: Complex scroll animations (use GSAP or Motion hooks)

---

## Scroll Snapping (CSS Native)

### Overview
CSS-native section locking. The browser snaps scroll position to defined alignment
points. Perfect for full-page section layouts and carousels.

### Key Patterns
```css
.container {
  scroll-snap-type: y mandatory;   /* or proximity */
  overflow-y: scroll;
  height: 100vh;
}
.section {
  scroll-snap-align: start;
  height: 100vh;
}
```

### Picker_Ang Notes
- Choose when: Full-page sections, slide-based layouts, carousels
- Avoid when: Long-form content (snapping disrupts reading flow)

---

## Parallax Techniques

### Overview
Foreground and background elements move at different speeds during scroll,
creating a sense of depth and visual interest.

### Implementations
| Approach | How | Performance | Bundle |
|----------|-----|-------------|--------|
| **Motion useTransform** | Map scrollY to translateY | GPU-accelerated | In Motion |
| **CSS perspective** | `transform-style: preserve-3d` + `perspective` | Best (CSS only) | 0KB |
| **GSAP ScrollTrigger** | Scrub parallax timelines | GPU-accelerated | In GSAP |
| **Rellax.js** | Lightweight parallax library | Good | +1KB |

### Best Practices
- Maximum parallax offset: 200px (more feels disconnected)
- Disable on mobile (touch scrolling + parallax = jank)
- Use `will-change: transform` on parallax elements
- Test at 60fps — drop effects if performance degrades

---

## Scrollytelling

### Overview
Long-form narrative technique: sticky viewport with content that changes based
on scroll position. Used in data journalism, feature tours, and product stories.

### Pattern
```
┌─────────────────────────────────┐
│  Sticky Viewport (60-70% width) │ ← Visual changes based on scroll
│  ┌───────────────┐              │
│  │  Content Step  │              │ ← Scroll through steps on the side
│  │  1. First...   │              │
│  │  2. Then...    │              │
│  │  3. Finally... │              │
│  └───────────────┘              │
└─────────────────────────────────┘
```

### Implementations
| Approach | How | Best For |
|----------|-----|----------|
| **Custom sticky + useScroll** | Motion hooks + CSS sticky | React/Next.js |
| **GSAP ScrollTrigger pin** | Pin viewport, scrub content | Complex choreography |
| **Scrollama** | Intersection Observer wrapper | Simple step detection |
| **CSS position: sticky** | Pure CSS sticky container | Zero JS approach |

### Picker_Ang Notes
- Choose when: Storytelling, data journalism, feature tours, product demos
- Avoid when: Short content (overkill), mobile-first (careful with sticky)

---

## Scroll & Interaction Comparison Matrix

| Technology | JS Required | Complexity | Scroll Linking | Pinning | Bundle |
|-----------|------------|-----------|---------------|---------|--------|
| **CSS Scroll-Driven** | No | Low | Native | No | 0KB |
| **GSAP ScrollTrigger** | Yes | High | Scrub | Yes | ~45KB |
| **Motion useScroll** | Yes | Medium | Transform | No | In Motion |
| **Lenis** | Yes | Low | Events | No | ~5KB |
| **Intersection Observer** | Yes | Low | Threshold | No | 0KB |
| **CSS Scroll Snap** | No | Low | Snap points | N/A | 0KB |

---

## A.I.M.S. Default: Motion useScroll + useInView

For React/Next.js projects, **Motion scroll hooks** are the default.
Add **GSAP ScrollTrigger** for complex choreography with pinning/scrub.
Add **Lenis** only when smooth scrolling is explicitly requested.
