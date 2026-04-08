---
name: factory-controller
displayName: Factory Controller — Always-On Orchestration
version: 1.0.0
role: ACHEEVY
status: active
triggers: ["manage it", "always on", "factory", "autonomous", "keep running", "run to completion", "don't stop", "persistent"]
tags: [factory-controller, always-on, orchestration, fdh, manage-it, automation]
---

# Factory Controller — Always-On Orchestration Mode

## Purpose

This skill promotes ACHEEVY from a **reactive orchestrator** (responds when user triggers) to a
**persistent Factory Controller** (watches events, auto-kicks FDH runs, drives to completion).

The user shifts from "commanding tools" to **approver of plans and releases**.
ACHEEVY + the Boomer_Angs become the **default, always-on factory loop** that reacts to specs
and telemetry, while humans set policy in Circuit Box, approve blueprints, and sign off on
BAMARAM receipts.

> This is not a new product. This is A.I.M.S. doing what its name says: **managing services with AI**.

---

## Execution Modes

ACHEEVY operates in two modes, selectable per session or per chamber:

### Mode 1: Reactive (Default Today)
- User sends message → ACHEEVY classifies → routes → executes → responds
- Human drives the conversation
- Already implemented in `orchestrator.ts`

### Mode 2: Factory Controller (Always-On)
- ACHEEVY watches **event sources** and auto-initiates FDH runs
- Human is notified at approval gates only
- Everything runs until complete — ACHEEVY keeps checking or delegates a Boomer_Ang to oversee

```
┌──────────────────────────────────────────────────────────────────────────┐
│  FACTORY CONTROLLER LOOP                                                 │
│                                                                          │
│  1. WATCH    → Poll event sources (git, specs, tickets, telemetry)       │
│  2. DETECT   → Classify event as actionable (new spec, failed health,    │
│                 ticket update, config change, schedule trigger)           │
│  3. PLAN     → Generate FDH manifest (Foster → Develop → Hone)           │
│  4. APPROVE  → Present plan to human (HITL gate) — OR auto-approve       │
│                 if within "Deploy It" lane policy                         │
│  5. EXECUTE  → Kick FDH pipeline — Boomer_Angs + Chicken Hawk            │
│  6. OVERSEE  → Monitor execution via Overseer_Ang or polling loop        │
│                 If stalled → retry. If failed → escalate.                │
│  7. VERIFY   → ORACLE gates + QA/security scans                          │
│  8. RECEIPT  → Seal BAMARAM receipt with proof artifacts                  │
│  9. DELIVER  → Notify human of completion + deploy if approved            │
│  10. LEARN   → Log to audit ledger, update ByteRover RAG                 │
│                                                                          │
│  LOOP BACK TO 1 — always on for active chambers                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Event Sources (What ACHEEVY Watches)

| Source | Events | How |
|--------|--------|-----|
| **Git** | Push to main, PR merged, branch created, tag pushed | GitHub webhook → n8n → Factory Controller |
| **Specs** | New spec file, spec updated, spec approved | Firestore `specs/` collection watch |
| **Tickets** | Ticket created, status changed, assigned | Firestore `tickets/` or external (Linear, GitHub Issues) |
| **Telemetry** | Health check failure, resource threshold, anomaly | Instance Health Sweep → Factory Controller |
| **Schedule** | Cron triggers, recurring tasks, maintenance windows | n8n cron → Factory Controller |
| **User Events** | "Manage It" clicked, automation trigger, manual run | Frontend action → UEF Gateway → Factory Controller |
| **Build Events** | Chicken Hawk build complete, ORACLE pass/fail | Build pipeline → Factory Controller |
| **Deploy Events** | Instance deployed, scaled, decommissioned | Plug Engine → Factory Controller |

---

## Auto-Approve Policy (Deploy It Lane)

Events that match **all** of these criteria are auto-approved (no HITL gate):

- Low OEI (Operational Exposure Index)
- No new integrations or secrets expansion
- Within existing budget allocation
- Standard Plug spin-up from catalog
- Health check remediation (restart, scale)
- Scheduled maintenance tasks

Everything else goes through the **Guide Me lane** → human approves the FDH manifest before execution.

---

## Overseer Pattern

When ACHEEVY kicks an FDH run, it doesn't fire-and-forget. It delegates oversight:

### Option A: ACHEEVY Polling
- ACHEEVY sets a poll interval (default: 30s for active builds, 5m for monitoring)
- Checks `get_shift_status` on each tick
- Escalates if stalled > threshold

### Option B: Overseer Boomer_Ang
- ACHEEVY delegates to `OpsConsole_Ang` to watch the run
- OpsConsole_Ang reports back only on: completion, failure, or stall
- ACHEEVY is free to handle other events concurrently

### Stall Detection
```
IF shift.progress unchanged for > 3 poll cycles:
  → Retry current wave (up to maxRetries from task file)
  → If retries exhausted: escalate to ACHEEVY → human notification
  → If critical: trigger_rollback
```

---

## Integration with Manage It / Guide Me

### "Let ACHEEVY Manage It" Path
When user selects "Manage It" for any task:
1. ACHEEVY enters **Factory Controller mode** for that task/chamber
2. Generates FDH manifest automatically
3. Presents quick summary + cost estimate (LUC)
4. If user approves → runs to completion autonomously
5. User gets notified at: start, key milestones, completion, or if approval needed

### "Guide Me (DMAIC)" Path
When user selects "Guide Me":
1. ACHEEVY stays in **Reactive mode** for that task
2. Walks user through Define → Measure → Analyze → Improve → Control
3. At each step, offers to "hand off to the factory" (switch to Manage It)
4. If user hands off → transitions to Factory Controller mode for remaining steps

### Hybrid: Factory Controller + HITL
For high-stakes work (production deploys, billing changes, data migrations):
1. ACHEEVY runs Factory Controller for Foster + Develop phases
2. Pauses at Hone phase for human review
3. Human approves → ACHEEVY completes deploy + receipt

---

## Circuit Box Integration

Circuit Box becomes the **policy and safety config layer** for Factory Controller:

### Owner-Only Controls (Circuit Box)
| Control | What It Does |
|---------|-------------|
| **Auto-Approve Threshold** | Max LUC cost for auto-approved FDH runs |
| **Factory Hours** | When the factory runs (24/7, business hours, custom) |
| **Event Source Toggles** | Enable/disable which event sources trigger FDH |
| **Stall Timeout** | How long before stalled jobs escalate |
| **Max Concurrent FDH** | How many FDH pipelines can run in parallel |
| **Budget Cap** | Monthly/weekly factory budget cap |
| **Kill Switch** | Emergency halt of all factory operations |

### User-Visible (Deploy Dock)
| Indicator | What It Shows |
|-----------|--------------|
| **Factory Status** | Active / Paused / Idle |
| **Active FDH Runs** | Count + progress bars |
| **Recent Completions** | Last N completed FDH runs with receipts |
| **Pending Approvals** | FDH runs waiting for human sign-off |
| **Factory Cost (Period)** | LUC spend for current billing period |

---

## New ACHEEVY Actions

These actions are added to ACHEEVY's allowed actions:

| Action | Description |
|--------|-------------|
| `START_FACTORY_RUN` | Initiate an FDH pipeline from an event or user request |
| `OVERSEE_FACTORY_RUN` | Monitor an active FDH run (poll or delegate) |
| `AUTO_APPROVE_FDH` | Auto-approve an FDH manifest within Deploy It lane policy |
| `ESCALATE_FACTORY_STALL` | Escalate a stalled FDH run to human |
| `PAUSE_FACTORY` | Temporarily halt all factory operations |
| `RESUME_FACTORY` | Resume factory operations after pause |
| `SET_FACTORY_POLICY` | Update Circuit Box factory policy (owner only) |
| `FACTORY_STATUS_REPORT` | Generate factory status report for user |

---

## LUC Billing for Factory Runs

Factory runs are billed as **machine jobs**, not human sessions:

```
FDH Run Cost = Σ(phase_tokens × model_rate) + compute_hours + storage
  where:
    phase_tokens = Foster tokens + Develop tokens + Hone tokens
    model_rate   = per-model cost per 1K tokens
    compute_hours = container runtime for builds/tests
    storage      = artifact storage (GCS, Docker layers)

ByteRover Discount applies to token costs (same tiers as today)
Factory Priority multiplier: 1.0x (standard), 1.5x (priority), 2.0x (urgent)
```

No human hours. Pure machine utilization.
