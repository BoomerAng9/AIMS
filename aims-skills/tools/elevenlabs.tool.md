---
id: "elevenlabs"
name: "ElevenLabs"
type: "tool"
category: "voice"
provider: "ElevenLabs"
description: "Advanced text-to-speech API with natural voice synthesis and voice cloning capabilities."
env_vars:
  - "ELEVENLABS_API_KEY"
  - "ELEVENLABS_VOICE_ID"
  - "NEXT_PUBLIC_ELEVENLABS_AGENT_ID"
docs_url: "https://elevenlabs.io/docs/api-reference"
aims_files:
  - "frontend/lib/services/elevenlabs.ts"
  - "frontend/lib/acheevy/voiceConfig.ts"
---

# ElevenLabs — Text-to-Speech Tool Reference

## Overview

ElevenLabs is the primary TTS provider for AIMS. It powers ACHEEVY's voice with the Adam voice model. The ElevenLabsService class wraps the REST API for text-to-speech conversion with configurable voice settings.

## API Key Setup

| Variable | Required | Where to Get | Purpose |
|----------|----------|--------------|---------|
| `ELEVENLABS_API_KEY` | Yes | https://elevenlabs.io/app/settings/api-keys | API authentication |
| `ELEVENLABS_VOICE_ID` | Optional | ElevenLabs Voice Library | Override default voice |
| `NEXT_PUBLIC_ELEVENLABS_AGENT_ID` | Optional | ElevenLabs Agents | Conversational AI agent |

**Apply in:** `frontend/.env.local` or `infra/.env.production`

**Default voice:** Adam (`pNInz6obpgDQGcFmaJgB`) — this is ACHEEVY's voice.

## API Reference

### Base URL
```
https://api.elevenlabs.io/v1
```

### Auth Header
```
xi-api-key: $ELEVENLABS_API_KEY
```

### Text-to-Speech
```http
POST /text-to-speech/{voice_id}
Content-Type: application/json

{
  "text": "Welcome to AI Managed Solutions.",
  "model_id": "eleven_monolingual_v1",
  "voice_settings": {
    "stability": 0.5,
    "similarity_boost": 0.75
  }
}
```

**Response:** Raw audio buffer (MP3)

### List Voices
```http
GET /voices
```

### Available TTS Models

| Model | ID | Quality | Speed |
|-------|----|---------|-------|
| Monolingual v1 | `eleven_monolingual_v1` | Good | Fast |
| Multilingual v2 | `eleven_multilingual_v2` | Best | Slower |
| Turbo v2.5 | `eleven_turbo_v2_5` | Good | Fastest |

## AIMS Voice Config

ACHEEVY's voice identity is defined in `frontend/lib/acheevy/voiceConfig.ts`:

| Voice | ID | Used For |
|-------|----|----------|
| Adam (default) | `pNInz6obpgDQGcFmaJgB` | ACHEEVY responses |

## AIMS Usage

```typescript
import { ElevenLabsService } from '@/lib/services/elevenlabs';

const tts = new ElevenLabsService();

// Get audio buffer
const audioBuffer = await tts.textToSpeech('Hello, I am ACHEEVY.');

// Get base64 data URL (for browser playback)
const dataUrl = await tts.textToSpeechDataUrl('Hello!');
// => "data:audio/mpeg;base64,..."

// Custom voice settings
const audio = await tts.textToSpeech('Deep voice test', {
  voiceId: 'custom-voice-id',
  stability: 0.8,
  similarityBoost: 0.9,
});
```

## Pricing
- Free: 10,000 characters/month
- Starter ($5/mo): 30,000 characters/month
- Creator ($22/mo): 100,000 characters/month
- Pro ($99/mo): 500,000 characters/month

## Rate Limits
- Free: ~2 concurrent requests
- Paid: Up to 10 concurrent requests
- Max text length: 5000 characters per request

## Troubleshooting

| Issue | Fix |
|-------|-----|
| 401 Unauthorized | Check `ELEVENLABS_API_KEY` is set and valid |
| 422 Voice not found | Verify `ELEVENLABS_VOICE_ID` matches an available voice |
| Audio quality poor | Increase `stability` (0.0-1.0) for more consistent output |
| Quota exceeded | Check plan limits at https://elevenlabs.io/app/usage |
