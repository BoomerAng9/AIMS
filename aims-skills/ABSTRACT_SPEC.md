# A.I.M.S. Abstract Skills, Hooks & Tasks Specification

**Version:** 1.0.0
**Date:** 2026-03-01
**Status:** Canonical Reference
**Binding Document:** `AIMS_ROLE_BINDINGS.md` maps concrete executor identities onto the abstract roles defined here.

---

> This specification defines roles, standard operating procedures, the GSD Bridge, tool management,
> agentic swarms, and the OpenClaw DRIVER pattern **without naming any specific executor identity**.
> All references use abstract role types only. Concrete agents, services, and identities are bound
> separately by configuration.

---

## Table of Contents

- [1.1 Standards](#11-standards)
- [1.2 Standard Operating Procedures (SOPs)](#12-standard-operating-procedures-sops)
- [1.3 GSD (Get Shit Done) Bridge](#13-gsd-get-shit-done-bridge)
- [1.4 Tool & MCP Management (Abstract)](#14-tool--mcp-management-abstract)
- [1.5 Agentic Swarms](#15-agentic-swarms)
- [1.6 OpenClaw DRIVER.md (Abstract Form)](#16-openclaw-drivermd-abstract-form)

---

## 1.1 Standards

### Roles (Abstract Only)

Four abstract role types govern every interaction, plan, and execution within the platform. No specific identity is assumed for any executor in this spec. Concrete agents are bound later by configuration.

- **Primary Orchestrator Executor** — Single front door for all user input (chat, UI, voice, API). Plans work, delegates to other executors, synthesizes final responses. There is exactly one Primary Orchestrator per tenant context. It owns the conversation lifecycle, maintains the master plan, and is the only role permitted to communicate directly with end users.

- **Specialist Executors** — Narrow, goal-driven actors each responsible for one objective and a small skill bundle. Examples of objective domains: "grow YouTube channel", "optimize email conversions", "harden infrastructure", "ship UI changes", "manage real estate calculations", "run compliance audits". Each Specialist Executor operates independently within its objective boundary and reports results back to the Primary Orchestrator or to shared memory.

- **Automation Executors** — Workflow engines or cron-like systems that run scheduled or event-driven tasks. These executors do not make judgment calls; they execute pre-defined sequences when trigger conditions are met. Examples of trigger types: time-based (cron), event-based (webhook, message queue), threshold-based (metric crosses boundary), lifecycle-based (instance deployed, health check failed).

- **Review Executors** — Human or agentic reviewers that check outputs against KPIs, security rules, and design standards before shipping. Review Executors have veto authority over any artifact or action within their review scope. They do not create — they evaluate, approve, reject, or request revision.

### Skills & Hooks Format

Every skill is a markdown file stored at `skills/<domain>/SKILL.md` containing the following structure:

```markdown
# Skill: <Name>

- Role: <Which executor roles can own this skill>
- Intent: <Single clear outcome — one sentence, no ambiguity>
- KPIs: <Measurable success metrics — numeric thresholds where possible>
- Stack: <Frameworks, APIs, services, repos this skill depends on>
- Inputs: <Required inputs — data, context, permissions>
- Outputs: <Guaranteed outputs — artifacts, state changes, notifications>
- Quality Gates: <Checks before this skill is considered done>
- Hooks:
  - trigger: <When to activate — event type, condition, or explicit invocation>
  - pre_gsd: <Checks before execution — data availability, permissions, budget>
  - post_gsd: <Validation, logging, handoff — evidence collection, metric recording>
  - stitch_design: <Optional UI/UX design pass — layout proposals, brand compliance>
- Limits:
  - Max iterations / runtime: <Hard ceiling to prevent runaway execution>
  - Max external tool/API calls: <Budget cap per invocation>
```

**Skill File Rules:**

1. One skill per file. If a skill grows beyond a single clear outcome, split it.
2. The `Role` field uses abstract role types only (Primary Orchestrator, Specialist, Automation, Review).
3. The `Intent` field must be a single sentence. If you need "and", you need two skills.
4. KPIs must be measurable. "Improve performance" is not a KPI. "Reduce p95 latency below 200ms" is.
5. Quality Gates are binary pass/fail. No partial credit.
6. Hooks are optional individually, but every skill must declare at least `trigger` and `post_gsd`.
7. Limits are mandatory. No skill runs without a defined ceiling.

### Hooks Format

Hooks are lifecycle interceptors stored at `hooks/<domain>/HOOK.md`:

```markdown
# Hook: <Name>

- Phase: pre | post | trigger
- Attached To: <Skill name or SOP step>
- Condition: <When this hook fires>
- Action: <What it does — validation, transformation, logging, gating>
- Failure Mode: <What happens if the hook fails — block, warn, log-and-continue>
```

### Tasks Format

Tasks are atomic units of work stored at `tasks/<domain>/TASK.md`:

```markdown
# Task: <Name>

- Owner Role: <Abstract role type>
- Parent Skill: <Which skill spawns this task>
- Inputs: <Specific data required>
- Steps: <Ordered list of actions>
- Outputs: <What is produced>
- Evidence: <What proof is logged>
- Timeout: <Max duration>
```

### Narrowness Standard

Each Specialist Executor MUST:

- Own a single primary objective — stated in one sentence, no conjunctions.
- Track 3-5 KPIs tied directly to that objective — each KPI has a numeric target and evaluation cadence.
- Use no more than 7-10 active skills at a time — if more are needed, the objective is too broad and must be split into multiple Specialist Executors.
- Declare its skill bundle explicitly — no implicit capabilities, no "and anything else it can do."
- Be replaceable — any executor meeting the same skill/KPI contract can substitute.

**Narrowness Violations:**

If a Specialist Executor is found to:

- Own skills serving two unrelated objectives → Split into two executors.
- Track more than 5 KPIs → Prune to the 3-5 most impactful; park the rest.
- Hold more than 10 active skills → Move overflow to a new executor or parking lot.
- Make decisions outside its objective scope → Escalate to Primary Orchestrator.

---

## 1.2 Standard Operating Procedures (SOPs)

SOPs define the repeatable processes that all executors follow. Each SOP is numbered, versioned, and referenced by skills and hooks.

### SOP-01: Fast Planning & Role Realization

**Purpose:** Transform raw user intent into a committed, executable plan with assigned roles and validated tools.

**Steps:**

1. **Intent Extraction** — Parse user input (chat, UI action, API call, voice command) into a single-line Intent Statement. Map the intent to the relevant workspace and/or vertical. If ambiguous, the Primary Orchestrator asks one clarifying question before proceeding.

2. **Role Realization (Agentic)** — Each available executor introspects its own capabilities and proposes its responsibilities for this intent. The Primary Orchestrator collects proposals. No executor is assigned work it did not volunteer for unless it is the only capable candidate.

3. **Tool & MCP Discovery** — Query the Tool/MCP Registry (see Section 1.4) for available tools matching the intent. Draft a Plan Outline containing: ordered steps, assigned roles per step, tools required per step, expected inputs/outputs per step.

4. **GSD Pre-Check** — Submit the Draft Plan Outline to the GSD Bridge (see Section 1.3). The bridge prunes scope, enforces narrowness limits, verifies data and tool availability, and returns a Tight Plan Outline. If the bridge rejects the plan, return to step 1 with the bridge's feedback.

5. **Plan Commit** — Persist the Tight Plan Outline to shared memory. All executors involved receive notification. The plan is now the contract. Deviations require re-planning through SOP-01.

**Timing:** SOP-01 should complete in under 30 seconds for simple intents, under 2 minutes for complex multi-executor plans.

### SOP-02: Execution Loop

**Purpose:** Execute a committed plan step-by-step with logging, checkpointing, and controlled handoffs.

**Steps:**

1. **Load Plan & Context** — Read the Tight Plan Outline from shared memory. Load all context required for the current step (previous step outputs, external data, configuration).

2. **Choose Minimal Next Action** — Select the smallest possible action that advances the plan. Prefer atomic operations over compound ones. If multiple independent actions exist, they may run in parallel if the executor supports it.

3. **Autonomous Tool Invocation** — When pre-conditions match and permissions allow, the assigned executor invokes the required tool(s) via the Tool/MCP Registry. No human approval needed for pre-approved tool calls. Human-in-the-loop gates apply only where explicitly declared in the skill or plan.

4. **Checkpoint & Log** — After each action, record:
   - What was done (action name, tool called, parameters summary)
   - What changed (state delta, artifacts created/modified)
   - What is next (next step in plan, or completion)
   - Metrics/artifacts (KPI measurements, output files, evidence hashes)

5. **Handoff or Re-loop** — If the current executor's step is complete and the next step belongs to a different executor, hand off via shared memory update + notification. If the next step belongs to the same executor, re-loop to step 2. If the plan is complete, notify the Primary Orchestrator for synthesis and user delivery.

**Error Handling:** If a step fails:

- Retry once with the same parameters.
- If retry fails, log the failure, mark the step as blocked, and notify the Primary Orchestrator.
- The Primary Orchestrator decides: re-scope, substitute executor, or escalate to human.

### SOP-03: Review & Pass/Fail

**Purpose:** Evaluate completed work against defined KPIs and quality gates.

**Steps:**

1. **Define Evaluation Window per Objective** — Each objective type has a natural evaluation cadence:
   - Growth objectives (audience, revenue): weekly evaluation
   - Campaign objectives (email, ads): daily evaluation
   - Infrastructure objectives (uptime, latency): continuous monitoring with hourly rollups
   - Build objectives (features, fixes): per-completion evaluation

2. **Collect KPIs from Analytics/Logs** — Pull metrics from the relevant data sources. Use the Tool/MCP Registry to access analytics APIs, log aggregators, and monitoring systems. Raw data is collected before interpretation.

3. **Evaluate** — Compare collected KPIs against defined thresholds:
   - **Pass**: KPI is at or above the target threshold. The skill/task is marked complete.
   - **Marginal**: KPI is within 10% of threshold. Flag for monitoring; do not fail yet.
   - **Fail**: KPI is below threshold. Trigger re-scoping or decommissioning.

4. **Record Review** — Write a structured review entry to shared memory containing:
   - Review timestamp and evaluation window
   - KPIs evaluated with actual vs. target values
   - Pass/Marginal/Fail determination per KPI
   - Recommended actions (continue, adjust, re-scope, decommission)
   - Reviewer identity (abstract role, not specific agent name)

**Escalation:** Two consecutive "Fail" evaluations on the same objective trigger automatic escalation to the Primary Orchestrator, which must re-scope or replace the responsible executor.

### SOP-04: Stitch Design Trigger

**Purpose:** Ensure all user-facing changes maintain visual consistency, brand compliance, and UX quality.

**Steps:**

1. **When** — This SOP activates whenever any change affects:
   - UI layout (page structure, component arrangement, responsive behavior)
   - User flows (navigation paths, form sequences, onboarding steps)
   - Brand expression (colors, typography, imagery, tone of microcopy)
   - Motion/animation (transitions, reveals, loading states)

2. **What** — The `stitch_design` hook is called with:
   - Screen or flow context (which page/component, what state)
   - Target platform (web, mobile, CLI, API response format)
   - Brand tokens (color palette, typography scale, spacing system, motion tokens)
   - Existing design system components available for reuse

3. **Constraints** — The stitch_design hook:
   - CAN propose layouts, components, microcopy, animation sequences, and responsive breakpoints.
   - CAN reference and compose existing design system components.
   - CANNOT change platform identity (domain, branding, naming).
   - CANNOT change role definitions or executor assignments.
   - CANNOT change system architecture or infrastructure configuration.
   - MUST use established motion tokens — no magic numbers for durations, easing, or spring values.
   - MUST respect `prefers-reduced-motion` in all animation proposals.

4. **Output** — A design proposal artifact containing:
   - Annotated layout sketch or component tree
   - Token references (not raw values)
   - Accessibility notes (contrast, focus order, screen reader labels)
   - Approval status (pending review by Review Executor)

---

## 1.3 GSD (Get Shit Done) Bridge

### Purpose

The GSD Bridge is the neutral checkpoint between "big idea" plans and actual executor steps. It exists to prevent scope creep, skill overload, tool misuse, and evidence-free claims. Every plan passes through the GSD Bridge before execution begins.

### Inputs

| Input | Source | Description |
|---|---|---|
| Intent Statement | SOP-01 Step 1 | Single-line description of what the user wants |
| Draft Plan Outline | SOP-01 Step 3 | Ordered steps with roles, tools, and expected I/O |
| Active SOP ID | SOP-01 Step 4 | Which SOP is governing this planning cycle |
| Skill Registry Snapshot | Skill files | Current state of all registered skills and their ownership |

### Outputs

| Output | Consumer | Description |
|---|---|---|
| Tight Plan Outline | SOP-01 Step 5 | Pruned, validated, executable plan |
| Goal-to-Skills-to-Tools Mapping | Execution Loop | Traceability from user goal through skills to tool calls |
| Rejected Skills List | Primary Orchestrator | Skills that were proposed but removed, with reasons |
| Optional Clarifying Questions | Primary Orchestrator | Questions to resolve ambiguity before committing |

### Checks

The GSD Bridge performs four mandatory checks on every plan:

#### Check 1: Goal Alignment

Every step and every skill in the plan must support at least one KPI tied to the original Intent Statement. If a step cannot be traced to a KPI, it is removed.

- **Input:** Draft Plan Outline + KPI definitions from skill files
- **Output:** Pruned plan with orphan steps removed
- **Failure mode:** If pruning removes more than 50% of steps, reject the plan and request re-scoping

#### Check 2: Skill Budget Enforcement

Each executor in the plan is checked against the Narrowness Standard (Section 1.1):

- No executor owns more than 7-10 active skills for this plan.
- No executor serves more than one primary objective.
- No executor tracks more than 5 KPIs.

If any executor exceeds limits:

- **Auto-fix:** Split the overloaded executor's responsibilities across two executors.
- **If split is not possible:** Move excess skills to a parking lot and flag for later.
- **Output:** Updated plan with correct executor-to-skill ratios.

#### Check 3: Tool Registry Consistency

Every tool referenced in the plan must:

- Exist in the Tool/MCP Registry (Section 1.4).
- Be permitted for the role that will call it.
- Be available (not deprecated, not over quota, not restricted for the current vertical/tenant).

If a tool is missing or restricted:

- **Auto-fix:** Suggest an alternative tool from the registry.
- **If no alternative:** Flag the step as blocked and request human resolution.
- **Output:** Validated tool list with confirmed availability.

#### Check 4: Evidence Pathing

Important claims, metrics, and deliverables in the plan must have a defined evidence path:

- Where will the evidence come from? (API, log, screenshot, artifact hash)
- How will it be stored? (Shared memory, evidence locker, external system)
- Who reviews it? (Which Review Executor)

If a claim has no evidence path:

- **Auto-fix:** Add an evidence-collection step to the plan.
- **If evidence is impossible to collect:** Flag the claim as unverifiable and recommend removing it.
- **Output:** Plan with evidence paths for all significant claims.

### GSD Bridge Flow

```
Intent Statement
       │
       ▼
Draft Plan Outline ──► GSD Bridge
                          │
                ┌─────────┼─────────┐─────────┐
                ▼         ▼         ▼         ▼
          Goal Align  Skill Budget  Tool Reg  Evidence
                │         │         │         │
                └─────────┼─────────┘─────────┘
                          ▼
                   Tight Plan Outline
                          │
              ┌───────────┼───────────┐
              ▼           ▼           ▼
         Plan Commit  Rejected List  Questions
```

---

## 1.4 Tool & MCP Management (Abstract)

### Registry Structure

A single registry document serves as the source of truth for all tools and MCP endpoints available to the platform. Each entry contains:

```yaml
tool:
  name: <Branded abstract tool name>
  endpoint: <URL or MCP address>
  protocol: <HTTP | MCP | gRPC | WebSocket | CLI>
  operations:
    - name: <Operation name>
      method: <GET | POST | PUT | DELETE | CALL>
      schema:
        input: <JSON Schema reference or inline>
        output: <JSON Schema reference or inline>
      idempotent: <true | false>
      cost_units: <Number of billing units per call>
  allowed_roles:
    - <Abstract role types permitted to call this tool>
  vertical_constraints:
    - <Verticals or tenants where this tool is available>
  quotas:
    rate_limit: <Calls per minute>
    daily_cap: <Calls per day>
    monthly_cap: <Calls per month>
  status: <active | deprecated | restricted | coming_soon>
  notes: <Free-text notes on usage, caveats, alternatives>
```

### Registry Rules

1. **Single source of truth.** There is exactly one registry. No shadow registries, no hardcoded endpoints in skill files.
2. **Abstract names only.** The registry uses branded abstract tool names. Concrete implementation details (vendor, library, version) are in the `notes` field, not the `name`.
3. **Role-gated access.** Every tool declares which abstract roles may call it. An executor cannot call a tool its role is not listed for.
4. **Vertical/tenant scoping.** Tools may be restricted to specific verticals or tenants. The GSD Bridge checks this during Tool Registry Consistency (Check 3).
5. **Cost tracking.** Every operation declares its cost in abstract billing units. The Primary Orchestrator includes cost estimates in plans. Automation Executors log actual costs per invocation.
6. **Deprecation path.** Tools marked `deprecated` must include a `replacement` field pointing to the successor tool. Skills referencing deprecated tools must be updated within one evaluation cycle.

### Planning Phase

During SOP-01 (Fast Planning), the Primary Orchestrator:

1. Reads the Tool/MCP Registry for tools matching the intent domain.
2. Selects the minimal subset of tools required (fewer tools = simpler plan = fewer failure modes).
3. Records the selection rationale in the Draft Plan Outline.
4. Submits to GSD Bridge for validation.

### Execution Phase

During SOP-02 (Execution Loop), Specialist and Automation Executors:

1. Call only tools declared in the Tight Plan Outline.
2. Use the registry's schema definitions for input validation before calling.
3. Handle errors according to the tool's documented failure modes.
4. Never call a tool not in the plan without re-entering SOP-01.

### Logging

All tool calls are logged with:

| Field | Description |
|---|---|
| Timestamp | ISO 8601 UTC |
| Executor Role | Abstract role type of the caller |
| Tool Name | Registry tool name |
| Operation | Which operation was called |
| Parameters Summary | Sanitized summary (no secrets, no PII) |
| Result Status | success / failure / timeout / rate_limited |
| Cost Units | Actual billing units consumed |
| Duration | Wall-clock time of the call |
| Plan Reference | Which plan step triggered this call |

### MCP (Model Context Protocol) Specifics

MCP endpoints follow the same registry structure with additional fields:

```yaml
mcp_extension:
  transport: <stdio | HTTP SSE | WebSocket>
  capabilities:
    - <tools | resources | prompts | sampling>
  auth: <none | api_key | oauth2 | mTLS>
  context_window: <Max tokens this MCP server handles>
```

MCP tools are called through the same registry interface. The transport layer is abstracted — executors do not need to know whether a tool is HTTP or MCP. The registry adapter handles protocol translation.

---

## 1.5 Agentic Swarms

### Swarm Model

A swarm is a coordinated group of Specialist Executors and Automation Executors operating under a Primary Orchestrator toward a shared high-level goal. Swarms are the mechanism for parallelizing work that a single executor cannot complete alone.

**Composition:**

- **1 Primary Orchestrator** — Owns the master plan, delegates slices, synthesizes results.
- **N Specialist Executors** — Each owns a narrow objective slice of the overall goal. N is typically 2-7 for manageable coordination overhead.
- **M Automation Executors** — Handle scheduled, repetitive, or event-driven tasks within the swarm. M is typically 0-3.
- **1+ Review Executors** — Evaluate swarm outputs before delivery. At least one review gate per swarm.

Each swarm member has:

- A narrow objective slice (subset of the swarm's overall goal)
- Its own KPIs (3-5, derived from the swarm goal)
- A specific memory surface (dedicated section in shared memory for its logs, artifacts, and state)

### Organic Delegation

The Primary Orchestrator delegates work to swarm members based on:

1. **Role capability declarations** — What each executor says it can do (from its skill bundle).
2. **Skills in SKILL.md files** — The concrete skills each executor has registered.
3. **Current workload** — How many active tasks the executor is already handling. Prefer idle executors.
4. **Performance history** — Past KPI achievement rates. Prefer executors with strong track records for similar tasks.

Delegation is organic, not static. The same executor may receive different task types across different plans based on its declared capabilities and current availability.

### Communication Model

Swarm members do NOT communicate through direct dialog, message passing, or function calls to each other. All communication flows through shared memory artifacts:

- **Journals** — Structured logs written by each executor, readable by all.
- **Plan Artifacts** — The Tight Plan Outline and its checkpoints.
- **Data Documents** — Analysis results, collected metrics, generated content.
- **Status Flags** — Per-step completion markers, blocking issues, handoff signals.

This model prevents:

- Circular conversations between executors.
- Lost context from ephemeral messages.
- Ordering dependencies on synchronous communication.

The Primary Orchestrator reads all memory surfaces. Specialist Executors read the master plan and their own memory surface. Cross-reading between Specialist Executors is permitted but not required.

### Swarm Lifecycle

```
Design ──► Instantiate ──► Wire ──► Run ──► Evaluate ──► Act
  │            │            │        │          │          │
  │            │            │        │          │          ├─ Keep (swarm is effective)
  │            │            │        │          │          ├─ Re-scope (adjust objectives)
  │            │            │        │          │          └─ Retire (goal achieved or abandoned)
  │            │            │        │          │
  │            │            │        │          └─ SOP-03 Review & Pass/Fail
  │            │            │        │
  │            │            │        └─ SOP-02 Execution Loop (parallel across members)
  │            │            │
  │            │            └─ Connect members to shared memory, tool registry, notification bus
  │            │
  │            └─ Create executor instances with assigned skills and KPIs
  │
  └─ SOP-01 Fast Planning — determine swarm composition, objectives, skill assignments
```

**Phase Details:**

1. **Design** — During SOP-01, the Primary Orchestrator determines that the intent requires a swarm (single executor insufficient). It designs the swarm composition: how many Specialist Executors, what objective slice each gets, what Automation Executors are needed.

2. **Instantiate** — Create or assign executor instances. Each receives its skill bundle, KPI targets, and memory surface allocation. No work begins yet.

3. **Wire** — Connect all swarm members to shared memory, the Tool/MCP Registry, and the notification system. Verify all connections. Run a health check on each member.

4. **Run** — SOP-02 Execution Loop runs in parallel across all swarm members. Each member works its slice independently, checkpointing to shared memory. The Primary Orchestrator monitors progress and resolves conflicts.

5. **Evaluate** — SOP-03 Review applied to the swarm's overall goal and each member's KPIs. The Review Executor examines both individual and aggregate performance.

6. **Act** — Based on evaluation:
   - **Keep**: Swarm continues operating. No changes.
   - **Re-scope**: Adjust objectives, swap members, reassign skills. Re-enter Design phase for the modified scope.
   - **Retire**: Goal achieved or abandoned. Archive memory surfaces. Release executor instances.

### Swarm Anti-Patterns

- **Hub-and-spoke overload**: Primary Orchestrator becomes a bottleneck. Fix: ensure Specialist Executors can self-coordinate via shared memory.
- **Overlapping objectives**: Two executors compete on the same KPI. Fix: GSD Bridge catches this in Skill Budget Enforcement.
- **Ghost members**: Executor instantiated but never receives work. Fix: evaluate during Run phase; retire idle members.
- **Infinite swarm growth**: Adding executors to fix problems. Fix: cap swarm size at Design phase; split into multiple swarms if needed.

---

## 1.6 OpenClaw DRIVER.md (Abstract Form)

### Purpose

The OpenClaw DRIVER pattern defines how a single-computer agent host operates as a container for Automation and Specialist Executor roles. It is the deployment pattern for self-contained, locally-running executor instances that receive delegation from the Primary Orchestrator.

### Host Role

A DRIVER host is a single-computer agent host functioning as both an Automation Executor and a Specialist Executor container. It:

- Runs one or more executor instances, each with its own skill folder and local memory.
- Provides an HTTP or messaging gateway for the Primary Orchestrator to delegate tasks.
- Manages its own lifecycle (startup, health reporting, graceful shutdown).
- Operates independently when network connectivity to the Primary Orchestrator is interrupted (queues work, syncs when reconnected).

### Design Rules

Each host-agent instance running on a DRIVER host MUST declare:

1. **Primary Objective** — A single sentence describing what this instance exists to accomplish.

2. **KPIs (3-5)** — Measurable metrics tied to the primary objective, each with:
   - Metric name
   - Target value
   - Evaluation cadence (hourly, daily, weekly)
   - Data source (where the measurement comes from)

3. **Skill Bundle (7-10 skills)** — The active skills this instance operates, each with:
   - Skill file path (local markdown file)
   - KPI mapping (which of the 3-5 KPIs this skill serves)
   - Tool dependencies (which registry tools this skill calls)
   - Context requirements (folders, databases, API keys, environment variables)

4. **Required Context** — Explicit declaration of everything the instance needs:
   - Local folders (skill files, data directories, output paths)
   - Database connections (connection strings, schemas, migrations)
   - API keys and credentials (referenced by name, never by value)
   - Environment variables (listed with descriptions, not values)

5. **Skill Storage Format** — Skills stored as markdown files on the local filesystem:

```
driver-host/
├── skills/
│   ├── domain-a/
│   │   └── SKILL.md
│   ├── domain-b/
│   │   └── SKILL.md
│   └── domain-c/
│       └── SKILL.md
├── memory/
│   ├── journal.jsonl        # Structured log (append-only)
│   ├── state.json           # Current executor state
│   └── artifacts/           # Output artifacts
├── config/
│   ├── declaration.yaml     # Objective, KPIs, skill bundle
│   └── tools.yaml           # Local tool registry subset
└── gateway/
    └── server.ts            # HTTP/messaging endpoint for delegation
```

### Memory Pattern

Each DRIVER host maintains a dedicated memory system:

- **Journal Agent** — A lightweight process (or function) that writes structured log entries. The journal is append-only and follows a strict schema:

```json
{
  "timestamp": "ISO 8601 UTC",
  "executor_role": "Specialist | Automation",
  "action": "What was done",
  "skill": "Which skill was active",
  "inputs_summary": "Sanitized input description",
  "outputs_summary": "What was produced",
  "kpi_impact": "Which KPIs were affected and how",
  "status": "success | failure | partial",
  "next": "What should happen next"
}
```

- **Read-Only Context** — Other executors (including the Primary Orchestrator) treat the journal as read-only context. They may query it for status updates, performance history, and artifact references, but they never write to another executor's journal.

- **State File** — A mutable JSON document representing the executor's current state (active task, progress percentage, blocking issues). Updated by the executor, read by the Primary Orchestrator for monitoring.

- **Artifacts Directory** — Output files, generated content, evidence snapshots. Each artifact is hashed (SHA-256) and referenced in the journal for integrity verification.

### Duplication & Sharing

DRIVER instances are designed for easy cloning and configuration sharing:

1. **Clone by Copy** — To create a new instance with similar capabilities, copy the skill folder structure.
2. **Update KPIs** — Modify `config/declaration.yaml` with the new instance's specific objectives and targets.
3. **No Identity Baked In** — The instance's identity comes entirely from its configuration, not from hardcoded values in skill files. Skill files reference abstract role types, not specific agent names.
4. **Shared Skill Libraries** — Multiple DRIVER instances may reference the same skill files (symlinks or shared mounts). KPI targets and context differ per instance even when skills are shared.

**Sharing Rules:**

- Skill files are shareable (read-only reference).
- Memory is never shared (each instance has its own journal, state, and artifacts).
- Configuration is instance-specific (declaration.yaml is unique per instance).
- Tool registry subsets may overlap but are declared independently.

### Scheduling

DRIVER hosts support two scheduling patterns:

1. **Cron-Based Scheduling** — For fixed-time tasks:
   - Health checks (every 5 minutes)
   - Data collection (hourly, daily)
   - Report generation (daily, weekly)
   - Cleanup and archival (weekly, monthly)

   Configured via standard cron syntax in `config/declaration.yaml`:

   ```yaml
   schedules:
     - name: health_check
       cron: "*/5 * * * *"
       skill: infrastructure/health-check
       timeout: 30s
     - name: daily_report
       cron: "0 6 * * *"
       skill: reporting/daily-summary
       timeout: 5m
   ```

2. **Lightweight Repetitive Loops** — For continuous or near-continuous tasks:
   - Queue processing (check every N seconds)
   - Event monitoring (poll or subscribe)
   - Incremental data sync (run until caught up, sleep, repeat)

   Configured via loop definitions:

   ```yaml
   loops:
     - name: queue_processor
       skill: messaging/process-queue
       interval: 10s
       max_iterations: 1000
       backoff: exponential
       idle_sleep: 60s
   ```

**Scheduling Rules:**

- Every scheduled task must reference a registered skill.
- Timeouts are mandatory — no infinite-running scheduled tasks.
- Loops must have a max_iterations cap or a time-based kill switch.
- Cron tasks that fail 3 consecutive times are suspended and flagged for review.
- The Primary Orchestrator can override any schedule via the gateway endpoint.

### Gateway Endpoint

Each DRIVER host exposes a minimal HTTP or messaging gateway:

| Endpoint | Method | Description |
|---|---|---|
| `/health` | GET | Returns instance health, active task, uptime, KPI summary |
| `/delegate` | POST | Accepts a task delegation from the Primary Orchestrator |
| `/status` | GET | Returns current state file content |
| `/journal` | GET | Returns recent journal entries (paginated) |
| `/artifacts/{id}` | GET | Returns a specific artifact by hash |
| `/schedule` | PUT | Updates the scheduling configuration |
| `/shutdown` | POST | Initiates graceful shutdown (completes current task, then stops) |

All endpoints require authentication (API key or mTLS). No anonymous access.

---

## Appendix: Cross-Reference Matrix

| Section | Depends On | Referenced By |
|---|---|---|
| 1.1 Standards | — | All sections |
| 1.2 SOPs | 1.1 (roles, formats) | 1.3 (GSD checks reference SOPs), 1.5 (swarm lifecycle uses SOPs) |
| 1.3 GSD Bridge | 1.1 (narrowness), 1.2 (SOP-01 invokes GSD), 1.4 (tool registry) | 1.2 (SOP-01 Step 4), 1.5 (swarm design) |
| 1.4 Tool & MCP | 1.1 (role-gated access) | 1.3 (Check 3), 1.5 (swarm wiring), 1.6 (DRIVER tool subset) |
| 1.5 Swarms | 1.1 (roles), 1.2 (SOPs), 1.3 (GSD), 1.4 (tools) | 1.6 (DRIVER instances as swarm members) |
| 1.6 DRIVER | 1.1 (roles, formats), 1.4 (tool registry) | 1.5 (swarm instantiation) |

---

*This document is the canonical abstract reference. Concrete executor identities, agent names, and deployment-specific configurations are defined in `AIMS_ROLE_BINDINGS.md`, which maps onto the roles, SOPs, and patterns specified here.*
