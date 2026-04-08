---
name: stitch-app-factory-voice-ui
description: |
  Stitch AppFactory Voice UI skill for A.I.M.S.
  Use when: generating or updating the cross-device ACHEEVY UI with voice-first Q&A,
  visible selectors, and screens for chat, LiveSim, and Chicken Hawk.
role: Specialist Executor
intent: Generate or update the cross-device ACHEEVY UI with voice-first Q&A, visible selectors, and screens for chat, LiveSim, and Chicken Hawk.
kpis:
  - design_consistency_score
  - voice_ui_usability
  - screen_coverage
status: active
priority: high
triggers:
  - stitch
  - app factory ui
  - voice ui design
  - conversation shell design
execution: sequential
dependencies:
  - "frontend/components/conversation/"
  - "frontend/components/motion/"
  - "frontend/lib/motion/tokens.ts"
---

# Stitch AppFactory Voice UI

## Purpose

This skill generates or updates the A.I.M.S. cross-device ACHEEVY interface with a voice-first interaction paradigm. The UI surfaces voice Q&A as the primary input mode, with visible selectors for persona, model, and voice configuration.

## Required Screens

### 1. Normal ACHEEVY Chat (ConversationShell)
- Voice-first input with fallback to text
- Persona chip selector (horizontal scroll)
- Model dropdown (compact, top bar)
- Voice picker tray (slide-up on long-press)
- Chat history with streaming responses
- Cross-device responsive layout (mobile, tablet, desktop)

### 2. LiveSim Screen
- Real-time simulation view for running agents
- Status indicators for active services
- Voice command overlay for hands-free operation
- Split view: simulation output (left/top) + ACHEEVY chat (right/bottom)

### 3. Chicken Hawk Dashboard
- Safety policy status cards
- Audit log feed (real-time)
- Compliance gate indicators (pass/fail/pending)
- Voice-activated query: "What's the status of [service]?"
- Accessible only in PRIVATE/Admin mode (never exposed to PUBLIC users)

## Voice-First Design Principles

1. **Mic is always visible** -- The microphone button is the most prominent interactive element on every screen
2. **Voice feedback** -- Visual waveform or pulse animation during voice input
3. **Transcription preview** -- Show real-time transcription as the user speaks
4. **Confirmation before action** -- Voice commands that trigger deployments or destructive actions require explicit confirmation
5. **Fallback to text** -- Every voice interaction has a text equivalent

## Visible Selectors

| Selector | Location | Behavior |
|----------|----------|----------|
| Persona Chips | Above input bar | Horizontal scroll, tap to switch |
| Model Dropdown | Top bar / header | Compact dropdown, shows active model |
| Voice Picker | Slide-up tray | Grid of voices, preview on tap |
| Screen Switcher | Bottom nav / sidebar | Tab-style navigation between screens |

## Cross-Device Layout Strategy

- **Mobile**: Single-column, bottom-sheet patterns, large touch targets (min 44px)
- **Tablet**: Two-column where appropriate, side panel for context
- **Desktop**: Three-column with persistent nav, chat, and detail panel

## References

- `references/acceptance-criteria.md` -- Acceptance criteria for this skill
