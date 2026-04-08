---
id: "render-conversation-shell"
name: "Render Conversation Shell"
type: "skill"
status: "active"
triggers: ["chat", "conversation", "ui shell", "input bar"]
description: "Renders the multi-device chat UI: chat history, input bar (mic + text), persona chips, model dropdown, voice picker tray."
execution:
  target: "persona"
priority: "high"
---

# Render Conversation Shell Skill

> The conversation shell is the primary UI surface. It must work identically across all devices.

## Components

### Core Shell
- **Chat History** — scrollable message list (user + ACHEEVY turns)
- **Input Bar** — voice-centric with mic button (primary) + text input (secondary)
- **Persona Chips** — 7 personas selectable: ProConsultant, Strategist, Entertainer, Analyst, HeadCoach, SportsInsider, Custom
- **Model Dropdown** — OpenRouter model selector with `{id, label, cost_tier}`
- **Voice Picker Tray** — list of voice profiles with preview playback

## Layout Rules by Device

### Mobile (< 768px)
Full-height stacked layout:
```
┌─────────────────────────┐
│ App Bar                 │
│ [ACHEEVY logo] [persona]│
│ [model pill]            │
├─────────────────────────┤
│                         │
│   Scrollable Chat       │
│   Messages              │
│                         │
├─────────────────────────┤
│ [🎤 MIC]  [📝 text]    │
│ [Voice tray button]     │
└─────────────────────────┘
```
- Large mic button (primary), smaller text icon (secondary)
- Voice tray: bottom sheet with voice profiles (name, style tag, radio, preview)
- Model selector: icon in app bar → bottom sheet with OpenRouter model tree

### Tablet (768px - 1024px)
Two-column layout:
```
┌──────────────────┬──────────┐
│                  │ Control  │
│   Chat Stream    │ Panel    │
│   (70%)          │ (30%)    │
│                  │          │
│                  │ Persona  │
│                  │ Model    │
│                  │ Voice    │
├──────────────────┴──────────┤
│ Input Bar                   │
└─────────────────────────────┘
```
- Control panel is collapsible
- Shows persona selector, model dropdown, voice list with radio + preview

### Desktop (> 1024px)
Three-region layout:
```
┌────────┬───────────────┬──────────┐
│ Left   │               │ Right    │
│ Side   │  Conversation │ Panel    │
│ bar    │  Stream       │          │
│        │               │ Persona  │
│ Mode   │               │ Path     │
│ Sports │               │ Roster   │
│ CH vtl │               │ HITL     │
├────────┴───────────────┴──────────┤
│ Input Bar                         │
└───────────────────────────────────┘
```
- Left sidebar: Mode selector (Default/Business/Growth/DIY), Sports toggle, Chicken Hawk vertical shortcut
- Right panel: Session details — persona, path ("Let ACHEEVY Manage It" vs "Guide Me DMAIC"), active Boomer_Angs/Lil_Hawks roster (read-only), HITL checkpoint status (SoW/Quote/PO)

## Input Bar Behavior
- Mic button: tap to start recording, tap again to stop
- Recording shows live waveform (per voice-elevenlabs-deepgram skill)
- Transcribed text populates the text input — user edits and submits
- No auto-submit on voice transcription
- Text input: standard text field with send button
- Both inputs route through `onUserMessage()` or `onUserVoice()` into the Q&A loop
