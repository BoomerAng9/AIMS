---
id: "pipedream-mcp"
name: "Pipedream MCP Platform"
type: "tool"
category: "workflow"
provider: "Pipedream"
description: "Hosted MCP server platform providing 3,000+ app integrations with 10,000+ prebuilt tools. Primary bridge for Paperform and other third-party services via Model Context Protocol."
env_vars:
  - "PIPEDREAM_MCP_URL"
  - "PIPEDREAM_PROJECT_ID"
  - "PIPEDREAM_API_KEY"
docs_url: "https://pipedream.com/docs/connect/mcp"
aims_files:
  - "aims-skills/brains/PLUG_ANG_BRAIN.md"
  - "aims-skills/tools/paperform.tool.md"
  - "aims-skills/chain-of-command/role-cards/plug-ang.json"
owner: "Plug_Ang"
---

# Pipedream MCP Platform — A.I.M.S. Integration Bridge

## Overview

Pipedream is an **MCP-native integration platform** that A.I.M.S. uses as a secondary MCP gateway
(alongside Composio) to connect ACHEEVY, Boomer_Angs, and the full chain of command to 3,000+ APIs
with 10,000+ prebuilt tools. It provides hosted MCP servers for every integrated app — including
**Paperform**, which is the first app wired through this platform.

**Owner:** Plug_Ang (Operations & Integration PMO)

Pipedream acts as a **credential-isolating proxy**: user credentials are encrypted at rest,
never exposed to AI models, and all API calls are made through Pipedream's servers. This aligns
with A.I.M.S. Port Authority security — credentials stay behind the gate.

## Architecture

```
ACHEEVY / Boomer_Ang / Chicken Hawk
  ↓  (MCP tool call)
Port Authority (UEF Gateway)
  ↓  (authenticated, metered)
Pipedream MCP Server (SSE)
  ↓  (credential-isolated proxy)
Target API (Paperform, etc.)
```

## MCP Server Configuration

### Hosted SSE (Production — Recommended)

```
MCP Server URL: https://mcp.pipedream.net/v2
Transport: SSE (Server-Sent Events)
Auth: Pipedream account OAuth or API key
```

This single URL works for **every** Pipedream-supported app. The server dynamically exposes
tools for whichever apps have been connected in your Pipedream account.

### Per-App MCP Endpoints

Each app also has a dedicated MCP page for discovery:
```
https://mcp.pipedream.com/app/{app-slug}
```

Example: `https://mcp.pipedream.com/app/paperform`

### Local Stdio (Development/Testing)

```bash
npx @pipedream/mcp
```

Or via configuration:
```json
{
  "mcpServers": {
    "pipedream": {
      "command": "npx",
      "args": ["-y", "@pipedream/mcp"],
      "env": {
        "PIPEDREAM_API_KEY": "${PIPEDREAM_API_KEY}"
      }
    }
  }
}
```

## API Key Setup

| Variable | Required | Where to Get | Purpose |
|----------|----------|--------------|---------|
| `PIPEDREAM_MCP_URL` | Yes | Default: `https://mcp.pipedream.net/v2` | MCP server endpoint |
| `PIPEDREAM_PROJECT_ID` | Recommended | Pipedream Dashboard > Projects | Scope connections to a project |
| `PIPEDREAM_API_KEY` | Yes | Pipedream Dashboard > Settings > API Keys | Authenticate MCP requests |

**Apply in:** `infra/.env.production`

## Key Features

- **3,000+ App Integrations** — Any app on Pipedream becomes an MCP tool
- **10,000+ Prebuilt Tools** — Actions and triggers auto-converted to MCP tools
- **Credential Isolation** — Secrets encrypted at rest, never sent to AI models
- **OAuth + API Key Management** — Pipedream handles auth flows per-app
- **Revocable Access** — Users can disconnect app accounts at any time
- **SSE Transport** — Production-ready Server-Sent Events for real-time communication
- **Per-App Tool Discovery** — Each app exposes its own tool surface via MCP

## A.I.M.S. Connected Apps (via Pipedream MCP)

| App | MCP Slug | Tool Doc | Purpose |
|-----|----------|----------|---------|
| **Paperform** | `paperform` | `paperform.tool.md` | Form creation, submission management, data collection |

> Add new apps here as they are connected through Pipedream.

## How Chain of Command Uses Pipedream MCP

### ACHEEVY (Orchestrator)
- Routes form-related intents to Plug_Ang via Pipedream
- Triggers Paperform actions as part of vertical workflows (onboarding, needs analysis, client intake)
- Monitors form submissions as event sources for automation

### Boomer_Angs (Managers)
- **Plug_Ang** owns all Pipedream MCP connections (credential management, health checks, wiring)
- Other Boomer_Angs request integrations through Plug_Ang — never direct Pipedream access

### Chicken Hawk (Coordinator)
- Dispatches form-related tasks to Lil_Hawks using tools that Plug_Ang has registered
- Cannot connect or disconnect Pipedream apps (Boomer_Ang-only action)

### Lil_Hawks (Workers)
- Execute bounded form tasks (e.g., "create this form", "pull these submissions")
- Access goes through Port Authority → Plug_Ang-delegated tool → Pipedream MCP → API
- Never see credentials, never configure connections

## Security

- All Pipedream MCP calls route through **Port Authority** (UEF Gateway)
- Credentials are **never** exposed to any agent in the chain of command
- User OAuth tokens managed by Pipedream, revocable at any time
- All MCP tool calls are **metered by LUC** for billing
- Rate limits enforced at both Pipedream (plan tier) and Port Authority (per-tenant) levels

## Relationship to Composio

Pipedream MCP and Composio serve complementary roles:

| Aspect | Composio | Pipedream MCP |
|--------|----------|---------------|
| **Role** | Primary MCP gateway | Secondary MCP bridge |
| **Strength** | 500+ integrations, SDK-native | 3,000+ apps, SSE-native, form builders |
| **Auth** | API key (`COMPOSIO_API_KEY`) | API key + OAuth (`PIPEDREAM_API_KEY`) |
| **Use When** | Integration is in Composio catalog | App not in Composio OR needs Pipedream-specific tools (e.g., Paperform) |

**Rule:** Plug_Ang checks Composio first. If unavailable, route through Pipedream MCP.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| MCP connection timeout | Verify `PIPEDREAM_MCP_URL` is set and reachable |
| Tool not found for app | Ensure the app is connected in Pipedream project |
| Auth error on tool call | Re-authenticate the app in Pipedream Dashboard |
| Rate limited | Check Pipedream plan tier; upgrade or throttle calls |
| Credential exposure concern | Credentials never leave Pipedream — verify via audit log |
