---
id: "circuit-box-owners-runbook"
name: "Circuit Box Owners Runbook"
type: "task"
status: "active"
triggers: ["circuit box owner", "owner setup", "admin circuit"]
description: "Step-by-step runbook for the Circuit Box Owner view: full system map, telemetry, policy controls."
execution:
  target: "internal"
priority: "high"
---

# Circuit Box — Owners Runbook

## Overview
The Owner Circuit Box is the full operational nerve center. It shows every service, connection, and metric.

## Setup Checklist

### 1. Provider Registration
- [ ] Register all LLM providers (OpenRouter, Claude, Vertex)
- [ ] Register voice providers (ElevenLabs, Deepgram, Groq)
- [ ] Register search providers (Brave, Tavily, Serper)
- [ ] Register data services (Firebase, Redis, Prisma)
- [ ] Register comms providers (Resend, Telegram, Discord)
- [ ] Register payment provider (Stripe)

### 2. Wiring Configuration
- [ ] Define connection topology between services
- [ ] Set fallback chains (primary → fallback for each category)
- [ ] Configure health check endpoints for each service
- [ ] Set up telemetry collection (latency, error rate, token usage)

### 3. Policy Configuration
- [ ] Set rate limits per service
- [ ] Set cost caps per user tier (free/starter/pro/enterprise)
- [ ] Configure approval thresholds (when does "Guide Me" lane activate?)
- [ ] Set up anomaly detection thresholds

### 4. Kill Switch Verification
- [ ] Verify kill switch is wired to all active services
- [ ] Test kill switch in staging (confirm all operations halt)
- [ ] Document kill switch recovery procedure

### 5. Audit Trail
- [ ] Verify all service calls emit audit events
- [ ] Confirm triple audit (platform, user, web3-ready) is active
- [ ] Set retention policy for audit logs

## Daily Operations

| Task | Frequency | Action |
|------|-----------|--------|
| Health check | Continuous | Automated — check Circuit Box for amber/red nodes |
| Cost review | Daily | Review LUC burn rate, check for anomalies |
| Security scan | Daily | Check anomaly dashboard for unusual patterns |
| Telemetry review | Weekly | Review latency trends, error rate trends |

## Troubleshooting

| Symptom | Check | Action |
|---------|-------|--------|
| Node is red | Health endpoint failing | Check provider status page, rotate to fallback |
| High latency | Telemetry dashboard | Check if provider is degraded, consider rate limiting |
| Cost spike | LUC burn rate | Check for runaway loops, apply cost cap |
| Anomaly alert | Security console | Review event, escalate if suspicious |
