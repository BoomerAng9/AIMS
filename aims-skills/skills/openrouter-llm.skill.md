---
id: "openrouter-llm"
name: "OpenRouter LLM Routing"
type: "skill"
status: "active"
triggers:
  - "model"
  - "llm"
  - "openrouter"
  - "which model"
  - "ai model"
  - "token cost"
  - "cheaper model"
description: "Guides agents on model selection, cost awareness, and the LLM fallback chain."
execution:
  target: "internal"
  route: ""
dependencies:
  files:
    - "aims-skills/tools/openrouter.tool.md"
    - "backend/uef-gateway/src/llm/openrouter.ts"
    - "backend/uef-gateway/src/llm/vertex-ai.ts"
priority: "high"
---

# OpenRouter LLM Routing Skill

## When This Fires

Triggers when any agent needs to select a model, estimate costs, or understand the LLM routing chain.

## Model Selection Rules

### By Task Complexity

| Task Type | Recommended Model | Tier | Why |
|-----------|-------------------|------|-----|
| Simple routing/classification | `gemini-3.0-flash` | Fast | $0.10/M input, fastest |
| General chat/responses | `claude-sonnet-4.6` | Standard | Best quality/cost balance, adaptive thinking |
| Complex reasoning/coding | `claude-opus-4.6` | Premium | Most capable, 1M context, adaptive max effort |
| Research + web grounding | `gemini-3.1-pro` | Standard | **$2/$12**, 1M ctx, native Google Search grounding, ARC-AGI-2 77.1%. See `skills/gemini-3.1-pro.skill.md` |
| Quick extraction/parsing | `claude-haiku-4.5` | Fast | Fast, cheap, good enough |
| Budget frontier reasoning | `glm-5` | Economy | **$1/$3.20**, 744B MoE, MIT licensed, record-low hallucination. See `skills/glm-5.skill.md` |
| Budget-sensitive batch work | `llama-4-maverick` | Economy | $0.27/M, 1M context, MoE |
| Visual agentic / agent swarm | `moonshotai/kimi-k2.5` | Premium | 1T MoE, native multimodal, 256K ctx. See `skills/kimi-k2.5.skill.md` |
| Video understanding | `moonshotai/kimi-k2.5` | Premium | Only model with native video input (official API only) |
| Ultra-budget frontier reasoning | `seed-2.0-pro` | Economy | **$0.47/$2.37**, 98.3 AIME, 89.5 VideoMME — Volcano Engine only. See `skills/bytedance-seed-2.0.skill.md` |
| AI video generation | Seedance 2.0 | — | 20s @ 1080p, character consistency — Volcano Engine. See `skills/bytedance-seed-2.0.skill.md` |
| Competitive coding | `seed-2.0-code` | Economy | 3020 Codeforces, 87.8 LiveCodeBench — Volcano Engine. See `skills/bytedance-seed-2.0.skill.md` |
| Chinese-language tasks | `glm-5` | Economy | Natively bilingual, CLUE benchmark leader. See `skills/glm-5.skill.md` |
| Voice / real-time response | `claude-opus-4.6` (fast mode) | Premium | 2.5x speed, same intelligence. See `skills/claude-4.6.skill.md` |
| Security audits | `claude-opus-4.6` (max effort) | Premium | Found 500+ zero-days. See `skills/claude-4.6.skill.md` |

### Cost Awareness Rules

1. **Never use Premium tier for simple tasks** — Classification, routing, and yes/no questions use Fast tier
2. **Default to Gemini Flash** — The gateway default (`gemini-3.0-flash`) is correct for 80% of routing decisions
3. **Escalate only when needed** — Start with Fast/Standard, upgrade to Premium only for complex multi-step reasoning
4. **Track costs per job** — Every `LLMResult.cost.usd` feeds into LUC for per-job billing
5. **Monitor token usage** — `LLMResult.tokens.total` must be logged for every call

### Fallback Chain

```
1. Vertex AI (if GOOGLE_APPLICATION_CREDENTIALS set)
   ↓ on failure
2. OpenRouter (if OPENROUTER_API_KEY set)
   ↓ on failure
3. Stub response (returns error message, never silent)
```

### API Key Check

Before making any LLM call, verify:
```typescript
if (!process.env.OPENROUTER_API_KEY) {
  // Fall back to heuristic mode — no real LLM calls
  // Log warning: agents operating in degraded mode
}
```

## Anti-Patterns

- Do NOT hardcode model IDs in frontend code — always route through UEF Gateway
- Do NOT use Premium models for logging/telemetry
- Do NOT retry 402 errors (payment required) — alert user to add credits
- Do NOT stream when response is <100 tokens — overhead exceeds benefit
