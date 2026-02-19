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
description: "Transcribe audio to text using ElevenLabs Scribe v2 (primary) or Deepgram Nova-3 (fallback)."
execution:
  target: "api"
  route: "/api/voice/stt"
  command: ""
dependencies:
  env:
    - "ELEVENLABS_API_KEY"
    - "DEEPGRAM_API_KEY"
  packages: []
  files:
    - "frontend/app/api/voice/stt/route.ts"
    - "frontend/hooks/useVoiceInput.ts"
priority: "high"
---

# Speech-to-Text Task

## Endpoint
**POST** `/api/voice/stt`

Accepts `multipart/form-data` with:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `audio` | File | yes | Audio file (WebM, MP3, WAV, etc.) |
| `provider` | string | no | `"elevenlabs"` (default) or `"deepgram"` |
| `language` | string | no | Language code (e.g., `"en"`, `"es"`) |

**Response:**
```json
{
  "text": "Transcribed text content...",
  "provider": "elevenlabs",
  "model": "scribe_v2",
  "confidence": 0.98,
  "words": [
    { "word": "Hello", "start": 0.0, "end": 0.5 }
  ]
}
```

## Provider Priority
```
1. ElevenLabs Scribe v2 (primary — 99% accuracy, 90+ languages, word timestamps)
2. Deepgram Nova-3 (fallback — sub-300ms, smart formatting)
```

> **NOTE:** Groq Whisper was removed — key was exposed and deprecated.

## Pipeline
1. **Capture** — Mic → MediaRecorder → WebM blob (16kHz, noise suppression)
2. **Upload** — POST FormData to `/api/voice/stt`
3. **Transcribe** — ElevenLabs Scribe v2 → Deepgram Nova-3 fallback
4. **Return** — Text with confidence, word timestamps, provider info
5. **Display** — Populate textarea for user to review before sending

## Supported Formats
MP3, WAV, M4A, FLAC, OGG, WebM

## API Keys
- Primary: `ELEVENLABS_API_KEY` — https://elevenlabs.io (same key for TTS + STT)
- Fallback: `DEEPGRAM_API_KEY` — https://console.deepgram.com/
