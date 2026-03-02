---
name: render-conversation-shell
description: |
  Render Conversation Shell skill for A.I.M.S.
  Use when: building or modifying the multi-device chat UI, chat history panel,
  voice-centric input bar, persona chips, model dropdown, or voice picker.
role: Specialist Executor
intent: Render the multi-device chat UI with chat history, voice-centric input bar, persona chips, model dropdown, and voice picker.
kpis:
  - render_time_ms
  - cross_device_consistency
  - input_latency_ms
status: active
priority: high
triggers:
  - chat
  - conversation
  - ui shell
  - input bar
execution: sequential
dependencies:
  - "frontend/components/conversation/"
  - "frontend/lib/motion/tokens.ts"
  - "frontend/lib/motion/variants.ts"
---

# Render Conversation Shell

## Core Shell Components

The Conversation Shell is the primary chat interface for ACHEEVY. It consists of five core components:

### 1. Chat History Panel
- Scrollable message list with auto-scroll to latest
- Message bubbles: user (right-aligned, gold accent), ACHEEVY (left-aligned, glass card)
- Timestamp display with relative time formatting
- Loading skeleton states during fetch
- Markdown rendering for ACHEEVY responses

### 2. Input Bar (Voice-Centric)
- Voice button as primary action (large, centered, gold pulse animation)
- Text input as secondary (expandable textarea below voice button)
- Send button appears only when text is entered
- Attachment button for file/image uploads
- Typing indicator when ACHEEVY is responding

### 3. Persona Chips
- Horizontal scrollable chip row above input bar
- Each chip represents a persona/mode (e.g., "General", "Code", "Research", "Creative")
- Active chip highlighted with gold border and glow
- Tap to switch persona context for the conversation

### 4. Model Dropdown
- Compact dropdown showing current LLM model
- Options populated from available model registry
- Shows model name + badge (e.g., "Claude 4.6 [Pro]")
- Model switch triggers context notification in chat

### 5. Voice Picker Tray
- Slide-up tray triggered by long-press on voice button
- Grid of available voice options with preview playback
- Current voice highlighted
- Voice selection persists across sessions

## Layout Rules by Device

### Mobile (< 640px)
```
+---------------------------+
|  [<] ACHEEVY Chat    [:]  |
+---------------------------+
|                           |
|   Chat History            |
|   (scrollable)            |
|                           |
|                           |
+---------------------------+
| [Persona] [Chips] [>>>]   |
+---------------------------+
| [+] [  Type here...  ] [>]|
|         [ MIC ]           |
+---------------------------+
```

### Tablet (640px - 1024px)
```
+---------------------------------------+
|  [<] ACHEEVY Chat   [Model v]   [:]  |
+---------------------------------------+
|                                       |
|        Chat History                   |
|        (scrollable)                   |
|                                       |
+---------------------------------------+
| [General] [Code] [Research] [Creative]|
+---------------------------------------+
| [+] [  Type here...     ] [MIC] [>]  |
+---------------------------------------+
```

### Desktop (> 1024px)
```
+-----+------------------------------------------+--------+
|     |  ACHEEVY Chat         [Model v]    [:]   |        |
| NAV |------------------------------------------| SIDE   |
|     |                                          | PANEL  |
|     |         Chat History                     |        |
|     |         (scrollable)                     | Voice  |
|     |                                          | Picker |
|     |                                          |        |
|     |------------------------------------------| Persona|
|     | [General][Code][Research][Creative]       | Detail |
|     |------------------------------------------+--------+
|     | [+] [  Type here...          ] [MIC] [>] |
+-----+------------------------------------------+--------+
```

## Input Bar Behavior

| State | Voice Button | Text Input | Send Button |
|-------|-------------|------------|-------------|
| Idle | Pulsing gold | Placeholder visible | Hidden |
| Text entered | Static, dimmed | Active, expanded | Visible (gold) |
| Recording | Red pulse, "Listening..." | Disabled | Hidden |
| Processing | Spinner | Disabled | Disabled |
| Error | Red outline, retry icon | Error message | Hidden |

## Animation Requirements

- All animations must use tokens from `frontend/lib/motion/tokens.ts`
- Message entrance: `staggerItem` variant from `frontend/lib/motion/variants.ts`
- Voice button pulse: spring animation with `duration.normal` token
- Tray slide-up: `overlayVariants` with `duration.slow` token
- Respect `prefers-reduced-motion` on all animated elements

## References

- `references/acceptance-criteria.md` -- Acceptance criteria for this skill
