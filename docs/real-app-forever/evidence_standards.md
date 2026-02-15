# A.I.M.S. Evidence Standards

> Defines what constitutes acceptable evidence for each gap audit category. Used by auditors and coding editors to verify that fixes meet the "Real App Forever" standard.

**Version**: 1.0.0
**Last Updated**: 2026-02-07

---

## 1. Authentication & Authorization

### What "PASS" Looks Like

**Session Management**
```
Evidence: Screenshot or curl showing NextAuth session cookie set with correct expiry.
File: frontend/lib/auth.ts
Verification: JWT decoded shows { role: "OWNER"|"USER", exp: <30d from now> }
```

**Protected Routes**
```
Evidence: curl -X POST /api/luc without Authorization header → 401 response
Evidence: curl -X POST /api/luc with valid session → 200 response
File: Each API route handler imports getServerSession()
```

**Owner Enforcement**
```
Evidence: Non-owner email session cannot access /api/admin/* → 403
File: frontend/lib/auth.ts — OWNER_EMAILS array checked in authorize()
```

**Password Recovery**
```
Evidence: User clicks "Forgot Password" → receives email → resets password → can log in
Files: frontend/app/(auth)/forgot-password/page.tsx + /api/auth/reset-password/route.ts
```

---

## 2. Data Persistence

### What "PASS" Looks Like

**Durable Storage**
```
Evidence: docker restart aims-frontend-1 → LUC account data persists
File: frontend/lib/luc/server-storage.ts writes to /app/data/*.json
Verification: Volume mount confirmed in docker-compose.prod.yml
```

**Database Migrations**
```
Evidence: alembic upgrade head runs without error; alembic history shows all 15 migrations
File: backend/ii-agent/src/ii_agent/migrations/versions/
Verification: SELECT * FROM alembic_version returns latest revision
```

**Backup Strategy**
```
Evidence: Cron job runs daily at 03:00 UTC; backup file appears in /backups/
Evidence: Restore procedure documented and tested (restore from backup → data intact)
File: scripts/backup.sh + crontab entry
```

---

## 3. API Routes

### What "PASS" Looks Like

**Functional Route**
```
Evidence: curl -X POST /api/luc -H "Content-Type: application/json" -d '{"op":"quote","service":"brave_search","units":5}' → { "cost": 0.002, ... }
Verification: Response matches expected schema; status 200
```

**Input Validation**
```
Evidence: curl -X POST /api/luc -d '{"op":"<script>alert(1)</script>"}' → 400 { "error": "Invalid operation" }
Evidence: curl -X POST /api/chat -d '' → 400 { "error": "Missing required field: message" }
File: Route handler calls validateInput() before processing
```

**Consistent Error Format**
```
All error responses follow: { "error": string, "code"?: string, "details"?: object }
Status codes: 400 (bad request), 401 (unauthorized), 403 (forbidden), 404 (not found), 429 (rate limited), 500 (internal)
```

**No Debug Endpoints in Production**
```
Evidence: /api/test/* routes return 404 in production
Verification: Routes gated by NODE_ENV !== 'production' or removed entirely
```

---

## 4. Frontend Components

### What "PASS" Looks Like

**Functional Page**
```
Evidence: Page renders with real data (not "Lorem ipsum" or "Coming soon")
Evidence: All interactive elements (buttons, forms, links) produce expected behavior
Evidence: Page handles loading state, empty state, and error state
```

**Error Boundary**
```
Evidence: Throw error in child component → error.tsx catches it → shows user-friendly message with "Try Again" button
File: frontend/app/dashboard/error.tsx (or per-route error.tsx)
```

**Form Validation**
```
Evidence: Submit empty required field → inline error message appears
Evidence: Submit invalid email → "Invalid email" shown before form submits
File: Zod schema defined and applied via react-hook-form or similar
```

**Accessibility**
```
Evidence: Lighthouse accessibility score >= 90
Evidence: Tab navigation works through all interactive elements
Evidence: Screen reader announces all form labels and error messages
```

---

## 5. Testing

### What "PASS" Looks Like

**Unit Test**
```
Evidence: npm test runs 50+ tests; all pass; coverage >= 60%
File: *.test.ts files adjacent to source files
Verification: CI log shows test step passed
```

**Integration Test**
```
Evidence: API route tests make real HTTP requests to test server
Evidence: Tests cover success, validation error, auth error, and server error cases
File: frontend/app/api/**/*.test.ts or __tests__/ directories
```

**E2E Test**
```
Evidence: Playwright/Cypress test navigates sign-in → dashboard → chat → send message → receive response
File: e2e/ or tests/e2e/ directory with *.spec.ts files
Verification: CI runs E2E tests in headless mode
```

**Coverage Reporting**
```
Evidence: npm run test:coverage generates HTML report
Evidence: Coverage thresholds enforced in jest.config.ts or vitest.config.ts
Minimum thresholds: statements 60%, branches 50%, functions 60%, lines 60%
```

---

## 6. Security

### What "PASS" Looks Like

**CSP Headers**
```
Evidence: curl -I https://aims.plugmein.cloud → Content-Security-Policy header present
Verification: No 'unsafe-eval' except where explicitly justified (Next.js requirement)
```

**Rate Limiting**
```
Evidence: Send 31 requests to /api/chat in 60 seconds → 429 Too Many Requests
Verification: Rate limit store persists across requests (in-memory or Redis)
```

**Bot Detection**
```
Evidence: curl -A "sqlmap/1.0" https://aims.plugmein.cloud/api/health → 403
Evidence: Normal browser request → 200
```

**Network Segmentation**
```
Evidence: docker exec aims-agent-zero-1 ping 8.8.8.8 → fails (sandbox-network is internal)
Evidence: docker exec aims-agent-zero-1 curl http://uef-gateway:3001 → fails (not on aims-network)
Evidence: docker exec aims-agent-bridge-1 curl http://agent-zero:80 → succeeds (bridges both networks)
```

**Payment Blocking**
```
Evidence: Agent sends request with op="payment" through agent-bridge → 403 BLOCKED
Evidence: Agent sends request with op="search" → proxied to UEF gateway successfully
File: infra/agent-bridge/index.ts — BLOCKED_OPS array
```

---

## 7. Deployment

### What "PASS" Looks Like

**Health Checks**
```
Evidence: docker ps shows all 7 services as (healthy)
Evidence: curl http://127.0.0.1/api/health → { "status": "healthy", "services": [...] }
Verification: Unhealthy service auto-restarts within 90 seconds
```

**CI/CD Pipeline**
```
Evidence: Push to main → Cloud Build triggered → images built → pushed to Artifact Registry → deployed to VPS
File: cloudbuild.yaml — 5 build steps
Verification: gcloud builds list shows successful runs
```

**Rollback**
```
Evidence: Previous image tags preserved in Artifact Registry
Evidence: Documented procedure: docker compose down → docker tag <previous> → docker compose up
Verification: Rollback tested end-to-end in staging
```

**Resource Limits**
```
Evidence: docker stats shows memory usage within configured limits
File: docker-compose.prod.yml — deploy.resources.limits for each service
Verification: OOM-killed container auto-restarts (restart: always)
```

---

## 8. Documentation

### What "PASS" Looks Like

**API Documentation**
```
Evidence: /api-docs or separate docs site shows all endpoints with request/response schemas
Format: OpenAPI 3.0 YAML/JSON or equivalent
Coverage: All 32 API routes documented
```

**Deployment Runbook**
```
Evidence: New engineer can follow runbook to deploy from scratch
Sections: Prerequisites, SSH access, Docker setup, env configuration, deploy, verify, rollback
File: docs/deployment-runbook.md
```

**Incident Response**
```
Evidence: Document covers: detection → triage → fix → post-mortem
Sections: On-call contacts, escalation paths, common issues + fixes, service restart procedures
File: docs/incident-response.md
```

---

## Verification Methodology

1. **Automated**: CI/CD tests, Docker health checks, Lighthouse scores
2. **Manual**: curl commands, browser testing, SSH verification
3. **Periodic**: Monthly re-audit using gap_audit_checklist.md
4. **Evidence Artifacts**: Screenshots, terminal output, test reports stored in `docs/evidence/`
