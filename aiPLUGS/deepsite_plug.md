# DeepSite v4 — AI Website Builder Plug

## Overview

DeepSite v4 is a "vibe-coding platform" by Hugging Face (enzostvs) that generates complete
websites and web apps from natural language prompts. It's the open-source alternative to v0.dev,
built on open-source LLMs and the HF ecosystem.

**License:** MIT
**Source:** https://huggingface.co/spaces/enzostvs/deepsite

## What It Does

- Generate full websites/apps from text prompts (landing pages, dashboards, games, portfolios)
- Chat-based iterative coding — describe changes, see live preview, refine via follow-ups
- Multi-file project support — `index.html`, `style.css`, `script.js`, component files
- SEARCH/REPLACE editing — incremental updates instead of full file rewrites
- Website redesign from URL — paste a URL, DeepSite fetches it via Jina Reader and rebuilds it
- Custom image upload for generated projects
- Auto-deploy to Hugging Face Spaces (static HTML)
- Project download as ZIP
- Model/dataset mentions — reference HF repos in prompts for context

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Framework | Next.js 16 (App Router) |
| Runtime | Node.js 20 (Alpine Docker) |
| Package Manager | pnpm |
| UI | Tailwind CSS 4, Radix UI, shadcn/ui, Framer Motion 12 |
| Code Editor | Monaco Editor |
| Live Preview | CodeSandbox Sandpack |
| Auth | NextAuth v4 with Hugging Face OAuth |
| Database | MongoDB (Mongoose 9) |
| AI Inference | HF Inference Router (multi-provider) |

## Supported Models

| Model | Providers | Notes |
|-------|-----------|-------|
| Kimi K2.5 | together, novita, groq | Default, "Best Seller" |
| DeepSeek V3 0324 | fireworks-ai, nebius, sambanova, novita, hyperbolic | "Best Seller" |
| DeepSeek V3.2 | (default) | — |
| Qwen3 Coder Next | novita, hyperbolic | — |
| GLM-4.7 | (default) | — |
| MiniMax M2.1 | (default) | Custom sampling params |

## Docker Deployment

```dockerfile
FROM node:20-alpine
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /usr/src/app
COPY package.json pnpm-lock.yaml ./
COPY . .
RUN pnpm install
RUN pnpm run build
EXPOSE 3001
CMD ["pnpm", "start"]
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `AUTH_HUGGINGFACE_ID` | Yes | HF OAuth App ID |
| `AUTH_HUGGINGFACE_SECRET` | Yes | HF OAuth App Secret |
| `AUTH_SECRET` | Yes | NextAuth session secret |
| `NEXTAUTH_URL` | Yes | Public URL (e.g., `https://deepsite.plugmein.cloud`) |
| `MONGODB_URI` | Optional | MongoDB for project persistence |

## How Inference Works

DeepSite uses the **user's own Hugging Face token** for inference. When deployed as a Plug:

1. User authenticates via HF OAuth
2. Their HF access token is used with `@huggingface/inference`
3. Inference routes through `router.huggingface.co` to the selected provider
4. Cost is billed to the user's HF account (HF Pro recommended for heavy usage)
5. Max tokens per generation: 16,000

This means the Plug itself has **zero inference cost** — users bring their own HF credits.

## AIMS Integration Notes

### Port Allocation
- Internal port: 3001
- External: Auto-allocated in 51000+ range by Plug Spin-Up engine

### Nginx Reverse Proxy
Standard AIMS plug proxy config with WebSocket support for live preview.

### Health Check
- Endpoint: `/api/healthcheck`
- Interval: 30s

### Dependencies
- MongoDB (optional — can deploy a sidecar or use AIMS shared MongoDB)
- No GPU required
- No Redis required

### Customizations
- Default LLM model selection
- Auto-deploy toggle (deploy generated sites as HF Spaces)

## Plug Export Bundle

When exported for self-hosting:
- `docker-compose.yml` — DeepSite + MongoDB sidecar
- `.env.example` — Required HF OAuth credentials
- `nginx.conf` — Reverse proxy with WebSocket support
- `setup.sh` — One-click setup script
- `healthcheck.sh` — Health monitoring
- `README.md` — Setup instructions

## Category

**Code Execution / Web Development** — sits alongside tools like II-Agent and Bolt.
