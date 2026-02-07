# A.I.M.S. Real App Forever — Project SOP

> Standard Operating Procedure for maintaining production-grade quality across all layers of the A.I.M.S. platform.

**Version**: 1.0.0
**Last Updated**: 2026-02-07
**Owner**: A.I.M.S. Engineering

---

## 1. Purpose

This SOP defines the minimum standards every service, route, component, and infrastructure artifact must meet before being considered "production-ready." It is the governing document for the Gap Audit Checklist, Evidence Standards, and Coding Editor Runbook that accompany it.

---

## 2. Scope

| Layer | Services |
|-------|----------|
| **Frontend** | Next.js 14 App Router (49 components, 32 API routes, 9+ dashboard pages) |
| **Gateway** | UEF Gateway (Hono.js orchestrator, 1,300+ lines) |
| **Agents** | OpenClaw (sandboxed multi-channel AI), Agent-Bridge (security gateway), II-Agent (FastAPI) |
| **Infrastructure** | Docker Compose (7 core services), nginx, Redis, Certbot, GCP Cloud Build CI/CD |
| **Billing** | LUC Engine (5 tiers, 10 service buckets, Stripe integration) |
| **Security** | Middleware WAF, agent-bridge payment blocking, iptables, SSH hardening |

---

## 3. Production Readiness Criteria

### 3.1 Authentication & Authorization
- [ ] All user-facing routes require authenticated session (NextAuth JWT)
- [ ] Owner-role enforcement on admin/sensitive endpoints
- [ ] Session expiry configured (30-day max)
- [ ] OAuth providers tested with real credentials (Google OAuth)
- [ ] Password recovery flow functional end-to-end
- [ ] API key validation on all backend-to-backend calls

### 3.2 Data Persistence
- [ ] Every stateful operation writes to durable storage (SQLite, PostgreSQL, or file-based)
- [ ] Database migrations versioned and reversible (Alembic for II-Agent)
- [ ] Backup strategy documented and automated
- [ ] Data retention policy defined
- [ ] PII handling documented (what is stored, where, how long)

### 3.3 API Contracts
- [ ] Every API route returns structured JSON with consistent error format
- [ ] Input validation on all POST/PUT/PATCH routes
- [ ] Rate limiting applied to all public endpoints
- [ ] CORS configured per environment (dev vs prod)
- [ ] No debug/test endpoints exposed in production

### 3.4 Error Handling
- [ ] Global React error boundary (`error.tsx`) in app router
- [ ] Try-catch on all async API route handlers
- [ ] Downstream service failures handled gracefully (timeouts, fallbacks)
- [ ] User-facing error messages never expose internals

### 3.5 Testing
- [ ] Unit tests for all business logic (LUC engine, auth, validation)
- [ ] Integration tests for API routes
- [ ] Component tests for critical UI flows (sign-in, onboarding, chat)
- [ ] CI pipeline blocks merge on test failure
- [ ] Minimum 60% code coverage target

### 3.6 Observability
- [ ] Structured logging (JSON format) on all services
- [ ] Request correlation IDs across service boundaries
- [ ] Health endpoints on every service returning dependencies status
- [ ] Error tracking service configured (Sentry or equivalent)
- [ ] Uptime monitoring with alerting

### 3.7 Security
- [ ] CSP headers on all responses
- [ ] Bot detection and honeypot paths active
- [ ] Input sanitization (SQL injection, XSS, command injection)
- [ ] Network segmentation (sandbox-network isolation for agents)
- [ ] Payment operations blocked at agent-bridge level
- [ ] SSH key-only auth on VPS
- [ ] Firewall rules blocking internal Docker ports

### 3.8 Deployment
- [ ] Multi-stage Dockerfiles for all services
- [ ] Health checks with start_period, interval, retries
- [ ] Restart policies (always or unless-stopped)
- [ ] Resource limits (CPU, memory) on all containers
- [ ] CI/CD pipeline: lint → test → build → push → deploy
- [ ] Rollback procedure documented

### 3.9 Documentation
- [ ] README with quickstart, architecture overview, and contribution guide
- [ ] Environment variable documentation (.env.example with comments)
- [ ] API documentation for all public endpoints
- [ ] Deployment runbook for VPS operations
- [ ] Incident response procedures

---

## 4. Gap Classification

| Severity | Definition | SLA |
|----------|-----------|-----|
| **P0 — Critical** | Blocks production launch or creates security vulnerability | Fix before deploy |
| **P1 — High** | Degrades user experience or limits core functionality | Fix within 1 sprint |
| **P2 — Medium** | Missing polish, documentation, or non-critical features | Fix within 2 sprints |
| **P3 — Low** | Nice-to-have improvements, optimization opportunities | Backlog |

---

## 5. Review Cadence

- **Pre-Deploy**: Run full gap audit checklist
- **Weekly**: Review P0/P1 items in gap register
- **Monthly**: Re-score production readiness across all 13 categories
- **Quarterly**: Update SOP with lessons learned

---

## 6. Current Production Readiness Score

| Category | Score | Status |
|----------|-------|--------|
| Authentication | 9/10 | PRODUCTION-READY |
| Database | 7/10 | PARTIAL (mixed strategies) |
| API Routes | 8/10 | MOSTLY REAL (8 stubs) |
| Payment/Billing | 10/10 | PRODUCTION-READY |
| Testing | 6/10 | FRAMEWORK READY, LOW COVERAGE |
| Error Handling | 8/10 | COMPREHENSIVE |
| Logging/Monitoring | 5/10 | BASIC |
| Environment Config | 9/10 | WELL-DOCUMENTED |
| Documentation | 7/10 | HIGH-LEVEL GOOD |
| Security | 9/10 | STRONG POSTURE |
| Deployment | 9/10 | PRODUCTION-READY |
| Frontend | 7/10 | REAL CORE, STUB DASHBOARDS |
| Backend Services | 9/10 | COMPREHENSIVE |
| **Overall** | **7.9/10** | **MOSTLY PRODUCTION-READY** |

---

## 7. Approval

| Role | Name | Date |
|------|------|------|
| Engineering Lead | — | — |
| Product Owner | — | — |
| Security Reviewer | — | — |
