---
name: plug-catalog-browse
type: skill
triggers:
  - "browse tools"
  - "plug catalog"
  - "what tools"
  - "available agents"
  - "available tools"
  - "show me tools"
  - "what can I deploy"
execution:
  target: frontend
  route: /dashboard/plug-catalog
  fallback: api
  api_endpoint: /api/plug-catalog
---

# Plug Catalog Browse Skill

## Purpose
Present the browsable Plug Catalog to the user. The catalog contains all
deployable AI tools, agents, and platforms available through AIMS.

## When to Activate
- User asks what tools are available
- User wants to explore deployment options
- User mentions specific tool names (OpenClaw, DeerFlow, Agent Zero, etc.)

## Behavior

### Conversational Response
When a user asks about available tools:

1. **Acknowledge the request** — "Let me show you what we have."
2. **Present category overview** — Group tools by category
3. **Highlight featured tools** — Show 3-5 featured plugs
4. **Offer next steps** — "Want to spin one up, or need help choosing?"

### Categories
- Agent Frameworks (OpenClaw, Agent Zero)
- Code Execution (II-Agent)
- Workflow Automation (n8n, Windmill)
- Research Agents (DeerFlow)
- Computer Use (OpenClaw, Trey AI)
- Voice Agents (PersonaPlex)
- Content Engines (Content Engine)
- Data Pipelines (Browser Use)
- Custom Verticals (Per|Form)

### Routing Rules
- If user knows what they want → Route to Plug Spin-Up skill
- If user is unsure → Route to Needs Analysis skill
- If user wants to export → Route to Plug Export skill

## API Integration
```
GET /api/plug-catalog                  → List all plugs
GET /api/plug-catalog?featured=1       → Featured plugs only
GET /api/plug-catalog?category=xxx     → Filter by category
GET /api/plug-catalog?q=xxx            → Search
GET /api/plug-catalog?id=xxx           → Single plug details
```

## Response Format
Always present tools with: name, tagline, tier badge, and one-click action.
Never expose internal Docker configs, port assignments, or security details to users.
