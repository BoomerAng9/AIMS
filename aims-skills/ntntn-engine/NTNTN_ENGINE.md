# NtNtN Engine — A.I.M.S. Creative Development Library

> **Owner:** A.I.M.S. (AI Managed Solutions)
> **Version:** 1.0.0
> **Effective:** 2026-02-21
> **Status:** Active

The NtNtN Engine is an A.I.M.S. platform feature — a comprehensive, agentic library and engine that translates creative intent into technical execution. When a user describes what they want to build, the NtNtN Engine provides the taxonomy, techniques, patterns, and implementation references that power the build.

## What It Is

A living library of web development technologies, animation techniques, styling systems, 3D capabilities, interaction patterns, and deployment strategies — organized by category, cross-referenced by use case, and accessible to every agent in the A.I.M.S. hierarchy.

## What It Is NOT

- NOT an agent or persona
- NOT a service or container
- NOT owned by any single Boomer_Ang
- NOT SmelterOS (completely unrelated)

## Who Accesses It

Every agent in the chain of command accesses the NtNtN Engine when the work calls for it:

| Agent | How They Use It |
|-------|-----------------|
| **ACHEEVY** | Classifies user intent → maps to NtNtN capabilities → routes to the right Boomer_Ang |
| **Picker_Ang** | Selects specific components, techniques, and patterns from the library that match the creative's description |
| **Buildsmith** | Takes Picker_Ang's selections and constructs the end product — accredited with the finished build |
| **Other Boomer_Angs** | Reference the library when their work intersects web development (Showrunner for presentations, Scribe for docs, etc.) |
| **Chicken Hawk** | Decomposes build manifests into Lil_Hawk tasks using NtNtN technique references |
| **Lil_Hawks** | Execute against the library — `Lil_Interface_Forge_Hawk` pulls component patterns, `Lil_Motion_Tuner_Hawk` pulls animation techniques |

## Connected Boomer_Angs

### Picker_Ang
The selector. Curates and picks the specific components, languages, frameworks, and techniques from the NtNtN Engine library that match the creative's described vision. Picker_Ang doesn't build — Picker_Ang chooses.

### Buildsmith
The builder. A special Boomer_Ang (no "_Ang" suffix). Takes Picker_Ang's selections and constructs the end product. Buildsmith is accredited with the finished build — the name on the work.

**Flow:** User describes → ACHEEVY classifies → Picker_Ang selects from NtNtN → Buildsmith builds with selections → Chicken Hawk dispatches Lil_Hawks for execution → Evidence collected → Delivered to user.

---

## NtNtN Engine Taxonomy

The library is organized into **10 categories**, each containing technologies, techniques, and use-case mappings.

---

### Category 1: Frontend Frameworks & Libraries

The structural foundation. What the application is built on.

| Technology | What It Is | Best For | Key Techniques |
|-----------|-----------|----------|----------------|
| **React 19.2 / Next.js 16.1** | Component-based UI + fullstack framework (Turbopack, `"use cache"`) | Production web apps, SEO-critical sites, dashboard-heavy platforms | App Router, Server Components, Server Actions, `<Activity>`, React Compiler, View Transitions |
| **Vue 3.6 / Nuxt 4.3** | Progressive framework + fullstack (Vapor Mode beta — no VDOM) | Rapid prototyping, content sites, developer-friendly SPAs | Composition API, Vapor Mode, Hybrid rendering, Pinia 3, alien-signals reactivity |
| **Svelte 5.49 / SvelteKit 2.52** | Compile-time framework — Runes reactivity, zero runtime | Performance-critical sites, small bundles, content-driven apps | Runes ($state/$derived/$effect/$props), Async Svelte, MCP server, Form actions |
| **Angular 21** | Enterprise framework (Zoneless default, Signal Forms, MCP) | Enterprise dashboards, large teams, regulated industries | Signals, Zoneless, Signal Forms, Angular ARIA (headless), Vitest, MCP server |
| **Astro 5.17** | Content-first static builder (6.0 beta — acquired by Cloudflare) | Blogs, docs, marketing sites, content-heavy pages | Content Collections, View Transitions, Islands, Live Content, Cloudflare Workers |
| **Solid.js** | Fine-grained reactive UI library — no virtual DOM | High-performance interactive UIs, real-time data displays | Signals, createResource, Suspense, Streaming SSR, @solidjs/signals (next-gen) |
| **Qwik 2 (beta)** | Resumable framework — instant load, zero hydration (~1 KB) | Sites where Time-to-Interactive is critical, e-commerce | Resumability, $() lazy boundaries, Speculative prefetching, @qwik.dev/* scope |
| **Web Components** | Native browser components — framework-agnostic | Design systems shared across frameworks, embeddable widgets | Shadow DOM, Custom Elements, HTML templates, Declarative Shadow DOM, Lit |

**Picker_Ang Decision Matrix:**
- User says "fast, SEO, production" → **Next.js**
- User says "lightweight, fast build" → **Svelte / Astro**
- User says "enterprise, large team" → **Angular**
- User says "performance, real-time" → **Solid.js**
- User says "blog, docs, content" → **Astro**
- User says "embed anywhere, any framework" → **Web Components**
- Default for A.I.M.S. internal builds → **Next.js** (existing stack)

---

### Category 2: Animation & Motion Libraries

How things move. The life and personality of the interface.

| Technology | What It Is | Best For | Key Techniques |
|-----------|-----------|----------|----------------|
| **Motion** | Declarative React animation library with gesture support | React/Next.js projects, layout animations, gesture interactions | Variants, AnimatePresence, Layout animations, useScroll, Drag, Spring physics, Shared layout |
| **GSAP (GreenSock)** | Professional-grade animation platform — framework-agnostic | Complex timelines, scroll-driven sequences, SVG animation | ScrollTrigger, Timeline, SplitText, MorphSVG, DrawSVG, Flip plugin, MotionPath |
| **Anime.js** | Lightweight JS animation library | Simple animations, SVG, DOM elements, quick prototypes | Timeline, Stagger, SVG path animation, CSS properties, Easing functions |
| **Motion One** | Performant animation library using Web Animations API | Performance-critical animations, small bundle size | animate(), timeline(), scroll(), inView(), spring(), Hardware-accelerated |
| **Auto Animate** | Zero-config transition library | List reordering, adding/removing elements, quick wins | Single function call, automatic transitions, framework adapters |
| **Lottie** | After Effects animations rendered on web via JSON | Icon animations, loading states, illustrations, micro-interactions | LottieFiles, Interactive playback, Scroll-synced, Segment control |
| **Rive** | Real-time interactive animations with state machines | Interactive characters, game-like UI, data-driven animation | State machines, Input binding, Mesh deformation, Runtime control, Blend states |
| **CSS Animations** | Native browser animations — zero JS dependency | Simple transitions, hover effects, loading spinners, performance-critical | @keyframes, transition, animation, will-change, contain, @starting-style |
| **Web Animations API** | Native browser API for programmatic animation control | When you need JS control without library overhead | Element.animate(), getAnimations(), commitStyles(), Custom easing |
| **Spring Animations** | Physics-based motion (available in Motion, React Spring, etc.) | Natural-feeling motion, interactive elements, drag-and-release | Mass/tension/friction/damping config, Velocity inheritance, Interrupted transitions |

**Picker_Ang Decision Matrix:**
- User wants React animations → **Motion** (A.I.M.S. standard)
- User wants complex timeline choreography → **GSAP**
- User wants After Effects export → **Lottie**
- User wants interactive characters / state machines → **Rive**
- User wants minimal bundle, simple animations → **CSS Animations** or **Motion One**
- User wants physics-based, natural motion → **Spring Animations**
- User wants SVG animation → **GSAP** or **Anime.js**

---

### Category 3: Styling Systems

How it looks. The visual foundation.

| Technology | What It Is | Best For | Key Techniques |
|-----------|-----------|----------|----------------|
| **Tailwind CSS** | Utility-first CSS framework | Rapid development, consistent spacing/colors, responsive design | JIT compilation, Custom design tokens, @apply, Plugins, Container queries, Dark mode |
| **CSS Modules** | Scoped CSS with automatic class name hashing | Component isolation, avoiding class conflicts, SSR-friendly | :global, composes, CSS variables, co-located styles |
| **Styled Components / Emotion** | CSS-in-JS with tagged template literals (⚠️ styled-components in maintenance mode) | Legacy projects with existing CSS-in-JS (plan migration) | ThemeProvider, css prop, keyframes, createGlobalStyle, SSR extraction |
| **Vanilla Extract** | Zero-runtime CSS-in-TypeScript | Type-safe styling, large codebases, build-time extraction | sprinkles(), recipe(), createTheme, style(), globalStyle() |
| **UnoCSS** | Instant atomic CSS engine — configurable | Custom utility systems, speed-critical builds, preset flexibility | Attributify mode, Variant groups, Shortcuts, Presets (Wind, Mini, Icons) |
| **Open Props** | Pre-built CSS custom properties library | Design token adoption, consistent defaults, progressive enhancement | Adaptive colors, Easing tokens, Size scale, Gradients, Animations |
| **Sass/SCSS** | CSS preprocessor with nesting, mixins, variables | Legacy projects, complex selector logic, design systems | Mixins, Functions, @use/@forward modules, Interpolation, Maps |

**Picker_Ang Decision Matrix:**
- A.I.M.S. default → **Tailwind CSS** (existing stack)
- User needs type-safe tokens → **Vanilla Extract**
- User has design system with many variants → **Vanilla Extract** + **Tailwind**
- User wants maximum speed → **UnoCSS**
- User works with legacy CSS → **Sass/SCSS**
- User wants zero-config design tokens → **Open Props**

---

### Category 4: 3D & Visual Technologies

Depth, dimension, and immersive experiences.

| Technology | What It Is | Best For | Key Techniques |
|-----------|-----------|----------|----------------|
| **Three.js** | 3D graphics library built on WebGL | 3D product showcases, data visualization, immersive experiences | Scene/Camera/Renderer, Raycasting, Shaders (GLSL), Post-processing, Physics (Cannon/Rapier) |
| **React Three Fiber (R3F)** | React renderer for Three.js — declarative 3D | React/Next.js apps needing 3D, interactive 3D scenes | useFrame, useLoader, Drei helpers, Suspense loading, Event system |
| **Drei** | Helper library for R3F — pre-built 3D components | Quick 3D setups, common patterns, environment maps | OrbitControls, Environment, Text3D, Float, MeshTransmission, Sparkles, Stars |
| **WebGPU** | Next-gen GPU API (successor to WebGL) | Compute-heavy rendering, ML on GPU, future-proofed 3D | Compute shaders, Render pipelines, Storage buffers, Indirect draws |
| **Spline** | 3D design tool with web export | Designers who want 3D without code, quick embeds | Scene export, Runtime events, Material editor, Camera control |
| **Babylon.js** | Full game engine for the web (v8.x) | Game-like experiences, VR/AR, physics-heavy scenes | PBR materials, Physics engine (Havok), XR support, Node material editor, WebGPU |
| **p5.js** | Creative coding library (Processing for JS) | Generative art, educational visuals, creative experiments | Sketch mode, WEBGL renderer, Shaders, Sound, Data visualization |
| **D3.js** | Data-driven document manipulation | Complex data visualization, custom charts, geographic maps | Scales, Axes, Transitions, Force layouts, Geo projections, Voronoi |
| **Canvas API** | Native 2D drawing surface | Custom graphics, image manipulation, game rendering | 2D context, requestAnimationFrame, OffscreenCanvas, ImageData |
| **SVG Animation** | Animated vector graphics — scalable, accessible | Icons, logos, illustrations, path animations, morphing shapes | SMIL, CSS animation on SVG, Path morphing, Stroke dasharray animation |

**Picker_Ang Decision Matrix:**
- User wants 3D in React/Next.js → **R3F + Drei**
- User wants a 3D product showcase → **R3F** or **Spline**
- User wants data visualization → **D3.js**
- User wants generative / creative art → **p5.js**
- User wants game-like experience → **Babylon.js**
- User wants custom 2D graphics → **Canvas API**
- User wants animated icons/logos → **SVG Animation**
- A.I.M.S. default for 3D → **R3F + Drei** (React stack)

---

### Category 5: Scroll & Interaction Patterns

How the page responds to the user's journey.

| Technology / Technique | What It Is | Best For | Key Techniques |
|----------------------|-----------|----------|----------------|
| **CSS Scroll-Driven Animations** | Native browser scroll-linked animations (2024+) | Simple scroll effects without JS, progressive enhancement | animation-timeline, view-timeline, ScrollTimeline, ViewTimeline, animation-range |
| **Intersection Observer** | Native API for detecting element visibility | Lazy loading, scroll reveals, infinite scroll triggers | Thresholds, Root margin, isIntersecting, unobserve on trigger |
| **GSAP ScrollTrigger** | Professional scroll-animation controller | Complex scroll-linked choreography, pin sections, scrub animations | Scrub, Pin, Snap, Batch, Markers (debug), Timeline integration |
| **Lenis** | Smooth scroll library with native scroll feel | Smooth scrolling without jank, scroll-linked animations | Lerp config, Scroll-to, Infinite scroll, Orientation lock, RAF integration |
| **Locomotive Scroll** | Smooth scroll + parallax detection library | Parallax-heavy designs, creative agency sites | Data-scroll-speed, Sticky sections, ScrollTo, Horizontal scroll |
| **Parallax Techniques** | Foreground/background differential speed | Hero sections, depth perception, visual storytelling | useTransform(scrollY), CSS perspective, Multi-layer parallax, Rellax.js |
| **Scrollytelling** | Sticky viewport + sequenced content steps | Long-form storytelling, feature tours, data journalism | Sticky container, progress-mapped content, Scrollama, useScroll offset mapping |
| **Scroll Snapping** | CSS-native section locking | Full-page section layouts, carousels, slideshows | scroll-snap-type, scroll-snap-align, scroll-padding, scroll-margin |

**Picker_Ang Decision Matrix:**
- User wants native, zero-JS scroll effects → **CSS Scroll-Driven Animations**
- User wants professional scroll choreography → **GSAP ScrollTrigger**
- User wants smooth scrolling → **Lenis**
- User wants parallax → **Motion useTransform** (A.I.M.S. standard) or **GSAP**
- User wants storytelling / step sequences → **Scrollytelling pattern**
- User wants full-page sections → **Scroll Snapping**

---

### Category 6: UI Component Systems

Pre-built, accessible, composable building blocks.

| Technology | What It Is | Best For | Key Techniques |
|-----------|-----------|----------|----------------|
| **shadcn/ui** | Copy-paste React components built on Radix + Tailwind | Full ownership, customizable, accessible defaults | CLI installation, Theme customization, Composition pattern, CVA variants |
| **Radix UI** | Unstyled, accessible React primitives | Building custom design systems, accessibility compliance | Headless components, WAI-ARIA, Composition, Portal, Focus management |
| **Headless UI** | Unstyled accessible components (Tailwind Labs) | Tailwind projects needing accessible interactions | Renderless components, Transition, Combobox, Listbox, Menu |
| **Ark UI** | Framework-agnostic headless components (Chakra team) | Multi-framework projects (React, Vue, Solid) | State machines, Fine-grained APIs, Anatomy-based styling |
| **Chakra UI** | Styled component library with theme system | Rapid prototyping, consistent design, accessibility | Theme tokens, Style props, Dark mode, Responsive styles |
| **Material UI (MUI)** | Google Material Design for React | Enterprise apps, Material Design compliance | Theme provider, sx prop, Slots, Pigment CSS (zero-runtime) |
| **Ant Design** | Enterprise UI component library | Admin panels, data-heavy dashboards, CJK support | ConfigProvider, Pro components, Table, Form, ProLayout |

**Picker_Ang Decision Matrix:**
- A.I.M.S. default → **shadcn/ui** (Radix + Tailwind, full ownership)
- User wants full design system control → **Radix UI** (unstyled)
- User wants rapid prototyping → **Chakra UI**
- User wants enterprise / admin → **Ant Design** or **MUI**
- User needs multi-framework → **Ark UI**

---

### Category 7: Layout & Responsive Design

How content adapts and flows across devices and viewports.

| Technology / Technique | What It Is | Best For | Key Techniques |
|----------------------|-----------|----------|----------------|
| **CSS Grid** | 2D layout system — rows and columns | Page layouts, card grids, dashboard panels, bento grids | grid-template-areas, auto-fit/auto-fill, minmax(), subgrid, masonry (experimental) |
| **Flexbox** | 1D layout system — row or column | Navigation bars, card rows, centering, inline layouts | gap, flex-wrap, order, flex-grow/shrink/basis, align-items/justify-content |
| **Container Queries** | Style based on parent container size (not viewport) | Reusable components, widget-based layouts, responsive cards | container-type, @container, container-name, cqw/cqh units |
| **View Transitions API** | Native browser page transition animations | Multi-page apps, SPA route transitions, shared element animations | document.startViewTransition(), view-transition-name, ::view-transition pseudo-elements |
| **Responsive Images** | Serve optimal image size per device | Performance, bandwidth savings, art direction | srcset, sizes, picture element, AVIF/WebP, loading=lazy, fetchpriority |
| **Fluid Typography** | Font size scales smoothly with viewport | Responsive text without breakpoints, consistent readability | clamp(), min(), max(), CSS locks, modular type scales |
| **CSS Anchor Positioning** | Attach elements to others in pure CSS | Tooltips, dropdowns, popovers without JS | anchor-name, position-anchor, inset-area, position-try-fallbacks |
| **Logical Properties** | Direction-agnostic CSS (inline/block vs left/right) | RTL support, internationalization, future-proof layouts | margin-inline, padding-block, inset-inline, border-block |

**Picker_Ang Decision Matrix:**
- User wants grid layout → **CSS Grid** (always)
- User wants responsive cards that adapt to their container → **Container Queries**
- User wants page transitions → **View Transitions API**
- User wants tooltips/dropdowns without JS → **CSS Anchor Positioning** (with Floating UI fallback)
- User wants scalable text → **Fluid Typography (clamp)**
- User needs RTL / i18n → **Logical Properties**

---

### Category 8: Backend & Fullstack

What powers the server side when creatives need more than frontend.

| Technology | What It Is | Best For | Key Techniques |
|-----------|-----------|----------|----------------|
| **Node.js / Express** | JS runtime (v24 LTS) + web framework | API backends, real-time apps, existing JS teams | Middleware, REST/GraphQL, WebSockets, Streaming, Worker threads |
| **Next.js API Routes / Server Actions** | Built-in server-side logic in Next.js | Fullstack React apps, form handling, data mutations | Route Handlers, Server Actions, Middleware, Edge functions |
| **Python / FastAPI** | Modern Python web framework with automatic OpenAPI | ML-heavy backends, data pipelines, rapid API development | Async/await, Pydantic models, Auto-docs, WebSockets, Background tasks |
| **Python / Django** | Batteries-included Python framework | Content management, admin panels, auth-heavy apps | ORM, Admin panel, Templates, REST framework, Channels (WebSocket) |
| **Go** | Compiled, concurrent systems language | High-throughput services, microservices, CLI tools | Goroutines, Channels, net/http, gRPC, Minimal dependencies |
| **Rust (Actix / Axum)** | Memory-safe systems language for web | Ultra-performance APIs, WebAssembly targets, security-critical | Async runtime (Tokio), Type safety, Zero-cost abstractions, WASM compilation |
| **Edge Functions** | Server-side code at CDN edge locations | Low-latency APIs, personalization, A/B testing, geo-routing | Vercel Edge Functions, Cloudflare Workers, Deno Deploy, Middleware |
| **tRPC** | End-to-end typesafe APIs for TypeScript | Fullstack TypeScript apps, type-safe client-server communication | Routers, Procedures, Middleware, React Query integration, Subscriptions |
| **Hono** | Ultrafast web framework — runs everywhere | Edge-first APIs, multi-runtime (Node, Deno, Bun, Workers) | Middleware, JSX, RPC mode, Validator, Multi-runtime |

**Picker_Ang Decision Matrix:**
- A.I.M.S. default backend → **Node.js / Express** (existing stack)
- User wants fullstack in one framework → **Next.js Server Actions**
- User wants ML/data backend → **Python / FastAPI**
- User wants maximum performance → **Go** or **Rust**
- User wants edge-first → **Hono** or **Edge Functions**
- User wants end-to-end TypeScript safety → **tRPC**

---

### Category 9: CMS & Content

How content is managed, authored, and delivered.

| Technology | What It Is | Best For | Key Techniques |
|-----------|-----------|----------|----------------|
| **Sanity** | Real-time structured content platform | Custom schemas, real-time collaboration, GROQ queries | Studio, Portable Text, GROQ, Real-time sync, Webhooks, Visual editing |
| **Strapi** | Open-source headless CMS (self-hosted) | Full control, self-hosted, REST + GraphQL out of box | Content Types Builder, Roles, Media Library, i18n, Webhooks |
| **Contentful** | Enterprise headless CMS (cloud-hosted) | Enterprise content operations, multi-channel delivery | Content model, CDN delivery, Rich text, Environments, Compose |
| **MDX** | Markdown with JSX components | Developer docs, blogs, interactive content | Component imports, Remark/Rehype plugins, Next.js integration, Frontmatter |
| **Keystatic** | Git-based CMS with local-first editing | Small teams, Git-native workflows, Astro/Next.js integration | Schema config, Reader API, Local mode, GitHub mode |
| **Payload CMS** | TypeScript-first headless CMS (code-first) | Developers who want CMS + API in one, self-hosted | Config-driven, Access control, Hooks, Blocks, Lexical editor |

**Picker_Ang Decision Matrix:**
- User wants real-time, flexible schema → **Sanity**
- User wants self-hosted, open-source → **Strapi** or **Payload CMS**
- User wants enterprise-grade → **Contentful**
- User wants dev docs / blog → **MDX**
- User wants git-based, simple → **Keystatic**

---

### Category 10: Deployment & Infrastructure

How it ships and runs in production.

| Technology | What It Is | Best For | Key Techniques |
|-----------|-----------|----------|----------------|
| **Docker** | Container runtime (Engine 29.2, Compose v5) | Consistent deploys, multi-service architectures, AI sandboxes | Dockerfile, docker-compose, Multi-stage builds, Volume mounts, Sandboxes |
| **Vercel** | Frontend cloud (AI Gateway, Fluid Compute) | Next.js apps, AI apps, preview deploys, edge functions | Automatic deploys, AI Gateway (20+ providers), Spend Management, ISR |
| **Netlify** | Web platform with AI-native strategy | Static/JAMstack, AI-generated apps (Bolt.new) | Deploy previews, Functions, AI Gateway, Edge handlers, Identity |
| **Cloudflare** | Edge compute + CDN (Workers VPC, D1 10GB) | Global distribution, Workers, R2 storage, D1 database | Workers, Pages, R2, D1 (10GB/db), Durable Objects, Browser Rendering (Playwright) |
| **AWS** | Comprehensive cloud platform | Enterprise, scalable infrastructure, managed services | EC2, S3, Lambda, CloudFront, ECS/EKS, Amplify |
| **GCP** | Google's cloud platform | ML/AI workloads, Kubernetes, analytics | Cloud Run, GKE, Cloud Build, Vertex AI, Artifact Registry |
| **VPS (Self-hosted)** | Virtual Private Server — full control | Budget-conscious, custom setups, sovereignty | Docker Compose, nginx reverse proxy, Certbot SSL, systemd |

**Picker_Ang Decision Matrix:**
- A.I.M.S. default → **VPS (Docker Compose)** (existing infra) + **GCP** (AI/GPU)
- User wants zero-config Next.js deploy → **Vercel**
- User wants static/JAMstack → **Netlify** or **Cloudflare Pages**
- User wants edge-everything → **Cloudflare**
- User wants enterprise scale → **AWS** or **GCP**

---

## Technique Reference Index

Cross-cutting techniques that span multiple categories. Picker_Ang uses this index to match creative intent to technical implementation.

### By Creative Intent

| When the creative says... | Picker_Ang selects... |
|--------------------------|----------------------|
| "I want it to feel alive" | Motion + Spring physics + Micro-interactions |
| "Apple-style product page" | Scroll-linked image sequence + Parallax + GSAP ScrollTrigger |
| "Modern, clean, fast" | Next.js + Tailwind + shadcn/ui + Motion reveals |
| "Interactive 3D showcase" | R3F + Drei + OrbitControls + GLTF loading |
| "Storytelling page" | Scrollytelling pattern + Sequential scroll + Text reveals |
| "Dashboard with charts" | Next.js + shadcn/ui + D3.js or Recharts + CSS Grid |
| "E-commerce product page" | Next.js + Server Components + Responsive images + View Transitions |
| "Portfolio / creative showcase" | GSAP + Lenis smooth scroll + Custom cursor + Page transitions |
| "Blog / content site" | Astro or Next.js + MDX + Tailwind + Scroll reveals |
| "Game-like / immersive" | Three.js/R3F + Babylon.js + Particle systems + Shaders |
| "Animated logo / icon set" | Lottie or Rive + SVG animation + CSS animation |
| "Data journalism / infographic" | D3.js + Scrollytelling + GSAP + SVG |
| "Landing page that converts" | Next.js + Motion + Parallax + CTA animations + A/B testing |
| "Mobile-first app feel" | React + Motion gestures + Spring physics + View Transitions |
| "Brutalist / experimental" | Custom CSS + p5.js + Canvas + Custom fonts + Grain overlays |
| "Glassmorphic / frosted" | backdrop-filter + CSS gradients + Animated borders + Blur layers |
| "Dark mode premium" | CSS custom properties + Tailwind dark: + Gradient meshes + Glow effects |

### By Effect Type

| Effect | Primary Tool | Fallback | Category |
|--------|-------------|----------|----------|
| Parallax | Motion useTransform | CSS perspective | Scroll |
| Scroll reveal | Motion useInView | Intersection Observer + CSS | Scroll |
| Image sequence | Canvas + useScroll | Video with scroll scrub | Scroll |
| Scrollytelling | Custom sticky + useScroll | GSAP ScrollTrigger + Pin | Scroll |
| Smooth scroll | Lenis | CSS scroll-behavior | Scroll |
| 3D card tilt | Motion useMotionValue | CSS transform perspective | Hover |
| Magnetic cursor | Motion useSpring | GSAP | Hover |
| Custom cursor | CSS + motion tracking | mix-blend-mode circle | Hover |
| Page transitions | View Transitions API | Motion AnimatePresence | Navigation |
| Layout animation | Motion layoutId | FLIP technique | Layout |
| Stagger reveal | Motion staggerChildren | GSAP stagger | Reveal |
| Typewriter | Motion staggerChildren | CSS steps() | Text |
| Text split | GSAP SplitText | Manual span wrapping | Text |
| Number counter | Motion useSpring | requestAnimationFrame | Text |
| Particle system | Canvas / Three.js | CSS animation (limited) | Visual |
| Gradient border | CSS conic-gradient + @property | SVG gradient | Visual |
| Glassmorphism | backdrop-filter: blur() | Semi-transparent bg | Visual |
| 3D scene | R3F + Drei | Three.js vanilla | 3D |
| 3D text | Drei Text3D | CSS 3D transform (flat) | 3D |
| Loading skeleton | CSS animation shimmer | Tailwind animate-pulse | Micro |
| Button feedback | Motion whileTap | CSS :active | Micro |
| Toast notification | Motion + AnimatePresence | CSS transition | Micro |
| Accordion | Motion animate height | HTML details/summary | Micro |
| Drag reorder | Motion Reorder | @dnd-kit | Micro |

---

## NLP Intent Mapping

When ACHEEVY's NLP classifies a user's message as a build/design intent, it maps keywords to NtNtN Engine categories:

### Trigger Patterns

```
IF intent contains [build, create, make, design, develop, code, scaffold, generate, launch]
  AND context contains [website, page, app, dashboard, landing, portfolio, site, interface, UI]
  THEN activate NtNtN Engine routing
  THEN route to Picker_Ang for component selection
```

### Keyword → Category Mapping

| Keywords Detected | NtNtN Category | Primary Boomer_Ang |
|------------------|---------------|-------------------|
| scroll, parallax, reveal, animate, motion, effect | Animation & Motion + Scroll & Interaction | Picker_Ang → Buildsmith |
| 3d, three, webgl, immersive, orbit, scene | 3D & Visual | Picker_Ang → Buildsmith |
| layout, grid, responsive, mobile, adaptive | Layout & Responsive | Picker_Ang → Buildsmith |
| style, theme, dark mode, colors, typography | Styling Systems | Picker_Ang → Buildsmith |
| component, button, form, modal, table, card | UI Component Systems | Picker_Ang → Buildsmith |
| deploy, host, docker, server, cloud | Deployment & Infrastructure | Picker_Ang → Forge_Ang |
| content, blog, cms, articles, posts | CMS & Content | Picker_Ang → Buildsmith |
| api, backend, database, auth | Backend & Fullstack | Picker_Ang → Patchsmith_Ang |
| chart, data, visualization, graph | 3D & Visual (D3/Canvas) | Picker_Ang → Buildsmith |
| react, next, vue, svelte, angular | Frontend Frameworks | Picker_Ang → Buildsmith |

---

## Execution Layer — Buildsmith's Three Pillars

The NtNtN Engine is not just a library — it's an execution engine. Buildsmith's execution pipeline turns Picker_Ang's selections into real, deployed products through three pillars:

### Pillar 1: IMAGE (Visual Asset Pipeline)
Generates everything the user sees before code is written — AI images, color palettes, typography, icons, logos, favicons, OG images, placeholders, animation assets, video.

**Default Image Model:** Nano Banana Pro (Gemini 3 Pro Image)
**Tools:** Nano Banana Pro / GPT Image 1.5 / FLUX.2 / Imagen 4, Recraft V4 (native SVG), SVGMaker MCP, Sharp v0.34+, Satori + resvg-js, Playwright, Colormind API, Fontjoy, Figma MCP Server, v0.app, Sora 2 / Runway Gen-4.5 / Kling 2.6 / Pika 2.5

### Pillar 2: INTERFACE (Code Generation Engine)
The core builder — generates code, components, pages, styles, and animations inside an isolated sandbox with live preview and user iteration loop.

**Tools:** E2B Cloud Sandbox / Docker, Next.js dev server, LLM (Claude) + NtNtN patterns, shadcn/ui CLI, ESLint, axe-core

### Pillar 3: INTEGRATIONS (Fullstack & Deploy Pipeline)
Connects frontend to databases, auth, payments, APIs, Git, deployment targets, monitoring.

**Tools:** GitHub API, Prisma v7, Auth.js v5 / Clerk, Stripe (2026-01-28.clover), Resend, Vercel / Docker Compose, Sentry / Uptime Kuma

### Execution Flow
```
User describes vision
    ↓
Picker_Ang → Stack Recommendation
    ↓
Buildsmith Execution Pipeline:
  PHASE 0: INTAKE   → Build Manifest created
  PHASE 1: IMAGE    → Visual assets generated + optimized
  PHASE 2: INTERFACE → Code generated in sandbox, preview URL, user iterates
  PHASE 3: INTEGRATIONS → DB, auth, API, deploy → Live URL
  PHASE 4: VERIFICATION → Lighthouse, a11y, CWV, security, SEO
  PHASE 5: SIGN      → <!-- Buildsmith --> + delivery package
    ↓
ACHEEVY delivers to user
```

### Two Entry Points
- **Entry A (ACHEEVY-Guided):** Conversational creative brief → Picker_Ang → Buildsmith
- **Entry B (Direct-to-Engine):** Detailed prompt → NLP classify → Auto-select → Buildsmith

### Scope Tiers
| Tier | Scope | Est. Cost | Est. Time |
|------|-------|-----------|-----------|
| 1: Component | Single pattern | $0.25-$0.75 | 2-5 min |
| 2: Page | Landing/portfolio | $1-$3 | 5-15 min |
| 3: Application | Multi-page app | $3-$8 | 15-45 min |
| 4: Platform | Enterprise SaaS | $8-$20 | 45-120 min |

**Full Pipeline Spec:** `aims-skills/ntntn-engine/execution/buildsmith-execution-pipeline.md`

---

## Library File Structure

```
aims-skills/ntntn-engine/
├── NTNTN_ENGINE.md              ← This file (master reference)
├── index.ts                     ← Exports + NLP keyword registry
├── execution/
│   └── buildsmith-execution-pipeline.md  ← Full execution pipeline spec (IMAGE, INTERFACE, INTEGRATIONS)
├── categories/
│   ├── frontend-frameworks.md   ← Category 1 deep reference
│   ├── animation-motion.md      ← Category 2 deep reference
│   ├── styling-systems.md       ← Category 3 deep reference
│   ├── 3d-visual.md             ← Category 4 deep reference
│   ├── scroll-interaction.md    ← Category 5 deep reference
│   ├── ui-components.md         ← Category 6 deep reference
│   ├── layout-responsive.md     ← Category 7 deep reference
│   ├── backend-fullstack.md     ← Category 8 deep reference
│   ├── cms-content.md           ← Category 9 deep reference
│   └── deployment-infra.md      ← Category 10 deep reference
├── techniques/
│   ├── scroll-techniques.md     ← All scroll-based techniques (deep dive)
│   ├── hover-interaction.md     ← All hover & interaction techniques
│   ├── page-transitions.md      ← All navigation/page transition techniques
│   ├── text-typography.md       ← All text animation techniques
│   ├── visual-effects.md        ← All visual effect techniques
│   ├── 3d-immersive.md          ← All 3D & immersive techniques
│   └── micro-interactions.md    ← All micro-interaction techniques
└── intent-map.json              ← NLP keyword → category → technique mapping
```

---

## Versioning & Maintenance

- The NtNtN Engine library is versioned alongside A.I.M.S.
- New technologies are added when they reach production stability (not experimental).
- Deprecated technologies are marked with `⚠️ DEPRECATED` and removed after 2 release cycles.
- Picker_Ang's decision matrices are updated when new technologies shift the recommendation landscape.
- Buildsmith validates that selected techniques are compatible before starting a build.

---

## Integration with Existing Skills

The NtNtN Engine **complements** existing A.I.M.S. skills:

| Existing Skill | NtNtN Engine Relationship |
|---------------|--------------------------|
| `aims-animated-web` | NtNtN Engine is the library; `aims-animated-web` is the implementation skill for A.I.M.S. internal pages |
| `ui-interaction-motion.skill.md` | NtNtN Engine provides the technique catalog; this skill enforces motion consistency |
| `threejs-3d.skill.md` | NtNtN Engine provides the 3D technology taxonomy; this skill sets guardrails |
| `design-first-builder.md` | NtNtN Engine feeds into the "Implement" phase of the design-first pipeline |
| `best-practices.md` | NtNtN Engine techniques must comply with engineering best practices |
| `chicken-hawk-executor.skill.md` | Chicken Hawk references NtNtN technique IDs when creating Lil_Hawk task manifests |
