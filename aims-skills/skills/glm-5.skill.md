---
id: "glm-5"
name: "GLM-5 — Z.ai's Frontier Open-Source MoE Model"
type: "skill"
status: "active"
triggers:
  - "glm"
  - "glm-5"
  - "zhipu"
  - "z.ai"
  - "chatglm"
  - "chinese model"
  - "cogvideo"
  - "cogview"
  - "agentic engineering"
  - "huawei trained"
description: "Usage guide for GLM-5 — Z.ai's 744B MoE frontier model (MIT licensed). Covers API access, pricing, agentic engineering, CogVideoX, and next-level use cases for AIMS."
execution:
  target: "internal"
  route: ""
dependencies:
  env:
    - "OPENROUTER_API_KEY"
  apis:
    - "https://openrouter.ai/api/v1"
    - "https://api.z.ai"
    - "https://bigmodel.cn"
    - "https://build.nvidia.com/z-ai/glm5"
priority: "high"
released: "2026-02-11"
license: "MIT — fully open-source, commercial use allowed"
---

# GLM-5 Skill

> Released February 11, 2026 by Z.ai (formerly Zhipu AI — Tsinghua University spinoff).
> MIT License — free to use, modify, fine-tune, redistribute commercially.
> Trained entirely on 100,000 Huawei Ascend 910B chips — zero NVIDIA dependency.

## What It Is

GLM-5 is a **744-billion-parameter Mixture-of-Experts** model with ~40B active parameters
per token. It's the strongest open-source model as of February 2026, competing directly
with Claude Opus 4.5 and GPT-5.2 on benchmarks while being **5-8x cheaper**.

Key stats:
- **744B total / 40B active** (256 experts per layer, top-8 activated)
- **200K input context / 128K max output**
- **MIT licensed** — no restrictions on commercial use
- **$1.00 / $3.20 per 1M tokens** — cheapest frontier model
- **Native Chinese + English** — not a fine-tuned English model
- **Record-low hallucination rate** — best in industry (Artificial Analysis)

## Architecture

| Spec | Value |
|---|---|
| Total Parameters | 744B |
| Active per Token | ~40B |
| Architecture | MoE Transformer decoder |
| Experts | 256 per layer, top-8 activated |
| Layers | 78 (first 3 dense, rest MoE) |
| Attention | Multi-head Latent Attention (MLA) + DeepSeek Sparse Attention |
| Context Window | 200K input |
| Max Output | 128K (~131,000 tokens) |
| Pre-training Data | 28.5 trillion tokens |
| Training Hardware | 100K Huawei Ascend 910B |
| License | **MIT** |

## API Access

### OpenRouter (Recommended for AIMS)
```
Model ID: z-ai/glm-5
Endpoint: https://openrouter.ai/api/v1
```

```typescript
// Via AIMS OpenRouter client
const result = await openrouter.chat({
  model: 'z-ai/glm-5',
  messages: [...],
  temperature: 0.7,
});
```

### NVIDIA NIM
```
Endpoint: https://build.nvidia.com/z-ai/glm5
Auth: Bearer $HF_TOKEN or NVIDIA NIM API key
```

### Direct API (Z.ai)
```
Endpoint: https://api.z.ai
Docs: https://docs.z.ai
Chat: https://chat.z.ai
```

### Self-Hosted (MIT — fully permitted)
```bash
# vLLM deployment (8x H100 80GB minimum)
vllm serve zai-org/GLM-5-FP8 \
  --tensor-parallel-size 8 \
  --gpu-memory-utilization 0.85 \
  --tool-call-parser glm47 \
  --reasoning-parser glm45 \
  --enable-auto-tool-choice \
  --served-model-name glm-5-fp8
```

Also available via: Ollama (`ollama run glm-5`), SGLang, KTransformers, HuggingFace.

## Pricing

| Model | Input/MTok | Cached Input/MTok | Output/MTok |
|---|---|---|---|
| **GLM-5** | **$1.00** | $0.20 | **$3.20** |
| GLM-5-Code | $1.20 | $0.30 | $5.00 |

**Comparison (per MTok):**
| Model | Input | Output | GLM-5 Savings |
|---|---|---|---|
| Claude Opus 4.6 | $5.00 | $25.00 | **5x input, 8x output** |
| Gemini 3.1 Pro | $2.00 | $12.00 | **2x input, 4x output** |
| GPT-5.2 | $5.00 | $20.00 | **5x input, 6x output** |

## Benchmark Performance

| Benchmark | GLM-5 | Claude Opus 4.5 | Notes |
|---|---|---|---|
| AIME 2026 | 92.7% | — | Near-frontier math |
| GPQA Diamond | 86.0% | — | Graduate-level science |
| HLE (with tools) | 50.4 | — | Beats Claude Opus 4.5 |
| SWE-Bench Verified | **77.8%** | 80.9% | Open-source SOTA |
| SWE-Bench Multilingual | 73.3% | 77.5% | Strong cross-lingual |
| Terminal-Bench 2.0 | 56.2% | — | Verified: 60.7% |
| BrowseComp | 62.0 | — | Open-model leader |
| Agentic Index | **63** | — | Highest open-weight |
| Hallucination Rate | **Record low** | — | Best in industry |

## Z.ai Ecosystem (Companion Models)

GLM-5 is text-only, but the Z.ai ecosystem provides full multimodality:

| Model | Type | Key Feature |
|---|---|---|
| **GLM-4.6V** | Vision-Language | 128K context, native function call, 106B total |
| **GLM-Image / Seedream 5.0** | Image Generation | Photorealistic 2K, auto-regressive + diffusion |
| **CogVideoX 1.5** | Video Generation | Text→video, image→video, 10s @ 768P, Apache 2.0 |
| **GLM-OCR** | Document OCR | Available on HuggingFace (zai-org/GLM-OCR) |
| **CogView4** | Image Understanding | Fine-tuning via CogKit framework |

## Key Features

| Feature | Status |
|---|---|
| Reasoning / Thinking Mode | Yes — native preserved thinking across turns |
| Tool Calling / Function Calling | Yes — structured JSON output |
| Agent Mode | Yes — autonomous subtask decomposition |
| Code Generation | Yes — front-end, back-end, data processing |
| Code Interpreter | Yes (via chat.z.ai) |
| Web Browsing | Yes — BrowseComp leader among open models |
| Document Generation | Yes — .docx, .pdf, .xlsx from prompts |

## AIMS Next-Level Use Cases

### 1. Cost-Optimized ACHEEVY Backbone
Use GLM-5 as a budget-friendly alternative to Opus for routine orchestration:
```
Use case: ACHEEVY standard chat, task planning, general reasoning
Model: z-ai/glm-5 via OpenRouter
Cost: $1/$3.20 per MTok vs $5/$25 for Opus
Savings: 80%+ on routine conversational tasks
Routing: Default to GLM-5, escalate to Opus for critical decisions
```

### 2. Chinese Market Expansion
GLM-5 is natively bilingual — not a translated English model:
```
Use case: Chinese-language ACHEEVY interactions, localized content
Strength: Superior Chinese NLP, cultural context, CLUE benchmark leader
Integration: UEF Gateway routes Chinese-language requests to GLM-5
```

### 3. CogVideoX Plug for Video Generation
Apache 2.0 licensed video generation — deploy as a Plug Catalog item:
```
Use case: Text-to-video and image-to-video generation plug
Model: CogVideoX 1.5 (5B params)
Output: 10-second videos at 768P resolution
License: Apache 2.0 — fully commercial
Deployment: Docker container in Plug Catalog
```

### 4. Agentic Engineering Pipeline
GLM-5's native Agent Mode for autonomous multi-step coding:
```
Use case: Chicken Hawk builds for Chinese market apps
Flow: User describes app → GLM-5 decomposes into subtasks → executes autonomously
Output: Working code + documentation + deployment config
Strength: 77.8% SWE-Bench — production-grade code generation
```

### 5. Document Generation Factory
GLM-5 can generate formatted documents directly:
```
Use case: Automated report generation, proposal creation, SOW documents
Input: Raw requirements or meeting notes
Output: Formatted .docx, .pdf, .xlsx files
Integration: n8n workflow triggers GLM-5 → generates doc → stores in evidence locker
```

### 6. Low-Hallucination Knowledge Base
Record-low hallucination rate makes GLM-5 ideal for factual tasks:
```
Use case: Veritas fact-checking engine, compliance documentation
Strength: Best hallucination rate in industry (Artificial Analysis)
Integration: ACHEEVY routes fact-sensitive queries to GLM-5
Fallback: Cross-verify with Gemini Search Grounding for real-time data
```

### 7. Self-Hosted Inference (MIT Licensed)
For clients needing on-premise AI with no vendor lock-in:
```
Use case: Plug Export for enterprise clients with data sovereignty requirements
Deployment: vLLM + 8x H100 or Ollama on high-memory servers
License: MIT — client owns everything, no usage restrictions
Bundle: Docker Compose + vLLM + GLM-5 weights + setup script
```

## Routing Rules for AIMS

```
IF task is routine chat, planning, general reasoning
  → glm-5 via OpenRouter ($1/$3.20 — cheapest frontier option)

IF task is Chinese-language interaction
  → glm-5 (native bilingual, not translated)

IF task is code generation at scale
  → glm-5-code ($1.20/$5.00 — still cheaper than alternatives)

IF task requires lowest possible hallucination
  → glm-5 (record-low hallucination rate)

IF task needs video generation
  → cogvideox-1.5 (Apache 2.0, self-hostable)

IF task needs vision understanding
  → glm-4.6v (128K context, native function call)

IF task requires absolute best reasoning
  → claude-opus-4.6 or gemini-3.1-pro (still ahead on hardest benchmarks)
```

## Anti-Patterns

- Do NOT assume GLM-5 has vision input — it's text-only; use GLM-4.6V for multimodal
- Do NOT self-host without 8x H100 or equivalent — 744B model requires datacenter hardware
- Do NOT ignore its verbosity — GLM-5 generates ~7x more tokens than average; set `max_tokens` explicitly
- Do NOT use for real-time voice — ~76 tok/s output is slower than needed for voice UX
- Do NOT skip the cached input discount — $0.20/MTok vs $1.00 is 5x savings on repeated prompts

## References

- Official: https://z.ai/blog/glm-5
- OpenRouter: https://openrouter.ai/z-ai/glm-5
- HuggingFace: https://huggingface.co/zai-org/GLM-5
- GitHub: https://github.com/zai-org/GLM-5
- NVIDIA NIM: https://build.nvidia.com/z-ai/glm5/modelcard
- CogVideoX: https://github.com/zai-org/CogVideo
- Paper: https://arxiv.org/html/2602.15763v1
- Pricing: https://bigmodel.cn/pricing
