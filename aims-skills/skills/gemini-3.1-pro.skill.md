---
id: "gemini-3.1-pro"
name: "Gemini 3.1 Pro — Google's Frontier Reasoning Model"
type: "skill"
status: "active"
triggers:
  - "gemini"
  - "gemini 3.1"
  - "gemini pro"
  - "google ai"
  - "thought signatures"
  - "google search grounding"
  - "visual thinking"
  - "arc-agi"
  - "custom tools model"
description: "Usage guide for Gemini 3.1 Pro — Google's most advanced model with 1M context, three-level thinking, native tool use, and thought signatures. Covers API modes, pricing, grounding, and next-level use cases for AIMS."
execution:
  target: "internal"
  route: ""
dependencies:
  env:
    - "OPENROUTER_API_KEY"
    - "GOOGLE_APPLICATION_CREDENTIALS"
  apis:
    - "https://openrouter.ai/api/v1"
    - "https://generativelanguage.googleapis.com/v1beta"
    - "https://cloud.google.com/vertex-ai"
priority: "high"
released: "2026-02-19"
---

# Gemini 3.1 Pro Skill

> Released February 19, 2026 by Google DeepMind.
> First ".1" increment — signals a leap in core reasoning.

## What It Is

Gemini 3.1 Pro is Google's **most advanced model** as of February 2026. It processes
text, images, audio, video, PDFs (up to 1,000 pages), and code natively in a single
inference call — no external preprocessing.

Key stats:
- **1M token context window** (1,048,576 tokens)
- **64K max output** (must set explicitly — default is 8,192)
- **Three-level thinking system** — LOW / MEDIUM / HIGH
- **ARC-AGI-2: 77.1%** — more than 2x its predecessor (31.1%)
- **Thought signatures** — persistent reasoning chains across multi-turn conversations
- **$2 / $12 per 1M tokens** — 7.5x cheaper than Claude Opus 4.6 on input

## Model IDs

| Variant | ID | Use Case |
|---|---|---|
| Standard | `gemini-3.1-pro-preview` | General reasoning, research, analysis |
| Custom Tools | `gemini-3.1-pro-preview-customtools` | Agentic workflows with bash/file tools |
| OpenRouter | `google/gemini-3.1-pro-preview` | Unified API access |

## Thinking Levels

Gemini 3.1 Pro uses configurable reasoning depth:

| Level | Description | When to Use |
|---|---|---|
| `LOW` | Lightweight, fastest | Classification, routing, simple extraction |
| `MEDIUM` | Balanced — equivalent to 3.0 Pro HIGH | General chat, summaries, standard coding |
| `HIGH` | Mini version of Deep Think | Complex reasoning, math, research synthesis |

**80/20 Rule**: 80% of tasks on LOW/MEDIUM, 20% on HIGH. Saves 50-70% on API spend.

```typescript
// OpenRouter with thinking level
const response = await openrouter.chat({
  model: 'gemini-3.1-pro',
  messages: [...],
  thinking_level: 'medium', // Uses our existing thinking_level support
});
```

```python
# Google AI Studio / Vertex AI
import google.generativeai as genai

model = genai.GenerativeModel("gemini-3.1-pro-preview")
response = model.generate_content(
    "Analyze this codebase for security vulnerabilities.",
    generation_config=genai.GenerationConfig(
        max_output_tokens=65536,  # MUST set explicitly — default is only 8192
        thinking_level="HIGH",
    ),
)
```

## Thought Signatures

Unique to Gemini 3 — encrypted representations of the model's internal reasoning
that persist across API calls. **Critical for multi-turn agentic workflows.**

Rules:
- **MUST** return thought signatures back to the model exactly as received
- Missing signatures → **400 error**
- For parallel function calls: only first `functionCall` part contains the signature; return parts in exact order
- Google Gen AI SDKs handle signatures automatically when using chat feature

## Native Tool Use

Gemini 3.1 Pro supports these built-in tools in a single inference step:

| Tool | What It Does |
|---|---|
| **Google Search Grounding** | Real-time web search — model auto-generates queries |
| **Code Execution** | Writes and runs Python — can manipulate images (visual thinking) |
| **File Search** | Search through uploaded file context |
| **URL Context** | Fetch and process URL content |

Multi-tool use supported: Search + Code Execution in a single request.
Custom function calling NOT yet combinable with built-in tools.

```python
# Multi-tool: Search + Code Execution
response = model.generate_content(
    "Research the latest NFL draft picks and create a visualization.",
    tools=[
        {"google_search": {}},
        {"code_execution": {}},
    ],
)
```

## Pricing

| Metric | Standard (≤200K ctx) | Long Context (>200K) |
|---|---|---|
| Input | **$2.00 / 1M** | $4.00 / 1M |
| Output | **$12.00 / 1M** | $18.00 / 1M |
| Batch (async) | $1.00 / $6.00 | — |
| Cache Read | $0.20 / 1M | — |
| Search Grounding | 5K free/mo, then $14/1K queries | — |

Identical pricing to Gemini 3.0 Pro — massive performance upgrade at zero cost increase.

## Benchmark Performance

| Benchmark | Gemini 3.1 Pro | Claude Opus 4.6 | GPT-5.2 |
|---|---|---|---|
| ARC-AGI-2 | **77.1%** | 68.8% | 52.9% |
| GPQA Diamond | **94.3%** | 91.3% | 92.4% |
| SWE-Bench Verified | **80.6%** | 80.8% | — |
| Terminal-Bench 2.0 | **68.5%** | 65.4% | — |
| BrowseComp | **85.9%** | — | 65.8% |
| HLE (with tools) | 51.4% | **53.1%** | — |
| LiveCodeBench | **2887 Elo** | — | — |

## AIMS Next-Level Use Cases

### 1. Full-Codebase Security Audit (1M Context)
Feed an entire repository (up to 1M tokens) into a single Gemini call with HIGH thinking.
No chunking, no RAG — pure single-pass analysis.
```
Use case: Plug Catalog security review before publishing
Trigger: Before any plug goes live, ACHEEVY runs a full-codebase audit
Thinking: HIGH
Cost: ~$4 for a 500K-token codebase (input + output)
```

### 2. Visual Thinking for Data Analysis
Gemini can write Python to crop, annotate, and manipulate images as part of its
reasoning process — "thinking with its eyes."
```
Use case: Per|Form analytics — generate charts, annotate plays, visual scouting reports
Tools: code_execution + google_search
Output: Generated matplotlib/plotly visualizations + written analysis
```

### 3. Real-Time Research Grounding
Google Search grounding connects the model to live web data.
```
Use case: Research verticals — ACHEEVY fetches real-time market data, competitor analysis
Trigger: Any research task where data freshness matters
Cost: $14/1K search queries after 5K free/month
```

### 4. Agentic Custom-Tools Workflows
The `customtools` variant is optimized for autonomous agents using bash, file, and code tools.
```
Use case: Chicken Hawk build jobs — autonomous code generation + testing + deployment
Model: gemini-3.1-pro-preview-customtools
Why: Prioritizes tool invocation over conversational filler
```

### 5. Multi-Modal Intake Processing
Process video walkthroughs, audio interviews, PDF contracts, and images in a single call.
```
Use case: Needs Analysis intake — client uploads mixed media, Gemini extracts requirements
Input: Video demo + PDF spec + screenshot mockups
Output: Structured JSON requirements document
```

### 6. Budget-Aware Batch Processing
50% discount on batch API for non-urgent workloads.
```
Use case: Nightly content generation, SEO analysis, documentation generation
Cost: $1/$6 per 1M tokens (batch) vs $2/$12 (realtime)
Volume: Process thousands of pages overnight at half price
```

## Routing Rules for AIMS

```
IF task is classification/routing/simple extraction
  → gemini-3.0-flash (even cheaper, faster)

IF task needs real-time web data + analysis
  → gemini-3.1-pro with google_search grounding

IF task is full-codebase analysis or 100K+ document
  → gemini-3.1-pro with HIGH thinking (leverage 1M context)

IF task is autonomous agent workflow (build, deploy, test)
  → gemini-3.1-pro-preview-customtools

IF task needs highest reasoning quality regardless of cost
  → claude-opus-4.6 (still leads HLE, human preference)

IF task is budget batch work
  → gemini-3.1-pro batch API (50% off)
```

## Anti-Patterns

- Do NOT use default `maxOutputTokens` (8192) for generation tasks — set to 65536 explicitly
- Do NOT drop thought signatures between turns — causes 400 errors
- Do NOT combine built-in tools with custom function calling (not yet supported)
- Do NOT use HIGH thinking for simple routing — wastes tokens and money
- Do NOT assume Gemini Flash and Gemini Pro share the same capabilities — Pro has search grounding, Flash does not
- Do NOT use `thinkingBudget` parameter — it's deprecated; use `thinkingLevel` instead

## References

- Model Card: https://deepmind.google/models/model-cards/gemini-3-1-pro/
- API Docs: https://ai.google.dev/gemini-api/docs/models
- Thinking Docs: https://ai.google.dev/gemini-api/docs/thinking
- Thought Signatures: https://ai.google.dev/gemini-api/docs/thought-signatures
- Pricing: https://ai.google.dev/gemini-api/docs/pricing
- OpenRouter: https://openrouter.ai/google/gemini-3.1-pro-preview
