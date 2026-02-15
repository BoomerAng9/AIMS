---
id: "ui-voice-selector-visible"
name: "UI Voice Selector Visible"
type: "task"
status: "active"
triggers: ["voice selector", "voice picker", "voice tray"]
description: "Make voice profiles visible and selectable in the UI. Bind voice_profile_key to session state and persist to Firestore."
execution:
  target: "internal"
priority: "high"
---

# UI Voice Selector Visible Task

## Objective
Ensure voice profiles are always visible and selectable, not hidden behind multiple clicks.

## Requirements

### Voice Selector Component
- Display available voice profiles with: name, short style tag, radio selector
- Include a "Play" button next to each voice for preview
- Bind selection to `session.voice_profile_key`

### On Change Behavior
1. Update `session.voice_profile_key` in Redis
2. Persist preference to Firestore: `users/{uid}/preferences/voice_profile`
3. ACHEEVY sends an acknowledgment in chat: "I'll use the new voice for you from now on."
4. Next TTS output uses the new voice

### Layout by Device
- **Mobile**: Voice tray button in input bar → opens bottom sheet with voice list
- **Tablet**: Voice list in the collapsible Control Panel (right 30%)
- **Desktop**: Voice picker in the right session panel

### Voice Profile Data Model
```json
{
  "voice_id": "eleven_labs_voice_id",
  "name": "ACHEEVY Default",
  "style_tag": "Professional, Confident",
  "provider": "elevenlabs|deepgram|browser",
  "preview_url": "https://..."
}
```

## Implementation Checklist
- [ ] Create `VoicePicker` component with radio selection + preview
- [ ] Wire to session state (`voice_profile_key`)
- [ ] Persist changes to Firestore
- [ ] Add ACHEEVY acknowledgment message on change
- [ ] Responsive layout: bottom sheet (mobile), panel (tablet/desktop)
- [ ] Test: changing voice updates TTS on next message
