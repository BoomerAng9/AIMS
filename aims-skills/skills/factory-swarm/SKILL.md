---
name: factory-swarm
description: |
  Factory Swarm Auto-Wiring skill for automated workflow creation.
  Use when: specs change and workflows need updating, n8n workflows
  need auto-generation, dashboard data flows drift from source of truth,
  or new integrations require wiring.
role: Specialist Executor
intent: Automatically create and update n8n workflows, dashboards, and data flows when specs change.
kpis:
  - workflow_creation_latency_ms
  - drift_detection_rate
  - auto_wire_success_rate
status: active
priority: high
triggers:
  - spec file changed (skills, hooks, verticals)
  - new integration registered
  - drift detected between workflow and spec
  - manual rewire requested
execution: event-driven
dependencies: []
---

# Factory Swarm Auto-Wiring

## Overview

The Factory Swarm is the automation layer that keeps all workflows, dashboards, and data flows in sync with the platform's source-of-truth specifications. When a skill, hook, or vertical changes, the Swarm detects the change and auto-wires the corresponding n8n workflows, monitoring dashboards, and data pipelines.

This eliminates manual workflow maintenance and ensures the platform's operational infrastructure always reflects the current spec.

## Swarm Composition

| Agent Role          | Responsibility                                     | Count   |
|---------------------|----------------------------------------------------|---------|
| Wire_Ang (Boomer)   | Orchestrates auto-wiring for a domain              | 1 per domain |
| Lil_Wire_Hawk       | Executes individual workflow creation/update        | N (pooled)   |
| Lil_Drift_Hawk      | Monitors for spec-to-workflow drift                 | 1 (singleton)|
| Lil_Test_Hawk       | Validates wired workflows via dry-run               | N (pooled)   |

## Auto-Wiring Triggers

| Trigger                        | Source                    | Action                                   |
|--------------------------------|---------------------------|------------------------------------------|
| Skill file created/modified    | Git push / file watcher   | Generate or update n8n workflow           |
| Hook file created/modified     | Git push / file watcher   | Update hook trigger nodes in workflows    |
| Vertical phase change          | ACHEEVY state machine     | Rewire Phase A -> Phase B workflow edges  |
| New tool registered            | Tool registry update      | Add tool node to relevant workflows       |
| Dashboard schema change        | Config file change        | Regenerate dashboard data queries         |
| Manual rewire command          | ACHEEVY chat / API        | Full rewire of specified domain           |

## n8n Workflow Templates

The Swarm uses template-based workflow generation. Each template defines:

- **Trigger node** — What starts the workflow (webhook, cron, event).
- **Processing nodes** — Transform, filter, enrich data.
- **Action nodes** — API calls, deployments, notifications.
- **Error handler** — Standardized error capture and escalation.

Templates are stored in `aims-skills/swarm/templates/` and are parameterized with:
- `{{skill_name}}` — The skill being wired.
- `{{trigger_type}}` — How the workflow is triggered.
- `{{action_endpoint}}` — The target API endpoint.
- `{{error_channel}}` — Where errors are routed (Slack, email, ACHEEVY).

## Circuit Box Policy Layer

Every auto-wired workflow is governed by the Circuit Box policy:

- **Breaker Open** — Workflow is disabled. No executions allowed.
- **Breaker Closed** — Workflow is active. Normal execution.
- **Breaker Half-Open** — Workflow runs in dry-run mode. Output is logged but not applied.

State transitions:
- Closed -> Open: Triggered by 3 consecutive failures or manual kill switch.
- Open -> Half-Open: After cooldown period (default 5 minutes).
- Half-Open -> Closed: After 3 consecutive successful dry-runs.
- Any -> Open: Manual override via ACHEEVY or owner.

## Coordination Protocol

When multiple swarm agents work on related workflows:

1. **Lock acquisition** — Before modifying a workflow, the agent acquires a distributed lock (Redis).
2. **Dependency check** — Verify that upstream workflows are stable before modifying downstream.
3. **Atomic updates** — Workflow changes are applied as atomic transactions. Partial updates roll back.
4. **Notification** — After a successful wire/rewire, emit a `swarm.wired` event on the event bus.
5. **Conflict resolution** — If two agents target the same workflow, the higher-priority trigger wins. Ties go to the most recent trigger.

## Drift Detection

Lil_Drift_Hawk continuously compares:

- Spec files (skills, hooks, verticals) against their corresponding n8n workflows.
- Expected workflow nodes against actual n8n workflow definitions.
- Dashboard queries against current data schemas.

Drift is classified as:

| Severity | Example                              | Action                          |
|----------|--------------------------------------|---------------------------------|
| Low      | Missing optional node                | Log and queue for next cycle    |
| Medium   | Mismatched trigger configuration     | Auto-fix and notify             |
| High     | Workflow missing entirely            | Auto-create and alert owner     |
| Critical | Workflow executing with stale logic  | Circuit break and alert         |

Detection runs on a configurable interval (default: every 10 minutes).
