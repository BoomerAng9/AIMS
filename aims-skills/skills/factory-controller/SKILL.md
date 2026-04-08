---
name: factory-controller
description: |
  Factory Controller Always-On Orchestration skill.
  Use when: promoting ACHEEVY from reactive to proactive mode,
  configuring event-driven pipelines, setting auto-approve policies,
  or implementing the overseer pattern.
role: Primary Orchestrator
intent: Promote ACHEEVY from reactive to always-on factory controller that watches events and auto-initiates FDH pipelines.
kpis:
  - event_detection_latency_ms
  - auto_approve_accuracy
  - factory_uptime
status: active
priority: critical
triggers:
  - ACHEEVY mode switch to always-on
  - new event source registered
  - auto-approve policy update
  - factory uptime degradation detected
execution: event-driven
dependencies: []
---

# Factory Controller Always-On Orchestration

## Overview

The Factory Controller transforms ACHEEVY from a reactive chat assistant into an always-on autonomous factory controller. Instead of waiting for user messages, ACHEEVY actively watches event sources, detects actionable signals, and auto-initiates FDH pipelines to resolve them.

This is the operational core of A.I.M.S. as an AI-managed platform.

## Execution Modes

| Mode        | Trigger Source  | Human Gate | Description                                    |
|-------------|-----------------|------------|------------------------------------------------|
| **Reactive**  | User message    | Always     | Traditional chat — user asks, ACHEEVY responds |
| **Proactive** | Event stream    | Per-policy | ACHEEVY detects events and proposes actions    |
| **Autonomous**| Event stream    | Per-policy | ACHEEVY detects, decides, and executes         |

- Default mode: **Proactive** — ACHEEVY proposes but waits for approval on non-trivial actions.
- **Autonomous** mode requires explicit owner opt-in per event category.
- **Reactive** mode is always available as a fallback.

## Factory Loop

```
  +-----------+     +----------------+     +-------------+
  |  Event    | --> | Factory        | --> | FDH         |
  |  Sources  |     | Controller     |     | Pipeline    |
  +-----------+     +----------------+     +-------------+
       ^                   |                      |
       |                   v                      v
       |            +-------------+        +----------+
       +----------- | Auto-Approve| <----- | ORACLE   |
                    | Policy      |        | Verify   |
                    +-------------+        +----------+
```

## Event Sources

| Source              | Event Types                                    | Polling Interval |
|---------------------|------------------------------------------------|------------------|
| GitHub Webhooks     | push, PR opened, PR merged, issue created      | Real-time        |
| Docker Health       | container unhealthy, OOM, restart loop          | 30s              |
| Nginx Access Logs   | 5xx spike, latency spike, new 404 patterns     | 60s              |
| LUC Billing         | quota exceeded, payment failed, plan change     | 5m               |
| Plug Lifecycle      | deploy complete, health check fail, scale event | Real-time        |
| ACHEEVY Chat        | user request, escalation, feedback              | Real-time        |
| Scheduled Cron      | daily report, weekly audit, cert renewal        | Per-schedule     |

## Auto-Approve Policy

The auto-approve policy determines which actions ACHEEVY can take without human confirmation.

| Action Category       | Default Policy | Escalation                    |
|-----------------------|----------------|-------------------------------|
| Read/Query            | Auto-approve   | Never escalates               |
| Health check remediation | Auto-approve | Escalate after 3 failed retries |
| Container restart     | Auto-approve   | Escalate if restart loops > 2 |
| Deploy (staging)      | Propose & wait | Owner approval required       |
| Deploy (production)   | Propose & wait | Owner approval required       |
| Scale up              | Auto-approve   | Escalate if cost > threshold  |
| Scale down            | Propose & wait | Owner approval required       |
| Delete/Decommission   | Propose & wait | Always requires owner approval|
| Billing changes       | Propose & wait | Always requires owner approval|

## Overseer Pattern

The Overseer is a lightweight monitoring loop that runs independently of the Factory Controller.

- **Purpose**: Watch the Factory Controller itself for liveness, correctness, and drift.
- **Interval**: Every 5 minutes.
- **Checks**: Factory loop heartbeat, event backlog size, auto-approve decision audit.
- **Alert**: If the Factory Controller misses 3 consecutive heartbeats, alert the owner and fall back to reactive mode.

## Manage It / Guide Me Integration

Users interact with the Factory Controller through two modes:

- **Manage It** — "Just handle it." ACHEEVY takes full autonomous action within auto-approve policy bounds.
- **Guide Me** — "Walk me through it." ACHEEVY explains each step and waits for user confirmation before proceeding.

The mode can be toggled per-session or per-action. Default for new users: **Guide Me**.

## New ACHEEVY Actions

The Factory Controller adds these actions to ACHEEVY's capability set:

- `factory.watch(source)` — Register a new event source for monitoring.
- `factory.unwatch(source)` — Stop monitoring an event source.
- `factory.status()` — Report current factory state (mode, active pipelines, event backlog).
- `factory.policy.update(category, policy)` — Update auto-approve policy for an action category.
- `factory.escalate(event, reason)` — Manually escalate an event to the owner.

## LUC Billing Integration

All factory-initiated actions are metered through the LUC billing engine:

- Each FDH pipeline run consumes LUC credits based on complexity and model usage.
- Auto-approved actions consume credits silently; proposed actions show estimated cost before approval.
- If the account quota is exhausted, the factory drops to reactive mode and alerts the owner.

For the circuit box controls reference table, see `references/circuit-box-controls.md`.
