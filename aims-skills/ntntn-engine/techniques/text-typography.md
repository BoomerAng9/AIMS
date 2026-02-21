# NtNtN Engine — Text & Typography Techniques Deep Dive

> Every text animation, typographic effect, and content reveal technique.

---

## 1. Typewriter / Character Reveal

**What it achieves:** Text appears character by character, simulating typing — creates urgency, personality, and draws attention to key messages.

### Implementations

| Library | Approach | Performance | Bundle Impact |
|---------|----------|-------------|---------------|
| **Framer Motion** | Split into `<motion.span>` per character + `staggerChildren: 0.03` | GPU-accelerated | Included in FM |
| **CSS** | `steps()` timing function + `width` animation + `overflow: hidden` | Native, limited | 0KB |
| **Typed.js** | Dedicated typewriter library with cursor, backspace, loop | Feature-rich | +5KB |
| **Custom JS** | `setInterval` adding characters to `textContent` | Simple, no deps | 0KB |

### Variations
- **Forward only:** Characters appear left to right
- **With cursor:** Blinking cursor follows the text
- **Type and delete:** Types a word, deletes it, types the next (rotating phrases)
- **Scroll-triggered:** Typing starts when element enters viewport

### When to Use
- Hero headlines on landing pages
- Chatbot/AI-themed interfaces
- Rotating taglines or value propositions

### When NOT to Use
- Body text (too slow for reading)
- When the content is critical for comprehension (users can't scan ahead)
- Multiple typewriter effects on the same page

---

## 2. Text Gradient Animation

**What it achieves:** Text displays a gradient that shifts, shimmers, or rotates over time — creating a premium, eye-catching effect.

### Implementations

| Library | Approach | Performance | Bundle Impact |
|---------|----------|-------------|---------------|
| **CSS** | `background: linear-gradient()` + `background-clip: text` + `@keyframes` shift | Native, GPU-friendly | 0KB |
| **Tailwind** | `bg-gradient-to-r` + `bg-clip-text` + `animate-gradient-shift` custom animation | Utility-based | 0KB |
| **GSAP** | Animate gradient stop positions or hue rotation | Smooth, precise | +45KB |

### CSS Implementation Pattern
```css
.gradient-text {
  background: linear-gradient(90deg, #D4AF37, #3B82F6, #22D3EE, #D4AF37);
  background-size: 300% 100%;
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: gradient-shift 4s ease infinite;
}
@keyframes gradient-shift {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}
```

### When to Use
- Headlines and hero text on dark backgrounds
- Brand names and logos
- CTAs and featured text

### When NOT to Use
- Body text (readability suffers)
- Light backgrounds (gradients need contrast)
- Multiple gradient texts competing for attention

---

## 3. Split Text Animation

**What it achieves:** Text is split into individual characters, words, or lines, each animated independently — enabling stagger reveals, wave effects, and choreographed entrances.

### Implementations

| Library | Approach | Performance | Bundle Impact |
|---------|----------|-------------|---------------|
| **GSAP SplitText** | Plugin splits text nodes + timeline animates each piece | Professional, feature-rich | Club GreenSock (paid) |
| **Framer Motion** | Manual `.split("")` or `.split(" ")` + `staggerChildren` | GPU-accelerated | Included in FM |
| **splitting.js** | CSS-variable based splitting (chars, words, lines) + CSS animations | Lightweight, CSS-driven | +2KB |
| **Custom** | Manual DOM splitting + Intersection Observer + CSS transitions | Zero deps | 0KB |

### Split Types
- **Per-character:** Each letter animates independently (e.g., wave, cascade)
- **Per-word:** Each word enters as a unit (e.g., staggered fade-up)
- **Per-line:** Each line reveals sequentially (e.g., slide-up per line)

### Animation Styles
- **Fade up:** `opacity: 0, y: 20` → `opacity: 1, y: 0` (most common)
- **Fade down:** Same but from above
- **Scale in:** Each piece scales from 0 to 1
- **Rotate in:** Each piece rotates into place
- **Blur in:** `filter: blur(10px)` → `blur(0)`
- **Wave:** Sine-wave offset applied to each character's Y position
- **Clip reveal:** `clip-path: inset(100% 0 0 0)` → `inset(0)`

### When to Use
- Hero headlines (per-character or per-word)
- Section titles (per-line)
- Feature callouts and impact statements

### When NOT to Use
- Body text (destroys readability)
- Dynamic content that changes frequently (split + animate on every update is expensive)
- When more than 2 split-text elements are visible simultaneously

### Performance Rules
- Split only visible text (defer off-screen)
- Use `will-change: transform, opacity` on animated pieces
- Remove split spans after animation completes (restore original text node)
- Stagger: 30-50ms per character, 80-120ms per word, 150-200ms per line

---

## 4. Number Counter / Ticker

**What it achieves:** Numbers count up (or down) from a start value to a target value, creating a dynamic "live data" feel for statistics, metrics, and KPIs.

### Implementations

| Library | Approach | Performance | Bundle Impact |
|---------|----------|-------------|---------------|
| **Framer Motion** | `useSpring` + `useMotionValueEvent` to update displayed number | Smooth, spring-based | Included in FM |
| **CountUp.js** | Dedicated counter library with easing, formatting, scroll trigger | Feature-rich | +4KB |
| **Custom JS** | `requestAnimationFrame` loop with easing function | Zero deps, flexible | 0KB |
| **CSS** | `@property --num` + `counter()` + CSS animation | Native, limited | 0KB |

### Formatting Options
- **Integers:** 0 → 1,234
- **Decimals:** 0.00 → 99.99
- **Currency:** $0 → $1,234.56
- **Percentage:** 0% → 87%
- **With suffix:** 0K → 150K
- **Duration options:** 1-3 seconds (shorter feels snappier)

### When to Use
- Statistics sections (users, revenue, uptime)
- Dashboard KPI cards
- Achievement/milestone callouts
- Pricing comparisons

### When NOT to Use
- When the number isn't impressive (counting to 3 is anticlimactic)
- Real-time data that updates frequently (counter replays are distracting)
- Multiple counters that aren't visually grouped

### Performance Rules
- Trigger on scroll-into-view (don't auto-play above fold)
- Count once only (`once: true`)
- Use `Intl.NumberFormat` for locale-aware formatting
- Duration: 1.5-2.5 seconds for best visual impact
- Ease-out curve (fast start, slow finish) feels most natural

---

## 5. Text Scramble / Decode Effect

**What it achieves:** Text appears to decode from random characters into the final message — creates a hacker/tech/cipher aesthetic.

### Implementations

| Library | Approach | Performance | Bundle Impact |
|---------|----------|-------------|---------------|
| **Custom JS** | `setInterval` swapping random chars per position until resolved | Lightweight | 0KB |
| **Framer Motion** | Animate through character array per position with `useAnimate` | Smooth control | Included in FM |
| **baffle.js** | Dedicated text obfuscation library | Simple API | +2KB |

### Algorithm
```
For each character position:
  1. Start with random character from charset
  2. Every 30-50ms, swap to another random character
  3. After position-specific delay, resolve to final character
  4. Stagger resolution left-to-right (or random order)
```

### Character Sets
- **Alpha:** `ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz`
- **Numeric:** `0123456789`
- **Binary:** `01`
- **Matrix:** Katakana + Latin
- **Symbols:** `!@#$%^&*()_+-=[]{}|;:,.<>?`

### When to Use
- Tech/cyber-themed pages
- Reveal of important data or names
- Loading states with personality
- Section title entrances on tech sites

### When NOT to Use
- Formal/corporate branding
- Accessibility-critical content (screen readers can't follow scramble)
- Body text or long passages

---

## 6. Marquee / Ticker Tape

**What it achieves:** Text (or elements) scroll continuously in a horizontal or vertical loop — creates energy, urgency, and a broadcast/news feel.

### Implementations

| Library | Approach | Performance | Bundle Impact |
|---------|----------|-------------|---------------|
| **CSS** | `@keyframes` + `translateX(-100%)` on duplicated content | Native, smooth | 0KB |
| **Framer Motion** | `animate` with `x` transition + `repeat: Infinity` | GPU-accelerated | Included in FM |
| **react-fast-marquee** | Dedicated React component with speed, direction, pause | Feature-rich | +3KB |

### Variations
- **Single direction:** Content scrolls left indefinitely
- **Alternating:** Content scrolls left, then right
- **Pause on hover:** Marquee stops when user hovers
- **Variable speed:** Different rows at different speeds
- **Vertical ticker:** Content scrolls up (stock ticker style)

### When to Use
- Client logos / partner logos
- News feeds / announcement banners
- Decorative text bands between sections
- Social proof (testimonial snippets)

### When NOT to Use
- When the content must be readable on first view
- Accessibility-critical interfaces (moving text is hard to read)
- When more than 2 marquees are visible simultaneously

### Performance Rules
- Duplicate content for seamless loop (content + clone side by side)
- Use `translateX` (not `left`) for GPU compositing
- Pause on `prefers-reduced-motion`
- Speed: 30-60px/second for readability, 80-120px/second for decorative

---

## 7. Kinetic Typography

**What it achieves:** Text moves, scales, rotates, and transforms dynamically — each word or phrase has its own motion, creating an expressive, video-like reading experience.

### Implementations

| Library | Approach | Performance | Bundle Impact |
|---------|----------|-------------|---------------|
| **GSAP** | Timeline with per-word/per-char animations, ScrollTrigger or time-based | Professional, full control | +45KB |
| **Framer Motion** | `variants` per word + `useScroll` or timed sequences | GPU-accelerated | Included in FM |
| **Remotion** | Video-rendered kinetic typography (export as MP4) | Best for video content | +200KB+ |
| **CSS** | Per-word `@keyframes` with `animation-delay` stagger | Native, limited | 0KB |

### When to Use
- Video intros and outros
- Impact statements and manifestos
- Agency/creative portfolio sites
- Social media content (rendered as video via Remotion)

### When NOT to Use
- Body text or readable content
- Serious/corporate contexts
- When it's not the focal point of the page
