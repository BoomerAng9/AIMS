---
id: "openrouter"
name: "OpenRouter"
type: "tool"
category: "ai"
provider: "OpenRouter"
description: "Unified LLM gateway providing access to Claude, GPT, Gemini, Llama, Mistral, and 200+ models through a single API key."
env_vars:
  - "OPENROUTER_API_KEY"
docs_url: "https://openrouter.ai/docs"
aims_files:
  - "backend/uef-gateway/src/llm/openrouter.ts"
  - "frontend/lib/ai/openrouter.ts"
---

# OpenRouter — LLM Gateway Tool Reference

## Overview

OpenRouter is the primary LLM power source for AIMS (codename: **Voltron Engine**). It provides a unified OpenAI-compatible API for 200+ models across providers. Every Boomer_Ang, ACHEEVY, ORACLE, and ByteRover uses this module.

## API Key Setup

| Variable | Required | Where to Get |
|----------|----------|--------------|
| `OPENROUTER_API_KEY` | Yes | https://openrouter.ai/keys |

**Apply in:** `infra/.env.production` or `frontend/.env.local`

ACHEEVY checks this key at startup. Without it, agents fall back to heuristic mode (no real LLM calls).

## API Reference

### Base URL
```
https://openrouter.ai/api/v1
```

### Auth Header
```
Authorization: Bearer $OPENROUTER_API_KEY
```

### Chat Completion
```http
POST /chat/completions
Content-Type: application/json

{
  "model": "anthropic/claude-sonnet-4.5",
  "messages": [
    { "role": "system", "content": "You are ACHEEVY..." },
    { "role": "user", "content": "Build me an app" }
  ],
  "max_tokens": 4096,
  "temperature": 0.7
}
```

### Streaming
Same endpoint with `"stream": true`. Returns SSE chunks.

## AIMS Model Catalog

### Premium Tier ($5+ / 1M input tokens)
| Model | ID | Input/1M | Output/1M | Context |
|-------|----|----------|-----------|---------|
| Claude Opus 4.6 | `anthropic/claude-opus-4.6` | $5.00 | $25.00 | 1M |
| Claude Opus 4.5 | `anthropic/claude-opus-4.5` | $5.00 | $25.00 | 200K |
| GPT-5.2 | `openai/gpt-5.2` | $5.00 | $20.00 | 128K |

### Standard Tier ($1-5 / 1M input tokens)
| Model | ID | Input/1M | Output/1M | Context |
|-------|----|----------|-----------|---------|
| Claude Sonnet 4.5 | `anthropic/claude-sonnet-4.5` | $3.00 | $15.00 | 1M |
| GPT-5.1 | `openai/gpt-5.1` | $3.00 | $12.00 | 128K |
| Gemini 3 Pro | `google/gemini-3-pro-preview` | $1.25 | $10.00 | 1M |

### Fast Tier ($0.10-1 / 1M input tokens)
| Model | ID | Input/1M | Output/1M | Context |
|-------|----|----------|-----------|---------|
| Gemini 3.0 Flash | `google/gemini-3.0-flash` | $0.10 | $0.40 | 1M |
| Claude Haiku 4.5 | `anthropic/claude-haiku-4.5` | $0.80 | $4.00 | 200K |
| Gemini 2.5 Flash | `google/gemini-2.5-flash-preview` | $0.15 | $0.60 | 1M |

### Economy Tier (<$0.10 / 1M input tokens)
| Model | ID | Input/1M | Output/1M | Context |
|-------|----|----------|-----------|---------|
| Llama 3.3 70B | `meta-llama/llama-3.3-70b-instruct` | $0.10 | $0.10 | 128K |

**Default model:** `gemini-3.0-flash` (best cost/speed for general routing)

## AIMS Usage Pattern

```typescript
import { openrouter } from './llm/openrouter';

const result = await openrouter.chat({
  model: 'anthropic/claude-sonnet-4.5',
  messages: [{ role: 'user', content: 'Hello' }],
});

// result.content — LLM response text
// result.cost.usd — estimated cost
// result.tokens.total — tokens consumed
```

## Fallback Chain
```
Vertex AI (GCP native) → OpenRouter (200+ models) → Stub response
```

## Cost Tracking
Every call returns `LLMResult.cost.usd` calculated from the model catalog. This feeds into the LUC billing engine for per-job cost tracking.

## Rate Limits
- Free tier: 200 requests/day
- Paid: varies by model provider, generally 60-1000 req/min
- Credits system: prepaid balance, auto-refill available

## Troubleshooting

| Issue | Fix |
|-------|-----|
| 401 Unauthorized | Check `OPENROUTER_API_KEY` is set and valid |
| 402 Payment Required | Add credits at https://openrouter.ai/credits |
| 429 Rate Limited | Switch to a lower-tier model or reduce concurrency |
| Model not found | Check model ID against https://openrouter.ai/models |
