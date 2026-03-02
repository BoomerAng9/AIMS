---
name: elevenlabs-voice
description: |
  ElevenLabs Voice Persona — TTS provider for ACHEEVY and all A.I.M.S. agents.
  Use when: voice, tts, speak, text to speech, read aloud.
role: Specialist Executor
intent: Produce high-quality speech output using ElevenLabs TTS with persona-correct voices
kpis: [tts_latency_ms, character_credits_consumed, fallback_rate]
status: active
priority: high
triggers:
  - voice
  - tts
  - speak
  - text to speech
  - read aloud
  - acheevy voice
execution:
  target: api
  route: /api/voice/tts
dependencies:
  env:
    - ELEVENLABS_API_KEY
  files:
    - aims-skills/tools/elevenlabs.tool.md
    - aims-skills/tools/deepgram.tool.md
    - frontend/lib/acheevy/voiceConfig.ts
    - frontend/lib/services/elevenlabs.ts
---

# ElevenLabs Voice Persona Skill

## When This Fires

Triggers when any agent needs to produce speech output, select a voice, or configure TTS settings.

## Voice Identity Rules

### ACHEEVY's Voice

- **Voice:** Adam
- **Voice ID:** `pNInz6obpgDQGcFmaJgB`
- **Model:** `eleven_monolingual_v1`
- **Stability:** 0.5
- **Similarity Boost:** 0.75

**Hard rule:** ACHEEVY always uses the Adam voice. No other persona voices are active. The persona selector is hidden when only one voice is configured.

### TTS Provider Priority

```
1. ElevenLabs (primary — best quality)
   ↓ if ELEVENLABS_API_KEY missing or quota exceeded
2. Deepgram Aura (fallback — lower latency)
   ↓ if DEEPGRAM_API_KEY missing
3. Browser Web Speech API (last resort — no API needed)
```

## Core Workflow

1. Determine if TTS is appropriate (see When to Use / When NOT to Use below)
2. Check `ELEVENLABS_API_KEY` availability
3. Select voice (ACHEEVY = Adam, Voice ID `pNInz6obpgDQGcFmaJgB`)
4. Apply voice settings (stability=0.5, similarityBoost=0.75)
5. Call ElevenLabs TTS API with text content
6. Stream audio response to client
7. On failure: fall through to Deepgram Aura, then Browser Web Speech API

## When to Use TTS

- User explicitly requests voice output ("read this aloud", "speak this")
- ACHEEVY voice mode is active in the chat interface
- A worker delivers a result that should be narrated

## When NOT to Use TTS

- Code output (never voice code blocks)
- Long documents (>5000 chars — summarize first, then voice the summary)
- Error messages (display as text, don't speak errors)
- Internal agent-to-agent communication

## Voice Settings Guide

| Setting | Range | Effect |
|---------|-------|--------|
| `stability` | 0.0-1.0 | Higher = more consistent, lower = more expressive |
| `similarityBoost` | 0.0-1.0 | Higher = closer to original voice, lower = more variation |

**ACHEEVY defaults:** stability=0.5, similarityBoost=0.75 (balanced, natural)

## Quality Gates

- Voice output matches configured persona (Adam for ACHEEVY)
- Text >5000 chars is summarized before voicing
- No code blocks are ever sent to TTS
- Fallback chain engages correctly when primary provider unavailable
- Character credit consumption is logged

## Hooks

- **trigger:** Voice output requested or voice mode active
- **pre_gsd:** Validate API key, check remaining character credits
- **post_gsd:** Log character consumption, check quota threshold

## Limits

- Character credits consumed per call (monitor at https://elevenlabs.io/app/usage)
- If quota is near limit, auto-switch to Deepgram Aura fallback
- Average ACHEEVY response: ~200-500 characters

## Cost Awareness

See [references/acceptance-criteria.md](references/acceptance-criteria.md) for cost monitoring and provider fallback details.
