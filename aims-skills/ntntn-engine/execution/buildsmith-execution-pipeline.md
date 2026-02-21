# Buildsmith Execution Pipeline — NtNtN Engine

> **Version:** 1.0.0
> **Owner:** Buildsmith (Boomer_Ang, Creative Engineering PMO)
> **Engine:** NtNtN Engine — A.I.M.S. Platform Feature
> **Status:** Active
> **Effective:** 2026-02-21

The execution pipeline is the engine inside the engine — what turns Picker_Ang's Stack Recommendation into a real, deployed product. Three pillars: **IMAGE**, **INTERFACE**, **INTEGRATIONS**.

---

## Execution Architecture

```
User describes vision
         ↓
    ┌─────────────────┐
    │    ACHEEVY       │  (or user goes Direct-to-Engine)
    │  NLP Classify    │
    └────────┬────────┘
             ↓
    ┌─────────────────┐
    │   Picker_Ang     │  Stack Recommendation produced
    │   (Selects)      │
    └────────┬────────┘
             ↓
    ┌─────────────────────────────────────────────────────────┐
    │                  BUILDSMITH EXECUTION PIPELINE            │
    │                                                          │
    │  ┌──────────┐    ┌──────────────┐    ┌──────────────┐   │
    │  │  IMAGE    │    │  INTERFACE    │    │ INTEGRATIONS │   │
    │  │  Pillar   │ ←→ │  Pillar      │ ←→ │  Pillar      │   │
    │  └──────────┘    └──────────────┘    └──────────────┘   │
    │       ↓                ↓                    ↓            │
    │  Visual Assets    Code Artifacts      Fullstack Glue     │
    │                                                          │
    │  ┌──────────────────────────────────────────────────┐   │
    │  │         ASSEMBLY & VERIFICATION LAYER             │   │
    │  │  Combine → Test → Audit → Sign → Deploy           │   │
    │  └──────────────────────────────────────────────────┘   │
    └─────────────────────────┬───────────────────────────────┘
                              ↓
                    Delivered to User via ACHEEVY
```

---

## Two Entry Points

### Entry A: ACHEEVY-Guided (Conversational)
1. User describes vision to ACHEEVY (voice or text)
2. ACHEEVY walks the user through a creative brief:
   - What's the purpose? (portfolio, e-commerce, landing, dashboard, etc.)
   - What's the mood? (clean, bold, playful, dark, glassmorphic, etc.)
   - Any specific features? (3D, scroll effects, animations, forms, auth, etc.)
   - Target audience? (developers, consumers, enterprise, etc.)
   - Reference sites or inspirations?
3. ACHEEVY compiles the brief → routes to Picker_Ang
4. Picker_Ang produces Stack Recommendation
5. Buildsmith executes the pipeline

### Entry B: Direct-to-Engine (Prompt-to-Product)
1. User writes a detailed prompt describing exactly what they want
2. NtNtN Engine NLP classifies intent, extracts tech keywords
3. Picker_Ang auto-generates Stack Recommendation (no conversation)
4. Buildsmith executes the pipeline
5. User receives a live preview + iteration interface

---

## PILLAR 1: IMAGE — Visual Asset Pipeline

The IMAGE pillar handles everything the user *sees* before and during the build — design mockups, icons, logos, illustrations, backgrounds, OG images, favicons, and preview screenshots.

### Capabilities

| Capability | Tool / Service | Purpose | Output |
|-----------|---------------|---------|--------|
| **AI Image Generation** | Nano Banana Pro (Gemini 3 Pro Image) / GPT Image 1.5 / FLUX.2 [pro] / Imagen 4 | Generate hero images, backgrounds, illustrations, product shots | PNG/WebP/AVIF files |
| **Screenshot Preview** | Playwright | Capture rendered page screenshots for review before deploy | PNG screenshots |
| **Icon Generation** | SVGMaker MCP + Recraft V4 | Generate brand icons from descriptions — native SVG output | SVG files |
| **Logo Generation** | Recraft V4 Pro (via fal.ai) / GPT Image 1.5 (wordmarks) | Generate brand logos as true vectors | SVG/PNG |
| **Asset Optimization** | Sharp v0.34+ / next/image pipeline | Compress, resize, convert to AVIF/WebP, generate srcset variants | Optimized assets |
| **OG Image Generation** | Satori + resvg-js / @vercel/og v0.8+ | Dynamic Open Graph images from JSX templates (no browser needed) | PNG (1200x630) |
| **Background Generation** | CSS gradient generators + AI image gen | Mesh gradients, aurora, animated gradients, noise textures | CSS/SVG/PNG |
| **Placeholder Generation** | BlurHash / ThumbHash / Plaiceholder | Low-quality image placeholders for loading states | Base64 data URIs |
| **Animation Assets** | Rive / Lottie / Recraft V4 (Lottie export) | Export interactive animation assets for embedding | .riv / .json |
| **Color Palette Generation** | Colormind API / Hotpot.ai API + WCAG validation | Generate cohesive palettes, validate contrast accessibility | Design token JSON |
| **Typography Pairing** | Fontjoy neural net + Google Fonts API / LLM-assisted | Select complementary font pairings based on mood/intent | Font config |
| **Design-to-Code Bridge** | Figma MCP Server / v0.app / Google Stitch | Convert design files or prompts into code-ready specs | Design context JSON |
| **Template Assets** | Canva Connect APIs (12 APIs — resize, data connectors, design editing) | Template-driven marketing assets, data-driven design variants | PNG/PDF/designs |
| **Video Assets** | Sora 2 API / Runway Gen-4.5 / Kling 2.6 / Pika 2.5 | Generate short video assets for hero sections, backgrounds | MP4/WebM |

### AI Image Generation Tier List (February 2026)

| Model | Provider | API Endpoint | Price/Image | Best For |
|-------|----------|-------------|-------------|----------|
| **Nano Banana Pro** | Google (Gemini 3 Pro Image) | `gemini-3-pro-image-preview` | $0.02-$0.06 | Highest quality, A.I.M.S. default |
| **GPT Image 1.5** | OpenAI | `gpt-image-1.5` | $0.005-$0.17 | Text rendering, instruction following |
| **FLUX.2 [pro]** | Black Forest Labs | BFL API | $0.014-$0.05 | Fine-grained control, self-hosting options |
| **Imagen 4** | Google Vertex AI | `imagen-4.0-generate-001` | $0.02-$0.06 | GCP ecosystem, high volume |
| **Ideogram 3.0** | Ideogram | Ideogram API v3 | ~$0.06 | Typography in images (~90% accuracy) |
| **Recraft V4** | Recraft | Recraft API / fal.ai | $0.04-$0.30 | Native SVG vector generation |
| **SD4** | Stability AI | platform.stability.ai | ~$0.003 | Open-source, self-hostable, massive ecosystem |
| **Adobe Firefly 5** | Adobe | Firefly Services API | Subscription | IP-indemnified, commercially safe |
| **GPT Image 1-mini** | OpenAI | `gpt-image-1-mini` | ~$0.005-$0.011 | Budget, high-volume |
| **FLUX.2 [dev]** | Black Forest Labs | BFL API / self-host | Open-weight | 32B params, editing workflows, self-hosting |
| **FLUX.2 [flex]** | Black Forest Labs | BFL API | $0.014+ | Fine-grained parameter control, API-only |
| **FLUX.2 [klein]** | Black Forest Labs | BFL API / self-host | $0.014+ | Sub-second gen, Apache 2.0, consumer GPU |
| **Hunyuan Image 3.0** | Tencent | Tencent Cloud / Replicate / HuggingFace | Budget | 80B MoE (13B active), open-source, strong text rendering |

**DALL-E 3 is deprecated.** API scheduled for full shutdown May 2026. Do not use.
**Midjourney has no API.** Not viable for programmatic pipelines.
**Gemini 2.0 Flash models retire March 31, 2026.** Migrate to 2.5-flash-lite or newer. Imagen 1/2/3 already shut down.

### Unified API Platforms
For accessing multiple models through a single endpoint:
- **fal.ai** — FLUX.2, Recraft V4, SD models
- **Replicate** — FLUX, SD, Hunyuan, open-source models
- **WaveSpeedAI** — Multi-model with unified billing
- **SiliconFlow** — Budget-friendly multi-model access
- **Adobe Creative Cloud** — Bundles Firefly 5, Nano Banana Pro, GPT Image, Runway Gen-4, FLUX.2 under one subscription with unlimited generations

### Editing & In-Context Generation
- **FLUX.1 Kontext** — In-context image generation/editing with text+image prompting (integrated into Adobe Photoshop Generative Fill)

### IMAGE Pipeline Flow
```
Creative Intent (from Picker_Ang spec)
    ↓
1. ANALYZE — Parse visual requirements from Stack Recommendation
    ↓
2. GENERATE — Create visual assets (Nano Banana Pro / GPT Image 1.5 / FLUX.2)
    ↓
3. VECTORIZE — Generate icons/logos as native SVG (Recraft V4 / SVGMaker MCP)
    ↓
4. OPTIMIZE — Compress, convert to AVIF/WebP, generate responsive variants (Sharp)
    ↓
5. CATALOG — Register assets in the Build Manifest with paths and metadata
    ↓
6. PREVIEW — Generate screenshot mockup (Playwright) + OG images (Satori)
    ↓
Output: Asset Catalog (images, icons, fonts, colors, placeholders, video)
```

### IMAGE Rules
- **A.I.M.S. default image model:** Nano Banana Pro (Gemini 3 Pro Image)
- Every generated image must be optimized before inclusion (no raw AI output in production)
- Serve AVIF with WebP/JPEG fallback (AVIF = ~50% smaller than WebP)
- Maximum hero image: 400KB (after optimization)
- All images must have alt text generated alongside them
- Favicons generated in all required sizes (16, 32, 180, 192, 512)
- OG images are mandatory for every page
- Color palette must pass WCAG 2.1 AA contrast checks (use `color-contrast-checker` or axe-core)
- Font selections must include a system font fallback stack
- Icons and logos must be generated as native SVG (not rasterized)
- For commercial/enterprise builds requiring IP indemnification: use Adobe Firefly 5
- EU AI Act: all synthetic photorealistic content must be clearly labeled as AI-generated
- US Copyright: purely AI-generated works cannot be copyrighted — human-in-the-loop workflows may qualify

---

## PILLAR 2: INTERFACE — Code Generation Engine

The INTERFACE pillar is the core builder — it generates the actual code, components, pages, styles, and animations that make up the product.

### Capabilities

| Capability | Tool / Service | Purpose | Output |
|-----------|---------------|---------|--------|
| **Sandbox Environment** | E2B Cloud Sandbox / Docker container | Isolated execution environment for building and testing | Running dev server |
| **Project Scaffolding** | create-next-app / degit / custom templates | Initialize project structure with correct config | Project directory |
| **Component Generation** | LLM (Claude) + NtNtN patterns + shadcn/ui | Generate React components from descriptions | .tsx files |
| **Page Composition** | LLM + App Router conventions + layout patterns | Compose full pages from component inventory | page.tsx files |
| **Style System Setup** | Tailwind config + design tokens + CSS variables | Configure the visual foundation (colors, spacing, typography) | tailwind.config.ts, globals.css |
| **Animation Wiring** | Motion v12.34 / GSAP 3.14.2 patterns from NtNtN library | Wire animations per the technique spec | Motion components |
| **Responsive Implementation** | Tailwind breakpoints + container queries | Build mobile-first, enhance for tablet/desktop | Responsive layouts |
| **Design System Creation** | shadcn/ui CLI + custom variants + CVA | Build a design system from the color palette and tokens | Component library |
| **Live Preview** | Next.js dev server (inside sandbox) | Hot-reloading preview accessible via URL | Preview URL |
| **Iteration Loop** | Diff-based edits via LLM + user feedback | User views preview, requests changes, Buildsmith iterates | Updated files |
| **Code Quality** | ESLint + Prettier + TypeScript strict | Enforce code quality standards automatically | Clean code |
| **Accessibility Audit** | axe-core / Lighthouse accessibility | Automated a11y checks at component and page level | A11y report |

### INTERFACE Pipeline Flow
```
Stack Recommendation + Asset Catalog
    ↓
1. SCAFFOLD — Create project structure (Next.js App Router, deps, config)
    ↓
2. FOUNDATION — Set up layout, routing, design tokens, global styles
    ↓
3. COMPONENTS — Generate UI components (shadcn/ui base + custom)
    ↓
4. PAGES — Compose pages from components + wire data
    ↓
5. ANIMATION — Apply motion patterns from NtNtN technique library
    ↓
6. RESPONSIVE — Implement mobile → tablet → desktop breakpoints
    ↓
7. PREVIEW — Launch dev server, generate preview URL
    ↓
8. ITERATE — User reviews, requests changes, Buildsmith applies diffs
    ↓
9. POLISH — Accessibility audit, performance check, code cleanup
    ↓
Output: Complete codebase (ready for integration)
```

### Sandbox Architecture
```
┌─────────────────────────────────────────────┐
│  E2B Cloud Sandbox (or Docker container)     │
│                                              │
│  ┌─────────────────────────────────────┐    │
│  │  Node.js 22+ Runtime                 │    │
│  │  ├── next@16                         │    │
│  │  ├── tailwindcss@4                   │    │
│  │  ├── motion@12                       │    │
│  │  ├── radix-ui                        │    │
│  │  ├── typescript@5+                  │    │
│  │  └── [Picker_Ang selections]        │    │
│  └─────────────────────────────────────┘    │
│                                              │
│  ┌─────────────────────────────────────┐    │
│  │  Dev Server (next dev, port 3000)    │    │
│  │  Hot Module Replacement active       │    │
│  │  Accessible via sandbox URL          │    │
│  └─────────────────────────────────────┘    │
│                                              │
│  ┌─────────────────────────────────────┐    │
│  │  File System                         │    │
│  │  ├── /app (App Router pages)         │    │
│  │  ├── /components (UI components)     │    │
│  │  ├── /lib (utilities)               │    │
│  │  ├── /public (assets from IMAGE)    │    │
│  │  └── /styles (global CSS + tokens)  │    │
│  └─────────────────────────────────────┘    │
└─────────────────────────────────────────────┘
```

### Component Generation Pattern
```
For each component in the build manifest:
  1. Check NtNtN Engine for matching pattern/technique reference
  2. Check shadcn/ui for a base component to extend
  3. Generate component code using:
     - LLM (Claude) with NtNtN technique context injected
     - Design tokens from the style system
     - Animation patterns from Picker_Ang's technique selections
  4. Write .tsx file with TypeScript types
  5. Co-locate test file (.test.tsx) with basic render test
  6. Validate with ESLint + TypeScript compiler
  7. Hot-reload and verify in preview
```

### Iteration Protocol
```
LOOP:
  1. Buildsmith generates/updates code
  2. Dev server hot-reloads
  3. Screenshot captured and sent to user
  4. User provides feedback (text or voice)
  5. Buildsmith parses feedback into specific diffs
  6. Apply diffs to codebase
  7. GOTO 1 (max 10 iterations before requiring explicit continuation)
```

### INTERFACE Rules
- Every component must be TypeScript (.tsx) — no plain JS
- Every component must have at least a basic render test
- All animations must respect `prefers-reduced-motion`
- No inline styles — all styling through Tailwind or CSS modules
- Server Components by default — `'use client'` only when needed (interactivity, hooks, browser APIs)
- Maximum 200 lines per component file — split if larger
- All images use `next/image` with proper sizing
- All links use `next/link`
- Forms use Server Actions or React Hook Form
- Error boundaries on every page (`error.tsx`)
- Loading states on every async page (`loading.tsx`)

---

## PILLAR 3: INTEGRATIONS — Fullstack & Deploy Pipeline

The INTEGRATIONS pillar connects the frontend to everything else — databases, auth, payments, APIs, Git, deployment, monitoring.

### Capabilities

| Capability | Tool / Service | Purpose | Output |
|-----------|---------------|---------|--------|
| **Git Operations** | GitHub API / git CLI | Initialize repo, commit, branch, push | Git repository |
| **Database Setup** | Prisma v7 + SQLite (dev) / PostgreSQL (prod) | Schema definition, migrations, seeding | Database + Prisma client |
| **Authentication** | Auth.js v5 / Clerk | User auth flows (social, email, magic link) | Auth config + pages |
| **Payments** | Stripe SDK + Checkout / Billing Portal | Payment processing, subscriptions, invoicing | Stripe integration |
| **Email** | Resend / SendGrid / Nodemailer | Transactional emails, notifications | Email templates + API |
| **File Storage** | Uploadthing / S3 / GCS / Cloudflare R2 | User uploads, media storage | Storage config |
| **API Layer** | Next.js Route Handlers / tRPC | API endpoints for client-server communication | API routes |
| **Real-time** | WebSockets / Server-Sent Events / Pusher | Live updates, notifications, collaboration | WS/SSE endpoints |
| **Search** | Algolia / Meilisearch / Postgres full-text | Full-text search across content | Search index + UI |
| **Analytics** | Vercel Analytics / PostHog / Plausible | Usage tracking, performance monitoring | Analytics config |
| **Build & Deploy** | `next build` → Docker → VPS / Vercel | Production build and deployment | Live URL |
| **Domain & SSL** | DNS config + Certbot / Cloudflare SSL | Custom domain with HTTPS | Secure domain |
| **Monitoring** | Sentry / LogTail / Uptime Kuma | Error tracking, logging, uptime monitoring | Monitoring dashboard |
| **CI/CD Pipeline** | GitHub Actions / Cloud Build | Automated test → build → deploy on push | Pipeline config |

### INTEGRATIONS Pipeline Flow
```
Complete Codebase (from INTERFACE) + Stack Recommendation
    ↓
1. GIT INIT — Create repo, initial commit, push to GitHub
    ↓
2. DATABASE — Define Prisma schema, run migrations, seed data
    ↓
3. AUTH — Configure authentication provider and pages
    ↓
4. API — Create API endpoints / Server Actions for data mutations
    ↓
5. THIRD-PARTY — Wire payments, email, storage, search (as needed)
    ↓
6. ENV CONFIG — Set up environment variables (.env.local, .env.production)
    ↓
7. BUILD — Run `next build`, verify zero errors
    ↓
8. DEPLOY — Push to deployment target (VPS Docker / Vercel / Cloudflare)
    ↓
9. DNS — Configure domain + SSL
    ↓
10. MONITOR — Set up error tracking + uptime monitoring
    ↓
Output: Live production URL + monitoring dashboard
```

### Database Schema Generation
```
From build requirements:
  1. Identify data entities (users, products, posts, etc.)
  2. Generate Prisma schema with:
     - Model definitions with proper relations
     - Indexes for query patterns
     - Enum types for fixed value sets
     - Created/updated timestamps on all models
  3. Run `prisma migrate dev` in sandbox
  4. Generate seed data for development
  5. Export Prisma client for use in Server Components / Actions
```

### Authentication Templates
```
Based on Picker_Ang's auth selection:

Auth.js v5 (formerly NextAuth.js):
  - auth.ts (root config, universal auth() method)
  - app/api/auth/[...nextauth]/route.ts (handler export)
  - Social providers (Google, GitHub, Discord)
  - Email + magic link
  - Session handling (JWT or database)
  - Protected route middleware
  - Edge runtime compatible

Clerk:
  - ClerkProvider wrapper
  - SignIn/SignUp components
  - Middleware for route protection
  - User profile management

Custom:
  - bcrypt password hashing
  - JWT token management
  - Cookie-based sessions
  - CSRF protection
```

### Deployment Targets

| Target | When | How | Domain |
|--------|------|-----|--------|
| **A.I.M.S. VPS** | Default for A.I.M.S. builds | Docker Compose on 76.13.96.107 | *.plugmein.cloud |
| **Vercel** | Client's own deployment | `vercel deploy` or Git integration | Client's domain |
| **Cloudflare Pages** | Static or edge-heavy builds | `wrangler pages deploy` | Client's domain |
| **Docker (self-hosted)** | Client's own VPS | Dockerfile + docker-compose.yml | Client's domain |
| **Netlify** | JAMstack / static sites | Git integration or `netlify deploy` | Client's domain |

### INTEGRATIONS Rules
- Never hardcode secrets — always use environment variables
- Database credentials are never committed to Git
- All API routes must validate input (Zod schemas)
- Auth routes must use CSRF protection
- Payment webhooks must verify Stripe signatures
- File uploads must be size-limited and type-validated
- Every deployment must have a rollback plan
- Monitoring must be set up before marking a build as complete
- SSL is mandatory — no HTTP-only deployments

---

## Combined Execution Flow (Full Build)

```
PHASE 0: INTAKE
  ├── User describes vision (ACHEEVY-guided or direct prompt)
  ├── Picker_Ang produces Stack Recommendation
  └── Buildsmith validates spec, creates Build Manifest

PHASE 1: IMAGE (Visual Asset Pipeline)
  ├── Generate color palette + typography pairing
  ├── Generate hero/background images (AI)
  ├── Generate icons, logos, favicons
  ├── Generate OG images
  ├── Optimize all assets
  └── Catalog assets in manifest

PHASE 2: INTERFACE (Code Generation)
  ├── Spin up E2B sandbox
  ├── Scaffold Next.js project
  ├── Configure Tailwind + design tokens
  ├── Generate UI components
  ├── Compose pages from components
  ├── Wire animations (Motion / GSAP)
  ├── Implement responsive breakpoints
  ├── Launch dev server preview
  └── Enter iteration loop with user

PHASE 3: INTEGRATIONS (Fullstack & Deploy)
  ├── Initialize Git repository
  ├── Set up database (Prisma + Postgres)
  ├── Configure authentication
  ├── Wire API routes / Server Actions
  ├── Connect third-party services
  ├── Configure environment variables
  ├── Run production build
  ├── Deploy to target
  ├── Configure domain + SSL
  └── Set up monitoring

PHASE 4: VERIFICATION
  ├── Lighthouse audit (Performance > 90, Accessibility > 95)
  ├── Cross-browser check (Chrome, Safari, Firefox, Edge)
  ├── Mobile responsiveness check (375px, 768px, 1024px, 1440px)
  ├── Core Web Vitals check (LCP < 2.5s, CLS < 0.1, INP < 200ms)
  ├── Security scan (headers, CSP, CORS)
  ├── SEO check (meta tags, sitemap, robots.txt)
  └── Accessibility audit (axe-core, screen reader test)

PHASE 5: SIGN & DELIVER
  ├── Generate build report with all evidence
  ├── Add `<!-- Buildsmith -->` signature
  ├── Compile delivery package:
  │   ├── Live URL
  │   ├── Source code repository
  │   ├── Build report
  │   ├── Asset catalog
  │   ├── Environment variable manifest
  │   └── Deployment documentation
  ├── Sign build with Buildsmith attestation
  └── ACHEEVY presents to user
```

---

## Lil_Hawk Task Distribution

Buildsmith dispatches to Chicken Hawk, who assigns Lil_Hawks per pillar:

### IMAGE Pillar Tasks
| Task | Primary Lil_Hawk | Backup |
|------|-----------------|--------|
| AI image generation | Lil_Pixel_Hawk | — |
| Screenshot capture | Lil_Proofrunner_Hawk | Lil_Pixel_Hawk |
| Icon/logo generation | Lil_Pixel_Hawk | — |
| Asset optimization | Lil_Build_Surgeon_Hawk | Lil_Patch_Hawk |
| Color palette extraction | Lil_Pixel_Hawk | Lil_Motion_Tuner_Hawk |
| Typography pairing | Lil_Pixel_Hawk | — |

### INTERFACE Pillar Tasks
| Task | Primary Lil_Hawk | Backup |
|------|-----------------|--------|
| Project scaffolding | Lil_Build_Surgeon_Hawk | Lil_Patch_Hawk |
| Component generation | Lil_Interface_Forge_Hawk | Lil_Patch_Hawk |
| Page composition | Lil_Interface_Forge_Hawk | — |
| Style system setup | Lil_Interface_Forge_Hawk | Lil_Patch_Hawk |
| Animation wiring | Lil_Motion_Tuner_Hawk | Lil_Interface_Forge_Hawk |
| Responsive implementation | Lil_Interface_Forge_Hawk | — |
| Code quality check | Lil_Proofrunner_Hawk | — |
| Accessibility audit | Lil_Proofrunner_Hawk | — |

### INTEGRATIONS Pillar Tasks
| Task | Primary Lil_Hawk | Backup |
|------|-----------------|--------|
| Git operations | Lil_Build_Surgeon_Hawk | Lil_Patch_Hawk |
| Database setup | Lil_Build_Surgeon_Hawk | Lil_Patch_Hawk |
| Auth configuration | Lil_Patch_Hawk | Lil_Build_Surgeon_Hawk |
| API route creation | Lil_Interface_Forge_Hawk | Lil_Patch_Hawk |
| Third-party wiring | Lil_Patch_Hawk | — |
| Build & deploy | Lil_Deploy_Handler_Hawk | Lil_Build_Surgeon_Hawk |
| Domain & SSL | Lil_Deploy_Handler_Hawk | — |
| Monitoring setup | Lil_Deploy_Handler_Hawk | Lil_Proofrunner_Hawk |

---

## Build Manifest (Extended)

The Build Manifest is the contract that drives the entire pipeline:

```json
{
  "manifest_id": "BM-2026-001",
  "recommendation_id": "SR-2026-001",
  "build_name": "Creative E-Commerce Landing",
  "entry_point": "acheevy_guided",
  "creative_brief": {
    "purpose": "E-commerce landing page for a premium sneaker brand",
    "mood": "Dark, bold, kinetic",
    "features": ["3D product viewer", "scroll animations", "add to cart"],
    "audience": "Sneaker enthusiasts, 18-35",
    "references": ["nike.com", "adidas.com/yeezy"]
  },
  "stack_recommendation": {
    "framework": "Next.js 16",
    "styling": "Tailwind CSS v4",
    "animation": "Motion v12+",
    "ui_components": "shadcn/ui",
    "3d": "React Three Fiber + Drei",
    "scroll": "Lenis"
  },
  "pillars": {
    "image": {
      "color_palette": "pending",
      "typography": "pending",
      "hero_image": "pending",
      "icons": "pending",
      "og_images": "pending",
      "status": "not_started"
    },
    "interface": {
      "scaffold": "pending",
      "components": [],
      "pages": [],
      "animations": [],
      "preview_url": null,
      "iteration_count": 0,
      "status": "not_started"
    },
    "integrations": {
      "git_repo": null,
      "database": "pending",
      "auth": "not_required",
      "payments": "stripe_checkout",
      "deploy_target": "vercel",
      "live_url": null,
      "status": "not_started"
    }
  },
  "verification": {
    "lighthouse_score": null,
    "accessibility_score": null,
    "cwv_lcp": null,
    "cwv_cls": null,
    "cwv_inp": null,
    "cross_browser": "pending",
    "mobile_responsive": "pending",
    "security_scan": "pending"
  },
  "evidence": {
    "build_log": [],
    "screenshots": [],
    "audit_reports": [],
    "deploy_receipt": null
  },
  "luc_budget": {
    "estimated_cost_usd": 4.50,
    "estimated_tokens": 400000,
    "actual_cost_usd": 0,
    "actual_tokens": 0
  },
  "timing": {
    "created_at": "2026-02-21T00:00:00Z",
    "started_at": null,
    "completed_at": null,
    "timeout_seconds": 1800
  },
  "signed_by": null
}
```

---

## Scope Tiers

Buildsmith auto-detects the scope tier from the creative brief and adjusts the pipeline:

### Tier 1: Component (Smallest)
- Single component or pattern
- No full project scaffold needed
- IMAGE: minimal (maybe an icon)
- INTERFACE: single .tsx file
- INTEGRATIONS: none
- Example: "Build me an animated pricing table"

### Tier 2: Page (Medium)
- One or more pages within an existing project or new single-page site
- IMAGE: color palette, hero image, icons
- INTERFACE: layout + components + animations
- INTEGRATIONS: Git only (no database, no auth)
- Example: "Build me a portfolio landing page with scroll animations"

### Tier 3: Application (Full)
- Multi-page application with backend
- IMAGE: full brand assets
- INTERFACE: multiple pages, component library, design system
- INTEGRATIONS: database, auth, API, deployment, monitoring
- Example: "Build me an e-commerce store with user accounts and Stripe checkout"

### Tier 4: Platform (Enterprise)
- Multi-tenant application with advanced requirements
- IMAGE: full brand system, multi-theme
- INTERFACE: design system, admin panel, user-facing app
- INTEGRATIONS: database, auth, payments, email, search, real-time, CI/CD, monitoring
- Example: "Build me a SaaS dashboard platform with team management and billing"

---

## Error Recovery

### Build Failures
```
IF scaffold_fails:
  → Retry with clean directory
  → If second failure: escalate to Forge_Ang

IF component_generation_fails:
  → Simplify component (remove animation, reduce complexity)
  → If still fails: generate placeholder + log issue

IF sandbox_crashes:
  → Spin up new sandbox
  → Restore from last checkpoint (Git commit)
  → Resume from last successful phase

IF deploy_fails:
  → Check build output for errors
  → Fix errors and retry
  → If persistent: try alternative deploy target
  → If still fails: deliver source code + deploy instructions

IF lighthouse_under_target:
  → Identify bottlenecks (images, JS bundle, render-blocking)
  → Apply targeted optimizations
  → Re-audit (max 3 optimization rounds)
```

### Iteration Limits
- Max 10 iterations per user review cycle
- After 10 iterations: require explicit user confirmation to continue
- Max 3 major scope changes per build (prevent scope creep)
- If budget exceeds LUC estimate by 150%: pause and notify ACHEEVY

---

## Evidence Gates

Every phase produces evidence that must pass before the next phase begins:

| Phase | Required Evidence | Pass Criteria |
|-------|------------------|---------------|
| IMAGE | Asset catalog JSON + optimized files | All assets < size limits, alt text present, contrast checks pass |
| INTERFACE: Scaffold | package.json + tsconfig + project structure | `npm install` succeeds, TypeScript compiles |
| INTERFACE: Components | .tsx files + test files | All components render, tests pass, ESLint clean |
| INTERFACE: Preview | Screenshot + preview URL | Page renders without console errors |
| INTERFACE: Polish | Lighthouse report + a11y report | Performance > 90, Accessibility > 95 |
| INTEGRATIONS: Git | Repository URL | Clean history, .gitignore correct, no secrets committed |
| INTEGRATIONS: Database | Prisma schema + migration log | Migrations run, seed data loads |
| INTEGRATIONS: Deploy | Live URL + deploy receipt | Site loads, SSL valid, no errors |
| VERIFICATION | Full audit report | All checks pass or documented exceptions |
| SIGN | Buildsmith attestation | `<!-- Buildsmith -->` present, all evidence attached |

---

## Cost Estimation Model

| Scope Tier | Estimated LUC Cost | Estimated Tokens | Estimated Time |
|-----------|-------------------|-----------------|----------------|
| Tier 1: Component | $0.25 - $0.75 | 25K - 75K | 2-5 min |
| Tier 2: Page | $1.00 - $3.00 | 100K - 300K | 5-15 min |
| Tier 3: Application | $3.00 - $8.00 | 300K - 800K | 15-45 min |
| Tier 4: Platform | $8.00 - $20.00 | 800K - 2M | 45-120 min |

Cost includes: LLM calls for code generation, image generation API calls, sandbox compute time.
Does NOT include: third-party service costs (Stripe fees, hosting, domain registration).

---

## Security Constraints

- Sandbox is ephemeral — destroyed after build completes
- No user secrets stored in the sandbox filesystem
- Environment variables injected at deploy time, never at build time
- All generated code is scanned for common vulnerabilities (injection, XSS, SSRF)
- No `eval()`, no `dangerouslySetInnerHTML` without sanitization
- CORS configured per-route, never `*` in production
- CSP headers generated and applied automatically
- Rate limiting on all API routes
- Input validation on all forms and API endpoints (Zod schemas)
