---
name: kimi-k2.5
description: |
  Kimi K2.5 Visual Agentic Model routing and configuration.
  Use when: a task requires visual reasoning, video input processing, multimodal agent
  orchestration, or deploying Moonshot AI's 1T-parameter agentic model for swarm tasks.
role: Specialist Executor
intent: Deploy Moonshot AI's 1T-param multimodal agentic model for visual reasoning, video input, and agent swarm tasks.
kpis:
  - visual_reasoning_accuracy
  - agent_task_completion_rate
  - cost_per_inference
status: active
priority: high
triggers:
  - kimi
  - kimi k2.5
  - moonshot
  - multimodal agent
  - vision agent
  - agent swarm
  - visual reasoning
  - video input
  - 1 trillion
execution: sequential — classify visual/agentic task → configure K2.5 endpoint → submit input → parse structured output → log metrics
dependencies:
  - HF_TOKEN
---

# Kimi K2.5 — Visual Agentic Model

Moonshot AI's Kimi K2.5 is a 1 trillion parameter multimodal agentic model designed for
visual reasoning, video understanding, and autonomous agent swarm coordination. Licensed
under Modified MIT.

## Model Overview

| Property | Value |
|---|---|
| Parameters | 1T (Mixture of Experts) |
| Modalities | Text, Image, Video |
| License | Modified MIT |
| Provider | Hugging Face (via HF_TOKEN) |
| Specialization | Visual reasoning, agentic workflows, video input |

## Capabilities

### Visual Reasoning
- Scene understanding and spatial reasoning from images
- Chart/graph interpretation and data extraction
- UI screenshot analysis and element identification
- Document layout parsing (invoices, forms, blueprints)

### Video Input
- Frame-by-frame analysis of video clips
- Temporal event detection and sequencing
- Action recognition and scene transition mapping

### Agent Swarm Coordination
- Multi-agent task decomposition from visual inputs
- Structured output generation for downstream agent consumption
- Tool-use planning based on visual context

## Routing Rules

1. **Use Kimi K2.5 for visual reasoning tasks** that require understanding spatial
   relationships, charts, UI layouts, or document structures.
2. **Use for video input processing** — K2.5 natively handles video frames without
   requiring external frame extraction.
3. **Use for agent swarm orchestration** when the task involves visual context that
   must be decomposed into sub-agent assignments.
4. **Do NOT use for text-only tasks** — K2.5's 1T parameter cost is not justified for
   pure text inference. Use GLM-5 or Gemini 3.1 Pro instead.
5. **Requires HF_TOKEN** — access is via Hugging Face inference endpoints.

## When NOT to Use Kimi K2.5

- Pure text generation or reasoning (use GLM-5 or Gemini 3.1 Pro).
- Simple image classification that Vision API or Gemini Flash can handle.
- Tasks where latency is critical — 1T MoE models have higher inference latency.
- Budget-constrained tasks where a smaller multimodal model suffices.

## Anti-Patterns

- Routing text-only tasks to K2.5 (massive cost overhead for no visual benefit).
- Using K2.5 for simple image labeling that Gemini Flash handles at a fraction of the cost.
- Not parsing the structured agentic output — K2.5 returns tool-use plans that must be consumed.
- Ignoring the Modified MIT license terms when redistributing model outputs.

## Integration Example

```typescript
import { HfInference } from "@huggingface/inference";

const hf = new HfInference(process.env.HF_TOKEN);

const result = await hf.chatCompletion({
  model: "moonshot-ai/kimi-k2.5",
  messages: [
    {
      role: "user",
      content: [
        { type: "text", text: "Analyze this UI screenshot and list all interactive elements." },
        { type: "image_url", image_url: { url: screenshotUrl } }
      ]
    }
  ]
});
```
