---
id: "boost-space-deployapps"
name: "Boost.space Deployapps"
type: "skill"
status: "active"
triggers:
  - "deploy apps"
  - "deployapps"
  - "integrator"
  - "trigger scenario"
  - "run scenario"
  - "automation scenario"
  - "workflow trigger"
  - "on demand scenario"
  - "boost integrator"
description: "Boost.space Integrator MCP — trigger On-Demand automation scenarios as callable AI tools with parameterized execution and structured JSON output."
execution:
  target: "api"
  route: "/api/mcp/boost-integrator"
dependencies:
  env:
    - "INTEGRATOR_API_KEY"
    - "INTEGRATOR_TEAM"
  files:
    - "aims-skills/tools/boost-space-integrator.tool.md"
    - "aims-skills/tools/boost-space-remote.tool.md"
priority: "high"
---

# Boost.space Deployapps Skill

## When This Fires

Triggers when any agent needs to:
- Execute a pre-built automation workflow
- Trigger an On-Demand scenario in Boost.space Integrator
- Chain multiple workflow steps via AI
- Deploy app configurations across connected platforms
- Sync actions bidirectionally between AI and automation workflows

## What It Does

The Integrator MCP exposes all Boost.space On-Demand scenarios as callable tools.
AI assistants can discover scenarios, inspect their input parameters, execute them
with context-aware values, and receive structured JSON results.

## How Scenarios Work

### Discovery
The MCP server automatically identifies all scenarios in your team that are configured
with "On-Demand" scheduling. Each scenario is exposed as a tool with its input parameters
described for AI consumption.

### Execution Flow
```
1. AI receives user request → "Generate and send the weekly report"
2. SME_Ang identifies matching scenario → "weekly-report-generator"
3. MCP resolves input parameters → { period: "last_7_days", format: "pdf", recipients: ["team@aims.io"] }
4. Scenario executes → PDF generated, email sent
5. JSON result returned → { status: "sent", recipients: 3, report_url: "..." }
```

### Parameter Resolution
The Integrator MCP parses each scenario's input schema and provides meaningful
parameter descriptions to the AI, enabling accurate auto-fill from conversation context.

## Capabilities

### Scenario Types

| Category | Example Scenarios |
|----------|-------------------|
| **Provisioning** | Create workspace, set up project, configure environment |
| **Notifications** | Slack alerts, email digests, SMS notifications |
| **Data Sync** | CRM → Email tool, Form → CRM, Webhook → Database |
| **Reporting** | Weekly reports, dashboard snapshots, export pipelines |
| **Billing** | Invoice generation, payment reminders, subscription management |
| **Deployment** | App configuration sync, environment variable propagation |

### Operations
1. **List scenarios** — Discover all available On-Demand workflows
2. **Inspect inputs** — Get parameter schema for a specific scenario
3. **Execute** — Run scenario with AI-provided parameters
4. **Read output** — Parse structured JSON results

## Rules for Agents

1. **Only On-Demand scenarios** — Cannot trigger scheduled or webhook-based scenarios
2. **Validate parameters** — Ensure all required inputs are provided before execution
3. **Human-in-the-loop** — Confirm with user before executing destructive or costly scenarios
4. **Log executions** — Track every scenario run for audit trail
5. **Handle failures gracefully** — If scenario fails, report structured error to user

## A.I.M.S. Integration Points

| Touch Point | Scenario Use |
|-------------|-------------|
| **Plug Spin-Up** | Trigger workspace provisioning on deployment |
| **Onboarding** | Run welcome sequence when user completes Paperform |
| **Health Checks** | Execute monitoring pipeline and return results |
| **HalalHub** | Vendor approval workflow, product listing sync |
| **Billing** | Stripe webhook → invoice → email confirmation chain |
| **Alerts** | Critical incident notification across all channels |

## Relationship to Remote MCP

| Feature | Remote MCP | Integrator MCP (this) |
|---------|-----------|----------------------|
| **Focus** | Data access | Workflow execution |
| **Operations** | Read/Write/Enrich | Discover/Execute/Read |
| **Package** | pip (Python) | npm (Node.js) |
| **Best for** | Querying business data | Running automation chains |

Use **both together**: Remote MCP for data intelligence, Integrator MCP for taking action.

## Cost Considerations

Each scenario execution counts against the Boost.space Integrator plan quota.
Complex scenarios with multiple steps consume more execution credits.
SME_Ang routes through LUC for cost tracking.
