# Real App Forever SOP (Infrastructure-Agnostic) v2.0

**Version**: 2.0.0
**Last Updated**: 2026-02-08
**Owner**: A.I.M.S. Engineering
**Revision Note**: End-to-end security hardening for the Vibe Coding era, explicit UI requirements, configuration contracts.

---

## 0) What this SOP is

This SOP defines the **capabilities, contracts, gates, evidence, UI surfaces, and configuration controls** required to build applications that:
- remain reliable over time,
- resist malicious automation and supply-chain tampering,
- can be safely changed and operated.

This SOP is **infrastructure-agnostic**:
- It does not require any specific cloud, VPS, orchestrator, CI vendor, database vendor, or security product.
- It describes what must exist and how to prove it exists.

---

## 1) Plain-language definition: "Real App Forever"

An app "lasts forever" when it can:
1. **Keep working as dependencies change** (patches, browser updates, API updates).
2. **Prevent and contain security failures** (least privilege, secrets protection, isolation).
3. **Recover from failures** (rollback + backups + restore drills).
4. **Be safely changed** (tests, verification gates, reproducible builds).
5. **Be operated like a system** (monitoring, alerts, incident runbooks, patch cadence).

If any item is missing, the app may still work today, but it will fail over time.

---

## 2) Minimal glossary (novice-friendly)

| Term | Definition |
|------|-----------|
| **Artifact** | A build output that can be deployed (image/bundle/package). |
| **Release** | A specific artifact promoted to an environment. |
| **Environment** | Where the app runs (dev/staging/prod or equivalent). |
| **Gate** | A required check that blocks progress when it fails. |
| **Evidence** | Proof that a gate ran and passed (reports/logs/records). |
| **Policy** | Rules for permissions, approvals, limits, and tool execution. |
| **Secrets** | Sensitive values (API keys, tokens, signing keys, wallet keys). |
| **Tenancy** | How customers/users are isolated (single-tenant or multi-tenant). |
| **Runner** | Isolated execution environment that builds/tests/deploys. |

---

## 3) The 12 non-negotiable pillars (must exist)

These pillars stop "vibe-coded, low-security, broken apps."

### Pillar 1 — Requirements that machines can build from

Required:
- User stories + acceptance criteria (pass/fail)
- Non-functional requirements (availability, latency targets, security level)

### Pillar 2 — Identity + session security

Required:
- Authentication (SSO/OAuth/OIDC or equivalent)
- Secure sessions (expiry/rotation, secure cookies/tokens)
- Account recovery

### Pillar 3 — Authorization + least privilege

Required:
- Roles and permissions (RBAC/ABAC)
- Server-side enforcement (not UI-only)

### Pillar 4 — Tenancy isolation (if multi-tenant)

Required:
- Explicit tenancy model (row/schema/db/service isolation)
- Cross-tenant access prevented by default
- Rate limiting and resource limits per tenant

### Pillar 5 — Data persistence + migrations + lifecycle

Required:
- Persistence layer and data model
- Migrations with safe apply strategy
- Retention/delete/export rules

### Pillar 6 — Secrets management (never in code)

Required:
- Secrets stored outside code
- Scoped access (only what needs it can read it)
- Rotation support

### Pillar 7 — Supply chain security (dependencies and builds)

Required:
- Pinned dependencies (lockfiles)
- Vulnerability scanning
- Reproducible builds

### Pillar 8 — Execution safety (sandbox + safe defaults)

Required:
- Isolated runners (container/VM/jail — implementation flexible)
- Restricted filesystem boundaries
- Restricted egress where appropriate

### Pillar 9 — Testing (minimum viable test suite)

Required:
- Unit tests
- Integration tests (API + data layer)
- Smoke tests (app starts, basic flows work)

### Pillar 10 — Security testing (minimum viable)

Required:
- Static checks (baseline)
- Dependency scan (CVEs)
- Basic abuse checks (auth bypass attempts, input validation coverage)

### Pillar 11 — Release engineering (safe deploy + rollback)

Required:
- Staging environment (or safe equivalent)
- Artifact versioning
- Rollback strategy

### Pillar 12 — Operations (observe, respond, recover)

Required:
- Logs/metrics/alerts
- Backups + restore drills
- Incident runbooks
- Patch cadence

---

## 4) End-to-end lifecycle SOP (A → B)

This is the full path from idea to "runs forever."

### Phase 0 — Intake and scope

**Inputs:**
- Goal + users
- Data sensitivity level
- Integrations needed
- Acceptance criteria + DoD checklist

**Outputs:**
- Requirements Brief object (persisted)
- DoD checklist (persisted)
- Risk rating (low/med/high)

**Gate:** Acceptance criteria exists and is testable.

**Evidence:** Requirements Brief + DoD record.

### Phase 1 — Architecture and contracts

**Outputs:**
- Data model
- API contract (schemas)
- Tenancy model choice
- Threat model summary (top threats + mitigations)

**Gates:**
- Tenancy and auth are explicit
- Data lifecycle is defined

**Evidence:** API schema + data schema + threat notes.

### Phase 2 — Scaffold with secure defaults

**Outputs:**
- Project skeleton (UI/API/data/tests)
- Baseline security posture:
  - Auth middleware
  - RBAC policy scaffold
  - Input validation patterns
  - Secure headers defaults

**Gate:**
- App starts in an isolated runner
- Smoke test passes

**Evidence:** Build log + smoke output.

### Phase 3 — Build features in vertical slices

**Rule:** Each slice includes UI + API + data + tests for one user-visible function.

**Gates per slice:**
- Lint/format
- Unit tests
- Integration tests
- Dependency scan

**Evidence:** Test reports + scan reports per slice.

### Phase 4 — Pre-release verification

**Outputs:**
- Release candidate artifact (versioned)

**Gates:**
- Minimum security checks pass
- Migration plan validated on staging
- Rollback target ready

**Evidence:** Staging validation report + release checklist.

### Phase 5 — Release

**Outputs:**
- Production deployment + release notes

**Gates:**
- Monitoring enabled
- Backups verified
- Rollback confirmed

**Evidence:** Deploy record + monitoring status + backup record.

### Phase 6 — Operate forever

**Recurring controls:**
- Patch releases (deps/base images/connectors)
- Restore drills
- Access reviews
- Incident management

**Evidence:** Patch logs + restore drill evidence + audit logs.

---

## 5) Vibe Coding era hardening (assume hostile automation)

Treat any autonomous builder, external input, and integration callback as untrusted.

### 5.1 Required threat model (baseline)

For each project and the platform:
- **Assets:** source, artifacts, secrets, tenant data, billing state
- **Trust boundaries:** UI → gateway → services → runners → stores
- **Entry points:** API, webhooks, uploads, admin actions, automations
- **Top 10 threats** + mitigations + required gates/evidence

### 5.2 Secure runners (anti-infiltration)

Required controls:
- Isolation boundary per job (or per tenant with written justification)
- Non-root execution by default
- Read-only base filesystem where feasible
- Resource limits (cpu/mem/disk/time)
- Tool/command allowlist (no free-form shell from untrusted input)
- Network egress controls:
  - Deny by default for sensitive stages (build/test/sign)
  - Explicit allowlist for required registries/APIs
- Secrets injection:
  - Only at runtime
  - Scoped and never logged

### 5.3 Supply-chain integrity (chain of custody)

Required controls:
- Dependency pinning + lockfile enforcement
- Secret scanning (stop secrets in repo and logs)
- SBOM generated per release and stored as evidence
- Build provenance per artifact (build id → source ref → builder identity)
- Artifact signing (or equivalent integrity) and deploy-time verification
- Immutable promotion (build once, promote that artifact)

### 5.4 Prompt/tool injection defenses

Required controls:
- Tool execution requires server-side policy check (and approvals for high-risk actions)
- Untrusted input cannot directly become tool parameters without validation
- Outbound allowlists for connectors/domains when feasible (SSRF posture)
- Explicit "dangerous action" list requiring step-up auth + approval record:
  - Production deploy
  - Secrets binding/rotation changes
  - Data export/delete
  - Policy changes

### 5.5 Runtime hardening

Required controls:
- Edge protections (rate limits/WAF-equivalent)
- Structured logging with redaction rules
- Server-side RBAC + tenancy checks on every request
- Backups + restore drills
- Incident response runbooks
- Patch cadence

---

## 6) Gates and evidence (non-bypassable)

### 6.1 Minimum required gates to ship

| Gate | Description |
|------|------------|
| Lint/format | Code style enforcement |
| Unit tests | Business logic verification |
| Integration tests | API + data layer verification |
| Dependency vulnerability scan (SCA) | CVE detection |
| Secret scan | Prevent secrets in code |
| Smoke test | Startup + core flows verification |

### 6.2 Higher-assurance gates (phase-in)

| Gate | Description |
|------|------------|
| Spec-alignment verification | High-risk diff review |
| Drift detection | Runtime vs intended config |
| Deeper security testing | As risk requires |

### 6.3 Evidence rules

- Every gate produces evidence (report/log/record).
- Every "PASS" must link to evidence.
- Evidence must link to:
  - Work item
  - Execution id
  - Artifact id
  - Release id

**Overrides:**
- No manual override without approval record + reason + time-bounded exception.

---

## 7) UI requirements (agnostic) — required, not cosmetic

UI is part of safety. It must allow a novice to answer:
- What is being built?
- What must happen next?
- What proof exists it is safe and working?
- What is deployed, and how do I roll back?
- What changed, who changed it, and why?

### 7.1 Required UI objects (backing models)

| Object | Purpose |
|--------|---------|
| Workspace/Tenant | Organizational boundary |
| Project | Deliverable container |
| Environment | Runtime target (dev/staging/prod) |
| Work Item | Trackable unit of work |
| Gate | Verification checkpoint |
| Evidence | Pointer to reports/logs |
| Artifact | Build output |
| Release | Promoted artifact |
| Connector | Integration binding |
| Secret Reference | Pointer only — never raw values |
| Policy | Authz/tool/gate rules |
| Incident | Operational event record |
| Usage Record | Metering data |

### 7.2 Required screens (minimum) and what they must show

| # | Screen | Must Show |
|---|--------|-----------|
| 1 | **Intake** (chat or form) | Saves Requirements Brief + DoD + risk rating |
| 2 | **Workstream** (Build/Verify/Release timeline) | Current phase, next required gate, assigned owner(s) |
| 3 | **Live Build Stream** | executionId/requestId, step status, read-only logs, artifact links |
| 4 | **Gates & Evidence Locker** | Every gate result links to evidence; failures show "why failed" and remediation pointer |
| 5 | **Environments & Releases** | Active release version per environment, rollback target, last deploy actor/time/reason, migration status |
| 6 | **Integrations** | Connector enablement, credential status via secret references (never raw), webhook verification + replay protection status, last error and health |
| 7 | **Security Center** | Roles/permissions summary, policies in effect, secret reference inventory + rotation schedule, vulnerability findings + patch status, audit log access |
| 8 | **Operations** | Health/latency/errors, alerts, backups status + restore drill evidence, incidents + runbooks |
| 9 | **Billing & Metering** | Usage by capability/tool, quota state, denials with reason codes |

### 7.3 UI rules

- Every green check links to evidence.
- Every deploy shows rollback target.
- Every denial shows a reason (policy/quota/security gate).
- UI never bypasses the gateway to call internal services directly.

---

## 8) Configuration contracts (agnostic)

Configuration is a controlled system, not scattered toggles.

### 8.1 Config types that must exist

| Config Type | Description |
|-------------|------------|
| Authz policy config | Roles/permissions/approvals |
| Tool registry config | Allowlist + limits + metering mapping |
| Gate policy config | Gates per risk level + thresholds |
| Environment config sets | Variables, feature flags, connector enablement |
| Secret reference bindings | Rotation schedules |
| Observability policy | Redaction, retention, alert thresholds |
| Backup/restore policy | Frequency, retention, drill schedule |
| Release policy | Promotion rules, rollback rules, migration rules |

### 8.2 Config layering (effective config)

Effective configuration must be computed by layering:
1. Platform defaults
2. Tenant/workspace overrides
3. Project overrides
4. Environment overrides

**UI must show:**
- Draft config
- Effective config (enforced)
- Version history

### 8.3 Config change control

Rules:
- Schema validation before apply (hard fail)
- Audit log for every change (who/what/when/reason)
- Approval required for high-risk changes
- Rollback to last known-good config

### 8.4 Drift detection

Detect and surface when runtime config differs from expected effective config:
- Drift status
- Last known-good restore option
- Incident linkage if drift caused outage

---

## 9) "No-Guessing Contract" for autonomous building (task format)

Every work item must include:

| Field | Description |
|-------|------------|
| Objective | One sentence |
| Inputs | Paths/contracts |
| Outputs | Exact artifacts/files |
| Acceptance criteria | Pass/fail |
| Required gates | Which gates must pass |
| Required evidence | What to attach |

If the item cannot be written this way, it is not ready to execute.

---

## 10) Starter checklist (use this to self-audit)

Mark each as Present/Partial/Missing and attach evidence:

| # | Item | Status | Evidence |
|---|------|--------|----------|
| 1 | Identity + session security | — | — |
| 2 | RBAC/ABAC enforced server-side | — | — |
| 3 | Tenancy model explicit and tested (if multi-tenant) | — | — |
| 4 | Secrets stored outside code and never logged | — | — |
| 5 | Isolated runners with egress controls and allowlisted tools | — | — |
| 6 | Minimum gates enforced (lint/tests/scans/smoke) | — | — |
| 7 | SBOM + provenance + artifact integrity checks per release | — | — |
| 8 | Evidence locker exists (gate → evidence links) | — | — |
| 9 | Rollback and restore drills exist and are proven | — | — |
| 10 | Patch cadence exists and is proven | — | — |

---

## 11) A.I.M.S. platform mapping

How A.I.M.S. maps to this SOP:

| SOP Concept | A.I.M.S. Implementation |
|-------------|------------------------|
| Intake | Chat w/ACHEEVY (PMO classification → Boomer_Ang director routing) |
| Workstream | n8n PMO pipeline (6 offices: CTO/CFO/COO/CMO/CDO/CPO) |
| Live Build | Agent sandbox + Plug Factory |
| Gates & Evidence | CI/CD pipeline (Cloud Build), middleware WAF, agent-bridge payment blocking |
| Environments | Docker Compose (dev) → VPS prod (31.97.138.45, 76.13.96.107) |
| Integrations | OpenRouter (LLM), ElevenLabs (Voice), Stripe (Billing), Google OAuth |
| Security Center | Middleware WAF, DOCKER-USER iptables, UFW, SSH hardening |
| Operations | Health endpoints, Docker healthchecks, nginx rate limiting |
| Billing & Metering | LUC Engine (5 tiers, 10 service buckets) |

### Current pillar compliance (2026-02-08 audit)

| Pillar | Status | Score |
|--------|--------|-------|
| 1. Requirements | PARTIAL | 6/10 |
| 2. Identity + sessions | PASS | 9/10 |
| 3. Authorization | PASS | 8/10 |
| 4. Tenancy isolation | N/A | — |
| 5. Data persistence | PARTIAL | 7/10 |
| 6. Secrets management | PASS | 9/10 |
| 7. Supply chain security | PARTIAL | 6/10 |
| 8. Execution safety | PASS | 8/10 |
| 9. Testing | PARTIAL | 5/10 |
| 10. Security testing | PARTIAL | 7/10 |
| 11. Release engineering | PARTIAL | 7/10 |
| 12. Operations | PARTIAL | 5/10 |
| **Overall** | **PARTIAL** | **7.1/10** |

---

## 12) Security audit findings (2026-02-08)

### Critical — Fixed during audit

| Finding | VPS | Status |
|---------|-----|--------|
| UFW firewall was INACTIVE | 76.13.96.107 | **FIXED** — UFW enabled, deny incoming, allow 22/80/443 |
| PostgreSQL (5432, 5433) exposed to internet | 76.13.96.107 | **FIXED** — Blocked by UFW + DOCKER-USER iptables DROP |
| Redis (6380) exposed with NO password | 76.13.96.107 | **FIXED** — UFW blocks port + password set |
| Backend API (8000) exposed directly | 76.13.96.107 | **FIXED** — Blocked by UFW + DOCKER-USER iptables DROP |
| Sandbox server (8100) exposed | 76.13.96.107 | **FIXED** — Blocked by UFW + DOCKER-USER iptables DROP |
| Tool server (1236) exposed | 76.13.96.107 | **FIXED** — Blocked by UFW + DOCKER-USER iptables DROP |

### Verified — Passing

| Check | VPS | Result |
|-------|-----|--------|
| UFW active, only 22/80/443 | 31.97.138.45 | PASS |
| UFW active, only 22/80/443 | 76.13.96.107 | PASS (after fix) |
| DOCKER-USER iptables DROP on internal ports | Both | PASS |
| Honeypots (/wp-admin, /.env, /.git, /phpmyadmin, /admin) | plugmein.cloud | PASS (all 404) |
| Bot detection (sqlmap, nikto, curl, empty UA) | plugmein.cloud | PASS (all blocked) |
| SQL injection pattern detection | plugmein.cloud | PASS (400) |
| Path traversal blocking | plugmein.cloud | PASS (blocked) |
| Security headers (CSP, HSTS, X-Frame-Options, etc.) | plugmein.cloud | PASS (all present) |
| n8n bound to localhost only | 76.13.96.107 | PASS (127.0.0.1:5678) |
| Docker internal services not exposed | 31.97.138.45 | PASS |
| TypeScript build | Local | PASS (0 errors, 69 pages) |
| `tsc --noEmit` | Local | PASS (0 errors) |

### Open items

| Finding | Priority | Notes |
|---------|----------|-------|
| No SSL/TLS certificate on plugmein.cloud | P1 | HTTPS returns empty; certbot needs domain config |
| `NEXT_PUBLIC_ELEVENLABS_AGENT_ID` not set on VPS | P2 | Voice agent disabled |
| XSS in URL-encoded query params bypasses middleware regex | P3 | Mitigated by React JSX escaping + CSP |
| Duplicate security headers (middleware + nginx) | P3 | Cosmetic; no security impact |
| Redis password not persisted in docker-compose config | P2 | Will reset on container restart |
| No SBOM generation | P2 | Supply chain pillar gap |
| No artifact signing | P2 | Supply chain pillar gap |
| Debug/test endpoints exposed in production | P1 | /api/test/e2b, /api/test/groq |

---

## 13) Approval

| Role | Name | Date |
|------|------|------|
| Engineering Lead | — | — |
| Product Owner | — | — |
| Security Reviewer | — | — |
