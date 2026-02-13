---
id: "groq"
name: "Groq"
type: "tool"
category: "ai"
provider: "Groq"
description: "Ultra-fast LLM inference engine for real-time chat and Whisper speech-to-text transcription."
env_vars:
  - "GROQ_API_KEY"
docs_url: "https://console.groq.com/docs"
aims_files:
  - "frontend/lib/services/groq.ts"
---

# Groq — Fast Inference Tool Reference

## Overview

Groq provides ultra-fast LLM inference on custom LPU hardware. In AIMS it powers real-time chat responses and Whisper-based speech-to-text transcription. The GroqService class wraps the SDK with streaming support.

## API Key Setup

| Variable | Required | Where to Get |
|----------|----------|--------------|
| `GROQ_API_KEY` | Yes | https://console.groq.com/keys |

**Apply in:** `frontend/.env.local` or `infra/.env.production`

## API Reference

### Base URL
```
https://api.groq.com/openai/v1
```

### Auth Header
```
Authorization: Bearer $GROQ_API_KEY
```

### Chat Completion
```http
POST /chat/completions
{
  "model": "llama-3.3-70b-versatile",
  "messages": [{ "role": "user", "content": "Hello" }],
  "max_tokens": 8000,
  "temperature": 0.7
}
```

### Speech-to-Text (Whisper)
```http
POST /audio/transcriptions
Content-Type: multipart/form-data

file: <audio file>
model: whisper-large-v3-turbo
```

## Available Models

| Model | ID | Speed | Use Case |
|-------|----|-------|----------|
| Llama 3.3 70B | `llama-3.3-70b-versatile` | ~500 tok/s | Default chat, general tasks |
| Llama 3.1 8B | `llama-3.1-8b-instant` | ~1000 tok/s | Ultra-fast simple tasks |
| Whisper Large v3 Turbo | `whisper-large-v3-turbo` | Real-time | Speech-to-text |

**Default model in AIMS:** `llama-3.3-70b-versatile`

## AIMS Usage

```typescript
import { GroqService } from '@/lib/services/groq';

const groq = new GroqService();

// Chat completion
const response = await groq.chat([
  { role: 'user', content: 'Summarize this...' }
]);

// Streaming
for await (const chunk of groq.chatStream(messages)) {
  process.stdout.write(chunk);
}

// Quick response (single message helper)
const answer = await groq.quickResponse('What is TypeScript?');
```

## Rate Limits (Free Tier)
- Chat: 30 req/min, 14,400 req/day
- Whisper: 20 req/min, 2000 req/day
- Tokens: 6000 tokens/min (Llama 70B)

## Pricing
- Free tier available with generous limits
- Pay-as-you-go: ~$0.59/M input, $0.79/M output (Llama 70B)
- Whisper: ~$0.04/audio-hour

## Troubleshooting

| Issue | Fix |
|-------|-----|
| 401 Unauthorized | Verify `GROQ_API_KEY` is set |
| 429 Rate limited | Reduce concurrency or wait 60s |
| Whisper timeout | Audio file may be too large; chunk into segments |
| Empty response | Check `max_tokens` is set (default 8000 in AIMS) |
