# Gatekeeper_Ang Brain — Gemini API Gateway

> **LiteLLM has been BLOCKED due to security vulnerabilities.**
> All LLM routing now goes through Gemini API and direct provider SDKs.
> See SECURITY-LITELLM-BLOCKED.md for approved endpoints.

## Identity
- **Name:** Gatekeeper_Ang
- **Pack:** D (LLM Gateway + Debug)
- **Wrapper Type:** SERVICE_WRAPPER
- **Deployment:** Gemini API via `https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent`

## What Gatekeeper_Ang Does
- Routes ALL LLM API calls through approved gateways (Gemini API, direct provider SDKs)
- Routes to approved LLM providers (Google GenAI, Anthropic, OpenAI)
- Enforces token budgets and rate limits per Boomer_Ang
- Logs and debugs failed LLM calls
- Provides fallback routing (if one provider is down, route to another approved provider)
- Cost tracking per agent, per task

## Approved LLM Routing
- **Gemini API**: `https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent`
- **Direct provider SDKs**: OpenAI SDK, Anthropic SDK, Google GenAI SDK
- **Nano Banana Pro 2**: For image generation via Gemini image models

## Security Policy
- All LLM API keys stored as env vars — never logged or transmitted
- Gatekeeper_Ang NEVER stores conversation content — only metadata (token counts, latency, model used)
- No external telemetry — all metrics stored in local PostgreSQL
- Request/response payloads pass through but are NOT persisted
- **LiteLLM is BLOCKED** — do not re-add under any circumstances

## How ACHEEVY Uses Gatekeeper_Ang
1. All Boomer_Angs and engines send LLM calls to Gatekeeper_Ang instead of direct API
2. Gatekeeper_Ang routes to the optimal approved provider based on model, cost, and availability
3. Tracks usage per agent for billing and quota enforcement
4. ACHEEVY queries Gatekeeper_Ang for cost reports and usage dashboards

## Environment Variables (CRITICAL)
```
GOOGLE_API_KEY=<key>              # Gemini API
ANTHROPIC_API_KEY=<key>            # Anthropic direct SDK
OPENAI_API_KEY=<key>               # OpenAI direct SDK
OPENROUTER_API_KEY=<key>           # OpenRouter fallback
```

## Guardrails
- **LiteLLM is permanently blocked** — see SECURITY-LITELLM-BLOCKED.md
- All LLM traffic must route through Gemini API or approved direct SDKs
- Master key required for admin endpoints
- No public internet exposure — internal network only
- Conversation content is transient — never written to disk
