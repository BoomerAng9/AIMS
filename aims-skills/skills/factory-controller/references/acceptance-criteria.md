# Acceptance Criteria — factory-controller

## Functional Requirements

### FR-1: Execution Modes
- [ ] Reactive mode responds to user messages only
- [ ] Proactive mode detects events and proposes actions (waits for approval)
- [ ] Autonomous mode detects, decides, and executes within policy bounds
- [ ] Default mode for new sessions is Proactive
- [ ] Autonomous mode requires explicit owner opt-in per event category

### FR-2: Event Source Monitoring
- [ ] GitHub webhooks are received and processed in real-time
- [ ] Docker health events are polled every 30 seconds
- [ ] Nginx access log anomalies (5xx spikes, latency) are detected within 60 seconds
- [ ] LUC billing events (quota exceeded, payment failed) are polled every 5 minutes
- [ ] Plug lifecycle events (deploy, health fail, scale) are processed in real-time
- [ ] ACHEEVY chat events (user request, escalation) are processed in real-time
- [ ] Scheduled cron events (daily report, weekly audit) fire on schedule

### FR-3: Auto-Approve Policy
- [ ] Read/Query actions are auto-approved without escalation
- [ ] Health check remediation is auto-approved with escalation after 3 failed retries
- [ ] Container restarts are auto-approved with escalation on restart loops > 2
- [ ] Deploy (staging and production) requires owner approval
- [ ] Scale-up is auto-approved with cost threshold escalation
- [ ] Scale-down, delete, and billing changes always require owner approval
- [ ] Policy is configurable per action category via `factory.policy.update()`

### FR-4: Overseer Pattern
- [ ] Overseer runs independently every 5 minutes
- [ ] Overseer checks: heartbeat, event backlog, auto-approve audit
- [ ] 3 missed consecutive heartbeats trigger owner alert and fallback to reactive mode

### FR-5: Manage It / Guide Me
- [ ] "Manage It" mode enables full autonomous action within policy
- [ ] "Guide Me" mode explains each step and waits for user confirmation
- [ ] Mode is toggleable per-session and per-action
- [ ] Default for new users is "Guide Me"

### FR-6: ACHEEVY Actions
- [ ] `factory.watch(source)` registers new event sources
- [ ] `factory.unwatch(source)` stops monitoring
- [ ] `factory.status()` reports mode, active pipelines, and event backlog
- [ ] `factory.policy.update()` modifies auto-approve policy
- [ ] `factory.escalate()` manually escalates an event

### FR-7: LUC Billing Integration
- [ ] FDH pipeline runs consume LUC credits based on complexity
- [ ] Auto-approved actions consume credits silently
- [ ] Proposed actions show estimated cost before approval
- [ ] Exhausted quota drops factory to reactive mode with owner alert

## Non-Functional Requirements

### NFR-1: Performance
- [ ] Event detection latency is under 5 seconds for real-time sources
- [ ] Event detection latency is within 2x polling interval for polled sources

### NFR-2: Reliability
- [ ] Factory Controller recovers automatically from crashes (systemd/Docker restart)
- [ ] Event backlog is persisted — no events lost on restart
- [ ] Overseer detects and remediates Factory Controller failures within 15 minutes

### NFR-3: Security
- [ ] Auto-approve policy cannot be modified by non-owner roles
- [ ] Autonomous mode cannot be enabled by non-owner roles
- [ ] All auto-approved actions are logged with full audit trail

### NFR-4: Observability
- [ ] Factory uptime KPI is tracked and reported
- [ ] Auto-approve accuracy (correct decisions vs. overrides) is tracked
- [ ] Event processing metrics (count, latency, backlog) are dashboarded
