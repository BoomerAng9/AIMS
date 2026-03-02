# ElevenLabs Voice — Acceptance Criteria

## Functional Requirements

1. **Voice identity**: ACHEEVY always uses Adam voice (ID: `pNInz6obpgDQGcFmaJgB`)
2. **Provider priority**: ElevenLabs → Deepgram Aura → Browser Web Speech API
3. **Content filtering**: Code blocks are never sent to TTS
4. **Length gating**: Text >5000 chars is summarized before voicing
5. **Persona selector**: Hidden when only one voice is configured
6. **Voice settings**: stability=0.5, similarityBoost=0.75 for ACHEEVY

## Non-Functional Requirements

1. **Latency**: TTS response begins streaming within 1 second
2. **Cost tracking**: Character credits logged per call
3. **Quota awareness**: Auto-switch to fallback when credits near limit
4. **Graceful degradation**: Browser Web Speech API as last-resort (no API needed)

## Provider Fallback Matrix

| Condition | Action |
|-----------|--------|
| `ELEVENLABS_API_KEY` present, quota OK | Use ElevenLabs |
| `ELEVENLABS_API_KEY` missing | Use Deepgram Aura |
| ElevenLabs quota exceeded | Use Deepgram Aura |
| `DEEPGRAM_API_KEY` missing | Use Browser Web Speech API |
| All providers fail | Return text-only response, log warning |

## Cost Monitoring

- Monitor usage: https://elevenlabs.io/app/usage
- Average ACHEEVY response: ~200-500 characters per TTS call
- Set alerts at 80% quota threshold to preemptively switch providers
