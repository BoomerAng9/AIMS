# WBT Framework — Workflow-Build-Test

The WBT (Workflow-Build-Test) framework is the "God Mode" stack for building
A.I.M.S. features end-to-end using AI coding assistants + n8n.

---

## The Stack

| Layer | Tool | Role |
|-------|------|------|
| **Brain** | Gemini 3.1 Pro / Claude Opus 4.6 | Lead engineer — reads code, generates solutions, deploys |
| **Design** | Stitch + Nano Banana Pro | Visual design + image generation |
| **Backend** | n8n (via MCP) | Workflow automation engine, API backend |
| **Frontend** | Next.js 14 (App Router) | User-facing application |
| **Knowledge** | Skills/Instructions | Domain expertise loaded as context |

---

## n8n MCP Integration

### Setup

```bash
# Clone the MCP repository
git clone https://github.com/czlonkowski/n8n-mcp.git
cd n8n-mcp && npm install && npm run build && npm run rebuild

# Get credentials from n8n
# N8N_HOST: Your n8n URL (e.g., https://n8n.plugmein.cloud)
# N8N_API_KEY: n8n Settings > Developer > API Key > Create New
```

### Configuration (settings.json)

Add to your Gemini CLI or Claude Code MCP config:

```json
{
  "mcpServers": {
    "n8n": {
      "command": "node",
      "args": ["/path/to/n8n-mcp/dist/index.js"],
      "env": {
        "N8N_HOST": "https://n8n.plugmein.cloud",
        "N8N_API_KEY": "your-api-key"
      }
    }
  }
}
```

### Available MCP Tools

| Tool | Purpose |
|------|---------|
| `search_nodes` | Find n8n nodes by name or type |
| `get_workflow` | Pull full workflow JSON by ID |
| `update_workflow` | Push updated workflow to n8n |
| `create_workflow` | Deploy new workflow to n8n |
| `list_workflows` | Browse all workflows |

---

## WBT Workflow Phases

### Phase 1: WORKFLOW (W)

Design the automation workflow in n8n:

1. Describe the workflow to the AI:
   > "Build a workflow that catches a webhook, processes the data, and returns a result."
2. AI generates the n8n JSON using MCP tools
3. AI validates against n8n rules (expression syntax, node configuration)
4. AI deploys to n8n instance

### Phase 2: BUILD (B)

Build the frontend that connects to the n8n workflow:

1. n8n exposes a webhook URL as the API endpoint
2. AI builds Next.js frontend that POSTs to the webhook
3. Frontend displays results from the workflow
4. Deploy to Vercel or the AIMS VPS

### Phase 3: TEST (T)

Verify everything works end-to-end:

1. Run `npm run build` — zero errors
2. Test the webhook endpoint manually
3. Test the frontend at all breakpoints (phone, tablet, desktop)
4. Run gap report against the RESET UI spec
5. Get user approval on the design

---

## n8n Skills (Knowledge Layer)

Seven specialized skills for n8n integration:

1. **Expression Syntax** — Correct `{{ $json.body.field }}` patterns
2. **MCP Tools Expert** — How to use search_nodes, get_workflow, etc.
3. **Workflow Patterns** — Proven architectures (Webhook → Process → Response)
4. **Validation Expert** — Lint workflows before saving
5. **Node Configuration** — Deep knowledge of node properties
6. **Code JavaScript** — Valid ES6+ code inside n8n Code nodes
7. **Code Python** — Python node data handling

Reference: https://github.com/czlonkowski/n8n-skills

---

## Optimization Workflow

To optimize existing n8n workflows:

1. **Fetch**: Pull workflow by ID via MCP
2. **Analyze**: Check for bottlenecks, error handling gaps
3. **Refactor**: Rewrite slow Code nodes, add error handlers
4. **Update**: Push optimized version via MCP
5. **Verify**: Test the updated workflow

---

## A.I.M.S. Specific Patterns

### Plug Deployment Workflow
```
Webhook (POST /deploy) →
  Validate request →
  Check LUC budget →
  Provision container →
  Configure nginx →
  Health check →
  Respond with instance URL
```

### ACHEEVY Chat Workflow
```
Webhook (POST /chat) →
  Load user context →
  Route to correct Boomer_Ang →
  Process with AI model →
  Log to House of Ang →
  Respond with message
```

### Automation Trigger Workflow
```
Schedule/Webhook trigger →
  Evaluate conditions →
  Execute automation steps →
  Check gates (human approval if needed) →
  Log results →
  Notify user
```
