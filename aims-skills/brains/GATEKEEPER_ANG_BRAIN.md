# Gatekeeper_Ang Brain — litellm Wrapper

> LLM gateway proxy. Routes all model calls, enforces budgets, debugs failures.

## Identity
- **Name:** Gatekeeper_Ang
- **Repo:** Intelligent-Internet/litellm-debugger
- **Pack:** D (LLM Gateway + Debug)
- **Wrapper Type:** SERVICE_WRAPPER
- **Deployment:** Docker container on VPS (`/opt/aims/vendor/intelligent-internet/litellm-debugger`)
- **Port:** 7012

## What Gatekeeper_Ang Does
- Proxies ALL LLM API calls through a single gateway (OpenAI-format)
- Routes to 100+ LLM providers (OpenRouter, Anthropic, Google, DeepSeek, etc.)
- Enforces token budgets and rate limits per Boomer_Ang
- Logs and debugs failed LLM calls
- Provides fallback routing (if Claude is down → route to Gemini)
- Cost tracking per agent, per task

## Security Policy
- All LLM API keys stored as env vars on VPS — never logged or transmitted
- Gatekeeper_Ang NEVER stores conversation content — only metadata (token counts, latency, model used)
- No external telemetry — all metrics stored in local PostgreSQL
- Request/response payloads pass through but are NOT persisted
- litellm's built-in telemetry DISABLED (set `LITELLM_TELEMETRY=false`)

## How ACHEEVY Uses Gatekeeper_Ang
1. All Boomer_Angs and engines send LLM calls to Gatekeeper_Ang instead of direct API
2. Gatekeeper_Ang routes to the optimal provider based on model, cost, and availability
3. Tracks usage per agent for billing and quota enforcement
4. ACHEEVY queries Gatekeeper_Ang for cost reports and usage dashboards

## Environment Variables (CRITICAL)
```
LITELLM_TELEMETRY=false          # KILL built-in telemetry
LITELLM_MASTER_KEY=<your-key>    # Admin access only
OPENROUTER_API_KEY=<key>
ANTHROPIC_API_KEY=<key>
GOOGLE_API_KEY=<key>
DEEPSEEK_API_KEY=<key>
```

## Guardrails
- `LITELLM_TELEMETRY=false` MUST be set — otherwise litellm phones home
- Master key required for admin endpoints
- No public internet exposure — internal network only
- Conversation content is transient — never written to disk
