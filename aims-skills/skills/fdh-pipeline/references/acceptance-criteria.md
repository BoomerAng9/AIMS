# Acceptance Criteria — fdh-pipeline

## Functional Requirements

### FR-1: Foster Phase
- [ ] Entry criteria validated (clear request, sufficient context)
- [ ] Requirements are clarified with user when ambiguous
- [ ] Scope, agents, tools, cost estimate, and risks are defined
- [ ] Plan is approved by user (Guide Me) or auto-approved (Manage It)
- [ ] All required agents and tools are confirmed available
- [ ] Cost estimate is within budget before proceeding

### FR-2: Develop Phase
- [ ] Entry criteria validated (Foster complete, resources available)
- [ ] Code, configuration, and deployments are executed per plan
- [ ] API integrations are tested during development
- [ ] Incremental progress updates are sent to user
- [ ] All artifacts are produced and stored with evidence hashes
- [ ] Build/deploy succeeds without blocking errors

### FR-3: Hone Phase
- [ ] Entry criteria validated (Develop complete, artifacts produced)
- [ ] ORACLE 8-gate verification runs on all deliverables
- [ ] Bugs found during Hone are fixed and re-verified
- [ ] Security review (Chicken Hawk) is completed
- [ ] BAMARAM receipt is generated on completion

### FR-4: ORACLE 8-Gate Verification
- [ ] Gate 1 (Completeness): All planned deliverables exist
- [ ] Gate 2 (Correctness): Output matches requirements
- [ ] Gate 3 (Consistency): No contradictions between artifacts
- [ ] Gate 4 (Compliance): Security, privacy, and licensing requirements met
- [ ] Gate 5 (Cost): Actual cost within estimated budget
- [ ] Gate 6 (Coverage): Tests cover critical paths
- [ ] Gate 7 (Clarity): Documentation is complete and understandable
- [ ] Gate 8 (Chain): Evidence chain intact (every artifact has provenance)
- [ ] All 8 GREEN = pass; any RED = block; YELLOW = pass with warning

### FR-5: BAMARAM Receipt
- [ ] Receipt includes: Pipeline ID, timestamps, phase statuses, ORACLE results, artifact list, LUC cost, evidence hash
- [ ] Receipt is stored in Evidence Locker
- [ ] Receipt is linked to user's session history

### FR-6: Chamber States
- [ ] Pipeline states are tracked: queued, fostering, developing, honing, completed, failed, paused, cancelled
- [ ] State transitions are validated (no skipping phases)
- [ ] Paused state is entered when waiting for human input in Guide Me mode

### FR-7: Failure Handling
- [ ] Each phase allows up to 3 retries before failing
- [ ] Develop phase failure triggers rollback to last stable state
- [ ] 3rd retry failure escalates: Lil_Hawk -> Boomer_Ang -> ACHEEVY -> Human
- [ ] Every failed pipeline generates a failure report in Evidence Locker

### FR-8: Always-On Loop
- [ ] Factory Controller events can auto-initiate FDH pipelines
- [ ] Foster phase auto-generates plan from event context
- [ ] Pipeline completes and returns to monitoring state

## Non-Functional Requirements

### NFR-1: Performance
- [ ] Phase transition overhead (excluding execution) is under 5 seconds
- [ ] ORACLE 8-gate verification completes within 30 seconds
- [ ] BAMARAM receipt generation is under 2 seconds

### NFR-2: Reliability
- [ ] Pipeline state is persisted — no state loss on restart
- [ ] Concurrent pipelines do not interfere with each other
- [ ] Rollback on Develop failure restores system to pre-pipeline state

### NFR-3: Observability
- [ ] Pipeline completion rate is tracked and reportable
- [ ] Phase transition time is measured and dashboarded
- [ ] ORACLE pass rate is tracked per gate and overall
- [ ] Failed pipelines include detailed failure reports

### NFR-4: Auditability
- [ ] Every phase transition is logged with timestamp and agent
- [ ] ORACLE gate results are individually logged
- [ ] Evidence hashes provide tamper-proof artifact provenance
- [ ] BAMARAM receipts are immutable once issued
