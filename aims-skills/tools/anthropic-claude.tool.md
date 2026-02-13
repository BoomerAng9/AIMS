---
id: "anthropic-claude"
name: "Anthropic Claude"
type: "tool"
category: "ai"
provider: "Anthropic"
description: "Claude AI models (Opus, Sonnet, Haiku) — accessed via OpenRouter or Vertex AI in AIMS."
env_vars:
  - "ANTHROPIC_API_KEY"
docs_url: "https://docs.anthropic.com/en/docs"
aims_files:
  - "backend/uef-gateway/src/llm/openrouter.ts"
  - "backend/uef-gateway/src/llm/vertex-ai.ts"
---

# Anthropic Claude — AI Model Tool Reference

## Overview

Claude is the primary AI backbone for AIMS. In production, Claude is accessed through **OpenRouter** (default) or **Vertex AI** (GCP native path). The direct Anthropic API key is used for Claude Code CLI on the VPS.

## API Key Setup

| Variable | Required | Where to Get | Purpose |
|----------|----------|--------------|---------|
| `ANTHROPIC_API_KEY` | For VPS CLI | https://console.anthropic.com/settings/keys | Claude Code CLI on VPS |
| `OPENROUTER_API_KEY` | For app | https://openrouter.ai/keys | Claude via OpenRouter (app) |
| `GOOGLE_APPLICATION_CREDENTIALS` | For GCP | GCP Console | Claude via Vertex AI |

**Apply in:** `infra/.env.production`

## Direct API Reference

### Base URL
```
https://api.anthropic.com/v1
```

### Auth Headers
```
x-api-key: $ANTHROPIC_API_KEY
anthropic-version: 2023-06-01
```

### Messages API
```http
POST /messages
Content-Type: application/json

{
  "model": "claude-sonnet-4-5-20250929",
  "max_tokens": 4096,
  "messages": [
    { "role": "user", "content": "Hello" }
  ]
}
```

## Available Models in AIMS

| Model | OpenRouter ID | Vertex ID | Tier | Input/1M | Output/1M |
|-------|--------------|-----------|------|----------|-----------|
| Opus 4.6 | `anthropic/claude-opus-4.6` | `claude-opus-4-6@20250514` | Premium | $5.00 | $25.00 |
| Opus 4.5 | `anthropic/claude-opus-4.5` | — | Premium | $5.00 | $25.00 |
| Sonnet 4.5 | `anthropic/claude-sonnet-4.5` | `claude-sonnet-4-5-v2@20250514` | Standard | $3.00 | $15.00 |
| Haiku 4.5 | `anthropic/claude-haiku-4.5` | `claude-haiku-4-5@20250514` | Fast | $0.80 | $4.00 |

## AIMS Routing

Claude is NOT called directly by the app. Routing:
1. **App requests** → OpenRouter (`OPENROUTER_API_KEY`) or Vertex AI
2. **VPS CLI** → Direct Anthropic API (`ANTHROPIC_API_KEY`)
3. **Claude Code sessions** → Direct Anthropic API

## Key Capabilities
- **Extended thinking** — Opus/Sonnet support chain-of-thought reasoning
- **Tool use** — Function calling for agent workflows
- **Vision** — Image analysis (Opus, Sonnet)
- **1M context** — Opus 4.6 and Sonnet 4.5 support 1M token context windows

## Rate Limits (Direct API)
- Tier 1: 50 req/min, 40K tokens/min
- Tier 2: 1000 req/min, 80K tokens/min
- Tier 3: 2000 req/min, 160K tokens/min
- Tier 4: 4000 req/min, 400K tokens/min

## Troubleshooting

| Issue | Fix |
|-------|-----|
| 401 on VPS | Set `ANTHROPIC_API_KEY` in aims user environment |
| Claude not available in app | Check `OPENROUTER_API_KEY` has credits |
| Vertex AI auth fail | Verify `GOOGLE_APPLICATION_CREDENTIALS` JSON path and GCP project |
