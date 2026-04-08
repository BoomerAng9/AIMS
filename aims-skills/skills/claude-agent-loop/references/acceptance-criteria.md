# Acceptance Criteria — claude-agent-loop

## Functional Requirements

### FR-1: Stage 1 — Gather Context
- [ ] Agent reads all relevant files, configs, and conversation history before acting
- [ ] System state (containers, health, errors) is checked before action
- [ ] User role, resource limits, and billing status are verified
- [ ] Applicable skills, hooks, and verticals are loaded
- [ ] Internal summary is produced before proceeding to Stage 2
- [ ] Ambiguous context triggers a clarification request instead of assumption

### FR-2: Stage 2 — Take Action
- [ ] Each action performs a single responsibility
- [ ] Intent is logged before execution
- [ ] Human approval gates are respected (deploy, billing, deletion)
- [ ] Raw output of every action is captured for verification

### FR-3: Stage 3 — Verify Output
- [ ] Return values and status codes are checked
- [ ] Health checks run after deployments
- [ ] Output is compared against expectations from Stage 1
- [ ] FDH pipeline tasks pass through ORACLE 8-gate verification
- [ ] Failed verification triggers rollback

### FR-4: Stage 4 — Final Output
- [ ] Clear summary of what was done is delivered to user
- [ ] Evidence (logs, diffs, screenshots) is attached
- [ ] Next steps are indicated for multi-step workflows
- [ ] Conversation state and task status are updated
- [ ] Temporary files and resources are cleaned up

### FR-5: Loop Mechanics
- [ ] All agents (ACHEEVY, Boomer_Ang, Lil_Hawks) inherit the 4-stage pattern
- [ ] Nested loops are supported (Stage 2 can trigger sub-agent loops)
- [ ] Failed loops escalate through the hierarchy: Lil_Hawk -> Boomer_Ang -> ACHEEVY -> Human

## Non-Functional Requirements

### NFR-1: Performance
- [ ] Stage timeouts enforced: Context 30s, Action 60s, Verify 30s, Output 10s
- [ ] Loop overhead (excluding action execution) is under 5 seconds

### NFR-2: Reliability
- [ ] Each stage has retry logic (max 3 attempts) before escalation
- [ ] Timeout failures produce clear error messages, not silent hangs

### NFR-3: Observability
- [ ] Every loop execution emits timing metrics (per-stage duration)
- [ ] Success/failure rate is tracked per agent and per stage
- [ ] Loop completion rate KPI is reportable in dashboards

### NFR-4: Testability
- [ ] Each stage can be tested independently with mock inputs
- [ ] End-to-end loop tests exist for critical paths (deploy, health check, scale)
