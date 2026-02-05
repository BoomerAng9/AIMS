---
id: "n8n-workflow"
name: "n8n Workflow Automation"
type: "task"
status: "active"
triggers:
  - "n8n"
  - "workflow"
  - "automation"
  - "automate"
  - "schedule"
  - "cron"
  - "boomer"
  - "boomer_ang"
description: "Trigger and manage n8n workflow automations and Boomer_Ang agent templates."
execution:
  target: "cli"
  command: "node scripts/boomer.mjs"
dependencies:
  env:
    - "N8N_HOST"
    - "N8N_API_KEY"
  files:
    - "scripts/boomer.mjs"
    - "infra/.env"
priority: "high"
---

# n8n Workflow Automation Task

## n8n Instance
- **Host:** http://76.13.96.107:5678
- **Auth:** API key via `N8N_API_KEY` in `infra/.env`

## Boomer_Ang CLI

```bash
# List available agent templates
node scripts/boomer.mjs list-templates

# Check n8n connectivity and API key
node scripts/boomer.mjs check

# Deploy a workflow template
node scripts/boomer.mjs create-action <template_name>
```

## Available Templates

| Template | Description | Nodes |
|----------|-------------|-------|
| recruiter | LinkedIn scraper for lead generation | Start -> LinkedIn HTTP Request |
| marketer | Twitter/X auto-posting agent | Start -> Twitter Post |

## Adding New Templates
Edit `scripts/boomer.mjs` and add to the `templates` object:
```javascript
"template-name": {
  "name": "Boomer_Ang_TemplateName",
  "nodes": [ /* n8n node definitions */ ],
  "connections": { /* node wiring */ }
}
```

## MCP Tool
The `n8n.trigger_workflow` MCP tool (in `mcp-tools/definitions.ts`) allows agents to trigger workflows programmatically:
```json
{
  "workflowId": "workflow-id",
  "payload": { "key": "value" }
}
```

## Troubleshooting
1. SSH into VPS: `ssh root@76.13.96.107`
2. Check n8n container: `docker ps | grep n8n`
3. Open port: `sudo ufw allow 5678`
4. View logs: `docker logs n8n`
