# SOP-03: Review & Pass/Fail

> Evaluate executor performance against KPIs and decide: keep, re-scope, or retire.

## Preconditions

- Executor has completed at least one full evaluation window
- KPI data is collected and accessible
- Review Executor is assigned

## Steps

### Step 1: Define Evaluation Window

Set the evaluation window based on objective type:

| Objective Type | Window | Example |
| --- | --- | --- |
| Growth / acquisition | Weekly | YouTube subscribers, sign-ups |
| Email campaigns | Daily | Open rate, click-through, conversions |
| Infrastructure | Per-incident + weekly | Uptime, response time, error rate |
| Content production | Per-batch | Completion rate, quality score |
| Security | Continuous + monthly | Vulnerability count, patch latency |

### Step 2: Collect KPIs

- Pull metrics from analytics, logs, or monitoring into a consistent schema
- Normalize across evaluation windows
- Source data from: role card `evaluation.kpis`, LUC usage records, audit ledger

### Step 3: Evaluate

**Pass:** KPIs within or above thresholds for the evaluation window.
- Mark the executor's configuration as performing
- Continue with current skill set and objective

**Fail:** KPIs below thresholds over M consecutive windows (M ≥ 2).
- Trigger one of:
  - **Re-scope:** Narrow the objective, reduce skill count, adjust KPI targets
  - **Reassign:** Move skills to a different executor configuration
  - **Retire:** Decommission this particular executor configuration

### Step 4: Record Review

Store structured review entries in shared memory:
- Executor role (abstract) and bound identity (if applicable)
- Evaluation window dates
- KPI values vs. thresholds
- Decision: pass / re-scope / reassign / retire
- Rationale (brief)

Other executors can read these reviews to inform their own decisions.

## Integration Points

- **Role Cards:** `aims-skills/chain-of-command/role-cards/*.json` — KPI definitions
- **LUC Engine:** `aims-skills/luc/luc-adk.ts` — usage and cost tracking
- **Audit Ledger:** `aims-skills/acheevy-verticals/audit-ledger.ts` — event logging
