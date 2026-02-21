# NtNtN Engine — Category 1: Frontend Frameworks & Libraries

> The structural foundation. What the application is built on.

---

## React / Next.js

### Overview
React is the dominant component-based UI library. Next.js is its premier meta-framework,
providing SSR, SSG, ISR, App Router, Server Components, and Server Actions out of the box.

- **Current:** React 19.2.4 + Next.js 16.1 (Turbopack default bundler)
- **React 19.2:** `<Activity>` component (state-preserving visibility), `useEffectEvent` hook, View Transitions (experimental), React Compiler 1.0 (auto-memoization)
- **Next.js 16:** Turbopack default (dev + production), explicit `"use cache"` directive (replaces implicit caching), Build Adapters API
- **Rendering:** SSR, SSG, ISR, Streaming SSR, Partial Prerendering
- **A.I.M.S. Status:** Primary stack — all internal builds use Next.js

### Key Patterns & Techniques

#### 1. Server Components (RSC)
Components that render on the server and send HTML to the client. Zero client-side JS for
server components — dramatically reduces bundle size.

```
// This component runs on the server only — no JS shipped to client
async function ProductList() {
  const products = await db.products.findMany(); // Direct DB access
  return <ul>{products.map(p => <li key={p.id}>{p.name}</li>)}</ul>;
}
```

**When to use:** Data fetching, database queries, heavy computation, API calls.
**When NOT:** Interactive elements (forms, buttons with onClick, animations).

#### 2. Server Actions
Server-side functions called directly from client components — replace API routes for
mutations (form submissions, database writes, revalidation).

```
// actions.ts
"use server";
async function createUser(formData: FormData) {
  await db.users.create({ data: { name: formData.get("name") } });
  revalidatePath("/users");
}

// Component
<form action={createUser}>
  <input name="name" />
  <button type="submit">Create</button>
</form>
```

**When to use:** Form handling, data mutations, revalidation after writes.
**When NOT:** Real-time data, WebSocket connections, client-side-only logic.

#### 3. App Router File Conventions
```
app/
├── layout.tsx          ← Shared layout (persists across navigations)
├── page.tsx            ← Route entry point
├── loading.tsx         ← Streaming loading UI (Suspense boundary)
├── error.tsx           ← Error boundary
├── not-found.tsx       ← 404 handler
├── template.tsx        ← Re-renders on navigation (unlike layout)
├── route.ts            ← API Route Handler
├── (group)/            ← Route group (no URL segment)
├── [slug]/             ← Dynamic segment
├── [...slug]/          ← Catch-all segment
├── [[...slug]]/        ← Optional catch-all
└── @slot/              ← Parallel route (named slot)
```

#### 4. Streaming SSR
Progressive page rendering — server sends HTML in chunks as data resolves.
Combined with `<Suspense>` boundaries for instant shell with progressive content fill.

```tsx
export default function Page() {
  return (
    <div>
      <Header /> {/* Sent immediately */}
      <Suspense fallback={<Skeleton />}>
        <SlowDataComponent /> {/* Streams in when data resolves */}
      </Suspense>
    </div>
  );
}
```

#### 5. Parallel Routes & Intercepting Routes
- **Parallel:** Multiple page segments render simultaneously in named slots (`@analytics`, `@team`)
- **Intercepting:** Overlay a route on the current page (modal pattern) — `(.)photo/[id]`

#### 6. Middleware
Edge-executed logic that runs before every request — auth checks, redirects, geolocation,
A/B testing, header injection.

```ts
// middleware.ts
export function middleware(request: NextRequest) {
  if (!request.cookies.get("session")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
}
export const config = { matcher: ["/dashboard/:path*"] };
```

#### 7. Image Optimization
`next/image` — automatic WebP/AVIF conversion, lazy loading, responsive srcset,
blur placeholder, priority loading for LCP images.

#### 8. Incremental Static Regeneration (ISR)
Static pages that revalidate in the background — `revalidate: 60` regenerates
every 60 seconds. On-demand revalidation via `revalidatePath()` or `revalidateTag()`.

### Ecosystem
- **State:** Zustand, Jotai, Valtio (lightweight) | Redux Toolkit (enterprise)
- **Data Fetching:** React Query / TanStack Query, SWR
- **Forms:** React Hook Form, Conform, Formik
- **Auth:** Auth.js v5 (formerly NextAuth.js), Clerk, Lucia
- **ORM:** Prisma, Drizzle
- **Testing:** Vitest, Testing Library, Playwright

### Performance Characteristics
- **First Load:** Excellent with Server Components (minimal JS shipped)
- **Hydration:** Selective hydration via Suspense boundaries
- **Bundle:** Tree-shaking + code splitting per route (automatic)
- **Core Web Vitals:** Strong LCP/CLS with proper image optimization and streaming

### Picker_Ang Notes
- **Default choice** for A.I.M.S. builds — existing stack, team expertise
- Choose when: SEO matters, data-heavy, production-grade, dashboard + marketing
- Avoid when: Simple static content (use Astro instead), ultra-minimal bundle needs

---

## Vue / Nuxt

### Overview
Vue is a progressive framework with an approachable API. Nuxt is its meta-framework
providing SSR/SSG, auto-imports, file-based routing, and hybrid rendering.

- **Current:** Vue 3.5 (3.6 beta with Vapor Mode) + Nuxt 4.3.1 (Nuxt 5 imminent)
- **Vapor Mode (beta):** Renders without Virtual DOM — 100k components in 100ms, base bundle under 10 KB, per-component opt-in via `<script setup vapor>`
- **Rendering:** SSR, SSG, ISR, Hybrid (per-route rendering rules)
- **Reactivity:** Composition API with `ref()`, `reactive()`, `computed()`, `watch()` — rebuilt on `alien-signals` for performance

### Key Patterns & Techniques

#### 1. Composition API
```vue
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

const count = ref(0)
const doubled = computed(() => count.value * 2)
const increment = () => count.value++

onMounted(() => console.log('mounted'))
</script>
```

#### 2. Auto-Imports (Nuxt)
Components, composables, and utilities are auto-imported — no import statements needed.
`components/`, `composables/`, and `utils/` directories are scanned automatically.

#### 3. Hybrid Rendering (Nuxt)
Per-route rendering strategy:
```ts
// nuxt.config.ts
export default defineNuxtConfig({
  routeRules: {
    '/':          { prerender: true },       // SSG at build time
    '/blog/**':   { isr: 3600 },             // ISR every hour
    '/dashboard': { ssr: false },             // SPA (client-only)
    '/api/**':    { cors: true, cache: {} },  // API with CORS + cache
  }
});
```

#### 4. Vue Vapor Mode (Experimental)
Compile-time optimization that removes the virtual DOM for performance-critical components.
Compiles templates directly to DOM operations — similar to Svelte's approach.

#### 5. Pinia State Management
```ts
export const useCounterStore = defineStore('counter', () => {
  const count = ref(0)
  const increment = () => count.value++
  return { count, increment }
})
```

### Ecosystem
- **State:** Pinia (official), VueUse (composables collection)
- **UI:** Vuetify, PrimeVue, Naive UI, Radix Vue
- **Animation:** Vue Transition, VueUse Motion, GSAP
- **Forms:** VeeValidate, FormKit
- **Testing:** Vitest, Vue Test Utils

### Picker_Ang Notes
- Choose when: Rapid prototyping, team prefers Options/Composition API, content sites
- Avoid when: A.I.M.S. internal builds (not our stack), heavy 3D/animation needs

---

## Svelte / SvelteKit

### Overview
Svelte is a compile-time framework — no runtime overhead. Components compile to efficient
vanilla JS. SvelteKit is its meta-framework with file-based routing, SSR, and adapters.

- **Current:** Svelte 5.49 + SvelteKit 2.52
- **Reactivity:** Runes (`$state`, `$derived`, `$effect`, `$props`) — stable, default in Svelte 5
- **New:** Async Svelte (Aug 2025), Svelte MCP (Nov 2025), Cloudflare Workers setup via CLI
- **Compilation:** Components compile to imperative DOM operations at build time

### Key Patterns & Techniques

#### 1. Runes (Svelte 5)
```svelte
<script>
  let count = $state(0);
  let doubled = $derived(count * 2);

  $effect(() => {
    console.log(`count is ${count}`);
  });
</script>

<button onclick={() => count++}>{count} (doubled: {doubled})</button>
```

#### 2. Fine-Grained Reactivity
No virtual DOM diffing. Svelte compiles reactive declarations into surgical DOM updates.
Only the exact DOM node that changed gets updated.

#### 3. SvelteKit Form Actions
```ts
// +page.server.ts
export const actions = {
  default: async ({ request }) => {
    const data = await request.formData();
    await db.todos.create({ text: data.get('text') });
  }
};
```

#### 4. Transitions (Built-in)
```svelte
<script>
  import { fade, fly, slide } from 'svelte/transition';
  let visible = $state(true);
</script>

{#if visible}
  <div transition:fly={{ y: 200, duration: 300 }}>Content</div>
{/if}
```

#### 5. Adapters
SvelteKit deploys anywhere via adapters:
- `@sveltejs/adapter-auto` — auto-detects platform
- `@sveltejs/adapter-node` — Node.js server
- `@sveltejs/adapter-static` — static site
- `@sveltejs/adapter-vercel` — Vercel edge
- `@sveltejs/adapter-cloudflare` — Cloudflare Workers

### Picker_Ang Notes
- Choose when: Performance is paramount, small bundle critical, team knows Svelte
- Avoid when: Need large ecosystem (React has more libraries), heavy animation (Motion supports React + Vue + vanilla JS)

---

## Angular

### Overview
Angular is a batteries-included enterprise framework with dependency injection,
TypeScript-first design, and a mature CLI.

- **Current:** Angular 21 (Signal Forms, Zoneless default, Angular MCP, ARIA headless)
- **Reactivity:** Signals (fine-grained), **Zoneless is now the default** for new projects (Zone.js gone)
- **New:** Signal Forms (experimental), Angular MCP Server (AI tooling), Angular ARIA (headless accessible components), Vitest default
- **Components:** Standalone by default (no NgModules required)

### Key Patterns & Techniques

#### 1. Signals
```typescript
import { signal, computed, effect } from '@angular/core';

const count = signal(0);
const doubled = computed(() => count() * 2);

effect(() => console.log(`Count: ${count()}`));

count.set(5);        // Direct set
count.update(v => v + 1); // Functional update
```

#### 2. Standalone Components
```typescript
@Component({
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `<h1>{{ title }}</h1>`,
})
export class AppComponent {
  title = 'Hello';
}
```

#### 3. Deferrable Views
Lazy-load parts of a template based on triggers:
```html
@defer (on viewport) {
  <heavy-component />
} @placeholder {
  <loading-skeleton />
} @loading (minimum 500ms) {
  <spinner />
}
```

#### 4. Zoneless Change Detection
Opt out of Zone.js entirely — use signals for change detection.
Reduces bundle size and improves performance.

#### 5. Server-Side Rendering (Angular Universal)
Full SSR + hydration support, including partial hydration with `@defer`.

### Picker_Ang Notes
- Choose when: Enterprise environment, large team with Angular experience, regulated industries
- Avoid when: Small projects, rapid prototyping, creative/marketing sites

---

## Astro

### Overview
Astro is a content-first static site builder that ships zero JavaScript by default.
Uses Islands Architecture — only interactive components hydrate, everything else is static HTML.

- **Current:** Astro 5.17 (Astro 6 beta — joined Cloudflare, Vite Environment API dev server)
- **⚠️ Astro acquired by Cloudflare** — remains open-source MIT, supports all deployment targets
- **Astro 6:** Requires Node 22+, Zod 4, first-class Cloudflare Workers support, Live Content Collections
- **Rendering:** Static first, with SSR opt-in per route
- **Islands:** Interactive components from ANY framework (React, Vue, Svelte, Solid) inside static pages

### Key Patterns & Techniques

#### 1. Island Architecture
```astro
---
// This runs at build time — server-only
import ReactCounter from './Counter.tsx';
import Header from './Header.astro'; // Zero JS
---

<Header /> <!-- Static HTML, no JS -->
<ReactCounter client:visible /> <!-- Hydrates only when visible -->
```

**Hydration Directives:**
- `client:load` — hydrate on page load
- `client:idle` — hydrate when browser is idle
- `client:visible` — hydrate when scrolled into view
- `client:media` — hydrate on media query match
- `client:only` — skip SSR, client-render only

#### 2. Content Collections
Type-safe content management for Markdown/MDX:
```ts
// content.config.ts
const blog = defineCollection({
  schema: z.object({
    title: z.string(),
    date: z.date(),
    tags: z.array(z.string()),
  }),
});
```

#### 3. View Transitions
Built-in page transitions using the View Transitions API:
```astro
---
import { ViewTransitions } from 'astro:transitions';
---
<head>
  <ViewTransitions />
</head>
```

#### 4. Multi-Framework Support
Mix frameworks in one project — React for interactive islands, Svelte for another,
all inside Astro's static HTML shell.

### Picker_Ang Notes
- Choose when: Content-heavy (blog, docs, marketing), performance-critical, minimal JS needed
- Avoid when: Highly interactive apps (dashboards, chat), real-time data, complex client-side state

---

## Solid.js

### Overview
Solid is a reactive UI library with fine-grained reactivity and no virtual DOM.
Signals update only the exact DOM nodes that depend on changed data.

- **Current:** SolidStart 1.2.0 (SolidJS 2.0 + SolidStart 2.0 in alpha)
- **Reactivity:** Signals (`createSignal`), Memos (`createMemo`), Effects (`createEffect`)
- **New:** `@solidjs/signals` (next-gen reactive primitives), TanStack Start convergence
- **Rendering:** True fine-grained updates — no diffing, no re-rendering

### Key Patterns & Techniques

#### 1. Signals (Fine-Grained)
```tsx
const [count, setCount] = createSignal(0);
const doubled = createMemo(() => count() * 2);

createEffect(() => console.log(count())); // Only runs when count changes

return <p>{count()} doubled is {doubled()}</p>;
// Only the text nodes update — not the <p> element
```

#### 2. Control Flow Components
```tsx
<Show when={isLoggedIn()} fallback={<LoginForm />}>
  <Dashboard />
</Show>

<For each={items()}>{(item) => <Card data={item} />}</For>

<Switch>
  <Match when={status() === "loading"}><Spinner /></Match>
  <Match when={status() === "error"}><Error /></Match>
  <Match when={status() === "success"}><Content /></Match>
</Switch>
```

#### 3. Resource (Async Data)
```tsx
const [user] = createResource(userId, fetchUser);
return <Show when={user()}>{u => <Profile user={u()} />}</Show>;
```

### Picker_Ang Notes
- Choose when: Maximum performance needed, real-time UIs, frequent updates
- Avoid when: Team unfamiliar (learning curve), need large ecosystem (React has more)

---

## Qwik

### Overview
Qwik is a resumable framework — instead of hydrating (re-executing all JS), it resumes
from the server-serialized state. Zero JS on initial load, lazy-loads code on interaction.

- **Current:** Qwik 1.18 stable (Qwik 2.0 beta — new `@qwik.dev/*` npm scope)
- **Rendering:** Resumable (no hydration penalty) — ~1 KB initial JS regardless of app size
- **Loading:** Progressive — JS loads only when user interacts with specific elements

### Key Patterns & Techniques

#### 1. Resumability
```tsx
export const Counter = component$(() => {
  const count = useSignal(0);
  // This handler's code is NOT loaded until user clicks
  return <button onClick$={() => count.value++}>{count.value}</button>;
});
```

The `$` suffix marks lazy boundaries — code after `$` is loaded on demand.

#### 2. Speculative Prefetching
Qwik prefetches code for visible interactions during browser idle time.
When user clicks, the code is already cached — instant response.

### Picker_Ang Notes
- Choose when: Time-to-Interactive is the #1 priority, e-commerce, landing pages with heavy JS
- Avoid when: Simple sites where hydration cost is already low, team unfamiliar

---

## Web Components / Lit

### Overview
Web Components are native browser primitives — Custom Elements, Shadow DOM, HTML Templates.
Lit is the lightweight library that makes authoring Web Components easy.

- **Current:** Lit 4
- **Standard:** Browser-native, framework-agnostic
- **Shadow DOM:** Encapsulated styles and markup

### Key Patterns & Techniques

#### 1. Custom Element
```ts
@customElement('my-counter')
export class MyCounter extends LitElement {
  @property({ type: Number }) count = 0;

  render() {
    return html`
      <button @click=${() => this.count++}>${this.count}</button>
    `;
  }
}
// Usage anywhere: <my-counter count="5"></my-counter>
```

#### 2. Declarative Shadow DOM
Server-renderable Shadow DOM — works without JS:
```html
<my-component>
  <template shadowrootmode="open">
    <style>:host { display: block; }</style>
    <slot></slot>
  </template>
  Content here
</my-component>
```

### Picker_Ang Notes
- Choose when: Building a design system shared across multiple frameworks, embeddable widgets
- Avoid when: Single-framework app (use that framework's components instead)

---

## Build Tools: Vite

### Overview
The dominant frontend build tool. Faster than webpack, used by Nuxt, SvelteKit, Astro, Solid, Qwik, and more.

- **Current:** Vite 7.3.1 (31M+ weekly npm downloads)
- **Beta:** Vite 8.0 — powered by **Rolldown** (replaces esbuild + Rollup), linear build: 46s → 6s
- **Coming:** Vite+ (drop-in upgrade with additional features, public preview 2026)

### Picker_Ang Notes
- Default build tool for all non-Next.js projects (Next.js uses Turbopack)
- Vite 8 with Rolldown will be a major speed improvement for production builds

---

## Remix → React Router v7

**Remix as a React framework no longer exists.** It has been fully absorbed into React Router v7.

- **Current:** React Router v7.13 (IS Remix — bundler + server runtime merged)
- **Three modes:** Basic SPA routing, data router, full framework mode (was Remix)
- **RSC support:** Unstable React Server Components in Framework Mode
- **⚠️ "Remix 3" is NOT a continuation** — it's a separate project based on Preact, not React

### Picker_Ang Notes
- If user asks for Remix → use **React Router v7 Framework Mode** (same thing, new name)
- If user is on Remix v2 → upgrading is mostly a dependency swap

---

## Framework Comparison Matrix

| Framework | Bundle Size | SSR | Fine-Grained | TypeScript | Animation Compat | Learning Curve |
|-----------|------------|-----|---------------|-----------|-----------------|----------------|
| **Next.js** | Medium | Excellent | No (VDOM) | Excellent | Motion (native) | Medium |
| **Nuxt** | Medium | Excellent | No (VDOM) | Good | Vue Transition, GSAP | Medium |
| **SvelteKit** | Small | Good | Yes (compiled) | Good | Built-in transitions | Low |
| **Angular** | Large | Good | Signals (new) | Excellent | Angular Animations | High |
| **Astro** | Tiny | Excellent | N/A (static) | Good | Any (via islands) | Low |
| **Solid** | Small | Good | Yes (signals) | Good | Limited libraries | Medium |
| **Qwik** | Near-zero initial | Excellent | Yes (signals) | Good | Limited libraries | High |
| **Lit** | Tiny | Limited | No | Good | CSS/WAAPI | Low |

---

## A.I.M.S. Default: Next.js

For all A.I.M.S. internal and client builds, **Next.js is the default** unless there's a
specific reason to deviate. Picker_Ang should justify any non-Next.js selection with:

1. A clear technical reason (performance, bundle size, content-first)
2. Compatibility with the rest of the A.I.M.S. stack
3. Team capability to support the alternative long-term
