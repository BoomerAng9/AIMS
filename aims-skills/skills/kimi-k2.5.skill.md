---
id: "kimi-k2.5"
name: "Kimi K2.5 — Visual Agentic Model"
type: "skill"
status: "active"
triggers:
  - "kimi"
  - "kimi k2.5"
  - "moonshot"
  - "multimodal agent"
  - "vision agent"
  - "agent swarm"
  - "visual reasoning"
  - "video input"
  - "1 trillion"
description: "Usage guide for Kimi K2.5 — Moonshot AI's 1T-param native multimodal agentic model. Covers API modes, vision/video input, agent swarm, quantization, and deployment."
execution:
  target: "internal"
  route: ""
dependencies:
  env:
    - "HF_TOKEN"
  apis:
    - "https://platform.moonshot.ai"
    - "https://build.nvidia.com/moonshotai/kimi-k2.5"
priority: "high"
license: "Modified MIT — no terms/conditions required"
---

# Kimi K2.5 Skill

> Released 2026-01-27 by Moonshot AI. Open-source, no gating, no T&C.
> Modified MIT License — free to use commercially.

## What It Is

Kimi K2.5 is a **1-trillion-parameter Mixture-of-Experts (MoE)** native multimodal agentic model.
Only **32B parameters activate per token**, making it efficient despite its size.

Key capabilities:
- **Native multimodality** — pre-trained on vision + language tokens (not bolted-on)
- **256K context window**
- **Two modes**: Thinking (deep reasoning) and Instant (fast response)
- **Agent Swarm** — decomposes complex tasks into parallel sub-agents
- **Vision + Video input** — images, video (official API only for video)
- **Coding from visual specs** — generates code from UI designs, video workflows

## Model Architecture

| Property | Value |
|---|---|
| Architecture | Mixture-of-Experts (MoE) |
| Total Parameters | 1T |
| Activated per Token | 32B |
| Layers (total) | 61 (1 dense + 60 MoE) |
| Attention Heads | 64 |
| Experts | 384 total, 8 selected + 1 shared per token |
| Vocabulary | 160K tokens |
| Context Length | 256K |
| Attention | MLA (Multi-head Latent Attention) |
| Activation | SwiGLU |
| Vision Encoder | MoonViT (400M params, native resolution) |

## API Access (Recommended for AIMS)

**Do NOT self-host** — 600 GB raw weights require 4× H200 GPUs.

Use one of these APIs instead:

### Option 1: NVIDIA NIM (preferred — uses HF_TOKEN)
```
Endpoint: https://integrate.api.nvidia.com/v1
Model ID: moonshotai/kimi-k2.5
Auth: Bearer $HF_TOKEN (or NVIDIA NIM API key)
```

### Option 2: Moonshot Official API
```
Endpoint: https://platform.moonshot.ai
Docs: https://platform.moonshot.ai/docs
Compatible: OpenAI + Anthropic API format
```

## Calling the API

### Thinking Mode (deep reasoning)
```python
import openai

client = openai.OpenAI(
    base_url="https://integrate.api.nvidia.com/v1",
    api_key=HF_TOKEN  # or NVIDIA NIM key
)

response = client.chat.completions.create(
    model="moonshotai/kimi-k2.5",
    messages=[
        {"role": "user", "content": "Analyze this and think step by step."}
    ],
    max_tokens=4096,
    temperature=1.0,   # REQUIRED for thinking mode
    top_p=0.95
)

# Thinking mode returns reasoning_content separately
reasoning = response.choices[0].message.reasoning_content
answer = response.choices[0].message.content
```

### Instant Mode (fast, no deep reasoning)
```python
response = client.chat.completions.create(
    model="moonshotai/kimi-k2.5",
    messages=[{"role": "user", "content": "Quick question here."}],
    max_tokens=4096,
    temperature=0.6,   # Lower temp for instant mode
    top_p=0.95,
    extra_body={"thinking": {"type": "disabled"}}  # Official API
    # For vLLM/SGLang: extra_body={"chat_template_kwargs": {"thinking": False}}
)
```

### Vision Input (Image)
```python
import base64, requests

image_b64 = base64.b64encode(requests.get(image_url).content).decode()

response = client.chat.completions.create(
    model="moonshotai/kimi-k2.5",
    messages=[{
        "role": "user",
        "content": [
            {"type": "text", "text": "Describe this image in detail."},
            {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{image_b64}"}}
        ]
    }],
    max_tokens=8192
)
```

### Video Input (Official API only — not supported in vLLM/SGLang)
```python
video_b64 = base64.b64encode(requests.get(video_url).content).decode()

response = client.chat.completions.create(
    model="moonshotai/kimi-k2.5",
    messages=[{
        "role": "user",
        "content": [
            {"type": "text", "text": "Describe the video in detail."},
            {"type": "video_url", "video_url": {"url": f"data:video/mp4;base64,{video_b64}"}}
        ]
    }]
)
```

## Recommended Parameters

| Setting | Thinking Mode | Instant Mode |
|---|---|---|
| temperature | **1.0** | **0.6** |
| top_p | 0.95 | 0.95 |
| min_p | 0.01 | — |
| max_tokens | 96K (reasoning) | 4K–8K |

> These are officially mandated by Moonshot AI — do not lower temperature in thinking mode.

## When to Use Each Mode

| Use Case | Mode |
|---|---|
| Complex reasoning, math, research | Thinking |
| Code from visual specs / UI | Thinking |
| Multi-step agentic task decomposition | Thinking + Agent Swarm |
| Quick classification, simple Q&A | Instant |
| Real-time chat responses | Instant |
| SWE tasks (coding, terminal) | Instant (performs better) |

## Agent Swarm

Kimi K2.5 can decompose complex tasks into parallel sub-agents automatically.

When using swarm mode via official API:
- Main agent: max 15 steps
- Sub-agents: max 100 steps each
- Best for: BrowseComp-style deep research, WideSearch, multi-source synthesis

## Self-Hosting (If Required)

Only attempt on machines with sufficient RAM. Minimum viable setup:

| Quant | Size | Minimum | Source |
|---|---|---|---|
| Full BF16 | 630 GB | 4× H200 | Not recommended |
| UD-Q4_K_XL GGUF | ~400 GB | 400 GB RAM | AesSedai/Kimi-K2.5-GGUF |
| UD-Q2_K_XL GGUF | ~375 GB | 375 GB RAM | unsloth/Kimi-K2.5-GGUF |
| **UD-TQ1_0 GGUF** | **~240 GB** | **256 GB RAM + 24 GB GPU** | unsloth/Kimi-K2.5-GGUF |

Download (VPS only, not this sandbox):
```bash
python3 -c "
from huggingface_hub import snapshot_download
snapshot_download(
    'unsloth/Kimi-K2.5-GGUF',
    local_dir='/home/user/AIMS/data/models/kimi-k2.5-gguf',
    allow_patterns=['*UD-TQ1_0*'],
    token='$HF_TOKEN'
)
"
```

Inference engines (in order of recommendation):
1. vLLM
2. SGLang
3. KTransformers

Minimum transformers version: `4.57.1`

## Changelog

- **2026-01-29**: Default system prompt removed (was causing unexpected behavior). Token `<|media_start|>` replaced with `<|media_begin|>` in chat template.

## Performance Highlights (vs peers)

| Benchmark | Kimi K2.5 | Claude Opus 4.5 | GPT-5.2 |
|---|---|---|---|
| HLE-Full | 30.1 | 30.8 | 34.5 |
| HLE w/ tools | 50.2 | 43.2 | 45.5 |
| AIME 2025 | 96.1 | 92.8 | 100 |
| SWE-Bench Verified | 76.8 | 80.9 | 80.0 |
| SWE-Bench Multilingual | 73.0 | 77.5 | 72.0 |
| BrowseComp | 60.6 | 37.0 | 65.8 |
| BrowseComp (Swarm) | **78.4** | — | — |
| LiveCodeBench v6 | 85.0 | 82.2 | — |
| VideoMME | 87.4 | — | 86.0 |

## Anti-Patterns

- Do NOT use as a drop-in for Claude/GPT without adjusting temperature — it needs `temperature=1.0` in thinking mode
- Do NOT use Instant mode for complex multi-step reasoning — quality drops significantly
- Do NOT expect video input to work through vLLM/SGLang — official API only
- Do NOT remove `reasoning_content` from responses in thinking mode — it's part of the output contract
- Do NOT use `<|media_start|>` — it was corrected to `<|media_begin|>` on 2026-01-29

## References

- Paper: https://arxiv.org/abs/2602.02276
- Official API: https://platform.moonshot.ai
- NVIDIA NIM: https://build.nvidia.com/moonshotai/kimi-k2.5
- GGUF (Unsloth): https://huggingface.co/unsloth/Kimi-K2.5-GGUF
- Kimi Code CLI: https://www.kimi.com/code
- WorldVQA benchmark: https://github.com/MoonshotAI/WorldVQA
