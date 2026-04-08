---
name: bytedance-seed-2.0
description: |
  ByteDance Seed 2.0 Full Ecosystem skill for multi-modal AI routing.
  Use when: routing tasks to budget frontier LLMs, generating video/audio,
  selecting cost-effective models, or integrating Volcano Engine APIs.
role: Specialist Executor
intent: Route tasks to ByteDance's Seed ecosystem (LLM, video gen, TTS, music) for budget frontier reasoning and media generation.
kpis:
  - model_routing_accuracy
  - cost_per_task
  - video_generation_success_rate
status: active
priority: high
triggers:
  - task requires budget frontier reasoning model
  - video generation requested
  - TTS or music generation needed
  - cost optimization for AI inference
execution: sequential
dependencies:
  - VOLCANO_ENGINE_API_KEY
---

# ByteDance Seed 2.0 Full Ecosystem

## Overview

ByteDance's Seed ecosystem provides a comprehensive suite of AI models spanning LLM reasoning, video generation, text-to-speech, and music generation. These models offer frontier-competitive performance at significantly lower cost, making them the default choice for budget-sensitive tasks within A.I.M.S.

The ecosystem is accessed through Volcano Engine APIs and integrated via the UEF Gateway's model router.

## Model Lineup

| Model                  | Category       | Strengths                                | Cost Tier  |
|------------------------|----------------|------------------------------------------|------------|
| Seed 2.0 LLM          | Text/Reasoning | Frontier reasoning, 128K context         | Low        |
| Seed 2.0 Think        | CoT Reasoning  | Chain-of-thought, math, code             | Low        |
| Seaweed (Video)        | Video Gen      | Text-to-video, image-to-video            | Medium     |
| Seed-TTS               | Speech         | Zero-shot voice cloning, multilingual    | Low        |
| Seed Music             | Audio          | Text-to-music, style transfer            | Low        |

## Pricing Advantage

Seed 2.0 LLM costs approximately 1/10th of GPT-4o and 1/5th of Claude Sonnet for equivalent reasoning tasks. This makes it the default routing target for:
- Summarization and extraction tasks
- Code generation (non-critical paths)
- Data analysis and transformation
- Bulk content generation
- Draft/iteration phases of FDH pipeline

Reserve higher-cost models (Claude, GPT-4o) for:
- Final output verification (ORACLE gates)
- Complex multi-step reasoning chains
- Safety-critical decisions
- User-facing conversational AI (ACHEEVY primary)

## Routing Rules

1. **Default to Seed** — All new tasks route to Seed 2.0 LLM unless the task explicitly requires a specific model's capabilities.
2. **Escalation Path** — If Seed returns low-confidence output (self-reported or detected via ORACLE), escalate to Claude Sonnet, then Claude Opus.
3. **Media Tasks** — Video generation always routes to Seaweed. TTS routes to Seed-TTS. Music routes to Seed Music.
4. **Context Window** — Tasks exceeding 128K tokens must route to models with larger context (Gemini 2.5 Pro at 1M tokens).
5. **Latency Sensitive** — Real-time chat responses use ACHEEVY's primary model (Claude). Seed is for async/batch tasks.

## Anti-Patterns

- Never use Seed for safety-critical decisions (Chicken Hawk compliance, deployment authorization).
- Never expose Volcano Engine API keys to the client side.
- Never bypass the UEF Gateway model router to call Seed directly from frontend code.
- Never assume Seed output is final — all Seed outputs in production must pass through at least one verification gate.

## Integration Notes

- All Seed API calls go through `backend/uef-gateway/` via the OpenClaw router's model selection layer.
- The `VOLCANO_ENGINE_API_KEY` environment variable must be set in the UEF Gateway's environment.
- Response format normalization happens in the gateway — downstream consumers receive a unified response schema regardless of which model was used.
- Rate limits: Seed 2.0 LLM supports up to 100 RPM on the standard tier. Video generation is limited to 10 concurrent jobs.
- For detailed API specifications, benchmark tables, ecosystem catalog, and use case examples, see `references/api-patterns.md`.
