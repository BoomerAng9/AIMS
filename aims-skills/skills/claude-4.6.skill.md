---
id: "claude-4.6"
name: "Claude 4.6 — Anthropic Opus & Sonnet Frontier Models"
type: "skill"
status: "active"
triggers:
  - "claude"
  - "claude opus"
  - "claude sonnet"
  - "opus 4.6"
  - "sonnet 4.6"
  - "adaptive thinking"
  - "agent teams"
  - "compaction"
  - "fast mode"
  - "computer use"
  - "claude code"
description: "Usage guide for Claude Opus 4.6 and Sonnet 4.6 — Anthropic's frontier models with adaptive thinking, 1M context, agent teams, fast mode, and computer use. Covers API access, pricing, and next-level use cases for AIMS."
execution:
  target: "internal"
  route: ""
dependencies:
  env:
    - "OPENROUTER_API_KEY"
  apis:
    - "https://openrouter.ai/api/v1"
    - "https://api.anthropic.com/v1"
priority: "critical"
released: "2026-02-05"
---

# Claude 4.6 Skill

> Claude Opus 4.6: Released February 5, 2026
> Claude Sonnet 4.6: Released February 17, 2026

## Model Lineup

| Model | API ID | Context | Max Output | Input $/MTok | Output $/MTok |
|---|---|---|---|---|---|
| **Opus 4.6** | `claude-opus-4-6` | 200K (1M beta) | 128K | $5 | $25 |
| **Sonnet 4.6** | `claude-sonnet-4-6` | 200K (1M beta) | 64K | $3 | $15 |
| Haiku 4.5 | `claude-haiku-4-5-20251001` | 200K | 64K | $1 | $5 |

## What's New in 4.6

### Adaptive Thinking (Replaces Extended Thinking)
No more manual `budget_tokens`. The model dynamically decides reasoning depth.

| Effort Level | Description | Best For |
|---|---|---|
| `low` | Minimal reasoning | Classification, routing, extraction |
| `medium` | Balanced | General chat, summaries, standard code |
| `high` (default) | Deep reasoning | Complex analysis, debugging, research |
| `max` (**Opus only**) | Maximum depth | Hardest problems, novel algorithms, proofs |

```typescript
// Adaptive thinking via Anthropic API
const response = await anthropic.messages.create({
  model: "claude-opus-4-6",
  max_tokens: 16000,
  thinking: { type: "adaptive" },
  // Optional: thinking: { type: "adaptive", effort: "max" },
  messages: [{ role: "user", content: "..." }],
});
```

### 1M Context Window (Beta)
Both Opus and Sonnet 4.6 support 1M tokens with beta header:
```
anthropic-beta: context-1m-2025-08-07
```
Available on Claude Developer Platform (not yet Bedrock/Vertex for 1M).

### 128K Max Output (Opus 4.6)
Doubled from 64K. Requires streaming for large `max_tokens` values.

### Fast Mode (Opus 4.6 Only — Research Preview)
Same model, **2.5x faster** output at premium pricing:
- Input: $30/MTok, Output: $150/MTok (6x standard)
- Beta header: `fast-mode-2026-02-01`
- No intelligence trade-off — just faster inference
```typescript
const response = await anthropic.beta.messages.create({
  model: "claude-opus-4-6",
  speed: "fast",
  betas: ["fast-mode-2026-02-01"],
  messages: [{ role: "user", content: "..." }],
});
```

### Compaction API (Beta)
Server-side automatic context summarization for infinite conversations.
No custom truncation logic needed.

### Agent Teams
Multiple Claude Code instances working in parallel with a team lead coordinating.
Sub-agents have their own context windows and communicate directly.
Demo: Built a working C compiler (100K lines) that boots Linux on 3 CPU architectures.

### Computer Use
72.7% on OSWorld (Opus) / 72.5% (Sonnet) — nearly 5x improvement since launch.
Complex multi-application workflows: browse, click, type, navigate across apps.

### Claude Code Security
Uses Opus 4.6 to find vulnerabilities that static analysis misses.
Found **500+ high-severity zero-days** in open-source libraries.

## Pricing Deep Dive

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
| GDPval-AA Elo | **#1** | — | #2 (-144) | — |

Sonnet 4.6 preferred over Sonnet 4.5 in **70%** of Claude Code comparisons.
Sonnet 4.6 preferred over **Opus 4.5** in **59%** of comparisons.

## AIMS Next-Level Use Cases

### 1. ACHEEVY Orchestrator Brain (Opus 4.6 + Adaptive Max)
ACHEEVY's core reasoning engine. When a user request requires multi-step planning,
resource allocation, and deployment orchestration:
```
Model: claude-opus-4-6
Thinking: adaptive, effort: max
Use case: "Deploy a full-stack app with database, API, and frontend"
→ ACHEEVY plans infrastructure, allocates ports, generates configs, deploys containers
```

### 2. Agent Teams for Complex Builds
Parallel Claude instances tackling different parts of a build simultaneously:
```
Use case: Chicken Hawk complex builds
Team lead: Plans architecture, assigns subtasks
Sub-agent 1: Frontend scaffold
Sub-agent 2: Backend API
Sub-agent 3: Database schema + migrations
Sub-agent 4: Docker + nginx config
→ All coordinate through team lead, merge results
```

### 3. Security Scanning Pipeline (Claude Code Security)
Automated vulnerability discovery across the entire Plug Catalog:
```
Use case: Before any plug goes live, scan for zero-days
Model: claude-opus-4-6 (same engine as Claude Code Security)
Input: Full source code of the plug
Output: Vulnerability report with severity, location, fix suggestions
Gate: Human-in-the-loop review before publish
```

### 4. Computer Use for UI Testing
Claude navigates actual browser interfaces to test deployed plugs:
```
Use case: Automated E2E testing of deployed plug instances
Flow: Navigate to plug URL → interact with UI → verify functionality
Model: claude-sonnet-4-6 (cost-effective for repetitive UI tasks)
Evidence: Screenshots at each step for audit trail
```

### 5. Infinite Conversation with Compaction
ACHEEVY chat sessions that never lose context:
```
Use case: Long-running project management conversations
Feature: Compaction API auto-summarizes old context
Result: Users can have weeks-long conversations without context limits
Cost: Only pay for compacted summaries, not full history replay
```

### 6. Real-Time Fast Mode for Voice
When PersonaPlex or voice I/O needs instant responses:
```
Use case: Voice-enabled ACHEEVY with sub-second responses
Model: claude-opus-4-6 with fast mode
Speed: 2.5x faster output generation
Trade-off: 6x pricing, but for short voice responses the absolute cost is tiny
```

### 7. Batch Processing for Content Generation
50% discount on overnight workloads:
```
Use case: Generate documentation, marketing copy, plug descriptions
Schedule: Nightly batch via n8n workflow
Cost: $2.50/$12.50 per MTok (Opus batch) or $1.50/$7.50 (Sonnet batch)
Volume: Process hundreds of content pieces overnight
```

### 8. MCP-Powered Tool Ecosystem
Claude has the deepest MCP integration — 75+ official connectors:
```
Use case: ACHEEVY connects to GitHub, Slack, databases, file systems via MCP
Standard: Open protocol donated to Linux Foundation's AAIF
Integration: UEF Gateway acts as MCP server for Claude API calls
```

## Routing Rules for AIMS

```
IF task is core ACHEEVY orchestration (deploy, provision, scale)
  → claude-opus-4-6, adaptive thinking, effort: high or max

IF task is code review, PR analysis, debugging
  → claude-sonnet-4-6, adaptive thinking, effort: medium

IF task is classification, intent detection, routing
  → claude-haiku-4.5 or gemini-3.0-flash (cheaper, faster)

IF task needs real-time voice response
  → claude-opus-4-6 fast mode (2.5x speed)

IF task is bulk content generation (overnight)
  → claude-sonnet-4-6 batch API (50% off)

IF task is security audit
  → claude-opus-4-6, adaptive thinking, effort: max

IF task is UI testing / computer use
  → claude-sonnet-4-6 with computer_use tool
```

## Breaking Changes in 4.6

| Change | Impact | Migration |
|---|---|---|
| `thinking: {type: "enabled"}` + `budget_tokens` | Deprecated | Use `thinking: {type: "adaptive"}` |
| `interleaved-thinking` beta header | Deprecated on Opus 4.6 | Adaptive thinking auto-enables it |
| `output_format` parameter | Deprecated | Use `output_config.format` |
| Assistant message prefill | **Removed** on Opus 4.6 (400 error) | Use structured outputs or system prompts |
| Cache isolation | Changed from org-level to workspace-level | Update cache key strategies |

## Anti-Patterns

- Do NOT use `budget_tokens` on 4.6 models — use adaptive thinking instead
- Do NOT prefill assistant messages on Opus 4.6 — returns 400 error
- Do NOT use Fast Mode for batch workloads — 6x pricing defeats the purpose
- Do NOT default to Opus for everything — Sonnet 4.6 beats previous Opus 4.5 in 59% of cases
- Do NOT ignore prompt caching — cache reads are 90% cheaper than fresh input
- Do NOT skip the `max` effort level for critical decisions — it's exclusive to Opus 4.6 for a reason

## References

- Opus 4.6 Announcement: https://www.anthropic.com/news/claude-opus-4-6
- Sonnet 4.6 Announcement: https://www.anthropic.com/news/claude-sonnet-4-6
- Adaptive Thinking: https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking
- Pricing: https://platform.claude.com/docs/en/about-claude/pricing
- Agent Teams: https://code.claude.com/docs/en/agent-teams
- Claude Code Security: https://www.anthropic.com/news/claude-code-security
- MCP: https://www.anthropic.com/news/donating-the-model-context-protocol-and-establishing-of-the-agentic-ai-foundation
