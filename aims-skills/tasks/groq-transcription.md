---
id: "groq-transcription"
name: "Groq Audio Transcription"
type: "task"
status: "active"
triggers:
  - "transcribe"
  - "stt"
  - "speech to text"
  - "audio to text"
  - "convert audio"
  - "whisper"
description: "Transcribe audio files to text using Groq's Whisper large-v3-turbo model."
execution:
  target: "api"
  route: "/api/voice/stt"
  command: ""
dependencies:
  env:
    - "GROQ_API_KEY"
  packages:
    - "groq-sdk"
  files:
    - "frontend/lib/services/groq.ts"
    - "aims-skills/tools/groq.tool.md"
priority: "high"
---

# Groq Audio Transcription Task

## Endpoint
**POST** `/api/voice/stt`

```json
{
  "audio": "<base64 encoded audio or URL>",
  "language": "en"
}
```

**Response:**
```json
{
  "text": "Transcribed text content here...",
  "duration": 12.5,
  "language": "en",
  "success": true
}
```

## Model
`whisper-large-v3-turbo` — Groq's optimized Whisper for real-time transcription.

## Supported Formats
- MP3, WAV, M4A, FLAC, OGG, WebM
- Max file size: 25MB
- Max duration: ~2 hours

## Pipeline
1. **Receive** — Audio buffer or URL
2. **Validate** — Check format, size, `GROQ_API_KEY` present
3. **Transcribe** — Send to Groq Whisper endpoint
4. **Return** — Plain text transcription with metadata

## Programmatic Usage
```typescript
import { GroqService } from '@/lib/services/groq';

const groq = new GroqService();
const transcript = await groq.transcribe(audioBuffer, { language: 'en' });
```

## API Key
Set `GROQ_API_KEY` in environment. Get key from: https://console.groq.com/keys

## Rate Limits
- 20 req/min (free tier)
- 2000 req/day (free tier)
- ~$0.04/audio-hour (paid)
