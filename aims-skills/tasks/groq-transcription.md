---
id: "groq-transcription"
name: "Groq Audio Transcription"
type: "task"
status: "deprecated"
triggers: []
description: "DEPRECATED — Groq API key was exposed. Use speech-to-text.md (ElevenLabs Scribe v2 + Deepgram Nova-3) instead."
execution:
  target: "api"
  route: "/api/voice/stt"
  command: ""
dependencies:
  env: []
  packages: []
  files: []
priority: "low"
---

# Groq Audio Transcription — DEPRECATED

> **This task has been deprecated.** The Groq API key was exposed and removed from all environments.
>
> **Replacement:** Use the `speech-to-text` task instead, which routes through:
> 1. ElevenLabs Scribe v2 (primary)
> 2. Deepgram Nova-3 (fallback)
>
> See: `aims-skills/tasks/speech-to-text.md`
