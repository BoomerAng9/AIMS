---
id: "owner-only-control-plane"
name: "Owner-Only Control Plane"
type: "skill"
status: "active"
triggers: ["owner", "control plane", "admin", "circuit box owner"]
description: "Circuit Box Owners scope: what only the platform owner can see and control."
execution:
  target: "persona"
priority: "critical"
---

# Owner-Only Control Plane

> The Owner sees everything. The User sees only what they need.

## Owner Capabilities (Circuit Box — Owner View)

| Capability | Description |
|------------|-------------|
| **Full System Map** | All services, providers, and internal connections visible |
| **Provider Management** | Add/remove/configure LLM, TTS, STT, search, and other providers |
| **Policy Levers** | Rate limits, cost caps, tier thresholds, feature flags |
| **Kill Switch** | Halt all operations immediately (`emergency_kill_switch`) |
| **Audit Trail** | Full event log with internal details (agent routing, tool calls, cost) |
| **Telemetry Dashboard** | Latency, token burn, error rates, uptime per service |
| **User Management** | View/manage user tiers, quotas, and access levels |
| **Revenue Metrics** | LUC revenue, subscription status, usage patterns |
| **Security Console** | Anomaly alerts, rate limit violations, suspicious activity |
| **Rollback Controls** | Revert deployments, cancel shifts, restore state |

## What Owners See That Users Don't

| Data | Owner | User |
|------|-------|------|
| Internal service endpoints | Full URLs | Hidden |
| Provider API keys | Masked but accessible | Not visible |
| Cost per operation | Exact breakdown | Hidden |
| Agent routing decisions | Full chain visible | Only outcome |
| LUC calculator internals | Full formula | Only final quote |
| Security multipliers | Numeric values | Hidden |
| Error logs | Full stack traces | "Something went wrong" |
| Other user data | Aggregated metrics | Own data only |

## Access Control

- Owner role is verified at the Gateway level via tenant role check
- Owner endpoints require `TenantRole = 'owner'`
- Owner views are server-rendered with role-gated data fetching
- No client-side hiding — owner data simply isn't sent to non-owner clients
