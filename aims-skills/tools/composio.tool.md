---
id: "composio"
name: "Composio"
type: "tool"
category: "workflow"
provider: "Composio"
description: "Unified API for connecting 150+ third-party services with LLM agents."
env_vars:
  - "COMPOSIO_API_KEY"
docs_url: "https://docs.composio.dev/"
aims_files: []
---

# Composio — Unified API Tool Reference

## Overview

Composio provides a unified API layer for connecting LLM agents to 150+ third-party services (GitHub, Slack, Gmail, Jira, etc.). In AIMS it enables Boomer_Angs and Lil_Hawks to interact with external tools without individual API integrations.

## API Key Setup

| Variable | Required | Where to Get |
|----------|----------|--------------|
| `COMPOSIO_API_KEY` | Optional | https://app.composio.dev/ |

**Apply in:** `infra/.env.production`

## Key Features
- Pre-built actions for 150+ apps
- OAuth management for user connections
- MCP integration for tool discovery
- No individual API keys needed per service

## Usage Pattern
```typescript
import { Composio } from 'composio-core';

const composio = new Composio({ apiKey: process.env.COMPOSIO_API_KEY });
const tools = await composio.getTools(['github', 'slack']);
```

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Tool not found | Check available integrations at Composio dashboard |
| Auth failed | Re-authenticate the connected app |
