---
id: "deepgram"
name: "Deepgram"
type: "tool"
category: "voice"
provider: "Deepgram"
description: "Speech-to-text (Nova-2 model) and fallback TTS (Aura) for real-time audio transcription."
env_vars:
  - "DEEPGRAM_API_KEY"
docs_url: "https://developers.deepgram.com/docs"
aims_files:
  - "frontend/lib/services/deepgram.ts"
---

# Deepgram — Speech-to-Text Tool Reference

## Overview

Deepgram is the primary speech-to-text provider for AIMS, using the Nova-2 model for high-accuracy transcription. It also serves as a fallback TTS provider via its Aura-2 model. The DeepgramService class wraps the SDK for file, URL, and live transcription.

## API Key Setup

| Variable | Required | Where to Get |
|----------|----------|--------------|
| `DEEPGRAM_API_KEY` | Yes | https://console.deepgram.com/ |

**Apply in:** `frontend/.env.local` or `infra/.env.production`

## API Reference

### Base URL
```
https://api.deepgram.com/v1
```

### Auth Header
```
Authorization: Token $DEEPGRAM_API_KEY
```

### Pre-recorded Transcription (File)
```http
POST /listen?model=nova-2&language=en-US&punctuate=true
Content-Type: audio/wav

<binary audio data>
```

### Pre-recorded Transcription (URL)
```http
POST /listen?model=nova-2&language=en-US
Content-Type: application/json

{
  "url": "https://example.com/audio.mp3"
}
```

### Live Streaming (WebSocket)
```
wss://api.deepgram.com/v1/listen?model=nova-2
```

## STT Models

| Model | ID | Accuracy | Speed | Use Case |
|-------|----|----------|-------|----------|
| Nova-2 | `nova-2` | Best | Fast | Default for all AIMS transcription |
| Nova | `nova` | Good | Faster | Legacy fallback |
| Enhanced | `enhanced` | Good | Fast | Specific language support |

**Default in AIMS:** `nova-2`

## AIMS Usage

```typescript
import { DeepgramService } from '@/lib/services/deepgram';

const deepgram = new DeepgramService();

// Transcribe audio file
const text = await deepgram.transcribeFile(audioBuffer, {
  model: 'nova-2',
  language: 'en-US',
  punctuate: true,
  diarize: false,
});

// Transcribe from URL
const text = await deepgram.transcribeUrl('https://example.com/audio.mp3');

// Live streaming (WebSocket)
const connection = deepgram.createLiveConnection({
  model: 'nova-2',
  language: 'en-US',
});
connection.on(LiveTranscriptionEvents.Transcript, (data) => {
  console.log(data.channel.alternatives[0].transcript);
});
```

## Features
- **Punctuation** — Auto-adds punctuation (`punctuate: true`)
- **Diarization** — Speaker identification (`diarize: true`)
- **Language detection** — Auto-detect language
- **Smart formatting** — Numbers, dates, currencies

## Pricing
- Free: $200 credit (pay-as-you-go)
- Nova-2: $0.0043/min (pre-recorded), $0.0059/min (streaming)
- Growth plan: volume discounts

## Rate Limits
- 100 concurrent connections (streaming)
- No hard request limit for pre-recorded (throughput-based)

## Troubleshooting

| Issue | Fix |
|-------|-----|
| 401 Unauthorized | Check `DEEPGRAM_API_KEY` is set |
| Empty transcript | Audio may be silence; check audio quality |
| Wrong language | Set `language` parameter explicitly |
| WebSocket disconnect | Implement reconnection logic; check network |
