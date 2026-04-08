---
name: "Voice-first chat rules"
description: "Rules for voice capture, playback, permissions, and interaction flow"
applyTo: "**/*voice*.*,**/*audio*.*,**/*mic*.*,**/*speech*.*,**/chat/**/*.{ts,tsx}"
---

# Voice-first rules

- Voice input is a default feature, not an optional afterthought.
- Assistant speech output is on by default.
- Provide a Speech Output Toggle so the user can disable read-aloud.
- Support live transcript updates.
- Support barge-in interruption.
- Handle microphone permission states explicitly.
- Expose input device selection and recovery from permission/device errors.
- Do not block the rest of the chat UI while audio is initializing.