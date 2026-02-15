---
id: "text-to-speech"
name: "Text-to-Speech"
type: "task"
status: "active"
triggers:
  - "speak"
  - "read aloud"
  - "tts"
  - "voice output"
  - "say this"
  - "narrate"
description: "Convert text to speech audio using ElevenLabs (primary) or Deepgram Aura (fallback)."
execution:
  target: "api"
  route: "/api/voice/tts"
  command: ""
dependencies:
  env:
    - "ELEVENLABS_API_KEY"
  packages:
    - "@elevenlabs/client"
  files:
    - "frontend/lib/services/elevenlabs.ts"
    - "frontend/lib/acheevy/voiceConfig.ts"
    - "aims-skills/tools/elevenlabs.tool.md"
priority: "high"
---

# Text-to-Speech Task

## Endpoint
**POST** `/api/voice/tts`

```json
{
  "text": "Welcome to AI Managed Solutions.",
  "voiceId": "pNInz6obpgDQGcFmaJgB",
  "model": "eleven_monolingual_v1"
}
```

**Response:** Audio buffer (MP3) or base64 data URL

## Pipeline
1. **Validate** — Check text length (<5000 chars), API key present
2. **Select provider** — ElevenLabs if key available, else Deepgram Aura
3. **Generate** — Call TTS API with voice settings
4. **Return** — Audio buffer for playback

## Default Voice
- **ACHEEVY:** Adam (`pNInz6obpgDQGcFmaJgB`)
- Stability: 0.5, Similarity Boost: 0.75

## API Key
Set `ELEVENLABS_API_KEY` in environment. Get key from: https://elevenlabs.io/app/settings/api-keys
