---
name: factory-swarm
displayName: Factory Swarm — Auto-Wiring & Continuous Operations
version: 1.0.0
role: BOOMER_ANG
status: active
triggers: ["factory swarm", "auto wire", "auto workflow", "continuous ops"]
tags: [factory-swarm, n8n, auto-wire, continuous-ops, circuit-box]
---

# Factory Swarm — Auto-Wiring & Continuous Operations

## Purpose

The Factory Swarm is a Boomer_Ang collective that **automatically creates and updates
n8n workflows, dashboards, and data flows** whenever specs change. Humans see the results
in C1 dashboards; the swarm keeps wiring and re-wiring under the hood.

Circuit Box becomes **policy + safety config only**. The Factory Swarm handles all
operational wiring.

---

## Swarm Composition

The Factory Swarm isn't a single agent — it's a coordinated set of existing Boomer_Angs
operating in factory mode:

| Agent | Factory Role |
|-------|-------------|
| **OpsConsole_Ang** | Swarm Coordinator — monitors all wiring, detects drift |
| **Plug_Ang** | API Wiring — connects services, configures MCP bridges |
| **Bridge_Ang** | Protocol Translation — ensures all services speak the same language |
| **Runner_Ang** | CLI Execution — runs automation scripts, deploys configs |
| **Gatekeeper_Ang** | Policy Enforcement — validates wiring against Circuit Box policies |

---

## Auto-Wiring Triggers

The Factory Swarm activates when:

| Trigger | What Happens |
|---------|-------------|
| **New Plug deployed** | Auto-create monitoring workflow + health check schedule |
| **Spec change detected** | Auto-update affected n8n workflows to match new spec |
| **New chamber created** | Auto-wire FDH pipeline workflows for the chamber |
| **Integration added** | Auto-create data flow between new service and existing stack |
| **Health check failure** | Auto-create remediation workflow (restart → scale → alert) |
| **Threshold crossed** | Auto-update alerting rules and escalation workflows |

---

## n8n Workflow Templates

The Factory Swarm generates n8n workflows from templates:

### Template: FDH Chamber Pipeline
```json
{
  "name": "FDH — {{chamber_name}}",
  "nodes": [
    { "type": "webhook", "name": "Event Trigger", "config": { "path": "/fdh/{{chamber_id}}" } },
    { "type": "function", "name": "Foster — Ingest", "config": { "action": "foster_ingest" } },
    { "type": "httpRequest", "name": "LUC Estimate", "config": { "url": "{{UEF_URL}}/luc/estimate" } },
    { "type": "if", "name": "Auto-Approve Gate", "config": { "condition": "{{luc_amount}} < {{auto_approve_threshold}}" } },
    { "type": "httpRequest", "name": "Develop — Execute", "config": { "url": "{{UEF_URL}}/factory/develop" } },
    { "type": "httpRequest", "name": "Hone — Verify", "config": { "url": "{{UEF_URL}}/factory/hone" } },
    { "type": "httpRequest", "name": "Seal Receipt", "config": { "url": "{{UEF_URL}}/factory/receipt" } },
    { "type": "httpRequest", "name": "Notify User", "config": { "url": "{{UEF_URL}}/notify" } }
  ]
}
```

### Template: Instance Health Monitor
```json
{
  "name": "Health Monitor — {{instance_name}}",
  "nodes": [
    { "type": "cron", "name": "Health Check Schedule", "config": { "interval": "60s" } },
    { "type": "httpRequest", "name": "Check Health", "config": { "url": "http://localhost:{{port}}/health" } },
    { "type": "if", "name": "Healthy?", "config": { "condition": "{{status}} == 200" } },
    { "type": "httpRequest", "name": "Restart Container", "config": { "url": "{{UEF_URL}}/factory/remediate" } },
    { "type": "httpRequest", "name": "Alert User", "config": { "url": "{{UEF_URL}}/notify" } }
  ]
}
```

### Template: Dashboard Data Flow
```json
{
  "name": "Dashboard — {{dashboard_name}}",
  "nodes": [
    { "type": "cron", "name": "Data Refresh", "config": { "interval": "5m" } },
    { "type": "httpRequest", "name": "Collect Metrics", "config": { "url": "{{UEF_URL}}/metrics" } },
    { "type": "function", "name": "Transform Data", "config": { "action": "transform_dashboard" } },
    { "type": "httpRequest", "name": "Update Dashboard", "config": { "url": "{{UEF_URL}}/dashboard/update" } }
  ]
}
```

---

## Circuit Box as Policy Layer

Circuit Box is no longer for toggling tools manually. It's the **policy surface** that
governs what the Factory Swarm does automatically:

### Owner Controls
| Policy | Default | Description |
|--------|---------|-------------|
| `factory.enabled` | `true` | Master switch for Factory Controller |
| `factory.auto_approve_threshold_usd` | `5.00` | Max LUC cost for auto-approved FDH runs |
| `factory.max_concurrent_fdh` | `3` | Max parallel FDH pipelines |
| `factory.hours` | `24/7` | When the factory operates |
| `factory.stall_timeout_minutes` | `15` | Time before stalled jobs escalate |
| `factory.monthly_budget_cap_usd` | `500.00` | Monthly factory budget |
| `factory.event_sources` | `all` | Which event sources trigger FDH |
| `factory.auto_wire_enabled` | `true` | Whether swarm auto-creates n8n workflows |
| `factory.health_remediation` | `restart_then_scale` | Default remediation strategy |

### Policy Enforcement
Gatekeeper_Ang validates every Factory Swarm action against Circuit Box policies:
- Budget check before every FDH run
- Hours check before auto-initiating work
- Concurrent limit check before spawning new FDH
- Event source check before processing triggers

---

## Swarm Coordination Protocol

```
OpsConsole_Ang (Coordinator)
  │
  ├── Detects drift or new event
  │     └── Classifies: needs new wiring? update existing? remediate?
  │
  ├── Dispatches to appropriate agent:
  │     ├── Plug_Ang: API/MCP wiring changes
  │     ├── Bridge_Ang: Protocol translation updates
  │     ├── Runner_Ang: Script/config execution
  │     └── Gatekeeper_Ang: Policy validation
  │
  ├── Collects results
  │     └── Validates all wiring is consistent
  │
  └── Reports to ACHEEVY
        └── Summary: what changed, what was wired, what needs human review
```

---

## Drift Detection

OpsConsole_Ang continuously monitors for **configuration drift** — when running state
doesn't match desired state:

| Drift Type | Detection | Response |
|-----------|-----------|----------|
| **Workflow missing** | Expected n8n workflow not found | Auto-create from template |
| **Config mismatch** | Running config != spec | Auto-update config |
| **Port conflict** | Allocated port in use by wrong service | Reallocate + update nginx |
| **Health degraded** | Instance responding but slow | Scale up + alert |
| **Integration broken** | API endpoint unreachable | Retry → fallback → alert |
| **Budget drift** | Spend trending over budget | Throttle factory + alert |
