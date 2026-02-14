# D.U.M.B. — Deep Universal Meticulous Build
## The A.I.M.S. Build Standard Operating Procedure

> **Version:** 1.0.0
> **Created:** 2026-02-14
> **Author:** ACHVMR
> **Status:** MANDATORY — all builds, all agents, all deployments
> **Triggers:** "build", "deploy", "create app", "new project", "scaffold", any Phase B execution

---

## What D.U.M.B. Is

D.U.M.B. (Deep Universal Meticulous Build) is the **mandatory build process** for every coding instance in the A.I.M.S. ecosystem — whether ACHEEVY's agents are building internally or building for users.

Based on the **"Real App Forever" SOP v2.0** (Infrastructure-Agnostic).

**Core promise:** Applications built under D.U.M.B. remain reliable over time, resist malicious automation and supply-chain tampering, can be safely changed and operated.

---

## The 5 Survival Properties (Non-Negotiable)

An app "lasts forever" when it can:
1. **Keep working as dependencies change** (patches, browser updates, API updates)
2. **Prevent and contain security failures** (least privilege, secrets protection, isolation)
3. **Recover from failures** (rollback + backups + restore drills)
4. **Be safely changed** (tests, verification gates, reproducible builds)
5. **Be operated like a system** (monitoring, alerts, incident runbooks, patch cadence)

If **any** item is missing, the app may still work today, but it will fail over time.

---

## Glossary

| Term | Definition |
|------|-----------|
| **Artifact** | A build output that can be deployed (image/bundle/package) |
| **Release** | A specific artifact promoted to an environment |
| **Environment** | Where the app runs (dev/staging/prod or equivalent) |
| **Gate** | A required check that blocks progress when it fails |
| **Evidence** | Proof that a gate ran and passed (reports/logs/records) |
| **Policy** | Rules for permissions, approvals, limits, and tool execution |
| **Secrets** | Sensitive values (API keys, tokens, signing keys, wallet keys) |
| **Tenancy** | How customers/users are isolated (single-tenant or multi-tenant) |
| **Runner** | Isolated execution environment that builds/tests/deploys |

---

## The 12 Non-Negotiable Pillars

These pillars stop "vibe-coded, low-security, broken apps."

### Pillar 1 — Requirements That Machines Can Build From
- User stories + acceptance criteria (pass/fail)
- Non-functional requirements (availability, latency targets, security level)

### Pillar 2 — Identity + Session Security
- Authentication (SSO/OAuth/OIDC or equivalent)
- Secure sessions (expiry/rotation, secure cookies/tokens)
- Account recovery

### Pillar 3 — Authorization + Least Privilege
- Roles and permissions (RBAC/ABAC)
- Server-side enforcement (not UI-only)

### Pillar 4 — Tenancy Isolation (If Multi-Tenant)
- Explicit tenancy model (row/schema/db/service isolation)
- Cross-tenant access prevented by default
- Rate limiting and resource limits per tenant

### Pillar 5 — Data Persistence + Migrations + Lifecycle
- Persistence layer and data model
- Migrations with safe apply strategy
- Retention/delete/export rules

### Pillar 6 — Secrets Management (Never in Code)
- Secrets stored outside code
- Scoped access (only what needs it can read it)
- Rotation support

### Pillar 7 — Supply Chain Security (Dependencies and Builds)
- Pinned dependencies (lockfiles)
- Vulnerability scanning
- Reproducible builds

### Pillar 8 — Execution Safety (Sandbox + Safe Defaults)
- Isolated runners (container/VM/jail — implementation flexible)
- Restricted filesystem boundaries
- Restricted egress where appropriate

### Pillar 9 — Testing (Minimum Viable Test Suite)
- Unit tests
- Integration tests (API + data layer)
- Smoke tests (app starts, basic flows work)

### Pillar 10 — Security Testing (Minimum Viable)
- Static checks (baseline)
- Dependency scan (CVEs)
- Basic abuse checks (auth bypass attempts, input validation coverage)

### Pillar 11 — Release Engineering (Safe Deploy + Rollback)
- Staging environment (or safe equivalent)
- Artifact versioning
- Rollback strategy

### Pillar 12 — Operations (Observe, Respond, Recover)
- Logs/metrics/alerts
- Backups + restore drills
- Incident runbooks
- Patch cadence

---

## End-to-End Lifecycle (A → B)

### Phase 0 — Intake and Scope

**Inputs:** goal + users, data sensitivity level, integrations needed, acceptance criteria + DoD checklist

**Outputs:** Requirements Brief (persisted), DoD checklist (persisted), risk rating (low/med/high)

**Gate:** Acceptance criteria exists and is testable

**Evidence:** Requirements Brief + DoD record

### Phase 1 — Architecture and Contracts

**Outputs:** Data model, API contract (schemas), tenancy model choice, threat model summary (top threats + mitigations)

**Gates:** Tenancy and auth are explicit, data lifecycle is defined

**Evidence:** API schema + data schema + threat notes

### Phase 2 — Scaffold with Secure Defaults

**Outputs:** Project skeleton (UI/API/data/tests), baseline security posture (auth middleware, RBAC policy scaffold, input validation patterns, secure headers defaults)

**Gate:** App starts in an isolated runner, smoke test passes

**Evidence:** Build log + smoke output

### Phase 3 — Build Features in Vertical Slices

**Rule:** Each slice includes UI + API + data + tests for one user-visible function

**Gates per slice:** lint/format, unit tests, integration tests, dependency scan

**Evidence:** Test reports + scan reports per slice

### Phase 4 — Pre-Release Verification

**Outputs:** Release candidate artifact (versioned)

**Gates:** Minimum security checks pass, migration plan validated on staging, rollback target ready

**Evidence:** Staging validation report + release checklist

### Phase 5 — Release

**Outputs:** Production deployment + release notes

**Gates:** Monitoring enabled, backups verified, rollback confirmed

**Evidence:** Deploy record + monitoring status + backup record

### Phase 6 — Operate Forever

**Recurring controls:** Patch releases (deps/base images/connectors), restore drills, access reviews, incident management

**Evidence:** Patch logs + restore drill evidence + audit logs

---

## Vibe Coding Era Hardening (Assume Hostile Automation)

Treat any autonomous builder, external input, and integration callback as untrusted.

### Required Threat Model (Baseline)
For each project and the platform:
- Assets (source, artifacts, secrets, tenant data, billing state)
- Trust boundaries (UI → gateway → services → runners → stores)
- Entry points (API, webhooks, uploads, admin actions, automations)
- Top 10 threats + mitigations + required gates/evidence

### Secure Runners (Anti-Infiltration)
- Isolation boundary per job (or per tenant with written justification)
- Non-root execution by default
- Read-only base filesystem where feasible
- Resource limits (cpu/mem/disk/time)
- Tool/command allowlist (no free-form shell from untrusted input)
- Network egress controls: deny by default for sensitive stages (build/test/sign), explicit allowlist for required registries/APIs
- Secrets injection: only at runtime, scoped and never logged

### Supply-Chain Integrity (Chain of Custody)
- Dependency pinning + lockfile enforcement
- Secret scanning (stop secrets in repo and logs)
- SBOM generated per release and stored as evidence
- Build provenance per artifact (build id → source ref → builder identity)
- Artifact signing (or equivalent integrity) and deploy-time verification
- Immutable promotion (build once, promote that artifact)

### Prompt/Tool Injection Defenses
- Tool execution requires server-side policy check (and approvals for high-risk actions)
- Untrusted input cannot directly become tool parameters without validation
- Outbound allowlists for connectors/domains when feasible (SSRF posture)
- Explicit "dangerous action" list requiring step-up auth + approval record:
  - Production deploy
  - Secrets binding/rotation changes
  - Data export/delete
  - Policy changes

### Runtime Hardening
- Edge protections (rate limits/WAF-equivalent)
- Structured logging with redaction rules
- Server-side RBAC + tenancy checks on every request
- Backups + restore drills
- Incident response runbooks
- Patch cadence

---

## Gates and Evidence (Non-Bypassable)

### Minimum Required Gates to Ship
1. lint/format
2. unit tests
3. integration tests (API + data)
4. dependency vulnerability scan (SCA)
5. secret scan
6. smoke test (startup + core flows)

### Higher-Assurance Gates (Phase-In)
- Spec-alignment verification for high-risk diffs
- Drift detection (runtime differs from intended effective configuration)
- Deeper security testing (as risk requires)

### Evidence Rules
- Every gate produces evidence (report/log/record)
- Every "PASS" must link to evidence
- Evidence must link to: work item, execution id, artifact id, release id
- **No manual override without approval record + reason + time-bounded exception**

---

## Required UI Objects (Backing Models)

Every D.U.M.B.-compliant application must expose these objects through its UI:

| Object | What It Represents |
|--------|-------------------|
| Workspace/Tenant | The isolation boundary |
| Project | The buildable unit |
| Environment | Where it runs (dev/staging/prod) |
| Work Item | A unit of trackable work |
| Gate | A required check |
| Evidence | Pointer to reports/logs proving gate passed |
| Artifact | A build output |
| Release | A promoted artifact |
| Connector | An integration point |
| Secret Reference | Pointer only — never raw values |
| Policy | authz/tool/gate rules |
| Incident | Something that went wrong |
| Usage Record | Metering data |

### Required Screens (Minimum)

1. **Intake** — Saves Requirements Brief + DoD + risk rating
2. **Workstream** — Current phase, next required gate, assigned owner(s)
3. **Live Build Stream** — executionId, step status, read-only logs, artifact links
4. **Gates & Evidence Locker** — Every gate result links to evidence; failures show "why failed" + remediation
5. **Environments & Releases** — Active release per env, rollback target, last deploy actor/time/reason
6. **Integrations** — Connector enablement, credential status via secret refs, webhook verification
7. **Security Center** — Roles/permissions summary, policies, secret inventory, vuln findings
8. **Operations** — Health/latency/errors, alerts, backup status, incidents + runbooks
9. **Billing & Metering** — Usage by capability, quota state, denials with reason codes

### UI Rules
- Every green check links to evidence
- Every deploy shows rollback target
- Every denial shows a reason (policy/quota/security gate)
- UI never bypasses the gateway to call internal services directly

---

## Configuration Contracts

### Config Types That Must Exist
- authz policy config (roles/permissions/approvals)
- tool registry config (allowlist + limits + metering mapping)
- gate policy config (gates per risk level + thresholds)
- environment config sets (variables, feature flags, connector enablement)
- secret reference bindings + rotation schedules
- observability policy (redaction, retention, alert thresholds)
- backup/restore policy (frequency, retention, drill schedule)
- release policy (promotion rules, rollback rules, migration rules)

### Config Layering (Effective Config)
Effective configuration must be computed by layering:
1. Platform defaults
2. Tenant/workspace overrides
3. Project overrides
4. Environment overrides

UI must show: draft config, effective config (enforced), version history.

### Config Change Control
- Schema validation before apply (hard fail)
- Audit log for every change (who/what/when/reason)
- Approval required for high-risk changes
- Rollback to last known-good config

### Drift Detection
Detect and surface when runtime config differs from expected effective config:
- Drift status
- Last known-good restore option
- Incident linkage if drift caused outage

---

## "No-Guessing Contract" for Autonomous Building (Task Format)

Every work item must include:
- **Objective** (one sentence)
- **Inputs** (paths/contracts)
- **Outputs** (exact artifacts/files)
- **Acceptance criteria** (pass/fail)
- **Required gates**
- **Required evidence** (what to attach)

**If the item cannot be written this way, it is not ready to execute.**

---

## Starter Checklist (Self-Audit)

Mark each as Present/Partial/Missing and attach evidence:

- [ ] Identity + session security
- [ ] RBAC/ABAC enforced server-side
- [ ] Tenancy model explicit and tested (if multi-tenant)
- [ ] Secrets stored outside code and never logged
- [ ] Isolated runners with egress controls and allowlisted tools
- [ ] Minimum gates enforced (lint/tests/scans/smoke)
- [ ] SBOM + provenance + artifact integrity checks per release
- [ ] Evidence locker exists (gate → evidence links)
- [ ] Rollback and restore drills exist and are proven
- [ ] Patch cadence exists and is proven

---

## Integration with A.I.M.S. Ecosystem

### Where D.U.M.B. Fires
- Every Phase B vertical execution
- Every Chicken Hawk build
- Every Plug fabrication (II-Agent)
- Every deployment via Deploy Dock
- Every scaffold operation
- Every project pipeline advancement

### Who Enforces D.U.M.B.
- **Quality_Ang** — Runs ORACLE 8-gate checks against D.U.M.B. pillars
- **Chicken Hawk** — Enforces gate completion before deployment
- **ACHEEVY** — Refuses to mark anything done without D.U.M.B. evidence

### ORACLE 8-Gate Mapping to D.U.M.B.
| Gate | D.U.M.B. Pillar(s) |
|------|-------------------|
| Gate 1: Requirements | Pillar 1 |
| Gate 2: Security | Pillars 2, 3, 6, 8, 10 |
| Gate 3: Testing | Pillars 9, 10 |
| Gate 4: Evidence | All pillars (evidence rules) |
| Gate 5: Deployment | Pillars 11, 12 |
| Gate 6: Rollback | Pillar 11 |
| Gate 7: Monitoring | Pillar 12 |
| Gate 8: Audit | Evidence rules + config contracts |
