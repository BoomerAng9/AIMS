# NtNtN Engine — Scroll Techniques Deep Dive

> Every scroll-based animation and interaction technique, cross-referenced by implementation library.

---

## 1. Parallax Scrolling

**What it achieves:** Background and foreground layers move at different speeds, creating depth and visual interest as the user scrolls.

### Implementations

| Library | Approach | Performance | Bundle Impact |
|---------|----------|-------------|---------------|
| **Motion** | `useScroll` + `useTransform` to map scroll progress to `y` offset | GPU-accelerated (transform) | Included in Motion bundle |
| **GSAP ScrollTrigger** | `scrub: true` on timeline, different speeds per layer | GPU-accelerated | +45KB (GSAP core + ScrollTrigger) |
| **CSS Only** | `perspective` + `translateZ` on parent/child layers | Native browser, best perf | 0KB |
| **Rellax.js** | `data-rellax-speed` attribute on elements | RAF-based, decent perf | +1.5KB |
| **Locomotive Scroll** | `data-scroll-speed` attribute, smooth scroll wrapper | Smooth but heavier | +15KB |

### When to Use
- Hero sections with background imagery
- Section dividers with depth
- Feature showcases with layered content

### When NOT to Use
- Mobile-primary layouts (can cause jank on low-end devices)
- Content-heavy pages where reading is the priority
- When the content itself needs scroll attention (parallax distracts)

### Performance Rules
- Keep parallax offset subtle (20-50% max displacement)
- Use `will-change: transform` on parallax layers
- Pair with `overflow-hidden` on the container
- Disable on `prefers-reduced-motion`
- Test on 60Hz and 120Hz displays

---

## 2. Scroll-Linked Image Sequence

**What it achieves:** Apple-style frame-by-frame animation where scrolling scrubs through a sequence of pre-rendered images, creating a video-like effect tied to scroll position.

### Implementations

| Library | Approach | Performance | Bundle Impact |
|---------|----------|-------------|---------------|
| **Canvas + Motion** | `useScroll` maps progress → frame index, draw to Canvas | Excellent (Canvas 2D) | Included in Motion bundle |
| **GSAP ScrollTrigger** | ScrollTrigger scrub drives frame index on Canvas | Excellent | +45KB |
| **CSS Scroll-Driven** | `animation-timeline: scroll()` swaps background-image | Limited browser support | 0KB |
| **Scrolly Video** | Decode video frames mapped to scroll (scrollyvideo.js) | Good (video decode) | +5KB |

### When to Use
- Product reveals (phones, cars, hardware rotating)
- Complex transformations that can't be done in CSS/JS
- When the client has pre-rendered 3D frames

### When NOT to Use
- When image count > 300 (memory issues)
- Mobile with limited bandwidth (preload is heavy)
- When a looping video would suffice

### Performance Rules
- Use `.webp` format (smaller than PNG, fast decode)
- Container height = `[N]vh` where N = 300–500 (controls scroll speed)
- Preload frames on mount with loading skeleton
- Use `requestAnimationFrame` for Canvas draws
- Consider lazy-loading first 30 frames, then rest

---

## 3. Sequential Scroll / Scrollytelling

**What it achieves:** A sticky viewport where different content steps (text, images, animations) appear and disappear in sequence as the user scrolls. Each scroll segment triggers the next step.

### Implementations

| Library | Approach | Performance | Bundle Impact |
|---------|----------|-------------|---------------|
| **Motion** | Sticky container + `useScroll` + per-step opacity/transform mapping | GPU-accelerated | Included in Motion bundle |
| **GSAP ScrollTrigger** | `pin: true` + timeline with labeled steps | GPU-accelerated | +45KB |
| **Scrollama** | Intersection Observer-based step detection | Lightweight | +3KB |
| **CSS Scroll Snap** | `scroll-snap-type: y mandatory` with full-page sections | Native, limited control | 0KB |

### When to Use
- Feature tours (3–6 steps)
- Data storytelling / journalism
- Product explanation flows
- Onboarding walkthroughs

### When NOT to Use
- More than 6 steps (becomes tedious)
- Mobile layouts where sticky positioning is unreliable
- When users need to quickly scan content (sticky blocks fast scanning)

### Performance Rules
- Container height = `steps × 100vh`
- Each step: 15-20% fade-in, 60-70% hold, 15-20% fade-out
- Add step indicator (dots or progress bar)
- On mobile, consider converting to vertical stack with scroll reveals
- Crossfade text and visuals independently for polish

---

## 4. Horizontal Scroll Section

**What it achieves:** A section that converts vertical scrolling into horizontal panning, creating a gallery or timeline that moves sideways while the user scrolls normally.

### Implementations

| Library | Approach | Performance | Bundle Impact |
|---------|----------|-------------|---------------|
| **Motion** | `useScroll` + `useTransform` to map scrollY → translateX | GPU-accelerated | Included in Motion bundle |
| **GSAP ScrollTrigger** | `pin: true` + horizontal tween scrubbed to scroll | GPU-accelerated | +45KB |
| **CSS Only** | `overflow-x: auto` + `scroll-snap-type: x mandatory` | Native, limited vertical trigger | 0KB |

### When to Use
- Image galleries / portfolios
- Timelines / history sections
- Product comparison carousels

### When NOT to Use
- When the content is text-heavy (horizontal reading is hard)
- When accessibility is critical (horizontal scroll is non-standard)
- On mobile (swipe conflicts with native gestures)

### Performance Rules
- Sticky container with `h-screen` and `overflow-hidden`
- Total scroll distance = `(panels - 1) × 100vw`
- Use `will-change: transform` on the sliding container
- Provide scroll indicator so users know to keep scrolling

---

## 5. Scroll-Triggered Reveals

**What it achieves:** Elements animate into view (fade, slide, scale, rotate) as they enter the viewport during scrolling.

### Implementations

| Library | Approach | Performance | Bundle Impact |
|---------|----------|-------------|---------------|
| **Motion** | `useInView` hook + `variants` (hidden/visible) | GPU-accelerated | Included in Motion bundle |
| **GSAP ScrollTrigger** | `ScrollTrigger.batch()` for multiple elements | GPU-accelerated | +45KB |
| **Intersection Observer** | Native API + CSS classes toggle | Best native perf | 0KB |
| **Motion One** | `inView()` function + `animate()` | Tiny bundle, WAAPI | +3KB |
| **AOS (Animate On Scroll)** | `data-aos` attributes on elements | Simple but dated | +14KB |

### When to Use
- Almost every content page — the most common scroll animation
- Feature sections, testimonials, cards, statistics
- Progressive content disclosure

### When NOT to Use
- Above-the-fold content (should be visible immediately)
- When every element animates (too much motion = no hierarchy)
- Dashboard/app interfaces (reveals slow down workflows)

### Performance Rules
- Use `once: true` — elements don't re-hide on scroll up
- Use `margin: "-80px"` to `-120px` so animation triggers slightly early
- Stagger children with 50-100ms delay between items
- Only animate `opacity` and `transform` (GPU-composited properties)
- Max 10-15 animated elements visible at once

---

## 6. Scroll Progress Indicators

**What it achieves:** A visual bar, ring, or percentage that shows how far through a page or section the user has scrolled.

### Implementations

| Library | Approach | Performance | Bundle Impact |
|---------|----------|-------------|---------------|
| **Motion** | `useScroll` + `scaleX` on a fixed bar | GPU-accelerated | Included in Motion bundle |
| **CSS Scroll-Driven** | `animation-timeline: scroll()` on a pseudo-element | Native, zero JS | 0KB |
| **Custom JS** | `scrollTop / scrollHeight` → width percentage | Simple | 0KB |

### When to Use
- Long-form articles / blog posts
- Documentation pages
- Section-by-section progress tracking

### When NOT to Use
- Short pages where progress is obvious
- App interfaces (users know where they are)

---

## 7. Text Reveal on Scroll

**What it achieves:** Text appears progressively as the user scrolls — word-by-word, line-by-line, or character-by-character. Creates a reading-driven, editorial feel.

### Implementations

| Library | Approach | Performance | Bundle Impact |
|---------|----------|-------------|---------------|
| **Motion** | Split text into spans + `staggerChildren` + `useInView` | GPU-accelerated | Included in Motion bundle |
| **GSAP SplitText** | SplitText plugin + ScrollTrigger scrub | GPU-accelerated, pro feature | +45KB + SplitText (Club) |
| **CSS Scroll-Driven** | `animation-timeline: view()` on per-word spans | Native, experimental | 0KB |
| **Custom** | Intersection Observer + CSS transition per word/line | Manual but flexible | 0KB |

### When to Use
- Hero headlines and taglines
- Editorial / storytelling pages
- Impact statements and callouts

### When NOT to Use
- Body text / long paragraphs (too slow to read)
- When accessibility is primary concern (screen readers ignore visual reveals)
- On fast-scrolling pages

---

## 8. Scroll-Driven Color / Theme Transitions

**What it achieves:** Background colors, text colors, or entire theme shifts as the user scrolls through different sections — creating distinct moods per section.

### Implementations

| Library | Approach | Performance | Bundle Impact |
|---------|----------|-------------|---------------|
| **Motion** | `useScroll` + `useTransform` mapping progress to color values | Smooth | Included in Motion bundle |
| **GSAP ScrollTrigger** | `onEnter`/`onLeave` callbacks toggle CSS custom properties | Event-based | +45KB |
| **Intersection Observer** | Toggle `data-theme` attribute on `<body>` per section | Native | 0KB |
| **CSS Scroll-Driven** | `animation-timeline: view()` animating `--bg-color` | Native, experimental | 0KB |

### When to Use
- Pages with distinct sections (features, pricing, testimonials)
- Dark-to-light or light-to-dark transitions
- Brand color section differentiation

### When NOT to Use
- When sections are short (transitions happen too fast)
- When color contrast must remain constant (accessibility)
- Single-mood pages

---

## 9. CSS Scroll Snapping

**What it achieves:** Sections lock into position as the user scrolls, creating a slide-by-slide experience.

### Implementations

| Library | Approach | Performance | Bundle Impact |
|---------|----------|-------------|---------------|
| **CSS Only** | `scroll-snap-type: y mandatory` + `scroll-snap-align: start` | Native, best perf | 0KB |
| **Fullpage.js** | Full-page section locking with advanced API | Feature-rich | +30KB |

### When to Use
- Full-page section layouts (presentation-style)
- Carousels and image galleries
- Step-by-step wizards

### When NOT to Use
- Content-heavy pages where free scrolling is expected
- When sections vary significantly in height
- Mobile (can conflict with native scroll behavior)

---

## 10. Infinite Scroll with Lazy Loading

**What it achieves:** New content loads automatically as the user approaches the bottom of the current content, creating an endless feed.

### Implementations

| Library | Approach | Performance | Bundle Impact |
|---------|----------|-------------|---------------|
| **Intersection Observer** | Sentinel element at bottom triggers data fetch | Native, minimal | 0KB |
| **React Query / SWR** | `useInfiniteQuery` + Intersection Observer trigger | Cached, deduped | Included in data lib |
| **Virtuoso / react-window** | Virtualized list + infinite loading | Best for long lists | +10-15KB |

### When to Use
- Social feeds, activity logs, search results
- Image galleries with many items
- Any paginated content the user browses linearly

### When NOT to Use
- When users need to reach the footer (infinite scroll blocks it)
- When content has a clear end (use pagination instead)
- SEO-critical content (search engines can't scroll)

### Performance Rules
- Load 20-50 items per batch
- Use virtualization for lists > 100 items
- Show loading skeleton during fetch
- Implement "load more" button as fallback for accessibility
