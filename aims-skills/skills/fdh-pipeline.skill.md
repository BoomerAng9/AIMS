---
name: fdh-pipeline
displayName: FDH Pipeline — Foster / Develop / Hone
version: 1.0.0
role: ACHEEVY
status: active
triggers: ["fdh", "foster develop hone", "pipeline", "run to completion", "build pipeline"]
tags: [fdh, pipeline, foster, develop, hone, always-on, factory-controller]
---

# FDH Pipeline — Foster / Develop / Hone

## Purpose

FDH is the **hardwired CI-like pipeline** that drives every piece of work to completion.
It replaces ad-hoc "run this when I tell you" with an **always-on loop per active chamber**.

FDH is not a concept — it is a concrete execution pipeline with three mandatory phases,
each with defined entry criteria, agents, tools, and exit gates.

---

## Pipeline Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        FDH PIPELINE                                     │
│                                                                         │
│  ┌──────────┐     ┌──────────┐     ┌──────────┐                        │
│  │  FOSTER   │ ──► │ DEVELOP  │ ──► │  HONE    │                        │
│  │  (Ingest) │     │ (Build)  │     │ (Verify) │                        │
│  └──────────┘     └──────────┘     └──────────┘                        │
│       │                │                │                               │
│  Context +         Code/Config      QA + Security                       │
│  Requirements      + Artifacts      + Performance                       │
│  + Constraints                      + ORACLE Gates                      │
│                                                                         │
│  Entry: Event       Entry: Foster   Entry: Develop                      │
│  lands              artifacts       artifacts                           │
│                     approved        ready                               │
│                                                                         │
│  Exit: Foster       Exit: Develop   Exit: ORACLE pass                   │
│  manifest           artifacts       + BAMARAM receipt                    │
│  approved           produced                                            │
│                                                                         │
│  Auto-loop: YES — active chambers run FDH continuously                  │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: FOSTER (Ingest + Plan)

**Purpose:** Automatically ingest context + requirements when a spec/prompt/ticket lands.

### Entry Criteria
- New event detected by Factory Controller (spec change, git push, ticket, telemetry alert)
- Event classified as actionable (not noise)

### Agents Involved
| Agent | Role |
|-------|------|
| **ACHEEVY** | Orchestrates Foster phase |
| **Scout_Ang** | Research context, gather external data |
| **Analyst_Ang** | Analyze requirements, identify constraints |
| **Chronicle_Ang** | Build timeline context from prior work |

### Actions
1. **Ingest Event** — Parse the triggering event (spec, commit, ticket, alert)
2. **Gather Context** — ByteRover query for related past work + RAG retrieval
3. **Analyze Requirements** — Extract scope, constraints, dependencies, risks
4. **Estimate Cost** — LUC pre-flight estimate for the full FDH run
5. **Generate Foster Manifest** — Structured plan document:

```yaml
foster_manifest:
  id: "foster_<uuid>"
  trigger_event:
    type: "spec_change | git_push | ticket | telemetry | schedule | user_request"
    source: "<event source>"
    payload: "<event data>"
  context:
    related_work: ["<byterover results>"]
    timeline: "<chronicle context>"
    external_data: ["<scout research>"]
  requirements:
    scope: "<what needs to be done>"
    constraints: ["<budget>", "<timeline>", "<technical>"]
    dependencies: ["<service>", "<api>", "<data>"]
    risks: ["<identified risks>"]
  plan:
    phases:
      - develop: { steps: [...], estimated_tokens: N, agents: [...] }
      - hone: { steps: [...], estimated_tokens: N, agents: [...] }
  luc_estimate:
    total_tokens: N
    total_usd: N.NN
    byterover_discount: N%
  approval_required: true | false  # Based on Deploy It / Guide Me lane
```

### Exit Gate
- Foster manifest generated and validated
- If Deploy It lane → auto-approved, proceed to Develop
- If Guide Me lane → HITL gate: human must approve manifest

---

## Phase 2: DEVELOP (Build + Wire)

**Purpose:** ACHEEVY spins Boomer_Angs to write code/config and wire n8n flows.

### Entry Criteria
- Foster manifest approved (auto or human)
- LUC budget confirmed

### Agents Involved
| Agent | Role |
|-------|------|
| **ACHEEVY** | Orchestrates Develop phase, delegates to Boomer_Angs |
| **Picker_Ang** | Selects stack/components via NtNtN Engine |
| **Buildsmith** | Constructs code, components, configurations |
| **Patchsmith_Ang** | Code edits, refactors, patches |
| **Runner_Ang** | CLI execution tasks |
| **Plug_Ang** | API wiring, MCP integration |
| **Chicken Hawk** | Dispatches Lil_Hawks for parallel execution |

### Actions
1. **Decompose Plan** — Break Foster manifest into executable waves
2. **Select Stack** — NtNtN Engine classification → Picker_Ang stack selection
3. **Spawn Shift** — Chicken Hawk creates shift with Lil_Hawk squads
4. **Execute Waves** — Lil_Hawks execute in parallel:
   - Code generation (Buildsmith → Code Ang)
   - Config generation (nginx, docker-compose, env files)
   - n8n workflow wiring (Factory Swarm auto-creates/updates)
   - API integration (Plug_Ang → Composio)
5. **Collect Artifacts** — Each wave produces artifacts → stored in Firestore/GCS
6. **Progress Reporting** — LiveSim events + Deploy Dock updates

### Develop Artifacts
```yaml
develop_artifacts:
  code: ["<file paths>"]
  configs: ["<docker-compose.yml>", "<nginx.conf>", "<.env>"]
  n8n_workflows: ["<workflow JSON>"]
  api_integrations: ["<MCP configs>"]
  build_logs: ["<shift logs>"]
  test_results: ["<preliminary test output>"]
```

### Exit Gate
- All waves completed
- No critical errors in build logs
- Artifacts collected and stored
- Ready for Hone phase verification

---

## Phase 3: HONE (Verify + Deploy)

**Purpose:** Separate QA/Oracle agents run tests, security scans, and performance checks.

### Entry Criteria
- Develop artifacts ready
- All waves completed without critical failure

### Agents Involved
| Agent | Role |
|-------|------|
| **ACHEEVY** | Orchestrates Hone phase |
| **Quality_Ang** | QA verification, test execution |
| **Gatekeeper_Ang** | Security scanning, policy compliance |
| **OpsConsole_Ang** | Performance monitoring, resource verification |
| **Lab_Ang** | Experimental verification (if novel patterns) |

### ORACLE 8-Gate Verification
```
Gate 1: CODE_QUALITY     — Lint, type check, no critical warnings
Gate 2: TEST_PASS        — All tests pass (unit + integration)
Gate 3: SECURITY_SCAN    — No critical OWASP findings, no exposed secrets
Gate 4: PERFORMANCE      — Lighthouse >= 90, response time < 2s
Gate 5: ACCESSIBILITY    — WCAG 2.1 AA compliance
Gate 6: RESPONSIVE       — Mobile + tablet + desktop verified
Gate 7: BRAND_COMPLIANCE — Brand strings enforcer passes, naming correct
Gate 8: LUC_ACCURACY     — Actual cost within 15% of estimate
```

### Actions
1. **Run Test Suite** — Automated tests against Develop artifacts
2. **Security Scan** — OWASP checks, dependency audit, secrets scan
3. **Performance Audit** — Lighthouse, load testing, resource profiling
4. **Brand Compliance** — Brand strings enforcer, naming validation
5. **LUC Reconciliation** — Compare estimated vs actual token spend
6. **Generate ORACLE Report** — Pass/fail per gate with evidence

### BAMARAM Receipt
On ORACLE pass, seal the receipt:
```yaml
bamaram_receipt:
  receipt_id: "BAM_<uuid>"
  fdh_run_id: "<fdh run id>"
  oracle_score: N/8
  gates_passed: ["GATE_1", "GATE_2", ...]
  gates_failed: []
  artifacts:
    - type: "code"
      path: "<gcs path>"
      hash: "<sha256>"
    - type: "test_report"
      path: "<gcs path>"
    - type: "security_scan"
      path: "<gcs path>"
  luc_actual:
    total_tokens: N
    total_usd: N.NN
    variance_from_estimate: "+/-N%"
  sealed_at: "<ISO timestamp>"
  sealed_by: "ACHEEVY"
  deploy_approved: true | false  # HITL gate for production deploys
```

### Exit Gate
- All 8 ORACLE gates pass (or acceptable exceptions documented)
- BAMARAM receipt sealed
- If production deploy → HITL gate: human must approve deployment
- If staging/preview → auto-deploy

---

## Always-On Loop Behavior

For **active chambers** (projects with ongoing work), FDH runs continuously:

```
WHILE chamber.status == 'active':
  events = poll_event_sources(chamber)
  FOR event IN events:
    IF is_actionable(event):
      manifest = foster(event, chamber.context)
      IF within_auto_approve_policy(manifest):
        artifacts = develop(manifest)
        receipt = hone(artifacts)
        deliver(receipt)
      ELSE:
        notify_human(manifest)
        WAIT for approval OR timeout
        IF approved:
          artifacts = develop(manifest)
          receipt = hone(artifacts)
          deliver(receipt)
  SLEEP(poll_interval)  # 30s active, 5m idle
```

### Chamber States
| State | Poll Interval | FDH Behavior |
|-------|--------------|--------------|
| **Active** | 30s | Full FDH on every actionable event |
| **Watching** | 5m | Foster only — notify human of detected events |
| **Paused** | None | No polling, no FDH |
| **Completed** | None | Chamber archived, no FDH |

---

## Failure Handling

| Failure Type | Response |
|-------------|----------|
| **Foster fails** | Retry with expanded context. If 3x fail → notify human. |
| **Develop wave fails** | Retry wave (up to maxRetries from task file). If exhausted → rollback + notify. |
| **Hone gate fails** | Return to Develop with gate feedback. Re-run failed gates only. Max 3 Develop↔Hone cycles. |
| **Budget exceeded** | Pause FDH, notify human with cost report + options. |
| **Stall detected** | Escalate per Factory Controller stall detection pattern. |
| **Critical error** | Kill switch → full audit → human investigation required. |
