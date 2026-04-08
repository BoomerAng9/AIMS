---
id: "stitch-app-factory-voice-ui"
name: "Stitch AppFactory Voice UI"
type: "skill"
status: "active"
triggers: ["stitch", "app factory ui", "voice ui design", "conversation shell design"]
description: "Design agent skill: generates or updates the cross-device ACHEEVY UI with voice-first Q&A, visible selectors, and screens for chat, LiveSim, and Chicken Hawk."
execution:
  target: "persona"
priority: "high"
---

# Stitch AppFactory Voice UI Skill

> The design agent listens for this skill to generate or update the multi-device ACHEEVY interface.

## Purpose
Generate or update the cross-device UI for ACHEEVY with:
- Voice-first Q&A input bar (mic-centric)
- Visible persona selector and path picker
- Model and voice selectors that respect Application-Factory rules
- Screens for all major surfaces

## Required Screens

### 1. Normal ACHEEVY Chat (`ConversationShell`)
- Chat history with user/ACHEEVY message bubbles
- Voice-centric input bar (mic primary, text secondary)
- Persona chips, model dropdown, voice picker
- Path selector ("Let ACHEEVY Manage It" vs "Guide Me DMAIC")
- See: `skills/render-conversation-shell.skill.md` for full layout spec

### 2. LiveSim Autonomous Space (`LiveSimView`)
- Left panel: live transcript of agent-to-agent interactions (timeline stream)
- Right panel: brief explanation of what's happening + "Ask this crew a question" button
- Header: room topic, active agents, room status (running/paused)
- WebSocket-powered real-time updates

### 3. Chicken Hawk Vertical (`ChickenHawkView`)
- Developer-oriented layout with code/terminal aesthetics
- Build status panel (CLAW readiness indicator)
- Task progress timeline
- Log output stream (natural-language updates from Chicken Hawk)
- Deploy controls (when CLAW is ready)

### 4. Control Panel (`ControlPanel`)
- Persona selector (7 personas)
- Model selector (OpenRouter models with cost tier labels)
- Voice picker (preview playback for each voice)
- Path selector
- HITL checkpoint status display
- Active agents roster (read-only)

## Expected Output
- NanoBanana / Figma design spec
- React/Next.js component tree:
  ```
  ConversationShell
  ├── ChatHistory
  ├── InputBar (VoiceInput + TextInput)
  ├── ControlPanel
  │   ├── PersonaSelector
  │   ├── ModelSelector
  │   ├── VoicePicker
  │   └── PathSelector
  LiveSimView
  ├── AgentTimeline
  ├── SimExplainer
  └── AskCrewButton
  ChickenHawkView
  ├── BuildStatusPanel
  ├── TaskTimeline
  ├── LogStream
  └── DeployControls
  ```

## Design Tokens
All components must reference the token system defined in `skills/design/design-tokens-standards.md`.
No magic numbers. No inline style overrides.
