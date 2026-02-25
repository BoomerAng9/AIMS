---
id: "mercury-llm"
name: "Mercury Diffusion LLM Integration"
type: "skill"
category: "ai-integration"
provider: "Inception Labs"
description: "Skill for integrating Mercury diffusion LLM into ACHEEVY agent pipelines for ultra-fast inference on latency-sensitive hot paths."
triggers:
  - "mercury"
  - "inception labs"
  - "diffusion llm"
  - "fast inference"
  - "fast model"
  - "speed"
  - "low latency"
  - "bulk generate"
tool_ref: "aims-skills/tools/mercury-llm.tool.md"
---

# Mercury Diffusion LLM — Integration Skill

## When to Use Mercury

Route to Mercury when the task demands **speed over breadth**:

| Scenario | Use Mercury? | Why |
|----------|-------------|-----|
| ACHEEVY multi-step agent chain | Yes | Each hop is 5-10x faster — compound savings |
| Real-time chat response | Yes | Sub-200ms first token |
| Voice pipeline (STT → LLM → TTS) | Yes | Keeps end-to-end latency under 1s |
| Bulk content generation (10+ items) | Yes | Parallel generation, no queue pressure |
| Code scaffolding (Plug templates) | Yes | Use `mercury-coder-small` |
| Deep reasoning / complex analysis | No | Use Claude Opus via OpenRouter |
| Vision / multimodal input | No | Mercury is text-only |
| Model-specific fine-tuning | No | Use OpenRouter for model variety |

## Integration Pattern

Mercury uses the **OpenAI chat completions format** — it's a drop-in replacement:

```typescript
const response = await fetch(`${process.env.MERCURY_BASE_URL}/chat/completions`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${process.env.MERCURY_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: process.env.MERCURY_MODEL || 'mercury-2',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
  }),
});

const data = await response.json();
const reply = data.choices[0].message.content;
```

## Routing Rules for SME_Ang

When SME_Ang receives a dispatch request, apply these rules:

1. **If the user asks for "fast" / "quick" / "instant" / "speed"** → Route to Mercury
2. **If the task is an agent loop with 3+ steps** → Route to Mercury for each sub-call
3. **If the task involves code generation** → Route to `mercury-coder-small`
4. **If the task requires deep reasoning or 200K+ context** → Route to OpenRouter (Claude/GPT)
5. **If MERCURY_API_KEY is not set** → Fall back to OpenRouter automatically

## Token Budget Management

- **Allocated:** 10M tokens
- **Tracking:** Each Mercury call should log `tokens.total` to the LUC billing engine
- **Alert at:** 80% usage (8M tokens) — notify owner via Chicken Hawk
- **Fallback at:** 100% usage — auto-switch to OpenRouter

## Environment Variables

```env
MERCURY_API_KEY=sk_148056f6feed5befe3f5c7a7c2491a1b
MERCURY_BASE_URL=https://api.inceptionlabs.ai/v1
MERCURY_MODEL=mercury-2
```

## Error Handling

```typescript
try {
  const result = await mercuryChat(messages);
  return result;
} catch (err) {
  logger.warn('[Mercury] Falling back to OpenRouter', { error: err.message });
  return openrouterChat(messages); // automatic fallback
}
```
