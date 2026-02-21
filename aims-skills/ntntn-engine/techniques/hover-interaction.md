# NtNtN Engine — Hover & Interaction Techniques Deep Dive

> Every hover, cursor, gesture, and direct interaction technique.

---

## 1. 3D Card Tilt

**What it achieves:** Cards tilt in 3D space following the mouse cursor, creating a holographic / physical feel with perspective depth.

### Implementations

| Library | Approach | Performance | Bundle Impact |
|---------|----------|-------------|---------------|
| **Framer Motion** | `useMotionValue` for mouse position → `useTransform` for rotateX/rotateY | GPU-accelerated | Included in FM |
| **Vanilla Tilt** | `data-tilt` attribute, auto-detects mouse position | Simple, standalone | +3KB |
| **CSS Only** | `:hover` + `perspective` + `transform: rotateX() rotateY()` (static, no tracking) | Native, limited | 0KB |
| **GSAP** | `quickTo` for smooth mouse-following rotation | GPU-accelerated | +45KB |

### When to Use
- Product/feature cards on marketing pages
- Pricing cards, team member cards
- Interactive galleries

### When NOT to Use
- Mobile (no hover) — provide tap fallback or skip
- Cards with lots of text (tilt makes reading harder)
- Rapid-scanning lists (tilt slows interaction)

### Performance Rules
- Use `perspective: 1000px` on the parent container
- Limit rotation to ±15° (more feels nauseating)
- Add `transition: transform 0.1s ease` for smoothness
- Reset to flat on mouse leave with spring animation
- Disable on `prefers-reduced-motion`

---

## 2. Magnetic Cursor Effect

**What it achieves:** Interactive elements (buttons, links, icons) subtly pull toward the cursor when it's nearby, as if magnetized.

### Implementations

| Library | Approach | Performance | Bundle Impact |
|---------|----------|-------------|---------------|
| **Framer Motion** | `useSpring` for position + distance calculation from cursor to element center | GPU-accelerated | Included in FM |
| **GSAP** | `quickTo` with distance threshold + `gsap.to` for smooth attraction | GPU-accelerated | +45KB |
| **Custom JS** | `mousemove` listener + `transform: translate()` based on distance | Manual, flexible | 0KB |

### When to Use
- CTAs and primary buttons on marketing pages
- Navigation links on creative/portfolio sites
- Icon grids

### When NOT to Use
- Forms (inputs shouldn't move)
- Dense UI with many clickable elements (too chaotic)
- Accessibility-critical interfaces

### Performance Rules
- Magnetic radius: 80-150px from element center
- Displacement: max 10-20px (subtle is better)
- Use `useSpring` for smooth return-to-center
- Throttle `mousemove` to RAF
- No effect on mobile — skip entirely

---

## 3. Custom Cursor

**What it achieves:** Replaces or supplements the default cursor with a custom design — circle, dot, trail, or contextual shape that reacts to hover states.

### Implementations

| Library | Approach | Performance | Bundle Impact |
|---------|----------|-------------|---------------|
| **Framer Motion** | `motion.div` following `clientX/clientY` with `useSpring` for lag | GPU-accelerated | Included in FM |
| **CSS** | `cursor: url(custom.svg), auto` — static custom cursor | Native, simple | 0KB |
| **Custom JS** | RAF loop updating `transform: translate()` on a fixed div | Manual, full control | 0KB |
| **Cursor Effects (npm)** | Pre-built cursor effects library | Plug and play | +5-10KB |

### Cursor Variations
- **Dot + Circle:** Small dot (actual cursor position) + larger circle (lagging follow)
- **Scale on Hover:** Circle grows when hovering interactive elements
- **Text Label:** Cursor becomes a text label on hover ("View", "Drag", "Play")
- **Blend Mode:** `mix-blend-mode: difference` for automatic contrast
- **Trail:** Multiple fading circles following the cursor path

### When to Use
- Creative/portfolio sites where personality matters
- Interactive galleries and showcases
- Agency/studio websites

### When NOT to Use
- E-commerce (custom cursors confuse shoppers)
- Apps/dashboards (precision matters)
- Mobile (no cursor)
- Accessibility-focused interfaces

### Performance Rules
- Use `pointer-events: none` on the cursor element
- Use `position: fixed` (not absolute)
- Apply `will-change: transform` for GPU compositing
- Hide default cursor with `cursor: none` on `<body>`
- Show default cursor on inputs, textareas, selects
- Throttle to RAF (not raw mousemove)

---

## 4. Hover State Morphing

**What it achieves:** Elements smoothly transition between shapes, sizes, colors, or border radii on hover — creating fluid, organic state changes.

### Implementations

| Library | Approach | Performance | Bundle Impact |
|---------|----------|-------------|---------------|
| **CSS** | `transition` on `border-radius`, `background`, `transform`, `box-shadow` | Native, best perf | 0KB |
| **Framer Motion** | `whileHover` prop with target values | GPU-accelerated | Included in FM |
| **GSAP** | `gsap.to` on hover event | GPU-accelerated | +45KB |

### Common Morphs
- **Shape morph:** Square → circle (`border-radius: 0` → `50%`)
- **Color morph:** Background and text color swap
- **Scale morph:** Element grows or shrinks
- **Shadow morph:** Shadow expands, changes color, or elevates
- **Border morph:** Border color, width, or style changes
- **Content swap:** Text or icon changes on hover

### When to Use
- Buttons, cards, navigation links
- Icon states (default → active)
- Any interactive element that benefits from feedback

### Performance Rules
- Only transition GPU-composited properties when possible (opacity, transform)
- For `background-color` transitions, keep duration short (150-250ms)
- Use `ease-out` for hover-in, `ease-in` for hover-out
- Avoid transitioning `width`/`height` — use `transform: scale()` instead

---

## 5. Ripple Effect

**What it achieves:** A circular wave emanates from the click/tap point on an element, providing tactile feedback (Material Design signature).

### Implementations

| Library | Approach | Performance | Bundle Impact |
|---------|----------|-------------|---------------|
| **CSS + JS** | Create `span` at click position, animate `scale` + `opacity`, remove after animation | Lightweight | 0KB |
| **Material UI** | Built-in `<ButtonBase>` ripple | Automatic | Included in MUI |
| **Custom Hook** | `useRipple` hook that manages ripple state and cleanup | Reusable | 0KB |

### When to Use
- Buttons and clickable cards
- List items and menu items
- Any tap target needing feedback

### When NOT to Use
- When the design language doesn't match Material Design
- On elements where the ripple obscures content
- Text links (too heavy for inline elements)

---

## 6. Drag-to-Reorder

**What it achieves:** Users can grab items and drag them into new positions within a list, with smooth animations showing the reordering in real-time.

### Implementations

| Library | Approach | Performance | Bundle Impact |
|---------|----------|-------------|---------------|
| **Framer Motion Reorder** | `<Reorder.Group>` + `<Reorder.Item>` with layout animations | GPU-accelerated, built-in | Included in FM |
| **@dnd-kit** | Modular drag-and-drop toolkit with sensors and collision detection | Accessible, flexible | +15KB |
| **react-beautiful-dnd** | Declarative DnD for lists (Atlassian) | Mature, accessible | +30KB (maintenance mode) |
| **HTML Drag & Drop API** | Native `draggable` + `dragover`/`drop` events | No animations, basic | 0KB |

### When to Use
- Todo lists, kanban boards, playlist ordering
- Priority ranking interfaces
- Dashboard widget arrangement

### When NOT to Use
- Mobile without touch support consideration
- Lists with 100+ items (performance concern without virtualization)
- When the order doesn't matter

### Performance Rules
- Use layout animations for smooth repositioning
- Implement keyboard drag support for accessibility
- Provide visual feedback during drag (elevation, opacity, placeholder)
- Auto-scroll when dragging near container edges
- Use `touch-action: none` on draggable elements

---

## 7. Gesture-Based Interactions

**What it achieves:** Pinch-to-zoom, swipe-to-dismiss, rotate, and other touch/pointer gestures create native-app-like interactions on the web.

### Implementations

| Library | Approach | Performance | Bundle Impact |
|---------|----------|-------------|---------------|
| **Framer Motion** | `drag`, `whileDrag`, drag constraints, `onDragEnd` velocity | GPU-accelerated | Included in FM |
| **use-gesture** | React hook for all gestures (drag, pinch, scroll, wheel, move, hover) | Flexible, composable | +8KB |
| **Hammer.js** | Multi-touch gesture recognition | Mature, touch-focused | +7KB |
| **Pointer Events API** | Native `pointerdown/move/up` + manual gesture math | Zero dependency | 0KB |

### Gesture Types
- **Swipe dismiss:** Drag horizontally past threshold → item removes
- **Pull to refresh:** Drag down from top → trigger refresh
- **Pinch to zoom:** Two-finger pinch → scale content
- **Rotate:** Two-finger rotation → rotate element
- **Long press:** Hold → context menu or action
- **Flick:** Quick drag → momentum-based scroll

### When to Use
- Mobile-first interfaces
- Image viewers and galleries
- Card stacks (Tinder-style swipe)
- Maps and zoomable content

### When NOT to Use
- Desktop-primary interfaces (gesture discoverability is low)
- When keyboard/mouse alternatives aren't provided
- Complex forms where accidental gestures cause issues

---

## 8. Tooltip Animations

**What it achieves:** Tooltips appear with smooth enter/exit animations instead of instant show/hide, creating a polished interaction feel.

### Implementations

| Library | Approach | Performance | Bundle Impact |
|---------|----------|-------------|---------------|
| **Framer Motion** | `AnimatePresence` + `motion.div` with fade + scale | GPU-accelerated | Included in FM |
| **Radix Tooltip** | Built-in animation support with CSS | Accessible, composable | +5KB |
| **CSS** | `opacity` + `transform` transition with `pointer-events` toggle | Native | 0KB |
| **Floating UI** | Positioning + optional animation via CSS/FM | Positioning-focused | +3KB |

### Animation Patterns
- **Fade + Scale:** `opacity: 0 → 1` + `scale: 0.95 → 1` (most common)
- **Slide from trigger:** Tooltip slides from the edge nearest the trigger
- **Delayed show:** 200-500ms delay before appearing (prevents flicker on quick hovers)
- **Instant hide:** No delay on mouse leave

### Performance Rules
- Use `will-change: opacity, transform` on tooltip
- Remove from DOM when hidden (AnimatePresence) to avoid stacking context issues
- Delay show by 200ms minimum to prevent tooltip spam
- Use `pointer-events: none` during exit animation
