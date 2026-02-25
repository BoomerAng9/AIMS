---
id: "mercury-llm"
name: "Mercury (Inception Labs)"
type: "tool"
category: "ai"
provider: "Inception Labs"
description: "World's first commercial diffusion-based LLM. Generates tokens in parallel — 5-10x faster than autoregressive models. OpenAI-compatible API."
env_vars:
  - "MERCURY_API_KEY"
  - "MERCURY_BASE_URL"
  - "MERCURY_MODEL"
docs_url: "https://www.inceptionlabs.ai/"
aims_files:
  - "backend/uef-gateway/src/agents/boomerangs/sme-ang.ts"
---

# Mercury (Inception Labs) — Diffusion LLM Tool Reference

## Overview

Mercury is the world's first commercial-scale diffusion large language model (dLLM) from Inception Labs. Unlike all other LLMs that generate text one token at a time (autoregressive), Mercury generates tokens **in parallel** using a diffusion process, achieving 5-10x higher throughput at dramatically lower inference cost.

Mercury is available as a **drop-in replacement** for any OpenAI-compatible endpoint — same request format, same response format, just faster.

## Key Specs

| Property | Value |
|----------|-------|
| Provider | Inception Labs |
| Architecture | Diffusion-based Transformer (dLLM) |
| Latest Model | `mercury-2` (Feb 2026) |
| Code Model | `mercury-coder-small` |
| Throughput | 1,009 tok/s (mercury-2 on Blackwell GPUs) |
| Speed Advantage | 5-10x faster than leading autoregressive models |
| Quality Benchmark | Competitive with Claude 4.5 Haiku and GPT 5.2 Mini |
| API Format | OpenAI chat completions (drop-in compatible) |
| Token Budget | 10M tokens allocated for A.I.M.S. |
| Backed By | Microsoft, NVIDIA, Snowflake ($50M round, Nov 2025) |

## API Key Setup

| Variable | Required | Description |
|----------|----------|-------------|
| `MERCURY_API_KEY` | Yes | Bearer token from Inception Labs |
| `MERCURY_BASE_URL` | Yes | `https://api.inceptionlabs.ai/v1` |
| `MERCURY_MODEL` | Yes | `mercury-2` (default) or `mercury-coder-small` |

**Apply in:** `infra/.env.production` or `frontend/.env.local`

## API Reference

### Base URL
```
https://api.inceptionlabs.ai/v1
```

### Auth Header
```
Authorization: Bearer $MERCURY_API_KEY
```

### Chat Completion
```http
POST /chat/completions
Content-Type: application/json
Authorization: Bearer $MERCURY_API_KEY

{
  "model": "mercury-2",
  "messages": [
    { "role": "system", "content": "You are ACHEEVY..." },
    { "role": "user", "content": "Deploy my app" }
  ]
}
```

### cURL Example
```bash
curl -X POST https://api.inceptionlabs.ai/v1/chat/completions \
  -H "Authorization: Bearer $MERCURY_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "Hello"}],
    "model": "mercury-2"
  }'
```

## Available Models

| Model | Use Case | Speed | Quality |
|-------|----------|-------|---------|
| `mercury-2` | General chat, reasoning, agent loops | 1,009 tok/s | ~Claude Haiku 4.5 |
| `mercury-coder-small` | Code generation, editing | 737 tok/s | Optimized for code |

## A.I.M.S. Use Cases

### 1. Agent Loop Acceleration
ACHEEVY orchestrates multi-step chains (deploy → configure → health-check → report). Each step may require an LLM call. Mercury cuts per-call latency by 5-10x, turning a 30s agent chain into a 3-5s one.

### 2. Real-Time Voice & Chat
Sub-200ms first-token latency makes Mercury ideal for the ACHEEVY live chat and voice pipeline (ElevenLabs STT → Mercury → ElevenLabs TTS). Users get near-instant responses.

### 3. Bulk Content Generation
Generating Plug catalog descriptions, export README files, onboarding copy, and email templates at scale. Mercury handles high-volume generation without queue back-pressure.

### 4. Code Generation (mercury-coder-small)
Rapid Plug scaffolding, Dockerfile generation, nginx config templating, and NtNtN build pipeline code. Use `mercury-coder-small` for this — 737 tok/s optimized for code.

### 5. Search Result Summarization
Fast summarization layer on top of Brave Search results before presenting to the user. Mercury's speed means search-augmented answers feel instant.

### 6. LUC Calculation Narratives
Instant plain-English explanation of complex financial calculations (K1 taxation, Zakat, flip analysis) from the LUC engine output.

## How Diffusion LLMs Work

Traditional LLMs (GPT, Claude, Gemini) are **autoregressive** — they predict one token at a time, sequentially. This means generating 100 tokens requires 100 forward passes.

Mercury uses **diffusion** — it starts with noise and iteratively refines multiple tokens in parallel. This means generating 100 tokens may only require 10-20 denoising steps, each producing multiple tokens simultaneously. The result: massive throughput gains with comparable quality.

## Fallback Chain (Updated)

```
Mercury (ultra-fast, latency-sensitive) → OpenRouter (200+ models, broad coverage) → Stub response
```

Use Mercury for hot paths where speed matters. Fall back to OpenRouter for tasks requiring specific model capabilities (e.g., Claude Opus for deep reasoning, GPT-5 for vision).

## Availability

Mercury is available through:
- **Direct API**: `https://api.inceptionlabs.ai/v1` (A.I.M.S. primary)
- **AWS Bedrock**: Available as a managed endpoint
- **Azure Foundry**: Available as a managed endpoint

## Troubleshooting

| Issue | Fix |
|-------|-----|
| 401 Unauthorized | Check `MERCURY_API_KEY` is set and valid |
| 402 / quota exceeded | Check remaining token budget (10M allocation) |
| Model not found | Use `mercury-2` or `mercury-coder-small` |
| Slow response | Verify you're hitting `api.inceptionlabs.ai` not a proxy |
