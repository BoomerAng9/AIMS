---
name: claude-agent-loop
description: |
  Claude Agent SDK Loop skill defining the 4-step autonomous agent pattern.
  Use when: implementing ACHEEVY orchestration loops, building new agent
  pipelines, or debugging agent execution flow.
role: Primary Orchestrator
intent: Define the 4-step autonomous agent loop (Gather Context, Take Action, Verify Output, Final Output) for ACHEEVY orchestration.
kpis:
  - loop_completion_rate
  - verification_pass_rate
  - context_utilization
status: active
priority: high
triggers:
  - new agent pipeline being built
  - ACHEEVY orchestration logic modified
  - agent loop debugging required
execution: sequential
dependencies: []
---

# Claude Agent SDK Loop

## Overview

The Claude Agent Loop is the foundational execution pattern for ACHEEVY and all autonomous agents within A.I.M.S. Every agent action follows a strict 4-stage loop that ensures context awareness, deliberate action, verified output, and clean delivery.

This pattern is derived from the Claude Agent SDK and adapted for A.I.M.S. platform operations.

## The 4 Stages

### Stage 1: Gather Context

Before taking any action, the agent must build a complete picture of the current state.

- **Read relevant files** — Source code, configuration, documentation, and conversation history.
- **Check system state** — Running containers, service health, recent deployments, error logs.
- **Identify constraints** — User role, resource limits, billing status, compliance requirements.
- **Load skill context** — Applicable skills, hooks, and verticals for the current task.
- **Summarize understanding** — Produce a brief internal summary of what is known before proceeding.

The agent must NEVER take action based on assumptions. If context is ambiguous, ask the user or query the system.

### Stage 2: Take Action

Execute the planned operation with precision.

- **Single responsibility** — Each action should do one thing well. Avoid compound operations.
- **Idempotent when possible** — Actions should be safe to retry without side effects.
- **Log intent** — Before executing, log what the agent intends to do and why.
- **Respect gates** — If the action requires human approval (deployment, billing, deletion), pause and request it.
- **Capture output** — Store the raw result of every action for the verification stage.

### Stage 3: Verify Output

Never trust that an action succeeded just because it did not throw an error.

- **Check return values** — Verify status codes, output content, and side effects.
- **Run health checks** — After deployments, run health checks against the target service.
- **Compare against expectations** — Does the output match what was expected given the context from Stage 1?
- **ORACLE gates** — For FDH pipeline tasks, pass output through the 8-gate ORACLE verification.
- **Rollback on failure** — If verification fails, undo the action and report the failure clearly.

### Stage 4: Final Output

Deliver the result to the user or the next stage in the pipeline.

- **Summarize what was done** — Clear, concise description of the action and its result.
- **Include evidence** — Attach logs, screenshots, diffs, or health check results.
- **State next steps** — If this is part of a multi-step workflow, indicate what comes next.
- **Update state** — Mark tasks as complete, update conversation state, emit events.
- **Clean up** — Remove temporary files, close connections, release locks.

## Implementation Guidelines

1. **Every agent inherits this loop** — Whether it is ACHEEVY, a Boomer_Ang, or a Lil_Hawk, the 4-stage pattern applies.
2. **Loops can nest** — A single Stage 2 action may itself trigger a sub-agent that runs its own 4-stage loop.
3. **Timeouts are mandatory** — Every stage must have a timeout. Default: 30s for context, 60s for action, 30s for verify, 10s for output.
4. **Failures escalate** — If a loop fails after retry, it escalates to the next level in the agent hierarchy (Lil_Hawk -> Boomer_Ang -> ACHEEVY -> Human).
5. **Telemetry** — Every loop execution emits timing and success/failure metrics for KPI tracking.

## Loop Diagram

```
 [1. Gather Context]
        |
        v
  [2. Take Action]
        |
        v
 [3. Verify Output] --fail--> [Retry / Escalate]
        |
      pass
        |
        v
  [4. Final Output]
```
