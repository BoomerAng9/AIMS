---
id: "boost-space-remote"
name: "Boost.space Remote MCP"
type: "tool"
category: "automation"
provider: "Boost.space"
tier: "Pro"
description: "Remote MCP server for real-time business data access and automation scenario triggering across 2000+ connected apps. Cloud-hosted on Boost.space infrastructure."
env_vars:
  - "BOOSTSPACE_API_BASE"
  - "BOOSTSPACE_TOKEN"
docs_url: "https://docs.boost.space/knowledge-base/ai-tools-mcp/bs-mcp/remote-mcp-server/"
aims_files:
  - "aims-skills/skills/integrations/boost-space-automation.skill.md"
  - "aims-skills/tools/boost-space-integrator.tool.md"
---

# Boost.space Remote MCP — Tool Reference

## What It Is

Boost.space is the world's first AI-Ready Data Sync Platform powered by MCP. It centralizes,
synchronizes, and enriches business data across 2000+ applications. The **Remote MCP Server**
runs on Boost.space cloud infrastructure — no self-hosting required.

## Two MCP Layers

| Layer | Purpose | Access |
|-------|---------|--------|
| **Data Layer MCP** | Query, scan, analyze, and manage all stored data | Read + Write |
| **Integrator MCP** | Trigger automation scenarios as callable tools | Execute workflows |

The Remote MCP server combines both layers into a single cloud-hosted connection.

## Environment Variables

```
BOOSTSPACE_API_BASE=<your-instance-api-url>
BOOSTSPACE_TOKEN=<your-mcp-token>
```

Generate an MCP Token in your Boost.space instance settings. The connection URL is provided
after token creation.

## MCP Configuration

### Claude Desktop / Claude Code
```json
{
  "mcpServers": {
    "boostspace": {
      "command": "python",
      "args": ["-m", "boostspace_mcp.server"],
      "env": {
        "BOOSTSPACE_API_BASE": "<API_PATH>",
        "BOOSTSPACE_TOKEN": "<TOKEN>"
      },
      "transport": "stdio"
    }
  }
}
```

### pip Install
```bash
pip install boostspace-mcp
python -m boostspace_mcp.server
```

### uv Install
```bash
uv add boostspace-mcp
uv x boostspace-mcp run
```

## Capabilities

### Data Access (Read + Write)
- **Query live data** — "Show me all sales deals over $10K from last quarter"
- **Create records** — "Add a new lead for John at Acme Corp"
- **Update records** — "Mark deal #1234 as closed-won"
- **Analyze data** — "What's our conversion rate this month?"
- **Enrich data** — AI-powered field mapping and data transformation

### Automation Triggering
- **On-Demand scenarios** — Trigger any scenario marked "On Demand" via AI chat
- **Parameterized execution** — AI fills in scenario inputs dynamically
- **Structured JSON output** — Scenario results returned as parseable JSON
- **Context-aware** — AI makes decisions based on real-time business data

### Data Spaces
- **Data view** — Browse and manage records
- **Connect view** — Integration configuration
- **Share view** — Team collaboration
- **Flow view** — Automation workflows

## A.I.M.S. Integration

### Use Cases

| Use Case | Description |
|----------|-------------|
| **Lead Management** | Query/create/update leads in Boost.space CRM |
| **Workflow Automation** | Trigger pre-built scenarios from ACHEEVY chat |
| **Data Enrichment** | AI-powered field mapping across 2000+ apps |
| **Reporting** | Real-time business intelligence queries |
| **Onboarding** | Auto-populate user profiles from connected apps |

### Routing via UEF Gateway
```
User → ACHEEVY → SME_Ang (MCP dispatch) → Boost.space Remote MCP → Business Data
```

## Security

- MCP Token authentication (bearer token)
- Cloud-hosted — no local secrets on VPS
- GDPR compliant
- Credentials managed via environment variables

## Rate Limits

Depends on Boost.space plan tier. Pro tier includes higher throughput and unlimited
automation executions.

## Links

- Docs: https://docs.boost.space/knowledge-base/ai-tools-mcp/bs-mcp/remote-mcp-server/
- GitHub: https://github.com/boostspace/boostspace-mcp-server
- Blog: https://boost.space/blog/mcp/
- Platform: https://boost.space/mcp
