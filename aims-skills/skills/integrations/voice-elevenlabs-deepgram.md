---
id: "voice-elevenlabs-deepgram"
name: "Voice UX (ElevenLabs + Deepgram + Nvidia)"
type: "skill"
status: "active"
triggers: ["voice", "tts", "stt", "speak", "listen", "recording", "transcribe", "waveform"]
description: "Voice-first UX rules: live waveform, recording indicator, editable transcript pre-send, TTS playback controls."
execution:
  target: "persona"
dependencies:
  env: ["ELEVENLABS_API_KEY", "DEEPGRAM_API_KEY"]
priority: "high"
---

# Voice UX Skill (ElevenLabs + Deepgram + Nvidia PersonaPlex)

## Voice-First Design Principles

Voice is a first-class input/output in A.I.M.S., not an afterthought.

### Recording UX (STT)

| Element | Rule |
|---------|------|
| **Recording indicator** | Red pulsing dot + "Recording" label — unmistakable state |
| **Live waveform** | 32-bar frequency visualization, responsive to audio level |
| **Processing state** | Gold bouncing bars + "Transcribing" label — user knows it's working |
| **Cancel option** | Always visible during recording — user can bail out |
| **Editable transcript** | Voice input populates the text field — user can edit BEFORE submitting |
| **No auto-submit** | Voice transcription never auto-sends. User reviews and hits send. |

### Playback UX (TTS)

| Element | Rule |
|---------|------|
| **Auto-play** | Toggleable via speaker icon in header — user controls this |
| **Per-message controls** | Play, pause, replay on every assistant message (hover reveal) |
| **Global playback bar** | Shows when TTS is active — progress, pause, stop, state label |
| **Avatar pulse** | ACHEEVY avatar pulses when speaking that message |
| **Markdown stripping** | TTS reads clean text — `sanitizeForTTS()` strips code blocks, links, formatting |
| **Length cap** | Messages over 5000 chars are not auto-spoken (too expensive) |

### Provider Chain

```
STT: ElevenLabs Scribe v2 (primary) → Deepgram Nova-3 (fallback)
TTS: ElevenLabs eleven_turbo_v2_5 (primary) → Deepgram Aura-2 (fallback)
Voice Agent: Nvidia PersonaPlex (avatar + engagement, when configured)
```

> **NOTE:** Groq Whisper was removed — key was exposed and deprecated.
> ElevenLabs now handles BOTH STT (Scribe v2) and TTS (eleven_turbo) with a single API key.

### Voice Identity
- ACHEEVY has a consistent voice across all TTS output
- Voice presets are configured in `frontend/lib/acheevy/voiceConfig.ts`
- SMOOTH preset: stability 0.42, style 0.65 — "Velvet-Jet timbre"
- CORPORATE preset: stability 0.6, style 0.3 — professional tone
- No switching voices mid-conversation unless user explicitly changes persona

### Nvidia PersonaPlex (Voice Agent)
- Full-duplex voice + avatar interaction via UEF Gateway
- Endpoints: `/personaplex/status`, `/personaplex/speak`
- Capabilities: voice sessions, status updates, engagement flows
- Config: `PERSONAPLEX_ENDPOINT`, `PERSONAPLEX_API_KEY`, `PERSONAPLEX_AVATAR_ID`
- When configured, PersonaPlex can deliver status updates vocally during Chicken Hawk runs

### Performance Rules
- STT processing must show feedback within 500ms of recording stop
- TTS audio should begin playing within 1s of generation request
- Waveform visualization runs at 60fps with no janky frames
- Audio buffers are cleaned up after playback completes
