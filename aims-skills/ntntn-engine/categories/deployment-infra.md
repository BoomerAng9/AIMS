# NtNtN Engine — Category 10: Deployment & Infrastructure

> How it ships and runs in production.

---

## Docker

### Overview
Container runtime for reproducible environments. Package application + dependencies
into a portable container that runs identically everywhere.

- **Current:** Docker Engine 27+, Docker Compose 2.x
- **A.I.M.S. Status:** Default deployment method (Docker Compose on VPS)

### Key Patterns

#### Multi-Stage Dockerfile (Next.js)
```dockerfile
# Build stage
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

#### Docker Compose
```yaml
version: '3.8'
services:
  frontend:
    build: ./frontend
    ports: ["3000:3000"]
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/app
    depends_on: [db]

  db:
    image: postgres:16-alpine
    volumes: ["pgdata:/var/lib/postgresql/data"]
    environment:
      POSTGRES_DB: app
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass

volumes:
  pgdata:
```

### Picker_Ang Notes
- **A.I.M.S. default** — all services deployed via Docker Compose
- Choose when: Multi-service architectures, consistent environments, self-hosted
- Avoid when: Serverless-first (Vercel/Cloudflare handle containers internally)

---

## Vercel

### Overview
Frontend cloud platform created by the Next.js team. Zero-config deployments,
preview URLs on every PR, edge functions, built-in analytics.

- **Current:** Vercel (latest platform)
- **Optimized for:** Next.js (but supports any framework)
- **Features:** Preview deploys, Edge Middleware, ISR, Analytics, Speed Insights

### Key Patterns

#### Automatic Deployment
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel deploy          # Preview deployment
vercel deploy --prod   # Production deployment
```

#### Environment Variables
```bash
vercel env add DATABASE_URL production
vercel env add STRIPE_KEY production preview
```

#### Git Integration
- Push to `main` → automatic production deploy
- Push to any branch → automatic preview URL
- PR comments with preview link and Lighthouse scores

### Picker_Ang Notes
- Choose when: Next.js project, want zero-config deployment, client needs preview URLs
- Avoid when: Self-hosted required, cost-sensitive at scale, non-JS backends

---

## Cloudflare

### Overview
Edge compute + CDN + DNS + storage. The closest-to-user infrastructure.
Workers, Pages, R2 (storage), D1 (SQLite at edge), KV (key-value), Queues.

- **Current:** Cloudflare latest
- **Edge Runtime:** V8 isolates (Workers), Node.js compat mode
- **Global:** 300+ data centers worldwide

### Key Services
| Service | Purpose | Use Case |
|---------|---------|----------|
| **Workers** | Edge compute | API proxies, middleware, transformations |
| **Pages** | Static + SSR hosting | Full-stack web apps |
| **R2** | S3-compatible storage | File uploads, media, backups (zero egress fees) |
| **D1** | SQLite at edge | Edge-local database |
| **KV** | Key-value store | Sessions, config, feature flags |
| **Durable Objects** | Stateful edge compute | Real-time, WebSockets, coordination |
| **Queues** | Message queues | Background jobs, event processing |

### Picker_Ang Notes
- Choose when: Edge-everything, global low-latency, static sites, zero egress costs
- Avoid when: Complex server-side rendering (Vercel better for Next.js), heavy compute

---

## Netlify

### Overview
Web platform with CI/CD, serverless functions, and forms. Strong for static sites,
JAMstack architecture, and Gatsby/Astro/Hugo deployments.

- **Current:** Netlify (latest platform)
- **Features:** Deploy previews, Functions, Edge Handlers, Identity, Forms

### Picker_Ang Notes
- Choose when: Static/JAMstack sites, built-in form handling, non-Next.js frameworks
- Avoid when: Next.js projects (Vercel is better optimized), heavy SSR

---

## AWS

### Overview
The most comprehensive cloud platform. Offers every service imaginable.
Best for enterprise-scale, regulated industries, and complex architectures.

### Key Services for Web
| Service | Purpose |
|---------|---------|
| **EC2** | Virtual servers |
| **S3** | Object storage (static assets) |
| **CloudFront** | CDN |
| **Lambda** | Serverless functions |
| **ECS/EKS** | Container orchestration |
| **RDS** | Managed databases |
| **Amplify** | Full-stack hosting (Next.js, React) |

### Picker_Ang Notes
- Choose when: Enterprise scale, AWS ecosystem, specific managed services needed
- Avoid when: Simple deployments (too much complexity), small teams

---

## GCP (Google Cloud Platform)

### Overview
Google's cloud platform. Strong in ML/AI, Kubernetes, and data analytics.
A.I.M.S. uses GCP for GPU workloads (Vertex AI) and CI/CD (Cloud Build).

- **A.I.M.S. Usage:** Cloud Build → Artifact Registry (CI), Vertex AI (GPU inference)

### Key Services
| Service | Purpose | A.I.M.S. Usage |
|---------|---------|----------------|
| **Cloud Run** | Serverless containers | Available but not primary |
| **Cloud Build** | CI/CD pipeline | Image builds on push |
| **Artifact Registry** | Docker image registry | Production images stored here |
| **Vertex AI** | ML model serving | PersonaPlex (Nemotron) |
| **GKE** | Kubernetes | Enterprise container orchestration |
| **Cloud Storage** | Object storage | Backups, ML training data |

### Picker_Ang Notes
- Choose when: ML/AI workloads, need GPU, Kubernetes, analytics pipelines
- Avoid when: Simple web hosting (Vercel/Cloudflare simpler)

---

## VPS (Self-Hosted)

### Overview
Virtual Private Server — full control over your infrastructure. Run Docker Compose,
custom services, and have complete sovereignty over your data.

- **A.I.M.S. Status:** Primary deployment target (76.13.96.107 / Hostinger)
- **Setup:** Docker Compose + nginx reverse proxy + Certbot SSL

### A.I.M.S. VPS Stack
```
┌─────────────────────────────────────┐
│  nginx (reverse proxy + SSL)         │
│  ├── frontend (Next.js)              │
│  ├── uef-gateway (Express)           │
│  ├── acheevy (AI orchestrator)       │
│  ├── house-of-ang (agent manager)    │
│  ├── redis (cache + sessions)        │
│  ├── n8n (workflow automation)        │
│  ├── agent-bridge                    │
│  ├── chickenhawk-core                │
│  ├── circuit-metrics                 │
│  └── ii-agent + tools + sandbox      │
│  SSL: Let's Encrypt via Certbot      │
└─────────────────────────────────────┘
```

### Deployment Process
```bash
# A.I.M.S. deploy script
./deploy.sh --domain plugmein.cloud --landing-domain aimanagedsolutions.cloud
```

### Picker_Ang Notes
- **A.I.M.S. default** for internal builds
- Choose when: Full control, cost-effective at scale, data sovereignty, custom services
- Avoid when: Need global edge distribution, zero-ops preference

---

## CI/CD Pipeline

### GitHub Actions (A.I.M.S. Standard)
```yaml
name: Build and Push
on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: google-github-actions/auth@v2
        with:
          credentials_json: ${{ secrets.GCP_SA_KEY }}
      - run: gcloud builds submit --config=cloudbuild.yaml
```

### Cloud Build (Image Registry)
```yaml
# cloudbuild.yaml
steps:
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'us-central1-docker.pkg.dev/$PROJECT_ID/aims/frontend', './frontend']
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'us-central1-docker.pkg.dev/$PROJECT_ID/aims/frontend']
```

---

## SSL & Domain Setup

### Certbot (A.I.M.S. Default)
```bash
# First-time cert
sudo certbot certonly --standalone -d plugmein.cloud -d www.plugmein.cloud

# Auto-renewal (cron)
0 0 1 * * certbot renew --quiet
```

### Cloudflare (Alternative)
- Free SSL with proxy enabled
- Full (strict) mode: origin cert + Cloudflare edge cert
- Zero configuration after DNS is pointed

---

## Deployment Comparison Matrix

| Platform | Best For | Scaling | SSL | CI/CD | Cost Model |
|----------|---------|---------|-----|-------|------------|
| **Docker/VPS** | Full control, internal | Manual/Docker Swarm | Certbot | GitHub Actions | Fixed monthly |
| **Vercel** | Next.js, previews | Auto | Included | Git push | Per-request |
| **Cloudflare** | Edge, static, Workers | Auto (global) | Included | Git push | Per-request (generous free) |
| **Netlify** | JAMstack, forms | Auto | Included | Git push | Per-site |
| **AWS** | Enterprise, complex | Unlimited | ACM | CodePipeline | Usage-based |
| **GCP** | ML/AI, K8s | Auto (GKE) | Managed | Cloud Build | Usage-based |

---

## A.I.M.S. Default: Docker Compose on VPS + GCP for AI

- **Internal builds:** Docker Compose on A.I.M.S. VPS (76.13.96.107)
- **Client builds:** Vercel (default) or client's preferred platform
- **AI/GPU workloads:** GCP Vertex AI
- **CI/CD:** GitHub Actions → Cloud Build → Artifact Registry
- **SSL:** Certbot (VPS) or Cloudflare (client domains)
