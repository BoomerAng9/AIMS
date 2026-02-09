# PlugMeIn.Cloud Integration Plan

**Document Version:** 1.0
**Created:** 2026-02-09
**Status:** Active

---

## Domain Architecture

```
plugmein.cloud (Root Domain)
├── aims.plugmein.cloud      → Main A.I.M.S. Frontend (Vercel)
├── api.aims.plugmein.cloud  → API Gateway
├── luc.plugmein.cloud       → LUC Billing Service
└── www.plugmein.cloud       → Marketing/Landing Page
```

---

## Current Integration Points

### 1. Frontend (Next.js on Vercel)

| File | Purpose |
|------|---------|
| `vercel.json` | Sets `NEXT_PUBLIC_APP_URL=https://aims.plugmein.cloud` |
| `middleware.ts` | CORS origins for all plugmein subdomains |
| `lib/security/config.ts` | CSP headers allowing plugmein endpoints |
| `app/layout.tsx` | `metadataBase` fallback to plugmein.cloud |

### 2. LUC SDK (`@plugmein/luc-sdk`)

**Package:** `packages/luc-sdk/`
**npm:** `@plugmein/luc-sdk`
**Homepage:** https://luc.plugmein.cloud

Features:
- Usage tracking & quota management
- Cost estimation with 8 industry presets
- Framework-agnostic (works with any JS/TS project)

### 3. n8n Bridge

**File:** `frontend/lib/n8n-bridge.ts`

Connects AIMS to remote n8n workflow automation instance for:
- PMO task routing
- Boomer_Ang orchestration
- Webhook integrations

### 4. II-Agent (ACHEEVY Desktop)

**File:** `backend/ii-agent/frontend/src-tauri/tauri.conf.json`

```json
"identifier": "cloud.plugmein.acheevy"
```

Tauri desktop app for local ACHEEVY instance.

### 5. Remotion Video Compositions

**Files:**
- `frontend/remotion/compositions/PlugMeIn.tsx`
- `frontend/remotion/Root.tsx`
- `frontend/components/landing/HeroPlayer.tsx`

Animated hero video for marketing.

---

## Integration Plan

### Phase 1: DNS & SSL Configuration

**Status:** ⚠️ Needs Attention

From `docs/real-app-forever/aims_project_sop.md`:
> No SSL/TLS certificate on plugmein.cloud | P1 | HTTPS returns empty; certbot needs domain config

**Actions:**
1. [ ] Configure DNS A/CNAME records for all subdomains
2. [ ] Set up SSL certificates via Certbot or Cloudflare
3. [ ] Verify HTTPS works for all endpoints

```bash
# Expected DNS Configuration
aims.plugmein.cloud      → Vercel CNAME (cname.vercel-dns.com)
api.aims.plugmein.cloud  → Backend server IP or load balancer
luc.plugmein.cloud       → LUC service endpoint
www.plugmein.cloud       → Redirect to aims.plugmein.cloud
```

### Phase 2: Environment Variables

**Required `.env.local` for local development:**

```env
# Domain
NEXT_PUBLIC_APP_URL=https://aims.plugmein.cloud
NEXTAUTH_URL=https://aims.plugmein.cloud

# API Endpoints
NEXT_PUBLIC_API_URL=https://api.aims.plugmein.cloud
NEXT_PUBLIC_LUC_URL=https://luc.plugmein.cloud

# n8n Integration
N8N_WEBHOOK_URL=https://n8n.plugmein.cloud/webhook
N8N_API_KEY=<your-n8n-api-key>

# Auth
NEXTAUTH_SECRET=<generate-secret>
```

### Phase 3: Security Headers

**Current CSP in `middleware.ts`:**

```typescript
allowedOrigins: [
  'https://aims.plugmein.cloud',
  'https://www.aims.plugmein.cloud',
  'https://api.aims.plugmein.cloud',
  'https://luc.plugmein.cloud',
]
```

**Recommended additions:**
- Add `wss://` for WebSocket connections
- Add n8n webhook URL if using external n8n

### Phase 4: Service Deployment

| Service | Platform | Status |
|---------|----------|--------|
| AIMS Frontend | Vercel | ✅ Ready |
| LUC Service | TBD (Cloud Run/Vercel) | ⏳ Pending |
| n8n Workflows | Self-hosted/n8n.cloud | ⏳ Pending |
| II-Agent Backend | Docker/Cloud Run | ⏳ Pending |

### Phase 5: LUC SDK Publishing

```bash
cd packages/luc-sdk
npm run build
npm run test
npm publish --access public
```

**Registry:** npmjs.com as `@plugmein/luc-sdk`

---

## Integration Checklist

### DNS & Infrastructure
- [ ] Configure `aims.plugmein.cloud` DNS
- [ ] Configure `api.aims.plugmein.cloud` DNS
- [ ] Configure `luc.plugmein.cloud` DNS
- [ ] Set up SSL certificates
- [ ] Verify all HTTPS endpoints respond

### Frontend
- [ ] Update `vercel.json` if domain changes
- [ ] Verify CORS origins in `middleware.ts`
- [ ] Test OAuth callbacks with production URL
- [ ] Verify CSP headers don't block legitimate requests

### Backend Services
- [ ] Deploy LUC service
- [ ] Configure n8n workflows
- [ ] Set up API gateway routing
- [ ] Configure rate limiting

### SDK
- [ ] Build and test `@plugmein/luc-sdk`
- [ ] Publish to npm
- [ ] Update documentation

---

## Service Communication Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    User Browser                              │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│              aims.plugmein.cloud (Vercel)                   │
│                    Next.js Frontend                          │
└─────────────────────┬───────────────────────────────────────┘
                      │
         ┌────────────┼────────────┬────────────┐
         ▼            ▼            ▼            ▼
┌─────────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐
│ api.aims.*  │ │ luc.*    │ │ n8n      │ │ External APIs│
│ (API GW)    │ │ (Billing)│ │ (Workflows)│ │ (OpenRouter) │
└─────────────┘ └──────────┘ └──────────┘ └──────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│                    Boomer_Ang Agents                         │
│              (Shopping, Research, Automation)                │
└─────────────────────────────────────────────────────────────┘
```

---

## Quick Start for Local Development

```bash
# 1. Clone and install
git clone https://github.com/BoomerAng9/AIMS.git
cd AIMS/frontend
npm install

# 2. Create .env.local
cat > .env.local << 'EOF'
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=dev-secret-change-in-production
EOF

# 3. Run development server
npm run dev

# 4. Access at http://localhost:3000
```

---

## Production Deployment

### Vercel (Recommended for Frontend)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd frontend
vercel --prod

# Set environment variables in Vercel Dashboard:
# - NEXT_PUBLIC_APP_URL
# - NEXTAUTH_URL
# - NEXTAUTH_SECRET
# - All API keys
```

### Docker (Self-hosted)

```bash
# Build
docker build -t aims-frontend:latest ./frontend

# Run
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_APP_URL=https://aims.plugmein.cloud \
  aims-frontend:latest
```

---

## Contacts

- **Domain Admin:** admin@plugmein.cloud
- **Security:** security@plugmein.cloud
- **Development:** dev@plugmein.cloud

---

*Last updated: 2026-02-09*
