---
id: "elevenlabs-voice"
name: "ElevenLabs Voice Persona"
type: "skill"
status: "active"
triggers:
  - "voice"
  - "tts"
  - "speak"
  - "text to speech"
  - "read aloud"
  - "acheevy voice"
description: "Guides agents on voice persona rules, voice selection, and TTS execution patterns."
execution:
  target: "api"
  route: "/api/voice/tts"
dependencies:
  env:
    - "ELEVENLABS_API_KEY"
  files:
    - "aims-skills/tools/elevenlabs.tool.md"
    - "aims-skills/tools/deepgram.tool.md"
    - "frontend/lib/acheevy/voiceConfig.ts"
    - "frontend/lib/services/elevenlabs.ts"
priority: "high"
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

### When to Use TTS
- User explicitly requests voice output ("read this aloud", "speak this")
- ACHEEVY voice mode is active in the chat interface
- Lil_Hawk delivers a result that should be narrated

### When NOT to Use TTS
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

## Cost Awareness
- Each TTS call consumes character credits
- Average ACHEEVY response: ~200-500 characters
- Monitor usage: https://elevenlabs.io/app/usage
- If quota is near limit, switch to Deepgram Aura fallback

## API Key Check
Before any TTS call:
```
if (!ELEVENLABS_API_KEY) → use Deepgram Aura
if (!DEEPGRAM_API_KEY) → use Browser Web Speech API
```
