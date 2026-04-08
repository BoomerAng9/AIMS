# Claude 4.6 API Patterns

## Adaptive Thinking

```typescript
// Standard adaptive thinking
const response = await anthropic.messages.create({
  model: "claude-opus-4-6",
  max_tokens: 16000,
  thinking: { type: "adaptive" },
  messages: [{ role: "user", content: "..." }],
});

// With explicit effort level (Opus only for "max")
const response = await anthropic.messages.create({
  model: "claude-opus-4-6",
  max_tokens: 16000,
  thinking: { type: "adaptive", effort: "max" },
  messages: [{ role: "user", content: "..." }],
});
```

## 1M Context Window (Beta)

```typescript
const response = await anthropic.messages.create({
  model: "claude-opus-4-6",
  max_tokens: 16000,
  messages: [{ role: "user", content: largeDocument }],
  headers: { "anthropic-beta": "context-1m-2025-08-07" },
});
```

Available on Claude Developer Platform (not yet Bedrock/Vertex for 1M).

## Fast Mode (Opus 4.6 Only — Research Preview)

Same model, **2.5x faster** output at premium pricing:
- Input: $30/MTok, Output: $150/MTok (6x standard)

```typescript
const response = await anthropic.beta.messages.create({
  model: "claude-opus-4-6",
  speed: "fast",
  betas: ["fast-mode-2026-02-01"],
  messages: [{ role: "user", content: "..." }],
});
```

## Pricing

| Feature | Opus 4.6 | Sonnet 4.6 | Haiku 4.5 |
|---|---|---|---|
| Input | $5 | $3 | $1 |
| Output | $25 | $15 | $5 |
| Cache Write (5m) | $6.25 | $3.75 | $1.25 |
| Cache Write (1h) | $10 | $6 | $2 |
| Cache Read | **$0.50** | **$0.30** | **$0.10** |
| Batch Input | $2.50 | $1.50 | $0.50 |
| Batch Output | $12.50 | $7.50 | $2.50 |
| Web Search | $10/1K searches | $10/1K searches | — |

**Discount stacking**: Batch (50%) + Cache Read (90% off) + Long Context modifiers multiply.

## Benchmark Performance

| Benchmark | Opus 4.6 | Sonnet 4.6 | GPT-5.2 | Gemini 3.1 Pro |
|---|---|---|---|---|
| Terminal-Bench 2.0 | **65.4%** | — | — | 68.5% |
| SWE-Bench Verified | **80.8%** | — | — | 80.6% |
| OSWorld (computer use) | **72.7%** | 72.5% | — | — |
| HLE (with tools) | **53.1%** | — | — | 51.4% |
| ARC-AGI-2 | 68.8% | — | 52.9% | **77.1%** |
| BigLaw Bench | **90.2%** | — | — | — |

## Breaking Changes in 4.6

| Change | Impact | Migration |
|---|---|---|
| `thinking: {type: "enabled"}` + `budget_tokens` | Deprecated | Use `thinking: {type: "adaptive"}` |
| `interleaved-thinking` beta header | Deprecated on Opus 4.6 | Adaptive thinking auto-enables it |
| `output_format` parameter | Deprecated | Use `output_config.format` |
| Assistant message prefill | **Removed** on Opus 4.6 (400 error) | Use structured outputs or system prompts |
| Cache isolation | Changed from org-level to workspace-level | Update cache key strategies |

## AIMS Use Cases

### Orchestrator Brain (Opus 4.6 + Adaptive Max)
Core ACHEEVY reasoning for multi-step planning, resource allocation, deployment orchestration.

### Agent Teams for Complex Builds
Parallel Claude instances tackling frontend, backend, DB, and infra simultaneously.

### Security Scanning Pipeline
Automated vulnerability discovery across Plug Catalog before any plug goes live.

### Computer Use for UI Testing
Claude navigates browser interfaces to test deployed plugs with screenshot evidence.

### Infinite Conversation with Compaction
Long-running project management conversations that never lose context.

### Real-Time Fast Mode for Voice
Sub-second responses for voice-enabled ACHEEVY (6x pricing but tiny absolute cost for short responses).

### Batch Processing for Content Generation
50% discount on overnight documentation, marketing copy, plug description workloads.

## References

- Opus 4.6 Announcement: https://www.anthropic.com/news/claude-opus-4-6
- Sonnet 4.6 Announcement: https://www.anthropic.com/news/claude-sonnet-4-6
- Adaptive Thinking: https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking
- Pricing: https://platform.claude.com/docs/en/about-claude/pricing
- Agent Teams: https://code.claude.com/docs/en/agent-teams
- Claude Code Security: https://www.anthropic.com/news/claude-code-security
