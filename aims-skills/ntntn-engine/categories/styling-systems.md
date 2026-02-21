# NtNtN Engine — Category 3: Styling Systems

> The visual foundation. How it looks, themes, and adapts.

---

## Tailwind CSS

### Overview
Utility-first CSS framework. Write styles directly in markup using atomic classes.
The A.I.M.S. default styling system.

- **Current:** Tailwind CSS v4 (Oxide engine — Rust-based, 10x faster builds)
- **Approach:** Utility classes composed in HTML/JSX
- **A.I.M.S. Status:** Default — all builds use Tailwind

### Key Patterns & Techniques

#### 1. Design Tokens via CSS Variables (v4)
Tailwind v4 uses CSS-first configuration — design tokens defined in CSS, not JS config:
```css
/* globals.css */
@theme {
  --color-primary: #3B82F6;
  --color-accent: #E5A530;
  --font-sans: 'Inter', system-ui, sans-serif;
  --spacing-lg: 2rem;
  --radius-card: 0.75rem;
}
```

#### 2. Dark Mode
```html
<div class="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">
  <!-- Automatically switches based on system preference or class toggle -->
</div>
```
Strategies: `media` (system preference), `class` (manual toggle), `selector` (custom).

#### 3. Container Queries
```html
<div class="@container">
  <div class="@lg:grid-cols-2 @sm:grid-cols-1">
    <!-- Responds to container width, not viewport -->
  </div>
</div>
```

#### 4. Arbitrary Values & Custom Utilities
```html
<div class="bg-[#1a1a2e] text-[clamp(1rem,2.5vw,2rem)] grid-cols-[200px_1fr_200px]">
  <!-- Escape hatch for one-off values -->
</div>
```

#### 5. Component Variants with CVA
```ts
import { cva } from 'class-variance-authority';

const button = cva('rounded-lg font-medium transition-colors', {
  variants: {
    intent: {
      primary: 'bg-blue-600 text-white hover:bg-blue-700',
      secondary: 'bg-zinc-100 text-zinc-900 hover:bg-zinc-200',
      danger: 'bg-red-600 text-white hover:bg-red-700',
    },
    size: {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg',
    },
  },
  defaultVariants: { intent: 'primary', size: 'md' },
});
```

### Ecosystem
- **CVA:** Class Variance Authority — variant management
- **tailwind-merge:** Intelligent class merging (resolves conflicts)
- **clsx / cn:** Conditional class composition
- **Tailwind Animate:** Animation utility classes
- **tailwindcss-typography:** Prose styling for Markdown content

### Picker_Ang Notes
- **Default choice** for every A.I.M.S. build — existing stack, team expertise
- Choose when: Any web project (universal)
- Avoid when: Never — Tailwind is always appropriate as the base

---

## CSS Modules

### Overview
Scoped CSS with automatic class name hashing. Each module is local by default —
no global namespace pollution.

- **Current:** Built into Next.js, Vite, webpack
- **Approach:** `.module.css` files with component-scoped classes
- **Scoping:** Automatic hash suffix on class names at build time

### Key Patterns
```css
/* Button.module.css */
.button { background: var(--color-primary); border-radius: 8px; }
.button:hover { opacity: 0.9; }
```
```tsx
import styles from './Button.module.css';
<button className={styles.button}>Click</button>
```

### Picker_Ang Notes
- Choose when: Need component-scoped styles alongside Tailwind, complex animations with named keyframes
- Avoid when: Tailwind alone covers all styling needs (most cases)

---

## Vanilla Extract

### Overview
Zero-runtime CSS-in-TypeScript. Styles are written in .css.ts files and extracted
to static CSS at build time. Full TypeScript type safety for styles.

- **Current:** Vanilla Extract 1.x
- **Approach:** TypeScript functions that generate CSS at build time
- **Output:** Static CSS files (no runtime overhead)

### Key Patterns
```ts
// styles.css.ts
import { style, createTheme } from '@vanilla-extract/css';
import { recipe } from '@vanilla-extract/recipes';

export const [themeClass, vars] = createTheme({
  color: { primary: '#3B82F6', surface: '#ffffff' },
  space: { sm: '8px', md: '16px', lg: '24px' },
});

export const button = recipe({
  base: { borderRadius: 8, fontWeight: 600 },
  variants: {
    color: {
      primary: { background: vars.color.primary, color: 'white' },
    },
    size: {
      sm: { padding: `${vars.space.sm} ${vars.space.md}` },
      lg: { padding: `${vars.space.md} ${vars.space.lg}` },
    },
  },
});
```

### Picker_Ang Notes
- Choose when: Large-scale design systems, type-safe tokens, multi-brand theming
- Avoid when: Rapid prototyping (Tailwind is faster), small projects

---

## UnoCSS

### Overview
Instant atomic CSS engine. Configurable rules, presets, and transformers.
Faster than Tailwind in many benchmarks due to on-demand generation.

- **Current:** UnoCSS 0.6x+
- **Approach:** On-demand atomic CSS generation from configurable rules
- **Presets:** Wind (Tailwind-compatible), Mini, Icons, Typography

### Key Patterns
```ts
// uno.config.ts
import { defineConfig, presetWind, presetIcons } from 'unocss';

export default defineConfig({
  presets: [presetWind(), presetIcons()],
  shortcuts: {
    'btn': 'px-4 py-2 rounded-lg font-medium transition-colors',
    'btn-primary': 'btn bg-blue-600 text-white hover:bg-blue-700',
  },
});
```

**Attributify Mode:**
```html
<div bg="blue-600" text="white lg" p="x-4 y-2" rounded="lg">
  <!-- Attributes instead of class strings -->
</div>
```

### Picker_Ang Notes
- Choose when: Maximum build speed needed, want Tailwind syntax + extras (icons, attributify)
- Avoid when: Team already invested in Tailwind ecosystem and plugins

---

## Open Props

### Overview
Pre-built CSS custom properties library. Drop-in design tokens for colors, spacing,
typography, easing, gradients, and animations.

- **Current:** Open Props 1.x
- **Approach:** CSS variables that work with any framework
- **Size:** Treeshakeable — import only what you use

### Key Patterns
```css
@import 'open-props/style';
@import 'open-props/normalize';

.card {
  padding: var(--size-4);
  border-radius: var(--radius-2);
  background: var(--surface-2);
  box-shadow: var(--shadow-3);
  transition: transform var(--ease-squish-3) 0.3s;
}
```

### Picker_Ang Notes
- Choose when: Want ready-made design tokens without Tailwind, progressive enhancement
- Avoid when: Already using Tailwind (Tailwind has its own token system)

---

## Styled Components / Emotion

### Overview
CSS-in-JS libraries using tagged template literals. Styles are co-located with
components and can access props and theme context dynamically.

- **Current:** Styled Components v6 (⚠️ MAINTENANCE MODE since March 2025), Emotion v11
- **Runtime:** Has runtime overhead (style injection at runtime)
- **Status:** styled-components officially in maintenance mode — no new features, only critical bug fixes. Incompatible with React Server Components (relies on Context API). Creator recommends against adoption for new projects. Sanity forked it for 40% faster renders while teams migrate.

### Key Patterns
```tsx
const Button = styled.button<{ $primary?: boolean }>`
  background: ${props => props.$primary ? '#3B82F6' : 'transparent'};
  color: ${props => props.$primary ? 'white' : '#3B82F6'};
  padding: 8px 16px;
  border-radius: 8px;
`;
```

### Picker_Ang Notes
- Choose when: Existing codebase uses it (plan migration)
- **Avoid for all new projects** — use Tailwind, CSS Modules, or Vanilla Extract instead
- Migration targets: Tailwind CSS (most common), Vanilla Extract (type-safe), StyleX (Meta, zero-runtime)

---

## Sass/SCSS

### Overview
CSS preprocessor with nesting, mixins, functions, and variables. The original
"CSS with superpowers." Still widely used in legacy and enterprise codebases,
but native CSS is catching up fast.

- **Current:** Dart Sass 1.x (only maintained version)
- **Note:** Node Sass is deprecated. LibSass is deprecated.
- **2026 Reality:** Native CSS now has nesting (stable in all browsers), `@function`, `@mixin`,
  and `if()` — reducing the need for Sass in new projects.

### Key Patterns
```scss
@use 'tokens' as *;

@mixin responsive($breakpoint) {
  @media (min-width: map-get($breakpoints, $breakpoint)) { @content; }
}

.card {
  padding: $space-md;
  border-radius: $radius-card;

  &:hover { transform: translateY(-2px); }

  @include responsive('md') {
    padding: $space-lg;
  }
}
```

### Picker_Ang Notes
- Choose when: Legacy codebases, migrating from older projects, complex math/loops
- Avoid when: New projects — native CSS nesting + `@function` + `@mixin` cover most Sass use cases

---

## Modern CSS Features (2026)

Native CSS is absorbing capabilities that previously required preprocessors or JavaScript:

| Feature | Status | Replaces |
|---------|--------|----------|
| **CSS Nesting** | Stable (all browsers) | Sass nesting |
| **CSS `if()`** | Chromium (shipping) | JS conditional styling |
| **CSS `@function`** | Chromium (shipping) | Sass functions |
| **CSS `@mixin` / `@apply`** | Chromium (shipping) | Sass mixins |
| **CSS Anchor Positioning** | Chromium + Safari (Interop 2026) | Floating UI / Popper.js |
| **Scroll-Driven Animations** | Chrome + Safari 26+ | JS scroll libraries |
| **View Transitions** | Chrome + Safari | Page transition libraries |
| **`@starting-style`** | Stable (all browsers) | JS entry animations |
| **`@property`** | Stable (all browsers) | CSS Houdini APIs |

### Picker_Ang Notes
- Native CSS features should be preferred when browser support is sufficient
- Tailwind CSS v4 already leverages native nesting and `@property`
- For projects requiring broad browser support, use CSS features with fallbacks

---

## Styling System Comparison Matrix

| System | Runtime | Type Safety | Tokens | Dark Mode | Bundle Impact | Learning Curve |
|--------|---------|-------------|--------|-----------|---------------|----------------|
| **Tailwind CSS** | Zero | With CVA | Built-in (v4) | Excellent | Small (purged) | Low |
| **CSS Modules** | Zero | No | Via CSS vars | Manual | Zero | Very Low |
| **Vanilla Extract** | Zero | Full TS | Built-in | Via themes | Zero | Medium |
| **UnoCSS** | Zero | Partial | Via presets | Excellent | Small | Low |
| **Open Props** | Zero | No | Pre-built | Adaptive | Treeshakeable | Very Low |
| **Styled Components** | Runtime | Partial | Via ThemeProvider | Via theme | Medium | Medium |
| **Sass/SCSS** | Zero | No | Via variables | Manual | Zero | Low |

---

## A.I.M.S. Default: Tailwind CSS

For all A.I.M.S. builds, **Tailwind CSS is the default** styling system.
Combined with **CVA** for variant management and **tailwind-merge** for conflict resolution.

Design tokens are defined in the theme layer and consumed via Tailwind utility classes.
