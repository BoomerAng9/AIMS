---
id: "speech-to-text"
name: "Speech-to-Text"
type: "task"
status: "active"
triggers:
  - "listen"
  - "transcribe"
  - "dictate"
  - "stt"
  - "convert speech"
  - "audio to text"
description: "Transcribe audio to text using Deepgram Nova-2 (primary) or Groq Whisper (fast fallback)."
execution:
  target: "api"
  route: "/api/voice/stt"
  command: ""
dependencies:
  env:
    - "DEEPGRAM_API_KEY"
  packages:
    - "@deepgram/sdk"
  files:
    - "frontend/lib/services/deepgram.ts"
    - "aims-skills/tools/deepgram.tool.md"
priority: "high"
---

# Speech-to-Text Task

## Endpoint
**POST** `/api/voice/stt`

```json
{
  "audio": "<base64 encoded audio or URL>",
  "language": "en-US",
  "diarize": false
}
```

**Response:**
```json
{
  "text": "Transcribed text content...",
  "confidence": 0.95,
  "duration": 12.5,
  "success": true
}
```

## Provider Priority
```
1. Deepgram Nova-2 (primary — best accuracy)
2. Groq Whisper (fallback — fastest)
```

## Pipeline
1. **Receive** — Audio buffer, URL, or live WebSocket stream
2. **Validate** — Format check, API key present
3. **Transcribe** — Send to Deepgram or Groq
4. **Post-process** — Punctuation, formatting
5. **Return** — Text with confidence score

## Supported Formats
MP3, WAV, M4A, FLAC, OGG, WebM

## API Keys
- Primary: `DEEPGRAM_API_KEY` — https://console.deepgram.com/
- Fallback: `GROQ_API_KEY` — https://console.groq.com/keys
