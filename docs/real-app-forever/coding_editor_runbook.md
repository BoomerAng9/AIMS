# A.I.M.S. Coding Editor Runbook

> Step-by-step instructions for a coding editor (human or AI) to close every gap identified in the audit. Each task is self-contained with file paths, expected changes, and verification steps.

**Version**: 1.0.0
**Last Updated**: 2026-02-07
**Priority Legend**: P0 (critical) → P1 (high) → P2 (medium) → P3 (low)

---

## P0 — Critical (Fix Before Production)

### GAP-001: Remove Debug/Test API Endpoints

**Problem**: `/api/test/e2b` and `/api/test/groq` expose debug functionality in production.

**Files to modify**:
- `frontend/app/api/test/e2b/route.ts`
- `frontend/app/api/test/groq/route.ts`

**Action**: Gate behind NODE_ENV check or delete entirely.

```typescript
// Option A: Gate behind environment check (add to top of each route)
if (process.env.NODE_ENV === 'production') {
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}

// Option B: Delete the files entirely (preferred)
// rm frontend/app/api/test/e2b/route.ts
// rm frontend/app/api/test/groq/route.ts
```

**Verify**: `curl https://aims.plugmein.cloud/api/test/e2b` → 404

---

### GAP-002: Add React Error Boundaries

**Problem**: No `error.tsx` files in app router. Unhandled errors show raw error page.

**Files to create**:
- `frontend/app/error.tsx` (root error boundary)
- `frontend/app/dashboard/error.tsx` (dashboard error boundary)

**Action**: Create error boundary components.

```typescript
// frontend/app/error.tsx
'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
      <div className="text-center max-w-md mx-auto p-8">
        <h2 className="text-2xl font-bold text-white mb-4">Something went wrong</h2>
        <p className="text-gray-400 mb-6">
          An unexpected error occurred. Our team has been notified.
        </p>
        <button
          onClick={reset}
          className="px-6 py-3 bg-amber-500 text-black font-semibold rounded-lg hover:bg-amber-400 transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
```

**Verify**: Temporarily throw an error in a dashboard page → error boundary catches it.

---

### GAP-003: Add Resource Limits to Frontend and Gateway

**Problem**: Frontend and UEF Gateway containers have no CPU/memory limits.

**File to modify**: `infra/docker-compose.prod.yml`

**Action**: Add deploy.resources.limits to frontend and uef-gateway services.

```yaml
# Add to frontend service:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '0.5'
          memory: 512M

# Add to uef-gateway service:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 1G
        reservations:
          cpus: '0.25'
          memory: 256M
```

**Verify**: `docker stats` shows memory limits applied.

---

## P1 — High (Fix Within 1 Sprint)

### GAP-004: Create User Database Schema

**Problem**: No persistent user/profile storage. NextAuth JWT only stores session.

**Files to create/modify**:
- `frontend/lib/db/schema.ts` — Define user table
- `frontend/lib/db/index.ts` — SQLite connection (matching UEF gateway pattern)

**Action**: Add a users table with basic profile fields.

```typescript
// frontend/lib/db/schema.ts
export const SCHEMA = `
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    role TEXT DEFAULT 'USER',
    avatar_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
`;
```

**Verify**: After sign-in, user record appears in SQLite DB. Profile edits persist across sessions.

---

### GAP-005: Frontend Component Tests

**Problem**: Zero test coverage for 49 frontend components.

**Files to create**:
- `frontend/jest.config.ts` or `frontend/vitest.config.ts`
- `frontend/__tests__/` directory with initial tests

**Action**: Configure Vitest (recommended for Next.js 14) and write tests for critical flows.

```bash
# Install test dependencies
cd frontend
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

Priority test files to create:
1. `frontend/__tests__/api/health.test.ts` — Health endpoint returns 200
2. `frontend/__tests__/api/luc.test.ts` — LUC billing operations
3. `frontend/__tests__/components/sign-in.test.tsx` — Sign-in form renders and validates
4. `frontend/__tests__/components/acheevy-chat.test.tsx` — Chat sends messages

**Verify**: `npm test` passes with >= 10 tests covering critical paths.

---

### GAP-006: Database Backup Automation

**Problem**: No automated backup strategy for SQLite (UEF) or file-based (LUC) data.

**Files to create**:
- `scripts/backup.sh`
- Crontab entry on VPS

**Action**:

```bash
#!/bin/bash
# scripts/backup.sh
set -euo pipefail

BACKUP_DIR="/root/aims/backups/$(date +%Y-%m-%d)"
mkdir -p "$BACKUP_DIR"

# SQLite backup (UEF Gateway)
docker cp aims-uef-gateway-1:/app/data/aims.db "$BACKUP_DIR/uef-gateway.db"

# LUC data backup
docker cp aims-frontend-1:/app/data/ "$BACKUP_DIR/luc-data/"

# Redis backup
docker exec aims-redis-1 redis-cli -a "$REDIS_PASSWORD" BGSAVE
sleep 2
docker cp aims-redis-1:/data/dump.rdb "$BACKUP_DIR/redis.rdb"

# Compress
tar -czf "$BACKUP_DIR.tar.gz" "$BACKUP_DIR"
rm -rf "$BACKUP_DIR"

# Retain last 30 days
find /root/aims/backups/ -name "*.tar.gz" -mtime +30 -delete

echo "[BACKUP] Completed: $BACKUP_DIR.tar.gz"
```

```bash
# Add to VPS crontab
0 3 * * * /root/aims/scripts/backup.sh >> /var/log/aims-backup.log 2>&1
```

**Verify**: Run backup.sh manually → tar.gz created with all data files.

---

### GAP-007: Set Up Error Tracking (Sentry)

**Problem**: No error tracking or APM. Production errors go unnoticed.

**Files to modify**:
- `frontend/package.json` — Add @sentry/nextjs
- `frontend/sentry.client.config.ts` — Client-side config
- `frontend/sentry.server.config.ts` — Server-side config
- `frontend/next.config.mjs` — Wrap with Sentry

**Action**:

```bash
cd frontend
npx @sentry/wizard@latest -i nextjs
```

Then configure DSN from Sentry dashboard. Set `SENTRY_DSN` in .env.production.

**Verify**: Throw test error → appears in Sentry dashboard within 30 seconds.

---

### GAP-008: Implement Password Recovery Flow

**Problem**: Forgot-password UI exists but no backend handler.

**Files to create**:
- `frontend/app/api/auth/forgot-password/route.ts`
- `frontend/app/api/auth/reset-password/route.ts`

**Action**: Implement email-based password reset using a time-limited token.

Key steps:
1. Generate random token, store with expiry in users table
2. Send email via Resend/SendGrid/SES with reset link
3. Reset endpoint validates token, updates password hash
4. Invalidate token after use

**Verify**: Request reset → receive email → click link → set new password → log in with new password.

---

## P2 — Medium (Fix Within 2 Sprints)

### GAP-009: Complete Stub Dashboard Pages

**Problem**: 9 dashboard pages are stubs (admin, boomerangs, build, chat, circuit-box, environments, house-of-ang, lab, pipelines).

**Priority order** (based on user-facing impact):
1. `/dashboard/chat` — Core feature, should replicate ACHEEVY chat in simplified form
2. `/dashboard/build` — Project build status and logs
3. `/dashboard/pipelines` — Pipeline visualization
4. `/dashboard/environments` — Environment management
5. `/dashboard/admin` — Admin panel (owner-only)
6. `/dashboard/boomerangs` — Agent management
7. `/dashboard/house-of-ang` — Registry
8. `/dashboard/circuit-box` — Integration management
9. `/dashboard/lab` — Experimental features

**Action per page**:
1. Design data model (what does this page show?)
2. Create API route if needed
3. Build component with loading/empty/error states
4. Wire to real data source
5. Add to navigation

**Verify**: Each page renders with real data, handles all states, and is accessible from sidebar navigation.

---

### GAP-010: Complete Stub API Routes

**Problem**: 5 API routes are stubs/incomplete (diy, admin/api-keys, boomerangs, deploy, invite, make-it-mine).

**Priority order**:
1. `/api/deploy` — Core feature for project deployment
2. `/api/boomerangs` — Agent listing (replace mock data with real)
3. `/api/admin/api-keys` — Admin API key management
4. `/api/invite` — Team invitation system
5. `/api/acheevy/diy` — DIY mode
6. `/api/make-it-mine` — Customization

**Action per route**:
1. Define request/response schema
2. Implement with real data source (SQLite or API call)
3. Add input validation
4. Add auth check
5. Add rate limiting
6. Write integration test

**Verify**: Each route responds with real data, validates input, and requires auth.

---

### GAP-011: API Documentation (OpenAPI)

**Problem**: No API documentation for 32 endpoints.

**Files to create**:
- `docs/openapi.yaml` — OpenAPI 3.0 spec
- Or integrate `next-swagger-doc` package

**Action**: Document all API routes with request/response schemas.

```yaml
openapi: 3.0.3
info:
  title: A.I.M.S. API
  version: 1.0.0
paths:
  /api/health:
    get:
      summary: Health check
      responses:
        '200':
          description: System healthy
          content:
            application/json:
              schema:
                type: object
                properties:
                  status: { type: string, enum: [healthy, degraded, unhealthy] }
                  services: { type: array }
  # ... all 32 routes
```

**Verify**: OpenAPI spec validates with `swagger-cli validate docs/openapi.yaml`.

---

### GAP-012: Rollback Procedure Documentation

**Problem**: No documented rollback procedure for failed deployments.

**File to create**: `docs/deployment-runbook.md`

**Action**: Document step-by-step procedures for:
1. Normal deployment (current flow via deploy.sh)
2. Rollback to previous version (docker tag + compose restart)
3. Emergency rollback (full stack down + restore from backup)
4. Service-specific restart (single container)
5. Database migration rollback

**Verify**: New team member can follow runbook to perform rollback without assistance.

---

### GAP-013: Uptime Monitoring

**Problem**: No external monitoring or alerting for service outages.

**Options** (pick one):
- UptimeRobot (free tier: 50 monitors, 5-min interval)
- Better Uptime
- Grafana Cloud free tier

**Action**: Configure monitoring for:
1. `https://aims.plugmein.cloud/api/health` — Full stack health
2. `https://aims.plugmein.cloud` — Frontend availability
3. VPS SSH port (optional)

**Verify**: Take frontend down → alert triggered within 5 minutes.

---

## P3 — Low (Backlog)

### GAP-014: Add Loading States to Dashboard Pages

**Files to create**: `frontend/app/dashboard/loading.tsx` + per-route loading.tsx

### GAP-015: Client-Side Form Validation with Zod

**Action**: Wire up Zod schemas (already in deps) with react-hook-form.

### GAP-016: Accessibility Audit (ARIA Attributes)

**Action**: Run Lighthouse, fix accessibility issues, add ARIA labels.

### GAP-017: Data Retention Policy Documentation

**File to create**: `docs/data-retention.md`

### GAP-018: PII Handling Documentation

**File to create**: `docs/pii-handling.md`

### GAP-019: Architecture Decision Records

**File to create**: `docs/adr/` directory with decision records.

### GAP-020: Log Aggregation Setup

**Action**: Configure Grafana Loki or similar for centralized log collection.

### GAP-021: Incident Response Plan

**File to create**: `docs/incident-response.md`

### GAP-022: Redis-Backed Rate Limiting

**Action**: Replace in-memory rate limit store with Redis for scalability.

### GAP-023: Unified Database Strategy

**Action**: Evaluate consolidating SQLite + file-based + PostgreSQL into single strategy.

---

## Execution Order

For maximum impact with minimum effort, execute in this order:

1. **GAP-001** (5 min) — Remove debug endpoints
2. **GAP-002** (15 min) — Add error boundaries
3. **GAP-003** (5 min) — Add container resource limits
4. **GAP-006** (30 min) — Backup automation
5. **GAP-007** (30 min) — Sentry error tracking
6. **GAP-004** (1 hr) — User database schema
7. **GAP-005** (2 hr) — Frontend test framework + initial tests
8. **GAP-013** (15 min) — Uptime monitoring
9. **GAP-012** (30 min) — Rollback documentation
10. **GAP-008** (2 hr) — Password recovery
11. **GAP-010** (4 hr) — Complete stub API routes
12. **GAP-009** (8 hr) — Complete stub dashboard pages
13. **GAP-011** (2 hr) — API documentation

**Estimated total effort**: ~22 hours for P0-P2 items
