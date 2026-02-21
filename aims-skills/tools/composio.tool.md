---
id: "composio"
name: "Composio"
type: "tool"
category: "workflow"
provider: "Composio"
description: "MCP gateway with 500+ pre-built integrations for connecting LLM agents to third-party services."
env_vars:
  - "COMPOSIO_API_KEY"
docs_url: "https://docs.composio.dev/"
aims_files:
  - "aims-skills/brains/PLUG_ANG_BRAIN.md"
  - "aims-skills/chain-of-command/role-cards/plug-ang.json"
owner: "Plug_Ang"
---

# Composio — A.I.M.S. MCP Gateway

## Overview

Composio is the A.I.M.S. primary MCP gateway — 500+ pre-built integrations through a single API key.
It provides unified auth (OAuth, API keys, tokens), MCP-native tool discovery, action-level RBAC,
and audit trails. SOC2 and ISO certified.

**Owner:** Plug_Ang (Operations & Integration PMO)

## API Key Setup

| Variable | Required | Where to Get |
|----------|----------|--------------|
| `COMPOSIO_API_KEY` | Yes | https://app.composio.dev/ |

**Apply in:** `infra/.env.production`

## Key Features
- 500+ pre-built integrations (Code, CRM, Storage, Payments, Communication, etc.)
- OAuth management for user-authenticated connections
- MCP-native tool discovery and execution
- Authentication abstraction (OAuth, API keys, tokens)
- Action-level RBAC and audit trails
- Intelligent routing past the 30-tool context limit
- SOC2 and ISO certified

## Service Categories

| Category | Services | Example Actions |
|----------|----------|-----------------|
| **Code & DevOps** | GitHub, GitLab, Bitbucket, Vercel, Netlify | Create repos, manage PRs, trigger deploys |
| **Communication** | Slack, Discord, Gmail, Outlook, Telegram | Send messages, manage channels, read mail |
| **Project Management** | Jira, Linear, Notion, Trello, Asana | Create issues, update boards, manage tasks |
| **CRM** | HubSpot, Salesforce, Pipedrive | Manage contacts, create deals, track pipelines |
| **Storage** | Google Drive, Dropbox, S3, GCS | Upload files, share folders, manage buckets |
| **Payments** | Stripe, PayPal | Create customers, manage subscriptions |
| **Search & Data** | Brave Search, Tavily, Serper, Firecrawl | Web search, scrape, extract data |
| **AI/ML** | OpenAI, Anthropic, Google AI, HuggingFace | Model inference, embeddings, image gen |
| **Analytics** | Google Analytics, Mixpanel, PostHog | Track events, query metrics |
| **Design** | Figma, Canva | Read designs, export assets |

## Usage Pattern
```typescript
import { Composio } from 'composio-core';

const composio = new Composio({ apiKey: process.env.COMPOSIO_API_KEY });

// Discover available tools
const tools = await composio.getTools(['github', 'slack', 'gmail', 'jira']);

// Execute an action
const result = await composio.executeAction('github_create_repo', {
  name: 'my-project',
  private: true,
});
```

## Direct MCP Connections (Non-Composio)
Some services connect via dedicated MCP servers instead of Composio:

| Service | MCP Server | Purpose |
|---------|-----------|---------|
| **Figma** | Figma MCP Server (GA) | Design-to-code bridge |
| **SVGMaker** | @genwave/svgmaker-mcp | AI SVG icon generation |
| **E2B** | E2B SDK | Code sandbox execution |
| **Firecrawl** | Firecrawl MCP | Web scraping + extraction |

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Tool not found | Check available integrations at Composio dashboard |
| Auth failed | Re-authenticate the connected app via Plug_Ang |
| Rate limited | Composio handles rate limiting — check plan tier |
| MCP discovery stale | Refresh tool list: `composio.getTools()` |
