---
id: "bytedance-seed-2.0"
name: "ByteDance Seed 2.0 — Full Ecosystem (LLM + Video + TTS + Music)"
type: "skill"
status: "active"
triggers:
  - "bytedance"
  - "seed"
  - "doubao"
  - "seedance"
  - "seed 2.0"
  - "seed dance"
  - "seed tts"
  - "seed music"
  - "volcano engine"
  - "trae"
  - "chinese ai video"
  - "ai video generation"
description: "Usage guide for ByteDance's Seed 2.0 ecosystem — frontier LLM (Doubao Seed 2.0), video generation (Seedance 2.0), TTS (Seed-TTS), and music (Seed-Music). Covers API access, pricing, and next-level use cases for AIMS."
execution:
  target: "internal"
  route: ""
dependencies:
  env:
    - "VOLCANO_ENGINE_API_KEY"
  apis:
    - "https://seed.bytedance.com"
    - "https://www.volcengine.com"
priority: "high"
released: "2026-02-14"
---

# ByteDance Seed 2.0 Skill

> Seed 2.0 LLM: Released February 14, 2026
> Seedance 2.0 Video: Released February 10, 2026
> 200M+ active users on Doubao app
> LMSYS Arena: 6th Text, 3rd Vision (as of Feb 16, 2026)

## Overview

ByteDance's **Seed** team (est. 2023) develops a full-stack AI ecosystem spanning
LLMs, video generation, text-to-speech, music synthesis, image generation, and robotics.
Labs across China, Singapore, and the U.S. power 50+ production applications.

This is not one model — it's **five product lines** that can be composed together.

## 1. DOUBAO SEED 2.0 (The LLM)

### Model Variants

| Variant | Use Case | Key Strength |
|---|---|---|
| **Seed 2.0 Pro** | Frontier reasoning, research, agents | Competes with GPT-5.2 and Gemini 3 Pro |
| **Seed 2.0 Lite** | General production workloads | Balanced cost/quality |
| **Seed 2.0 Mini** | High-throughput batch processing | Fastest, cheapest |
| **Seed 2.0 Code** | Software development lifecycle | Integrated into TRAE IDE |

### Benchmark Performance

| Benchmark | Seed 2.0 Pro | GPT-5.2 | Gemini 3 Pro | Claude Opus 4.5 |
|---|---|---|---|---|
| AIME 2025 | **98.3** | 100 | 92 | 92.8 |
| GPQA Diamond | **88.9** | 92.4 | 94.3 | — |
| Codeforces Rating | **3020** | — | — | — |
| LiveCodeBench v6 | **87.8** | — | — | 82.2 |
| SWE-Bench Verified | 76.5 | 80.0 | 80.6 | 80.9 |
| BrowseComp | **77.3** | 65.8 | 85.9 | 37.0 |
| Terminal-Bench 2.0 | 55.8 | 62.4 | 68.5 | 65.4 |
| VideoMME | **89.5** | 86.0 | — | — |
| MathVision | **88.8** | — | — | — |
| MMMU | **85.4** | — | — | — |

**LMSYS Arena**: 6th overall (Text), **3rd (Vision)** as of Feb 16, 2026.

### Capabilities
- **Hour-long video processing** with temporal reasoning and streaming QA
- **Native multimodal**: images, video, charts, OCR, document understanding
- **Long-context understanding**: Industry-best on DUDE, MMLongBench, MMLongBench-Doc
- **Agentic workflows**: Multi-step autonomous task execution
- **ICPC / IMO / CMO gold medals** in competitive programming and math

### Pricing (Via Volcano Engine)

| Variant | Input/MTok | Output/MTok | vs GPT-5.2 Savings |
|---|---|---|---|
| **Seed 2.0 Pro** | **~$0.47** | **~$2.37** | 3.7x input, 5.9x output |
| Seed 2.0 Lite | ~$0.20 | ~$1.00 | 8.8x input, 14x output |
| Seed 2.0 Mini | ~$0.08 | ~$0.40 | 22x input, 35x output |
| Seed 2.0 Code | ~$0.30 | ~$1.50 | 5.8x input, 9.3x output |

**10x cheaper than Claude Opus 4.5 on output tokens.**

### API Access

```
Platform: Volcano Engine (volcengine.com)
API Docs: https://seed.bytedance.com
App: Doubao (doubao.com)
IDE: TRAE (The Real AI Engineer) — integrated Seed 2.0 Code
```

### Known Limitations
- Trails Claude in pure code generation quality
- Falls behind Gemini in long-tail knowledge
- Higher hallucination rate than GLM-5 (per ByteDance's own benchmarks)
- API primarily via Volcano Engine — not yet on OpenRouter

---

## 2. SEEDANCE 2.0 (Video Generation)

> Released February 10, 2026. **This is what "Seed Dance" refers to.**

### What It Does

Seedance 2.0 is ByteDance's **AI video generation model** — generates cinematic video from
text, images, video, and audio input with character consistency, camera control, native audio
synthesis, and physically plausible motion.

### Version History

| Version | Date | Key Milestone |
|---|---|---|
| Seedance 1.0 | June 2025 | Foundation. 5-8s clips, 1080p, multi-shot storytelling |
| Seedance 1.5 Pro | Dec 2025 | Joint audio-video architecture. Lip-sync, camera control |
| **Seedance 2.0** | **Feb 10, 2026** | Architectural leap. 2K output, ~20s clips, native audio, 12-file multimodal input |

### Technical Architecture

- **Dual-Branch Diffusion Transformer (DiT)**: Two dedicated transformer pathways — one for video, one for audio — synchronized throughout diffusion. Generates video + audio **simultaneously in a single pass** (no post-stitching)
- **Quad-Modal Input System**: Accepts Text, Image, Video, and Audio as inputs via pre-trained encoders
- **Physics-Aware Training**: Penalizes physically implausible motion (gravity, fabric, fluid, object interactions)
- **Cross-Modal Joint Module**: Bridges audio and video branches for tight synchronization
- **10x Inference Acceleration**: Framework that boosts generation speed vs naive approach

### Specs

| Spec | Value |
|---|---|
| Max Duration | **4-15 seconds** per clip (chainable to ~20s coherent) |
| Resolution | Up to **2K** (1080p standard, 2K premium) |
| Audio | Native dialogue, ambient soundscapes, SFX — frame-synchronized |
| Lip-Sync | Phoneme-level in **8+ languages** (EN, ZH, JP, KO, ES, PT, ID + dialects) |
| Character Consistency | Cross-shot character preservation |
| Camera Control | Precise pan, zoom, dolly, tracking |
| Physics | Physically plausible motion and dynamics |
| Styles | Photorealism, animation, illustration, cyberpunk, felt texture |

### @ Reference System (Key Developer Feature)

Seedance 2.0 accepts up to **12 simultaneous reference files** in a single prompt:
- Up to 9 images, 3 videos, 3 audio files
- Reference via `@image1`, `@video2`, `@audio3` syntax
- Controls: character appearance, camera movement, choreography, audio sync

### API Access

| Channel | Status | Notes |
|---|---|---|
| **Volcano Engine** | Official API ~Feb 24, 2026 | Model ID: `doubao-seedance-2.0`. Async job-based. SDKs for Python/JS/TS |
| **fal.ai** | Available now (v1.0) | ~$0.74/video (5s, 1080p). v2.0 expected soon |
| **Replicate** | Available | replicate.com/bytedance |
| **Kie AI** | Available (v2.0) | Free test credits |
| **Jimeng AI** | Consumer (China) | Primary consumer access |
| **CapCut** | Coming | Global reach via TikTok ecosystem |

### Pricing Estimates (Seedance 2.0)

| Quality | Price/minute |
|---|---|
| 720p Basic | ~$0.10 |
| 1080p Standard | ~$0.30 |
| 2K Cinema | ~$0.80 |

**10-100x cheaper than Sora 2** per clip.

### Integration Pattern
```
User Request → AIMS Plug → Seedance API (async)
  ├─ Submit Job: POST /v1/generations
  ├─ Poll Status: GET /v1/generations/{id}
  ├─ Retrieve Video: GET /v1/generations/{id}/output
  └─ Webhook callback (when available)
```
Generation time: 30-120 seconds depending on resolution/duration.

### Copyright Warning

MPA (Motion Picture Association) accused Seedance 2.0 of unauthorized copyrighted content use.
Disney and Paramount Skydance issued cease-and-desist letters. ByteDance responded by blocking
copyrighted character generation and suspending voice-from-image. **Any AIMS integration must
implement content moderation on top of ByteDance's safeguards.**

### Roadmap
- **Seedance 2.5** (mid-2026): Targeting 4K output, near-real-time generation

### Companion Products
| Product | Type | Description |
|---|---|---|
| **Seedream 4.5** | Image Generation | Up to 4K, multi-image composition, text rendering |
| **SeedEdit 3.0** | Image Editing | Fast generative editing for real-world images |
| **OmniHuman-1.5** | Avatar Animation | Single-image-to-video avatar with audio |
| **CapCut** | Video Editing | AI-powered video editor (TikTok ecosystem) |
| **Dreamina** | Creative Platform | All-in-one AI creative suite |

---

## 3. SEED-TTS (Text-to-Speech)

### What It Does

Large-scale autoregressive TTS system that generates speech **indistinguishable from human voices**.

| Feature | Description |
|---|---|
| Voice Quality | Human-indistinguishable (per paper claims) |
| Emotion Control | Superior control over vocal emotion attributes |
| Voice Cloning | Zero-shot voice cloning from short samples |
| Training Pipeline | Pre-training → Fine-tuning → Post-training (same as LLMs) |
| Innovation | Self-distillation for voice factor decomposition + RL for robustness |
| Open Source | **No** — closed due to AI safety concerns |
| Paper | https://arxiv.org/pdf/2406.02430 |

### Related Products
| Model | Description |
|---|---|
| **Seed LiveInterpret 2.0** | End-to-end real-time simultaneous interpretation with voice cloning |
| **Seed Realtime Voice** | End-to-end real-time voice interaction |
| **Seed-ASR** | LLM-based speech recognition. 20M+ hours training data. Mandarin + 13 Chinese dialects + 7 foreign languages. Context-aware |

### Comparison to AIMS Voice Stack
| AIMS Current | ByteDance Equivalent |
|---|---|
| ElevenLabs TTS (turbo_v2_5) | Seed-TTS (not publicly available) |
| Deepgram Aura-2 (fallback) | — |
| ElevenLabs Scribe STT | Seed-ASR (20M+ hours, dialect-aware) |
| PersonaPlex (planned) | Seed LiveInterpret 2.0 (real-time interpretation) |

**Note**: Seed-TTS is NOT publicly available (no API, no weights). ByteDance has stated
they will not release source code or model weights due to safety concerns. Integration
possible only through Volcano Engine enterprise partnerships.

---

## 4. SEED-MUSIC (Music Generation)

### What It Does

Family of music generative models combining language models and diffusion models.

| Feature | Description |
|---|---|
| Generation | Controllable music generation across styles (pop, classical, jazz, electronic) |
| Score-to-Music | Convert sheet music to audio |
| Lyrics + Music Editing | Edit lyrics and music together |
| Voice Cloning | Zero-shot singing voice cloning |
| Multi-language | Supports multi-language singing generation |
| Real-time | Supports streaming output |
| Styles | Pop, classical, jazz, electronic, and more |
| Safety | Multi-step voice verification + multi-level watermarking |

---

## 5. SEED BROADER ECOSYSTEM

### Models
| Product | Domain | Description |
|---|---|---|
| Seed 2.0 (LLM) | Language | Frontier reasoning, coding, multimodal (Pro/Lite/Mini/Code) |
| Seed 1.5-VL | Vision-Language | SOTA on 38/60 multimodal benchmarks |
| Seed Coder | Code | Diffusion-based code generation, 2,146 tokens/sec |
| Seedance 2.0 | Video | Text/image-to-video, 2K, ~20s, native audio |
| Seedream 4.5 | Image | Up to 4K, multi-image composition, text rendering |
| SeedEdit 3.0 | Image Editing | Fast generative editing for real-world images |
| Seed-TTS | Speech | Human-level TTS + voice cloning (closed source) |
| Seed-ASR | Speech Recognition | 20M+ hours, 13 Chinese dialects + 7 foreign languages |
| Seed Realtime Voice | Voice | End-to-end real-time voice interaction |
| Seed LiveInterpret 2.0 | Translation | Real-time speech-to-speech interpretation |
| Seed-Music | Music | Controllable generation + editing across genres |
| Seed3D 1.0 | 3D | Images to simulation-ready 3D assets with materials |
| OmniHuman-1.5 | Avatar | Single-image-to-video avatar animation with audio |
| Seed Biomolecular | Science | Protein structure prediction + de novo design |
| Seed-Prover | Math | Automated theorem proving |
| UI-TARS / Seed Agent | GUI Agent | Native GUI agent for virtual environment tasks |
| Doubao-Seed-Translation | Translation | 28 languages, rivaling GPT-4o and Gemini 2.5 Pro |

### Platforms
| Platform | Description |
|---|---|
| **Doubao** | Consumer AI chatbot — 200M+ MAU, 1.9B interactions during Spring Festival |
| **Coze** | Zero-code/low-code AI agent platform — open-sourced (Golang + React, 10K+ GitHub stars) |
| **Jimeng AI** | Creative AI platform (image/video generation consumer app) |
| **CapCut** | TikTok's video editor — Seedance integration coming |
| **TRAE** | "The Real AI Engineer" IDE — Seed 2.0 Code integrated for full dev lifecycle |
| **Volcano Engine** | ByteDance's cloud (China: Volcengine; International: BytePlus) |

---

## AIMS Next-Level Use Cases

### 1. Ultra-Budget Frontier Reasoning
Seed 2.0 Pro at ~$0.47/$2.37 is the cheapest frontier-class model:
```
Use case: High-volume ACHEEVY reasoning at 10x lower cost than Opus
Routing: Default to Seed 2.0 Pro for general reasoning, escalate to Opus for critical
Cost: Process 10x more requests for the same budget
Access: Volcano Engine API
```

### 2. AI Video Generation Plug (Seedance 2.0)
Deploy Seedance as a Plug Catalog item for video creation:
```
Use case: Marketing video generation, social media content, product demos
Input: Text prompt or reference image
Output: 20-second 1080p video with character consistency
Integration: Volcano Engine API → Docker plug with web UI
Market: Content creators, marketing teams, social media managers
```

### 3. Competitive Coding Agent
Seed 2.0 Code has a 3020 Codeforces rating — the highest of any model:
```
Use case: Code competition solver, algorithm optimization
Model: Seed 2.0 Code
Strength: 87.8 LiveCodeBench, gold medals in ICPC/IMO/CMO
Integration: Chicken Hawk coding challenges, code review automation
```

### 4. Video Understanding Pipeline
89.5% VideoMME — best video understanding of any model:
```
Use case: Process client-uploaded video walkthroughs, training videos, demos
Capability: Hour-long video processing with temporal reasoning
Output: Structured transcription, key moment extraction, action items
Integration: Needs Analysis intake pipeline, Per|Form film analysis
```

### 5. Multi-Language Content Factory
Combine Seed-Music + Seed-TTS + Seedance for full content production:
```
Use case: Automated content pipeline — script → voice → music → video
Flow:
  1. Seed 2.0 Pro writes the script
  2. Seed-TTS generates voiceover (if available via partnership)
  3. Seed-Music creates background music
  4. Seedance 2.0 generates video scenes
  5. CapCut assembles the final cut
Output: Complete marketing video with original voice, music, and visuals
```

### 6. Document Intelligence at Scale
Industry-best long-context document understanding:
```
Use case: Bulk contract analysis, compliance review, financial document processing
Strength: DUDE, MMLongBench, MMLongBench-Doc leader
Model: Seed 2.0 Pro
Cost: ~$0.47/MTok input — process thousands of documents cheaply
```

### 7. Real-Time Interpretation Service (Enterprise)
Seed LiveInterpret for multi-language business communication:
```
Use case: Cross-border client meetings, international deployments
Capability: Real-time speech-to-speech interpretation with voice cloning
Requirement: Enterprise partnership with ByteDance/Volcano Engine
```

## Routing Rules for AIMS

```
IF task is high-volume frontier reasoning on budget
  → seed-2.0-pro via Volcano Engine (~$0.47/$2.37)

IF task is competitive-grade code generation
  → seed-2.0-code (3020 Codeforces, 87.8 LiveCodeBench)

IF task is video generation
  → seedance-2.0 via Volcano Engine API (20s @ 1080p)

IF task is video UNDERSTANDING (not generation)
  → seed-2.0-pro (89.5% VideoMME, hour-long processing)

IF task is high-throughput batch classification
  → seed-2.0-mini ($0.08/$0.40 — cheapest frontier option)

IF task requires lowest hallucination
  → glm-5 or claude-opus-4.6 (Seed acknowledges higher hallucination rate)

IF task requires code review quality
  → claude-opus-4.6 or claude-sonnet-4.6 (Seed trails Claude in code quality)
```

## Integration Notes

- **Volcano Engine** is ByteDance's cloud platform (similar to AWS/GCP) — required for API access
- **TRAE IDE** (The Real AI Engineer) is ByteDance's coding environment with native Seed 2.0 Code integration
- **Not yet on OpenRouter** — requires direct Volcano Engine API key
- **Seed-TTS and Seed-Music are NOT open-source** — enterprise partnerships only for voice/music
- **Seedance 2.0** accessible via Dreamina web UI (free tier) or Volcano Engine API (paid)

## Anti-Patterns

- Do NOT assume Seed 2.0 is on OpenRouter — it's Volcano Engine only
- Do NOT expect Seed-TTS weights to be released — ByteDance has explicitly refused for safety reasons
- Do NOT use Seed 2.0 for tasks requiring minimal hallucination — it self-reports higher rates than competitors
- Do NOT assume Seedance = the LLM — Seedance is video generation, Seed 2.0 is the LLM
- Do NOT ignore the Code variant for dev workflows — 3020 Codeforces rating is unmatched
- Do NOT assume English-first — Doubao is Chinese-first with English support

## References

- Seed Platform: https://seed.bytedance.com/en/
- Seed 2.0 Launch: https://seed.bytedance.com/en/blog/seed2-0
- Seedance 2.0: https://seed.bytedance.com/en/seedance2_0
- Seed Models: https://seed.bytedance.com/en/models
- Seed-TTS Paper: https://arxiv.org/pdf/2406.02430
- Seedance 1.5 Pro Paper: https://arxiv.org/pdf/2512.13507
- Volcano Engine: https://www.volcengine.com
- Seed 2.0 Model Card: https://lf3-static.bytednsdoc.com/obj/eden-cn/lapzild-tss/ljhwZthlaukjlkulzlp/seed2/0214/Seed2.0%20Model%20Card.pdf
- TechNode Review: https://technode.com/2026/02/14/bytedance-releases-doubao-seed-2-0-positions-pro-model-against-gpt-5-2-and-gemini-3-pro/
- Seedance API Guide: https://www.aifreeapi.com/en/posts/seedance-2-api-integration-guide
- Seedance Developer Guide: https://www.sitepoint.com/introducing-seedance-2-0/
- Coze Studio (open source): https://github.com/coze-dev/coze-studio
- GitHub: https://github.com/ByteDance-Seed
- HuggingFace: https://huggingface.co/ByteDance-Seed
