# Skill: spawn-agent

> Deployment Hub — Spawn Boomer_Angs and Lil_Hawks on demand under ACHEEVY's delegation.

## Trigger
- ACHEEVY determines a task requires a specific Boomer_Ang or Lil_Hawk
- Admin requests agent deployment via Dashboard or CLI
- Autonomous environment event requires agent participation
- Per|Form Platform requests agent for a performance session

## Overview

The Deployment Hub is ACHEEVY's agent factory. It creates (spawns), configures, and
deploys Boomer_Angs and Lil_Hawks to fulfill tasks, staff verticals, or participate
in autonomous environments. Every spawned agent gets:

1. A **Role Card** — identity, capabilities, chain-of-command, gates
2. A **Brain File** — technical scope, security policy, guardrails
3. A **Visual Identity** — per the BOOMER_ANG_VISUAL_IDENTITY.md spec
4. An **Audit Trail Entry** — who spawned it, when, why, for what task

## Spawn Types

### 1. Boomer_Ang Spawn
Boomer_Angs are persistent capability owners. They are NOT ephemeral — once spawned,
they remain active until explicitly decommissioned by ACHEEVY.

```
spawn_type: BOOMER_ANG
required_by: ACHEEVY only
role_card: aims-skills/chain-of-command/role-cards/{handle}.json
brain_file: aims-skills/brains/{HANDLE}_BRAIN.md
visual_spec: aims-skills/brains/BOOMER_ANG_VISUAL_IDENTITY.md
deployment: Docker container or Cloud Run Job (per brain file)
```

### 2. Lil_Hawk Spawn
Lil_Hawks are task-scoped workers dispatched by Chicken Hawk under Boomer_Ang
supervision. They can be ephemeral (single task) or persistent (squad rotation).

```
spawn_type: LIL_HAWK
required_by: Chicken Hawk (delegated from ACHEEVY → Boomer_Ang → Chicken Hawk)
role_card: aims-skills/chain-of-command/role-cards/{handle}.json
visual_spec: BOOMER_ANG_VISUAL_IDENTITY.md (Lil_Hawk section)
deployment: Ephemeral container or process within parent Boomer_Ang's service
```

### 3. Autonomous Environment Spawn
Agents sent to LiveSim, Per|Form Platform, or Dojo environments. These are
time-bounded and return to the Deployment Hub when the session ends.

```
spawn_type: AUTONOMOUS_SESSION
required_by: ACHEEVY or Simulation Conductor
agents: [Boomer_Ang handles]
environment: LIVESIM | PERFORM_PLATFORM | DOJO | SANDBOX
session_duration: bounded (max defined per environment)
```

## Spawn Flow

```
┌──────────────┐
│   ACHEEVY    │  1. Receives task or environment request
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ CLASSIFY     │  2. Determines required agent type and capability
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ LOAD CARD    │  3. Loads role card from chain-of-command/role-cards/
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ LOAD BRAIN   │  4. Loads brain file for technical scope and guardrails
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ APPLY VISUAL │  5. Applies visual identity (accent color, helmet, description)
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ GATE CHECK   │  6. Validates: budget, security scope, chain-of-command approval
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ SPAWN        │  7. Deploys container/process with injected config
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ REGISTER     │  8. Registers with OpsConsole_Ang for observability
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ AUDIT LOG    │  9. Creates audit trail entry (who, when, why, task_id)
└──────────────┘
```

## Spawn Payload Schema

```json
{
  "spawn_id": "spawn_<uuid>",
  "spawn_type": "BOOMER_ANG | LIL_HAWK | AUTONOMOUS_SESSION",
  "handle": "Scout_Ang",
  "requested_by": "ACHEEVY",
  "task_id": "task_<uuid>",
  "environment": "PRODUCTION | LIVESIM | PERFORM_PLATFORM | DOJO | SANDBOX",
  "role_card_path": "aims-skills/chain-of-command/role-cards/scout-ang.json",
  "brain_file_path": "aims-skills/brains/SCOUT_ANG_BRAIN.md",
  "visual_identity": {
    "accent_color": "#22D3EE",
    "helmet_style": "Slim recon visor with antenna array",
    "ang_placement": "chest_plate"
  },
  "budget_cap_usd": 2.00,
  "session_duration_max_s": null,
  "gates_passed": ["budget", "security", "chain_of_command"],
  "timestamp": "2026-02-14T00:00:00Z"
}
```

## Delegation Matrix

| Requester    | Can Spawn            | Approval Required       |
|-------------|----------------------|-------------------------|
| ACHEEVY     | Boomer_Ang, Lil_Hawk | None (self-authorized)  |
| Boomer_Ang  | Lil_Hawk (via CH)    | Chicken Hawk dispatch   |
| Chicken Hawk| Lil_Hawk             | Parent Boomer_Ang scope |
| Admin (User)| Any (via ACHEEVY)    | ACHEEVY approval        |

## Per|Form Platform Integration

When agents are sent to the Per|Form Platform:
- They carry their full role card and visual identity
- Performance sessions are time-bounded and scored
- Agents return to the Deployment Hub with a performance report
- Reports feed into Betty-Ann_Ang's evaluation cycle
- Per|Form sessions generate audit trail entries for the evidence chain

## Autonomous Environment Rules

1. Agents in autonomous environments operate under their existing guardrails
2. They cannot exceed their role card's `forbidden_actions` even in simulation
3. Communication with the user still routes through ACHEEVY only
4. Session data is logged by Chronicle_Ang for timeline generation
5. OpsConsole_Ang monitors all autonomous sessions in real-time

## Decommission Flow

```
ACHEEVY → DECOMMISSION_ORDER → Agent stops accepting tasks
  → Drains in-flight work → Evidence sealed → Audit entry closed
  → Container/process terminated → OpsConsole_Ang confirms offline
```

## Available Boomer_Ang Roster

| Handle           | Wraps                        | Port  | Accent   | Status    |
|------------------|------------------------------|-------|----------|-----------|
| Forge_Ang        | AIMS core infra              | —     | Gold     | Active    |
| Betty-Ann_Ang    | HR/PMO governance            | —     | Gold     | Active    |
| AVVA-NOON_Ang    | Operational excellence       | —     | Amber    | Active    |
| Scout_Ang        | ii-researcher                | 7010  | Cyan     | Ready     |
| OpsConsole_Ang   | CommonGround                 | 7011  | Green    | Ready     |
| Chronicle_Ang    | Common_Chronicle             | GCP   | Champagne| Ready     |
| Gatekeeper_Ang   | litellm-debugger             | 7012  | Red      | Ready     |
| Patchsmith_Ang   | codex + codex-as-mcp         | 7013  | Amber    | Ready     |
| Runner_Ang       | gemini-cli + bridge          | 7014  | Cyan     | Ready     |
| Showrunner_Ang   | reveal.js                    | 7015  | Champagne| Ready     |
| Scribe_Ang       | Symbioism-Nextra + TLE       | 7016  | White    | Ready     |
| Lab_Ang          | ii-thought + ii_verl + CoT   | GCP   | Green    | Ready     |
| Index_Ang        | II-Commons                   | —     | Gold     | Ready     |

## Lil_Hawk Squad Template

| Handle                    | Specialty                | Parent Ang        |
|---------------------------|--------------------------|-------------------|
| Lil_Intake_Scribe_Hawk    | Task intake & logging    | Scribe_Ang        |
| Lil_Build_Surgeon_Hawk    | Code surgery & builds    | Patchsmith_Ang    |
| Lil_Deploy_Handler_Hawk   | Deployment execution     | Forge_Ang         |
| Lil_Interface_Forge_Hawk  | UI component work        | Showrunner_Ang    |
| Lil_Motion_Tuner_Hawk     | Animation & motion       | Showrunner_Ang    |
| Lil_Policy_Sentinel_Hawk  | Policy enforcement       | Gatekeeper_Ang    |
| Lil_Proofrunner_Hawk      | Evidence verification    | Chronicle_Ang     |
| Lil_Secret_Keeper_Hawk    | Secrets management       | Gatekeeper_Ang    |
| Lil_Webhook_Ferryman_Hawk | Webhook/integration ops  | Runner_Ang        |
| Lil_Workflow_Smith_Hawk   | n8n workflow building    | OpsConsole_Ang    |
| Lil_Messenger_Hawk        | Notification delivery    | Scribe_Ang        |
| Lil_Attestation_Hawk      | Proof attestation        | Chronicle_Ang     |
| Lil_Chain_Of_Custody_Hawk | Chain-of-custody logging | Betty-Ann_Ang     |

---

*This skill is invoked by ACHEEVY's `spawn_shift` tool. All spawns are logged.
No agent exists without a card. No card exists without an audit entry.*
