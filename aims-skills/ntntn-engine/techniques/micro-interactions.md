# NtNtN Engine — Micro-Interaction Techniques Deep Dive

> Every small, delightful interaction that makes interfaces feel alive and responsive.

---

## 1. Button Press Feedback

**What it achieves:** Buttons visually respond to press/tap with scale, shadow, and color changes — confirming the user's action.

### Implementations

| Library | Approach | Performance | Bundle Impact |
|---------|----------|-------------|---------------|
| **Motion** | `whileTap={{ scale: 0.97 }}` + `whileHover={{ scale: 1.02 }}` | GPU-accelerated | Included in Motion |
| **CSS** | `:active { transform: scale(0.97); }` + `:hover { transform: scale(1.02); }` | Native, instant | 0KB |
| **Tailwind** | `active:scale-[0.97] hover:scale-[1.02] transition-transform` | Utility-based | 0KB |

### Feedback Patterns
- **Scale down:** Button shrinks slightly on press (most common)
- **Shadow lift:** Shadow grows on hover, shrinks on press
- **Color darken:** Background darkens 10-20% on press
- **Ripple:** Material Design ripple from click point
- **Combined:** Scale + shadow + color shift together

### Best Practices
- Scale: 0.97-0.98 on press, 1.02-1.03 on hover
- Transition: 100-150ms for press, 200ms for hover
- Always provide `:focus-visible` styles for keyboard users
- Never remove the visual feedback — it's accessibility

---

## 2. Toggle Switch Animation

**What it achieves:** A smooth, satisfying animation when toggling between on/off states — the iOS-style switch, theme toggles, or feature flags.

### Implementations

| Library | Approach | Performance | Bundle Impact |
|---------|----------|-------------|---------------|
| **Motion** | `layout` animation on the knob + `animate` background color | Spring-based, smooth | Included in Motion |
| **CSS** | `transition` on `transform: translateX()` + `background-color` | Native | 0KB |
| **Radix Switch** | Headless accessible switch + custom animation | Accessible | +2KB |

### Animation Details
- **Knob slide:** `translateX(0)` → `translateX(20px)` with spring easing
- **Background fill:** Gradual color transition (gray → brand color)
- **Knob squish:** Slight horizontal stretch during slide (0.95 → 1.1 → 1.0)
- **Duration:** 200-300ms total
- **Easing:** Spring (mass: 1, stiffness: 500, damping: 30)

### Accessibility
- Use `role="switch"` and `aria-checked`
- Support keyboard toggle (Space/Enter)
- Ensure sufficient color contrast between states
- Announce state change to screen readers

---

## 3. Form Input Focus Effects

**What it achieves:** Input fields visually transform when focused — border highlights, label floats, background shifts — guiding the user through form completion.

### Implementations

| Library | Approach | Performance | Bundle Impact |
|---------|----------|-------------|---------------|
| **CSS** | `:focus-within` + `transition` on border/label/shadow | Native, zero JS | 0KB |
| **Motion** | `animate` border color and label position based on focus state | Spring-based | Included in Motion |
| **Tailwind** | `focus-within:border-gold focus-within:ring-2` | Utility-based | 0KB |

### Focus Patterns
- **Border highlight:** Border color transitions to brand/gold color
- **Floating label:** Label slides from inside input to above on focus
- **Ring glow:** Soft box-shadow ring appears around input
- **Underline slide:** Bottom border slides in from center or left
- **Background lighten:** Input background slightly brightens on focus

### Best Practices
- Always use `:focus-visible` (not `:focus`) for keyboard-only ring
- Floating labels need `placeholder-shown` pseudo-class for CSS-only
- Keep focus transitions fast (150-200ms)
- Never remove focus indicators — only restyle them

---

## 4. Notification Slide-In

**What it achieves:** Notifications/alerts slide into view from an edge of the screen, remain briefly, then slide back out — non-intrusive user feedback.

### Implementations

| Library | Approach | Performance | Bundle Impact |
|---------|----------|-------------|---------------|
| **Motion** | `AnimatePresence` + `motion.div` with x/y slide + opacity | GPU-accelerated | Included in Motion |
| **CSS** | `@keyframes slideIn` + `animation-fill-mode: forwards` | Native | 0KB |
| **Sonner** | Purpose-built toast library for React | Polished, accessible | +8KB |
| **react-hot-toast** | Lightweight toast with animations | Simple API | +5KB |

### Slide Directions
- **Top-right:** Standard for desktop apps
- **Top-center:** Standard for mobile
- **Bottom-center:** Standard for actions/undo prompts
- **Bottom-right:** Standard for chat/messaging apps

### Animation Sequence
1. **Enter:** Slide from off-screen + fade in (300ms, ease-out)
2. **Hold:** Stay visible for 3-5 seconds
3. **Exit:** Slide back + fade out (200ms, ease-in)
4. **Stack:** New notifications push previous ones down/up

### Best Practices
- Auto-dismiss after 3-5 seconds (with progress indicator)
- Pause timer on hover
- Include close button for dismissal
- Support `role="alert"` for screen readers
- Max 3 visible toasts simultaneously

---

## 5. Progress Bar Animation

**What it achieves:** Visual indication of process completion — file upload, form steps, loading states — with smooth fill animation.

### Implementations

| Library | Approach | Performance | Bundle Impact |
|---------|----------|-------------|---------------|
| **Motion** | `animate` width from 0% → target with spring | GPU-accelerated | Included in Motion |
| **CSS** | `transition: width 300ms ease-out` on inner bar | Native | 0KB |
| **Tailwind** | `transition-all duration-300` + dynamic `w-[${percent}%]` | Utility-based | 0KB |

### Progress Bar Types
- **Linear:** Horizontal bar fill (most common)
- **Circular:** SVG circle with `stroke-dashoffset` animation
- **Steps:** Discrete segments that fill sequentially
- **Indeterminate:** Sliding gradient for unknown duration
- **Gradient fill:** Color shifts from red → yellow → green as progress increases

### Best Practices
- Animate `transform: scaleX()` instead of `width` for performance
- Use `transform-origin: left` for left-to-right fill
- Show percentage text for accessibility
- Indeterminate bars should have clear visual distinction from determinate
- `aria-valuenow`, `aria-valuemin`, `aria-valuemax` for screen readers

---

## 6. Checkbox / Radio Custom Animation

**What it achieves:** Custom-styled checkboxes and radio buttons with satisfying check/select animations — replacing the default browser controls.

### Implementations

| Library | Approach | Performance | Bundle Impact |
|---------|----------|-------------|---------------|
| **CSS** | Hidden native input + styled `::before`/`::after` + `transition` | Native, accessible | 0KB |
| **Motion** | SVG checkmark path with `pathLength` animation | Smooth draw-in | Included in Motion |
| **Radix Checkbox** | Headless accessible checkbox + custom animation | Accessible | +2KB |

### Checkbox Animation Patterns
- **Checkmark draw:** SVG path draws in with `stroke-dasharray` animation
- **Background fill:** Box fills with color on check
- **Scale bounce:** Checkbox scales down then bounces up on check
- **Combined:** Fill + draw + bounce together

### Radio Animation Patterns
- **Dot scale:** Inner dot scales from 0 to 1
- **Ripple:** Outward ripple on selection
- **Color transition:** Border and fill color animate

### Best Practices
- Always use real `<input type="checkbox/radio">` (hidden with `sr-only`)
- Label must be associated with input via `htmlFor`/`id`
- Support `:focus-visible` ring on the custom control
- Support `:indeterminate` state for checkboxes

---

## 7. Menu Open / Close Choreography

**What it achieves:** Menus open and close with orchestrated animations — the container scales/fades while items stagger in sequentially.

### Implementations

| Library | Approach | Performance | Bundle Impact |
|---------|----------|-------------|---------------|
| **Motion** | `AnimatePresence` + staggered children with `variants` | GPU-accelerated | Included in Motion |
| **CSS** | `@keyframes` + `animation-delay` per item | Native | 0KB |
| **Headless UI Transition** | Transition component with enter/leave classes | Tailwind-native | Included in Headless UI |

### Choreography Pattern
```
Open sequence (300ms total):
  1. Container: scale(0.95, 0.9) opacity(0) → scale(1) opacity(1) [150ms]
  2. Items: stagger 50ms each, opacity(0) y(8px) → opacity(1) y(0) [100ms each]

Close sequence (200ms total):
  1. Items: all simultaneously opacity(0) [100ms]
  2. Container: scale(0.95) opacity(0) [100ms]
```

### When to Use
- Dropdown menus and popovers
- Mobile hamburger menus
- Context menus
- Select dropdowns

### Best Practices
- Open animation slower than close (perceived responsiveness)
- Stagger items from top to bottom (reading direction)
- Container animates first, items follow
- On close, items fade simultaneously (don't stagger reverse)
- Escape key should close instantly (no animation)

---

## 8. Tab Switching Animation

**What it achieves:** Smooth transitions between tab panels — content crossfades, underline slides, or panels slide left/right.

### Implementations

| Library | Approach | Performance | Bundle Impact |
|---------|----------|-------------|---------------|
| **Motion** | `AnimatePresence` + `motion.div` with `key` per tab | GPU-accelerated | Included in Motion |
| **Motion layoutId** | Shared `layoutId` on the active indicator underline | Smooth indicator slide | Included in Motion |
| **CSS** | `transition` on tab indicator `left/width` + content `opacity` | Native | 0KB |
| **Radix Tabs** | Headless tabs + custom transition | Accessible | +3KB |

### Animation Elements
- **Active indicator:** Underline/background slides to the active tab
- **Content panel:** Crossfade between panels (opacity swap)
- **Directional slide:** Panel slides left when going forward, right when going back
- **Scale transition:** Old panel scales down while new scales up

### Best Practices
- Use `layoutId` for the smoothest indicator sliding
- Content transition: 150-200ms max (tabs should feel instant)
- Support keyboard navigation (Arrow keys between tabs)
- Use `aria-selected` and `role="tabpanel"` for accessibility
- Don't animate on initial render — only on user interaction

---

## 9. Toast Notification Animation

**What it achieves:** Compact, temporary messages that appear, deliver information, and auto-dismiss — with satisfying enter/exit motion.

### Implementations

| Library | Approach | Performance | Bundle Impact |
|---------|----------|-------------|---------------|
| **Sonner** | Dedicated toast library with stacking, swipe-to-dismiss | Production-ready | +8KB |
| **react-hot-toast** | Simple toast with enter/exit animation | Lightweight | +5KB |
| **Motion** | Custom toast with `AnimatePresence` + motion | Full control | Included in Motion |

### Toast Animation Sequence
1. **Enter:** Slide up from bottom + fade in + subtle scale (250ms, spring)
2. **Stack:** Previous toasts shift up to make room (layout animation)
3. **Progress:** Optional progress bar counting down auto-dismiss timer
4. **Hover:** Pause timer, slightly elevate toast
5. **Swipe dismiss:** Drag threshold → slide out in drag direction + fade
6. **Auto dismiss:** Fade out + slide down (200ms)

### Toast Types & Colors
- **Success:** Green accent, checkmark icon
- **Error:** Red accent, X icon
- **Warning:** Amber accent, alert icon
- **Info:** Blue accent, info icon
- **Loading:** Spinner icon, no auto-dismiss

---

## 10. Loading Spinners (Creative Variants)

**What it achieves:** Visual feedback during async operations — beyond the basic spinner, creative loaders reinforce brand and reduce perceived wait time.

### Spinner Variants

| Type | Implementation | Best For |
|------|---------------|----------|
| **Rotating ring** | CSS `border` + `border-top-color: transparent` + `@keyframes rotate` | Universal default |
| **Pulsing dots** | 3 dots with staggered `scale` animation | Chat/messaging apps |
| **Progress ring** | SVG circle with animated `stroke-dashoffset` | Determinate progress |
| **Skeleton screen** | Shimmer gradient over placeholder shapes | Content loading |
| **Logo morph** | Brand logo with subtle animation | Brand-heavy apps |
| **Bar bounce** | 3-5 vertical bars with staggered height animation | Audio/music apps |
| **Orbit dots** | Dots orbiting a center point | Tech/science apps |
| **Typing indicator** | 3 bouncing dots (like iMessage) | Chat interfaces |

### Best Practices
- Show spinner after 200ms delay (avoid flash for fast loads)
- Use skeleton screens for content loading (less anxious than spinners)
- Ensure spinner has sufficient color contrast (WCAG AA)
- Provide `aria-busy="true"` and `role="status"` on the loading region
- Spinners should be centered in the loading area, not the page
- Never use more than one spinner visible at a time
