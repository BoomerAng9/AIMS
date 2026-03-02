# API Patterns — bytedance-seed-2.0

## Volcano Engine API Specifications

### Authentication

All requests to Volcano Engine require:
- `Authorization: Bearer <VOLCANO_ENGINE_API_KEY>` header
- `Content-Type: application/json`
- Region endpoint: `https://open.volcengineapi.com` (default) or regional endpoints

### Seed 2.0 LLM — Chat Completion

```
POST /api/v3/chat/completions
{
  "model": "seed-2.0-llm",
  "messages": [
    {"role": "system", "content": "..."},
    {"role": "user", "content": "..."}
  ],
  "max_tokens": 4096,
  "temperature": 0.7,
  "stream": false
}
```

Response schema (normalized by UEF Gateway):
```json
{
  "id": "chatcmpl-...",
  "model": "seed-2.0-llm",
  "choices": [{
    "index": 0,
    "message": {"role": "assistant", "content": "..."},
    "finish_reason": "stop"
  }],
  "usage": {"prompt_tokens": 123, "completion_tokens": 456, "total_tokens": 579}
}
```

### Seed 2.0 Think — Chain-of-Thought

Same endpoint as LLM, with `model: "seed-2.0-think"`. Returns additional `reasoning` field in the message object containing the chain-of-thought trace.

### Seaweed — Video Generation

```
POST /api/v1/video/generate
{
  "model": "seaweed",
  "prompt": "A drone shot of a modern glass office building at sunset",
  "duration": 5,
  "resolution": "1080p",
  "style": "cinematic"
}
```

Response (async):
```json
{
  "job_id": "vid-...",
  "status": "processing",
  "estimated_completion": "2026-03-02T12:05:00Z",
  "poll_url": "/api/v1/video/status/vid-..."
}
```

Poll `poll_url` until `status: "completed"`, then retrieve `download_url`.

### Seed-TTS — Text-to-Speech

```
POST /api/v1/tts/synthesize
{
  "model": "seed-tts",
  "text": "Welcome to AI Managed Solutions.",
  "voice": "en-US-default",
  "format": "mp3",
  "speed": 1.0
}
```

Response: Binary audio stream with `Content-Type: audio/mpeg`.

### Seed Music — Text-to-Music

```
POST /api/v1/music/generate
{
  "model": "seed-music",
  "prompt": "Upbeat corporate background music, 120 BPM, major key",
  "duration": 30,
  "format": "mp3"
}
```

Response (async): Same pattern as video generation — returns `job_id` and `poll_url`.

## Benchmark Tables

### Seed 2.0 LLM vs Competitors (Reasoning Tasks)

| Benchmark       | Seed 2.0 | GPT-4o | Claude Sonnet | Gemini 2.5 Pro |
|-----------------|----------|--------|---------------|----------------|
| MMLU            | 86.2     | 88.7   | 87.1          | 89.3           |
| HumanEval      | 82.1     | 86.4   | 84.2          | 85.7           |
| GSM8K           | 94.3     | 95.8   | 94.9          | 96.1           |
| ARC-Challenge   | 92.1     | 93.4   | 92.8          | 94.0           |

### Cost Comparison (per 1M tokens)

| Model           | Input Cost | Output Cost | Effective Cost (avg) |
|-----------------|------------|-------------|---------------------|
| Seed 2.0 LLM   | $0.30      | $0.60       | $0.45               |
| GPT-4o          | $2.50      | $10.00      | $6.25               |
| Claude Sonnet   | $3.00      | $15.00      | $9.00               |
| Gemini 2.5 Pro  | $1.25      | $5.00       | $3.13               |

## Ecosystem Catalog

| Product          | Type          | Availability | A.I.M.S. Integration    |
|------------------|---------------|--------------|--------------------------|
| Seed 2.0 LLM    | Foundation LLM| GA           | UEF Gateway model router |
| Seed 2.0 Think   | CoT LLM      | GA           | UEF Gateway model router |
| Seaweed          | Video Gen     | Beta         | Async job via UEF Gateway|
| Seed-TTS         | Speech        | GA           | Sync via UEF Gateway     |
| Seed Music       | Audio Gen     | Beta         | Async job via UEF Gateway|
| Seed Image       | Image Gen     | Preview      | Not yet integrated       |
| Seed Code        | Code Gen      | Preview      | Not yet integrated       |

## Use Cases in A.I.M.S.

### Budget Bulk Processing
- Plug catalog description generation
- Documentation drafting (FDH Foster phase)
- Data extraction and summarization
- Template-based content generation

### Media Generation
- Plug promotional videos (Seaweed)
- ACHEEVY voice responses (Seed-TTS)
- Background music for demo reels (Seed Music)
- Video thumbnails and previews (Seaweed frame extraction)

### Cost Optimization
- Route all FDH Develop phase LLM calls through Seed by default
- Reserve Claude/GPT-4o for ORACLE verification and user-facing chat
- Use Seed Think for math-heavy LUC calculations
- Batch non-urgent tasks for off-peak Seed processing
