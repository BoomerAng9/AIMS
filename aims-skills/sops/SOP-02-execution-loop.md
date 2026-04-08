# SOP-02: Execution Loop

> Run steps quickly and consistently once a plan exists.

## Preconditions

- Approved Plan Outline from SOP-01
- Executor assigned to this plan segment
- Required context accessible (files, transcripts, metrics)

## Steps

### Step 1: Load Plan & Context

- Executor loads its assigned plan segment
- Loads required context: files, conversation transcripts, metrics, journal entries
- Verifies all required tools/MCPs are accessible

### Step 2: Choose Minimal Next Action

- Pick the smallest next action that meaningfully advances the objective
- Prefer actions with clear, verifiable outputs
- Avoid scope creep — stick to the plan

### Step 3: Autonomous Tool Invocation

Call tools/MCPs from the registry without human prompting when:
- Pre-conditions match (per skill's `trigger` and `pre_gsd` hooks)
- Tenant/vertical permissions allow their use
- LUC budget has not been exceeded

Stop and escalate when:
- HITL gate is triggered (destructive actions, external messaging)
- Budget threshold reached
- Unexpected errors or ambiguous results

### Step 4: Checkpoint & Log

Log the following after each action:
- What was done (action type, tool used)
- What changed (files modified, data created, state transitions)
- What is expected next (next step, dependencies)
- Metrics or artifacts produced (evidence for gates)

### Step 5: Handoff or Re-loop

- If the executor's part is complete → tag another role to continue
- If more steps remain → loop back to Step 2
- If blocked → escalate to Primary Orchestrator with context
- If recurring → schedule via Automation Executor (cron/n8n)

## Integration Points

- **Conversation State Hook:** `aims-skills/hooks/conversation-state.hook.ts`
- **Chain of Command Hook:** `aims-skills/hooks/chain-of-command.hook.ts`
- **Automations Hook:** `aims-skills/hooks/automations.hook.ts`
- **Gateway Enforcement Hook:** `aims-skills/hooks/gateway-enforcement.hook.ts`

## Evidence Requirements

Every execution loop iteration MUST produce at least one artifact:
- Code change (commit hash)
- Data output (file, DB record)
- Metric reading (KPI value)
- Status update (log entry)

No proof, no done.
