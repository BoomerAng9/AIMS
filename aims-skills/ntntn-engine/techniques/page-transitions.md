# NtNtN Engine — Page & Layout Transition Techniques Deep Dive

> Every navigation transition, layout animation, and content swap technique.

---

## 1. Page Transition Animations

**What it achieves:** Smooth animated transitions between pages/routes — instead of hard cuts, pages cross-fade, slide, or morph into each other.

### Implementations

| Library | Approach | Performance | Bundle Impact |
|---------|----------|-------------|---------------|
| **View Transitions API** | Native browser `document.startViewTransition()` | Best performance | 0KB |
| **Framer Motion** | `AnimatePresence` wrapping route outlet + exit/enter animations | Full control | Included in FM |
| **Next.js (App Router)** | `loading.tsx` + `template.tsx` with animation wrapper | Framework-native | 0KB |
| **Barba.js** | Dedicated page transition library (framework-agnostic) | Feature-rich | +8KB |
| **Swup** | Page transition library with plugin system | Modular | +5KB |

### Transition Types
- **Crossfade:** Old page fades out, new page fades in (simplest)
- **Slide:** Pages slide left/right based on navigation direction
- **Scale:** Old page scales down, new page scales up from center
- **Wipe:** Colored overlay wipes across screen, revealing new page
- **Morph:** Shared elements smoothly transition between pages (View Transitions API)
- **Curtain:** Two panels slide in from edges, meet in center, then reveal

### When to Use
- Portfolio / creative sites where navigation is part of the experience
- Multi-page apps with visual continuity (e-commerce product → detail)
- Apps where the navigation direction matters (forward/back)

### When NOT to Use
- High-frequency navigation (dashboards, admin panels — transitions slow workflow)
- When pages load slowly (transitions mask but also delay perceived load)
- SPA with complex state that needs preserved during transition

### Performance Rules
- Keep total transition duration under 400ms (300ms ideal)
- Use `will-change: opacity, transform` on transitioning elements
- Prefetch next page during transition animation
- Cancel in-progress transitions if user navigates again quickly
- Disable on `prefers-reduced-motion` (instant swap instead)

---

## 2. View Transitions API (Native Browser)

**What it achieves:** The browser captures a snapshot of the old state and new state, then animates between them — enabling shared element transitions natively without JS animation libraries.

### How It Works
```
1. Call document.startViewTransition(() => { /* update DOM */ })
2. Browser captures old state as screenshot
3. DOM updates execute
4. Browser captures new state
5. Old screenshot animates to new state (default: crossfade)
6. Customize via ::view-transition pseudo-elements in CSS
```

### Key CSS
```css
/* Name elements that should have shared transitions */
.product-image {
  view-transition-name: product-hero;
}

/* Customize the transition animation */
::view-transition-old(product-hero) {
  animation: fade-out 300ms ease-out;
}
::view-transition-new(product-hero) {
  animation: fade-in 300ms ease-in;
}
```

### Browser Support (2025-2026)
- Chrome/Edge: Full support (same-document + cross-document)
- Safari: Same-document support
- Firefox: In development
- Fallback: Instant navigation (no animation)

### When to Use
- Same-origin multi-page apps (MPAs)
- SPAs with route changes
- Shared element transitions (image → full page)
- List → detail page transitions

### When NOT to Use
- Cross-origin navigation
- When you need animation sequencing/choreography (use FM or GSAP instead)
- When browser support coverage isn't sufficient for your audience

---

## 3. Layout Animations

**What it achieves:** Elements smoothly animate to their new position when the layout changes — items reordering, panels resizing, content appearing/disappearing causes everything to flow naturally.

### Implementations

| Library | Approach | Performance | Bundle Impact |
|---------|----------|-------------|---------------|
| **Framer Motion layout** | `layout` prop on `motion` elements — automatic FLIP | Smooth, declarative | Included in FM |
| **Framer Motion layoutId** | Shared `layoutId` for cross-component layout transitions | Cross-container animation | Included in FM |
| **FLIP technique** | Manual First-Last-Invert-Play (measure → invert → animate) | Framework-agnostic | 0KB |
| **Auto Animate** | `useAutoAnimate()` hook — zero-config layout animation | Dead simple | +4KB |

### FLIP Technique (How Layout Animation Works)
```
1. FIRST:  Record element's current position/size
2. (DOM change happens — element moves in layout)
3. LAST:   Record element's new position/size
4. INVERT: Apply transform to make element appear in old position
5. PLAY:   Remove transform with animation → element smoothly moves to new position
```

### Common Use Cases
- **Reorder lists:** Items smoothly slide to new positions when sorted
- **Filter/remove:** Items slide together when siblings are filtered out
- **Expand/collapse:** Panels resize and siblings adjust
- **Tab indicator:** Active indicator slides between tabs
- **Card → modal:** Card expands into a full modal (shared layoutId)

### When to Use
- Any list that can be sorted, filtered, or reordered
- Collapsible panels and accordions
- Tab switches with sliding indicators
- Card grids with add/remove functionality

### When NOT to Use
- Lists with 100+ items (measuring every item is expensive)
- Rapid/frequent layout changes (too much animation)
- When the position change is minor (< 10px, not worth animating)

### Performance Rules
- Only add `layout` to elements that actually move
- Use `layout="position"` if only position changes (not size)
- Use `layoutId` sparingly — each one triggers a measurement
- `Auto Animate` is best for simple cases; Framer Motion for complex choreography

---

## 4. Staggered List Animations

**What it achieves:** List items enter one after another with a slight delay between each — creating a cascading reveal effect.

### Implementations

| Library | Approach | Performance | Bundle Impact |
|---------|----------|-------------|---------------|
| **Framer Motion** | `staggerChildren` in parent variant + child variants | GPU-accelerated | Included in FM |
| **GSAP** | `gsap.from(items, { stagger: 0.1, ... })` | GPU-accelerated | +45KB |
| **CSS** | `animation-delay: calc(var(--index) * 0.1s)` per item | Native | 0KB |
| **Motion One** | `stagger(0.1)` in timeline | Lightweight | +3KB |

### Stagger Patterns
- **Top-down:** First item appears first, last item last (most common)
- **Center-out:** Center items first, edges last
- **Random:** Random delay per item (organic feel)
- **From-click:** Items nearest to click point appear first

### Best Practices
- Stagger delay: 50-100ms per item
- Total stagger duration: max 500ms (even for 20+ items)
- For long lists (>10 items), only stagger the first 8-10 visible items
- Use `once: true` — don't re-stagger on scroll back
- Each item animation: 200-300ms (opacity + translateY)

---

## 5. Skeleton Loading Shimmer

**What it achieves:** Placeholder shapes matching the eventual content layout, with a shimmering gradient that sweeps across — indicating content is loading without a spinner.

### Implementations

| Library | Approach | Performance | Bundle Impact |
|---------|----------|-------------|---------------|
| **CSS** | `linear-gradient` + `@keyframes` background-position animation | Native, lightweight | 0KB |
| **Tailwind** | `animate-pulse` or custom `animate-shimmer` class | Utility-based | 0KB |
| **React Loading Skeleton** | Dedicated skeleton component library | Feature-rich | +3KB |

### Implementation Pattern
```css
.skeleton {
  background: linear-gradient(
    90deg,
    rgba(255,255,255,0.05) 25%,
    rgba(255,255,255,0.1) 50%,
    rgba(255,255,255,0.05) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
  border-radius: 8px;
}
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
```

### Best Practices
- Match skeleton shapes to actual content layout (rect for text, circle for avatar)
- Show skeleton immediately (no delay)
- Transition from skeleton to content with a brief fade
- Don't animate too fast (1.5-2s per cycle)
- Use `aria-busy="true"` on the skeleton container

---

## 6. Content Swap Crossfade

**What it achieves:** When content changes in place (tab content, dynamic data, carousel slides), old content fades out while new content fades in simultaneously.

### Implementations

| Library | Approach | Performance | Bundle Impact |
|---------|----------|-------------|---------------|
| **Framer Motion** | `AnimatePresence mode="wait"` or `mode="popLayout"` | GPU-accelerated | Included in FM |
| **CSS** | Absolute positioning + `opacity` transition with state toggle | Native | 0KB |
| **View Transitions API** | `document.startViewTransition()` for same-element content swap | Native, browser-level | 0KB |

### AnimatePresence Modes
- **`mode="wait"`**: Old exits completely before new enters (sequential)
- **`mode="popLayout"`**: Old exits while new enters simultaneously (crossfade)
- **`mode="sync"`**: Both animate at the same time, no waiting

### Best Practices
- Use `mode="wait"` for content where layout changes (prevents overlap)
- Use `mode="popLayout"` for same-size containers (smooth crossfade)
- Add `key` prop to the animated child to trigger re-mount
- Keep crossfade duration under 200ms (content swaps should feel instant)

---

## 7. Modal / Dialog Enter & Exit

**What it achieves:** Modals open and close with coordinated animations — backdrop darkens, dialog scales/slides in, content staggers — creating a polished, layered experience.

### Implementations

| Library | Approach | Performance | Bundle Impact |
|---------|----------|-------------|---------------|
| **Framer Motion** | `AnimatePresence` + backdrop + dialog motion components | Full control | Included in FM |
| **Radix Dialog** | Headless dialog + CSS/FM animation | Accessible | +5KB |
| **Headless UI Dialog** | Transition component with enter/leave classes | Tailwind-native | Included |
| **CSS** | `:modal` pseudo-class + `@starting-style` (2024+) | Native, modern | 0KB |

### Animation Choreography
```
Open (350ms total):
  1. Backdrop: opacity 0 → 0.5 [200ms, ease-out]
  2. Dialog:   scale(0.95) opacity(0) y(10px) → scale(1) opacity(1) y(0) [250ms, spring]
  3. Content:  stagger children 50ms each, opacity(0) y(8px) → opacity(1) y(0)

Close (200ms total):
  1. Content:  all opacity → 0 [100ms, ease-in]
  2. Dialog:   scale(0.97) opacity(0) [150ms, ease-in]
  3. Backdrop: opacity → 0 [150ms, ease-in]
```

### Best Practices
- Backdrop click should close (with exit animation)
- Escape key should close (with exit animation)
- Focus trap inside modal while open
- Restore focus to trigger element on close
- `aria-modal="true"` and `role="dialog"`
- Prevent body scroll while modal is open (`overflow: hidden` on body)

---

## 8. Accordion Expand / Collapse

**What it achieves:** Content sections expand and collapse with smooth height animation — revealing and hiding detail content on demand.

### Implementations

| Library | Approach | Performance | Bundle Impact |
|---------|----------|-------------|---------------|
| **Framer Motion** | `AnimatePresence` + `motion.div` with `height: "auto"` | Smooth, spring-based | Included in FM |
| **CSS** | `grid-template-rows: 0fr → 1fr` transition (modern) | Native, smooth | 0KB |
| **Radix Accordion** | Headless accordion + CSS variable for height | Accessible | +3KB |
| **HTML details/summary** | Native browser accordion (no animation by default) | Zero JS, accessible | 0KB |

### CSS Grid Technique (Modern)
```css
.accordion-content {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 300ms ease-out;
}
.accordion-content[data-open="true"] {
  grid-template-rows: 1fr;
}
.accordion-content > div {
  overflow: hidden;
}
```

### Best Practices
- Duration: 250-350ms for expand, 200ms for collapse
- Only one section open at a time (or allow multiple — user preference)
- Rotate chevron icon on expand (180° rotation)
- Use `aria-expanded` on the trigger button
- Content inside accordion should not contain focusable elements when collapsed
