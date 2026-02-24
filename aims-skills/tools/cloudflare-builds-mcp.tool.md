---
id: "cloudflare-builds-mcp"
name: "Cloudflare Workers Builds MCP"
type: "tool"
category: "cloud"
provider: "Cloudflare"
description: "Cloudflare Workers Builds via MCP — build, bundle, and deploy Workers with build pipelines. CI/CD for edge functions."
env_vars:
  - "CF_BUILDS_MCP_ENABLED"
mcp_endpoint: "https://builds.mcp.cloudflare.com/mcp"
owner: "Buildsmith"
secondary_owners: ["Patchsmith_Ang"]
---

# Cloudflare Workers Builds MCP — A.I.M.S. Edge CI/CD

## Overview

Cloudflare Workers Builds MCP provides build pipeline capabilities for Workers —
bundling, building, and deploying edge functions with proper CI/CD workflows.
This complements the Workers MCP by adding build orchestration.

**Owner:** Buildsmith (Build & Deploy)
**Secondary Owner:** Patchsmith_Ang (Code Quality)
**MCP Endpoint:** `https://builds.mcp.cloudflare.com/mcp`

## Capabilities

| Capability | MCP Tool | Description |
|-----------|----------|-------------|
| **Trigger build** | `builds_create` | Start a new build for a Worker project |
| **Get build** | `builds_get` | Build status, logs, artifacts |
| **List builds** | `builds_list` | Build history for a project |
| **Cancel build** | `builds_cancel` | Cancel a running build |
| **Get build logs** | `builds_logs` | Detailed build output |
| **Deploy build** | `builds_deploy` | Deploy a successful build artifact |

## How Each Actor Uses Worker Builds

### ACHEEVY (Orchestrator)
- Trigger builds as part of FDH pipeline Develop phase
- Monitor build status and report to user
- **Can do:** Trigger builds, read status, deploy approved builds
- **Cannot do:** Deploy builds that haven't passed verification

### Boomer_Angs (Managers)
| Ang | Builds Usage |
|-----|-------------|
| **Buildsmith** | Configure build pipelines, trigger builds, deploy artifacts |
| **Patchsmith_Ang** | Review build output, verify code quality gates |
| **Gatekeeper_Ang** | Security scan build artifacts before deployment |
| **Runner_Ang** | Monitor build execution, debug failures |

### Chicken Hawk (Coordinator)
- Read build logs as task evidence
- Cannot trigger or deploy builds

### Lil_Hawks (Workers)
- Read build status for their assigned tasks
- Cannot interact with build pipeline

## Integration with FDH Pipeline

```
Foster phase → Manifest includes Worker changes
  → Develop phase begins
  → Buildsmith triggers builds_create
  → Build runs (bundle, lint, test)
  → Hone phase: Gatekeeper_Ang scans build artifact
  → If ORACLE gates pass: builds_deploy
  → Receipt sealed with build logs as evidence
```

## Integration with GitHub MCP

```
PR merged on GitHub → webhook fires
  → Worker catches webhook (via Workers MCP)
  → Triggers builds_create for affected Worker project
  → Build completes → auto-deploy if Deploy It lane
  → Or wait for human approval if Guide Me lane
```

## Security Rules

- Build triggers require Boomer_Ang authorization
- Deployment of build artifacts requires ORACLE gate pass
- Build logs are retained for audit purposes
- Failed builds cannot be deployed (enforced at MCP level)
- All build operations are audit-logged
