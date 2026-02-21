# NtNtN Engine — Category 7: Layout & Responsive Design

> How content adapts and flows across devices and viewports.

---

## CSS Grid

### Overview
2D layout system for rows and columns simultaneously. The most powerful CSS layout
primitive — handles page-level layouts, card grids, dashboard panels, and bento grids.

- **Current:** Universal browser support (including subgrid)
- **Approach:** Define grid tracks, place items, let content flow

### Key Patterns & Techniques

#### 1. Auto-Responsive Grid
```css
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}
```
No media queries needed — items auto-wrap and fill available space.

#### 2. Named Grid Areas
```css
.layout {
  display: grid;
  grid-template-areas:
    "header  header"
    "sidebar main"
    "footer  footer";
  grid-template-columns: 250px 1fr;
  grid-template-rows: auto 1fr auto;
}
.header  { grid-area: header; }
.sidebar { grid-area: sidebar; }
.main    { grid-area: main; }
.footer  { grid-area: footer; }
```

#### 3. Subgrid
```css
.parent {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
}
.child {
  grid-column: span 3;
  display: grid;
  grid-template-columns: subgrid; /* Inherits parent's column tracks */
}
```

#### 4. Bento Grid Layout
```css
.bento {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-auto-rows: 200px;
  gap: 1rem;
}
.bento-large { grid-column: span 2; grid-row: span 2; }
.bento-wide  { grid-column: span 2; }
.bento-tall  { grid-row: span 2; }
```

#### 5. Masonry Layout (Experimental)
```css
.masonry {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: masonry; /* Chrome flag, Firefox 77+ */
  gap: 1rem;
}
```
**Fallback:** Use CSS columns or a JS library (Masonic, react-masonry-css) until native support lands.

### Picker_Ang Notes
- **Always use Grid for 2D layouts** — pages, dashboards, card grids, bento layouts
- Use `auto-fit` / `minmax()` for responsive grids without media queries
- Use Subgrid for aligned child layouts (card footers, form labels)

---

## Flexbox

### Overview
1D layout system — row or column. Best for single-axis alignment, navigation bars,
centering, and distributing space between items.

### Key Patterns
```css
/* Navbar */
.nav { display: flex; justify-content: space-between; align-items: center; gap: 1rem; }

/* Center anything */
.center { display: flex; justify-content: center; align-items: center; }

/* Auto-wrapping row */
.row { display: flex; flex-wrap: wrap; gap: 1rem; }
.row > * { flex: 1 1 300px; }
```

### Grid vs Flexbox
| Use Case | Grid | Flexbox |
|----------|------|---------|
| Page layout | Yes | No |
| Card grid | Yes | Maybe |
| Navigation bar | No | Yes |
| Centering | Either | Yes |
| Unknown item count | Either | Yes |
| 2D alignment needed | Yes | No |

---

## Container Queries

### Overview
Style elements based on their container's size, not the viewport.
Enables truly reusable components that adapt to wherever they're placed.

- **Current:** Chrome 105+, Safari 16+, Firefox 110+
- **Approach:** Parent declares `container-type`, children use `@container`

### Key Patterns
```css
.card-container {
  container-type: inline-size;
  container-name: card;
}

@container card (min-width: 400px) {
  .card { display: flex; flex-direction: row; }
  .card-image { width: 40%; }
}
@container card (max-width: 399px) {
  .card { display: flex; flex-direction: column; }
  .card-image { width: 100%; }
}
```

### Tailwind v4 Container Queries
```html
<div class="@container">
  <div class="flex flex-col @md:flex-row @lg:grid @lg:grid-cols-3">
    <!-- Responds to container width -->
  </div>
</div>
```

### Picker_Ang Notes
- Choose when: Reusable components (cards, widgets), dashboard panels, sidebar/main layouts
- Use alongside media queries — not a replacement

---

## Fluid Typography

### Overview
Font sizes that scale smoothly with viewport width. No breakpoint jumps —
continuous scaling using CSS `clamp()`, `min()`, and `max()`.

### Key Patterns
```css
/* Scales from 1rem at 320px viewport to 2.5rem at 1440px */
h1 {
  font-size: clamp(1rem, 0.5rem + 2.5vw, 2.5rem);
}

/* Modular type scale */
:root {
  --step-0: clamp(1rem, 0.9rem + 0.5vw, 1.125rem);
  --step-1: clamp(1.2rem, 1rem + 1vw, 1.5rem);
  --step-2: clamp(1.44rem, 1.1rem + 1.7vw, 2rem);
  --step-3: clamp(1.728rem, 1.2rem + 2.6vw, 2.667rem);
  --step-4: clamp(2.074rem, 1.3rem + 3.9vw, 3.556rem);
}
```

### Tools
- **Utopia.fyi** — Generate fluid type scales and space scales
- **Type Scale** — Visual type scale calculator
- **Modern Fluid Typography** — `clamp()` calculator

### Picker_Ang Notes
- **Use on every build** — fluid typography is always better than fixed breakpoints
- Pair with Tailwind's `text-[clamp(...)]` arbitrary values

---

## Responsive Images

### Overview
Serve optimal image dimensions and format per device. Critical for performance —
images are typically 50%+ of page weight.

### Key Patterns

#### Next.js Image (A.I.M.S. Default)
```tsx
import Image from 'next/image';

<Image
  src="/hero.jpg"
  alt="Hero image"
  width={1200}
  height={630}
  priority            // LCP image — preload
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
  placeholder="blur"  // Show blur hash during load
/>
```

#### Picture Element (Art Direction)
```html
<picture>
  <source media="(max-width: 768px)" srcset="/hero-mobile.avif" type="image/avif">
  <source media="(max-width: 768px)" srcset="/hero-mobile.webp" type="image/webp">
  <source srcset="/hero-desktop.avif" type="image/avif">
  <source srcset="/hero-desktop.webp" type="image/webp">
  <img src="/hero-desktop.jpg" alt="Hero" loading="lazy">
</picture>
```

### Picker_Ang Notes
- **Always use `next/image`** in Next.js projects — automatic optimization
- Set `priority` on LCP images (above-the-fold hero)
- Use `sizes` attribute — prevents loading oversized images on small screens

---

## Logical Properties

### Overview
Direction-agnostic CSS properties. Use `inline`/`block` instead of `left`/`right`/`top`/`bottom`.
Essential for RTL support and internationalization.

### Key Patterns
```css
/* Physical (old) → Logical (modern) */
margin-left    → margin-inline-start
margin-right   → margin-inline-end
padding-top    → padding-block-start
padding-bottom → padding-block-end
width          → inline-size
height         → block-size
top            → inset-block-start
left           → inset-inline-start
border-left    → border-inline-start
text-align: left → text-align: start
```

### Picker_Ang Notes
- Choose when: Internationalization, RTL support needed
- Recommendation: Use logical properties by default in new builds (future-proof)

---

## View Transitions API

### Overview
Native browser API for animated page transitions. Captures old/new state screenshots,
animates between them. Shared element transitions natively.

- **Current:** Chrome 111+, Safari 18+, Firefox (in development, Interop 2026)
- **Same-document:** SPA route changes
- **Cross-document:** MPA page navigations (Chrome 126+, Safari 26+)

### Key Patterns
```ts
// SPA route change with animation
document.startViewTransition(() => {
  // Update DOM (router navigation)
  updateRoute(newUrl);
});
```
```css
/* Shared element transition */
.product-image { view-transition-name: product-hero; }
::view-transition-old(product-hero) { animation: fade-out 300ms ease-out; }
::view-transition-new(product-hero) { animation: fade-in 300ms ease-in; }
```

### Picker_Ang Notes
- Choose when: Page transitions needed, shared element animations between routes
- Avoid when: Complex choreography (use Motion AnimatePresence), need Firefox support today

---

## CSS Anchor Positioning

### Overview
Attach elements to other elements purely in CSS. The browser handles spatial
awareness, overflow detection, and fallback positioning automatically.
Replaces Popper.js / Floating UI for most tooltip/dropdown use cases.

- **Current:** Chrome 125+, Safari (Interop 2026 focus), Firefox (in development)
- **Approach:** Declare anchor on trigger, position target relative to anchor

### Key Patterns
```css
.trigger {
  anchor-name: --menu-trigger;
}

.dropdown {
  position: fixed;
  position-anchor: --menu-trigger;
  inset-area: block-end span-inline-end;

  /* Automatic fallback when no room below */
  position-try-fallbacks: flip-block;
}
```

### Fallback Styling
```css
/* Style tooltip arrows based on which fallback position is active */
@position-try --flip-above {
  inset-area: block-start span-inline-end;
}
```

### Picker_Ang Notes
- Choose when: Tooltips, dropdowns, popovers, contextual menus — no JS needed
- Avoid when: Need Firefox support today (use Floating UI as fallback)
- Progressive enhancement: use Anchor Positioning with Floating UI fallback

---

## Responsive Design Strategy

### A.I.M.S. Default Breakpoints (Tailwind)
```
sm:  640px   → Larger phones / small tablets
md:  768px   → Tablets (portrait)
lg:  1024px  → Tablets (landscape) / small laptops
xl:  1280px  → Laptops / desktops
2xl: 1536px  → Large desktops
```

### Mobile-First Approach (Mandatory)
1. Design for 375px first (iPhone SE)
2. Add complexity at each breakpoint going up
3. Never hide critical content on mobile — reflow, don't remove
4. Touch targets minimum 44x44px on mobile
5. Test on real devices, not just browser devtools

### Testing Widths
| Width | Device | Priority |
|-------|--------|----------|
| 375px | iPhone SE / small phone | Must |
| 390px | iPhone 14 | Must |
| 768px | iPad Mini / tablet portrait | Must |
| 1024px | iPad Pro / tablet landscape | Should |
| 1280px | Laptop | Must |
| 1440px | Desktop | Should |
| 1920px | Large desktop | Nice to have |

---

## Layout Comparison Matrix

| Technique | Dimension | Responsive | Container-Aware | Browser Support |
|-----------|-----------|-----------|----------------|----------------|
| **CSS Grid** | 2D | Via auto-fit/minmax | Via subgrid | Universal |
| **Flexbox** | 1D | Via wrap | No | Universal |
| **Container Queries** | N/A | Container-based | Yes | Modern (95%+) |
| **Fluid Typography** | Text | Continuous | No | Universal |
| **View Transitions** | Navigation | N/A | N/A | Chrome/Safari |
| **Anchor Positioning** | Positioning | N/A | N/A | Chrome (Interop 2026) |
| **Logical Properties** | All | N/A | N/A | Universal |
