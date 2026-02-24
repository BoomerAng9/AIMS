---
id: "cloudflare-workers-mcp"
name: "Cloudflare Workers MCP"
type: "tool"
category: "cloud"
provider: "Cloudflare"
description: "Cloudflare Workers serverless functions via MCP — deploy, manage, and monitor edge functions. Serverless compute layer for webhooks, APIs, and edge logic."
env_vars:
  - "CF_WORKERS_MCP_ENABLED"
mcp_endpoint: "Claude Code Connector (Workers)"
owner: "Buildsmith"
secondary_owners: ["Runner_Ang", "Bridge_Ang"]
---

# Cloudflare Workers MCP — A.I.M.S. Edge Functions

## Overview

Cloudflare Workers MCP gives ACHEEVY and the chain of command the ability to deploy
and manage serverless edge functions. Workers handle webhooks, API proxies, edge
routing, and lightweight compute that doesn't need a full container.

**Owner:** Buildsmith (Build & Deploy)
**Secondary Owners:** Runner_Ang (Runtime), Bridge_Ang (Protocol bridging)
**MCP Transport:** Claude Code Connector (Workers)

## Capabilities

| Capability | MCP Tool | Description |
|-----------|----------|-------------|
| **Deploy Worker** | `workers_deploy` | Deploy a Worker script to Cloudflare edge |
| **List Workers** | `workers_list` | List all deployed Workers |
| **Get Worker** | `workers_get` | Worker metadata, routes, bindings |
| **Delete Worker** | `workers_delete` | Remove a Worker deployment |
| **Get logs** | `workers_tail` | Real-time log tail for debugging |
| **Update bindings** | `workers_update_bindings` | KV, R2, D1, and secret bindings |
| **Manage routes** | `workers_routes` | URL pattern → Worker routing |

## How Each Actor Uses Workers

### ACHEEVY (Orchestrator)
- Deploy webhook receivers for external integrations
- Create edge API proxies for Plug instances
- Monitor Worker health and error rates
- **Can do:** Request deployments, read logs, check status
- **Cannot do:** Delete Workers without HITL approval

### Boomer_Angs (Managers)
| Ang | Workers Usage |
|-----|-------------|
| **Buildsmith** | Write and deploy Worker scripts, manage routes and bindings |
| **Runner_Ang** | Monitor running Workers, tail logs, debug issues |
| **Bridge_Ang** | Create protocol bridge Workers (MCP ↔ REST, webhook translators) |
| **Plug_Ang** | Deploy integration webhook receivers (Paperform, Stripe, etc.) |
| **Gatekeeper_Ang** | Security review Worker code before deployment |

### Chicken Hawk (Coordinator)
- Read Worker logs for task evidence
- Cannot deploy or modify Workers

### Lil_Hawks (Workers)
- Write Worker script code as part of build tasks
- Cannot deploy or manage Workers directly

## Use Cases for A.I.M.S.

### Webhook Receiver
```
External service (Paperform, Stripe, GitHub) sends webhook
  → Cloudflare Worker receives at edge (fast, global)
  → Validates signature/auth
  → Forwards to UEF Gateway on VPS
  → Low latency, DDoS-protected by default
```

### Edge API Proxy
```
User's Plug instance needs a public API
  → Worker handles routing: api.plugmein.cloud/{slug}/*
  → Proxies to VPS container on allocated port
  → Handles CORS, rate limiting, caching at edge
```

### Protocol Bridge
```
Third-party MCP server (non-SSE) needs translation
  → Worker acts as MCP protocol bridge
  → Converts between transports (stdio ↔ SSE ↔ HTTP)
  → Bridge_Ang manages these bridge Workers
```

## When to Use Workers vs Containers vs VPS

| Use Case | Platform | Why |
|----------|----------|-----|
| **Webhook receivers** | Workers | Sub-millisecond cold start, global |
| **API proxies** | Workers | Edge routing, caching, CORS |
| **Full applications** | VPS or CF Containers | Need persistent state or long execution |
| **Protocol bridges** | Workers | Lightweight, always-on, global |
| **Cron jobs** | Workers (Cron Triggers) | Serverless scheduled tasks |

## Security Rules

- Worker scripts must pass Gatekeeper_Ang code review before deployment
- No raw secret access in Worker code — use Cloudflare Secrets bindings
- Worker deletion requires HITL approval
- Route changes to production domains require Boomer_Ang authorization
- All operations are audit-logged
