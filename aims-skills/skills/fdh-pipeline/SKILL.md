---
name: fdh-pipeline
description: |
  FDH Pipeline (Foster/Develop/Hone) skill for driving work to completion.
  Use when: starting new projects, executing multi-phase development work,
  running ORACLE verification gates, or tracking pipeline state.
role: Primary Orchestrator
intent: Drive work to completion through three mandatory phases with defined entry criteria, agents, tools, and exit gates.
kpis:
  - pipeline_completion_rate
  - phase_transition_time_ms
  - oracle_pass_rate
status: active
priority: critical
triggers:
  - new project or feature initiated
  - phase transition requested
  - ORACLE gate verification needed
  - pipeline state audit
execution: phased
dependencies: []
---

# FDH Pipeline (Foster / Develop / Hone)

## Overview

The FDH Pipeline is the universal execution framework for all non-trivial work in A.I.M.S. Every project, feature, fix, or deployment flows through three mandatory phases: **Foster**, **Develop**, and **Hone**. No work is considered complete until it has passed through all three phases and cleared ORACLE verification.

```
  +----------+     +-----------+     +--------+     +---------+
  |  FOSTER  | --> |  DEVELOP  | --> |  HONE  | --> | COMPLETE|
  | (Plan)   |     | (Build)   |     | (Verify)|    | (Ship)  |
  +----------+     +-----------+     +--------+     +---------+
       |                |                |               |
    Entry            Entry            Entry          ORACLE
    Criteria         Criteria         Criteria       8-Gate
```

## Phase 1: Foster (Plan)

**Purpose**: Define what needs to be built, why, and how.

**Entry Criteria**:
- Clear user request or event trigger
- Sufficient context gathered (Agent Loop Stage 1)

**Activities**:
- Requirements clarification with user (if ambiguous)
- Scope definition and boundary setting
- Agent assignment (which Boomer_Ang and Lil_Hawks are needed)
- Tool selection (which APIs, services, and integrations)
- Effort estimation and LUC cost projection
- Risk identification and mitigation plan

**Exit Gate**:
- Written plan approved by user (Guide Me mode) or auto-approved (Manage It mode)
- All agents and tools confirmed available
- Cost estimate within budget

**Agents**: ACHEEVY (lead), relevant Boomer_Ang (domain expert)

## Phase 2: Develop (Build)

**Purpose**: Execute the plan and produce artifacts.

**Entry Criteria**:
- Foster phase complete with approved plan
- All required resources available (agents, tools, API keys, compute)

**Activities**:
- Code generation, configuration, and deployment
- API integration and testing
- Data pipeline wiring
- Documentation generation
- Incremental progress updates to user

**Exit Gate**:
- All planned artifacts produced
- Unit tests pass (where applicable)
- No blocking errors in build/deploy
- Artifacts stored with evidence hashes

**Agents**: Boomer_Ang (manager), Lil_Hawks (workers), ACHEEVY (oversight)

## Phase 3: Hone (Verify & Polish)

**Purpose**: Verify quality, fix issues, and prepare for delivery.

**Entry Criteria**:
- Develop phase complete with all artifacts produced
- Build/deploy succeeded without blocking errors

**Activities**:
- ORACLE 8-gate verification (see below)
- Bug fixes and polish
- Performance optimization
- Security review (Chicken Hawk)
- User acceptance testing (if in Guide Me mode)
- BAMARAM receipt generation

**Exit Gate**:
- ORACLE 8-gate pass (all gates green)
- User accepts delivery (Guide Me) or auto-accepted (Manage It)
- BAMARAM receipt issued

**Agents**: ACHEEVY (lead), Chicken Hawk (security), ORACLE (verification)

## ORACLE 8-Gate Verification

Every FDH pipeline completion must pass through the ORACLE's 8 verification gates:

| Gate | Name           | Check                                                    |
|------|----------------|----------------------------------------------------------|
| 1    | **Completeness** | All planned deliverables exist                          |
| 2    | **Correctness**  | Output matches requirements (functional test)           |
| 3    | **Consistency**  | No contradictions between artifacts                     |
| 4    | **Compliance**   | Meets security, privacy, and licensing requirements     |
| 5    | **Cost**         | Actual cost within estimated budget                     |
| 6    | **Coverage**     | Tests cover critical paths                              |
| 7    | **Clarity**      | Documentation is complete and understandable            |
| 8    | **Chain**        | Evidence chain is intact (every artifact has provenance)|

**Pass criteria**: All 8 gates must be GREEN. Any RED gate blocks completion. YELLOW gates allow completion with a logged warning.

## BAMARAM Receipt

Upon pipeline completion, a BAMARAM receipt is generated:

```
BAMARAM RECEIPT
===============
Pipeline ID:    fdh-<uuid>
Started:        <timestamp>
Completed:      <timestamp>
Phases:         Foster (OK) -> Develop (OK) -> Hone (OK)
ORACLE:         8/8 PASS
Artifacts:      <list of produced files/deployments>
Cost (LUC):     <credits consumed>
Evidence Hash:  <SHA-256 of all artifacts>
```

The receipt is stored in the Evidence Locker and linked to the user's session history.

## Always-On Loop

In Factory Controller mode, the FDH pipeline runs continuously:

1. Factory Controller detects an event.
2. Factory Controller initiates an FDH pipeline with the event as input.
3. Foster phase auto-generates a plan from the event context.
4. Develop phase executes the plan.
5. Hone phase verifies and delivers.
6. Loop returns to monitoring.

## Chamber States

Each pipeline instance exists in one of these states:

| State       | Description                                          |
|-------------|------------------------------------------------------|
| `queued`    | Pipeline created, waiting for resources              |
| `fostering` | In Foster phase                                     |
| `developing`| In Develop phase                                    |
| `honing`    | In Hone phase                                       |
| `completed` | All phases passed, BAMARAM receipt issued            |
| `failed`    | A phase failed and could not be retried              |
| `paused`    | Waiting for human input (Guide Me gate)              |
| `cancelled` | Manually cancelled by user or owner                  |

## Failure Handling

- **Retry**: Each phase allows up to 3 retries before failing.
- **Rollback**: On Develop phase failure, rollback to last stable state.
- **Escalation**: On 3rd retry failure, escalate to next level (Lil_Hawk -> Boomer_Ang -> ACHEEVY -> Human).
- **Post-mortem**: Every failed pipeline generates a failure report stored in the Evidence Locker.

For detailed manifest and artifact YAML schemas, see `references/manifest-schemas.md`.
