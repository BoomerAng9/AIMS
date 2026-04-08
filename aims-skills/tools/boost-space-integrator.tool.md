---
id: "boost-space-integrator"
name: "Boost.space Integrator MCP"
type: "tool"
category: "automation"
provider: "Boost.space"
tier: "Pro"
description: "Integrator MCP server that exposes Boost.space automation scenarios as callable AI tools. Enables bidirectional AI-to-workflow communication."
env_vars:
  - "INTEGRATOR_API_KEY"
  - "INTEGRATOR_TEAM"
docs_url: "https://github.com/boostspace/integrator-mcp-server"
aims_files:
  - "aims-skills/skills/integrations/boost-space-deployapps.skill.md"
  - "aims-skills/tools/boost-space-remote.tool.md"
---

# Boost.space Integrator MCP — Tool Reference

## What It Is

The Integrator MCP Server turns Boost.space automation scenarios into callable tools
for AI assistants. Unlike the Data Layer MCP (read/write data), the Integrator MCP
focuses on **executing workflows** — create automations, trigger scenarios, and
synchronize actions across all connected apps.

## npm Package

```
@boostspace/integrator-mcp-server  (v0.1.4, MIT)
```

## Environment Variables

```
INTEGRATOR_API_KEY=<your-api-key>    # Generated in Integrator profile
INTEGRATOR_TEAM=<your-team-id>       # Found in Team page URL
```

The API key requires `scenarios:read` and `scenarios:run` scopes.

## MCP Configuration

### Claude Desktop / Claude Code
```json
{
  "mcpServers": {
    "integrator": {
      "command": "npx",
      "args": ["-y", "@boostspace/integrator-mcp-server"],
      "env": {
        "INTEGRATOR_API_KEY": "<your-api-key>",
        "INTEGRATOR_TEAM": "<your-team-id>"
      }
    }
  }
}
```

### npm Install
```bash
npm i @boostspace/integrator-mcp-server
```

## How It Works

1. **Discovery** — Connects to your Integrator account and finds all scenarios with "On-Demand" scheduling
2. **Parameter Resolution** — Parses scenario input parameters with meaningful descriptions for AI
3. **Execution** — AI invokes scenarios with appropriate parameters via natural language
4. **Response** — Returns scenario output as structured JSON for AI interpretation

## Capabilities

### Scenario Management
- **List scenarios** — Discover all On-Demand scenarios in your team
- **Inspect parameters** — Get input schema for each scenario
- **Execute scenarios** — Trigger with AI-filled parameters
- **Read results** — Structured JSON output from completed workflows

### Workflow Types
- **Quote generation** — "Generate a quote and send it via email"
- **Data sync** — "Sync contacts from HubSpot to Mailchimp"
- **Notifications** — "Send a Slack alert when a deal closes"
- **Provisioning** — "Create a new project workspace in Notion"
- **Reporting** — "Run the weekly sales report and email it"

## A.I.M.S. Integration

### Deployment Automation (Deployapps)

The Integrator MCP maps directly to A.I.M.S. deployment workflows:

| Scenario | A.I.M.S. Use |
|----------|-------------|
| **Provision workspace** | Plug spin-up triggers Boost.space workspace creation |
| **Sync user data** | Onboarding form data synced to CRM + project tools |
| **Deploy notification** | Slack/email alert when container deploys |
| **Health check pipeline** | Automated health monitoring via scenario chain |
| **Billing trigger** | Stripe webhook → Boost.space → invoice generation |

### Routing via UEF Gateway
```
User → ACHEEVY → SME_Ang → Integrator MCP → On-Demand Scenario → Connected Apps
```

### Complementary to Remote MCP

| Feature | Remote MCP | Integrator MCP |
|---------|-----------|----------------|
| Data read/write | Yes | No |
| Trigger workflows | Yes (basic) | Yes (full control) |
| Scenario parameters | Limited | Full schema |
| JSON output | Limited | Structured |
| npm package | pip only | npm + npx |

## Security

- API key with scoped permissions (scenarios:read, scenarios:run)
- Team-level isolation
- No direct database access — only scenario execution
- Audit trail via Boost.space logs

## Links

- npm: https://www.npmjs.com/package/@boostspace/integrator-mcp-server
- GitHub: https://github.com/boostspace/integrator-mcp-server
- Smithery: https://smithery.ai/server/@boostspace/integrator-mcp-server
- Boost.space MCP: https://boost.space/mcp
