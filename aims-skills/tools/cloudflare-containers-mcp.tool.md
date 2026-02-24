---
id: "cloudflare-containers-mcp"
name: "Cloudflare Containers MCP"
type: "tool"
category: "cloud"
provider: "Cloudflare"
description: "Cloudflare container deployment and management via MCP — deploy, manage, and monitor containers on Cloudflare's edge. Secondary compute layer for AIMS Plug instances."
env_vars:
  - "CF_CONTAINERS_MCP_ENABLED"
mcp_endpoint: "https://containers.mcp.cloudflare.com/mcp"
owner: "Runner_Ang"
secondary_owners: ["Buildsmith", "Dockmaster_Ang"]
---

# Cloudflare Containers MCP — A.I.M.S. Edge Container Deployment

## Overview

Cloudflare Containers MCP provides container deployment and management on Cloudflare's
global edge network. This is a **secondary compute layer** for A.I.M.S. — complementing
the primary VPS (Hostinger) and GCP Cloud Run for workloads that benefit from edge
distribution, global latency reduction, or burst capacity.

**Owner:** Runner_Ang (Execution & Runtime)
**Secondary Owners:** Buildsmith (Build → Deploy), Dockmaster_Ang (Container registry)
**MCP Endpoint:** `https://containers.mcp.cloudflare.com/mcp`

## Capabilities

| Capability | MCP Tool | Description |
|-----------|----------|-------------|
| **Deploy container** | `cf_containers_deploy` | Deploy a container image to Cloudflare edge |
| **List containers** | `cf_containers_list` | List running containers |
| **Get container** | `cf_containers_get` | Container status, logs, metrics |
| **Stop container** | `cf_containers_stop` | Gracefully stop a running container |
| **Delete container** | `cf_containers_delete` | Remove a container deployment |
| **Get logs** | `cf_containers_logs` | Stream container logs |
| **Scale** | `cf_containers_scale` | Adjust container replicas |

## How Each Actor Uses Cloudflare Containers

### ACHEEVY (Orchestrator)
- Deploy edge-optimized Plug instances when latency matters
- Route "deploy to edge" requests to Runner_Ang
- Monitor edge container health alongside VPS instances
- **Can do:** Request deployments, monitor status, read logs
- **Cannot do:** Delete containers without HITL approval

### Boomer_Angs (Managers)
| Ang | Container Usage |
|-----|---------------|
| **Runner_Ang** | Primary owner — deploy, scale, stop, manage edge containers |
| **Buildsmith** | Build container images, push to registry, trigger edge deploys |
| **Dockmaster_Ang** | Manage container registry, image tagging, cleanup |
| **OpsConsole_Ang** | Monitor edge container health and metrics |
| **Gatekeeper_Ang** | Security scan container images before edge deployment |

### Chicken Hawk (Coordinator)
- Deploy pre-approved containers as part of execution pipelines
- Read container logs for task evidence
- Cannot delete or scale containers

### Lil_Hawks (Workers)
- Read container logs relevant to their task
- Cannot deploy, stop, or manage containers

## When to Use Cloudflare Containers vs VPS vs Cloud Run

| Use Case | Platform | Why |
|----------|----------|-----|
| **Core A.I.M.S. services** | VPS (Hostinger) | Persistent, full control, cost-predictable |
| **User Plug instances** | VPS (default) or CF Containers (edge) | VPS for standard, edge for latency-sensitive |
| **GPU inference** | GCP Vertex AI | GPU required |
| **Batch builds** | GCP Cloud Run | Scale-to-zero, sandboxed |
| **Static/edge workloads** | CF Containers | Global distribution, low latency |
| **Burst capacity** | CF Containers | Overflow when VPS is resource-constrained |

## Deployment Pipeline Rules

```
IF user requests "deploy to edge" or workload is latency-sensitive
  THEN → Cloudflare Containers via this MCP
  Orchestrated by: Runner_Ang via ACHEEVY
  Image source: GCP Artifact Registry or Docker Hub

IF standard Plug deployment
  THEN → VPS (default path per CLAUDE.md rules)

IF edge deployment fails
  THEN → Fallback to VPS deployment
```

## Integration with Plug Engine

```
User: "Deploy X globally" or "I need low latency for X"
  → ACHEEVY classifies as edge deployment
  → Runner_Ang selects Cloudflare Containers
  → Buildsmith ensures image is ready in registry
  → cf_containers_deploy → container running on edge
  → Health monitor wires up (same as VPS instances)
  → ACHEEVY reports live URL to user
```

## Security Rules

- All container operations flow through Port Authority
- Container images must pass Gatekeeper_Ang security scan before edge deployment
- Container deletion requires HITL approval
- No direct network access to VPS internal services from edge containers
- Secrets injected via Cloudflare environment variables — never hardcoded
- All operations are audit-logged
