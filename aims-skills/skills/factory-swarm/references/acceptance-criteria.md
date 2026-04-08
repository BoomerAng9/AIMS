# Acceptance Criteria — factory-swarm

## Functional Requirements

### FR-1: Auto-Wiring Triggers
- [ ] Skill file creation or modification triggers workflow generation/update
- [ ] Hook file changes trigger hook node updates in existing workflows
- [ ] Vertical phase changes trigger workflow edge rewiring
- [ ] New tool registration triggers tool node addition
- [ ] Dashboard schema changes trigger query regeneration
- [ ] Manual rewire command triggers full domain rewire

### FR-2: Workflow Generation
- [ ] n8n workflows are generated from parameterized templates
- [ ] Templates support `{{skill_name}}`, `{{trigger_type}}`, `{{action_endpoint}}`, `{{error_channel}}` parameters
- [ ] Generated workflows include trigger, processing, action, and error handler nodes
- [ ] Workflows are validated (dry-run) before activation

### FR-3: Circuit Box Policy
- [ ] Breaker states (Open, Closed, Half-Open) are enforced per workflow
- [ ] Closed -> Open transition on 3 consecutive failures
- [ ] Open -> Half-Open transition after 5-minute cooldown
- [ ] Half-Open -> Closed after 3 consecutive successful dry-runs
- [ ] Manual override to Open state via ACHEEVY or owner

### FR-4: Coordination Protocol
- [ ] Distributed lock (Redis) is acquired before workflow modification
- [ ] Upstream workflow stability is verified before downstream modification
- [ ] Workflow changes are atomic — partial updates roll back
- [ ] `swarm.wired` event is emitted after successful wire/rewire
- [ ] Concurrent conflicts resolved by priority, then recency

### FR-5: Drift Detection
- [ ] Lil_Drift_Hawk compares spec files against n8n workflows every 10 minutes
- [ ] Low severity drift (missing optional node) is logged and queued
- [ ] Medium severity drift (mismatched trigger) is auto-fixed with notification
- [ ] High severity drift (missing workflow) triggers auto-create with alert
- [ ] Critical severity drift (stale logic executing) triggers circuit break and alert

### FR-6: Swarm Agent Roles
- [ ] Wire_Ang orchestrates auto-wiring per domain (one per domain)
- [ ] Lil_Wire_Hawk executes individual workflow creation/update (pooled)
- [ ] Lil_Drift_Hawk monitors for drift (singleton)
- [ ] Lil_Test_Hawk validates via dry-run (pooled)

## Non-Functional Requirements

### NFR-1: Performance
- [ ] Workflow creation latency is under 30 seconds for simple workflows
- [ ] Drift detection cycle completes within 60 seconds

### NFR-2: Reliability
- [ ] Swarm recovers from Redis lock failures with exponential backoff
- [ ] Failed auto-wires are retried up to 3 times before alerting
- [ ] Circuit breaker prevents cascading failures in workflow chains

### NFR-3: Consistency
- [ ] No workflow can exist without a corresponding spec entry
- [ ] No spec change can go unwired for more than 2 drift detection cycles

### NFR-4: Observability
- [ ] Workflow creation latency is tracked per template type
- [ ] Drift detection rate (drifts found per cycle) is reported
- [ ] Auto-wire success rate is tracked and alerted when below threshold
