---
id: "ui-conversation-refactor"
name: "UI Conversation Refactor"
type: "task"
status: "active"
triggers: ["refactor chat", "conversation refactor", "remove static cards"]
description: "Remove any 'static card -> auto-answer' flows. Ensure all flows route through onUserMessage() or onUserVoice() and into the Q/A loop."
execution:
  target: "internal"
priority: "critical"
---

# UI Conversation Refactor Task

## Objective
Refactor the frontend conversation UI to enforce the voice-first Q&A loop contract.

## What Must Change

### Remove: Static Card Auto-Answer Flows
- Identify all UI components that trigger an LLM response on click alone
- Remove or convert these to **question templates** that populate the input field
- Presets must be submitted or spoken by the user — no auto-trigger

### Enforce: Single Entry Points
All conversation flows must route through exactly one of:
1. `onUserMessage(text)` — text submission
2. `onUserVoice(audioStream)` — voice input
3. `onExplicitContinue()` — explicit continue/next button

### Ensure: No Hidden LLM Triggers
These events must NOT trigger LLM calls:
- Toggle switches (dark mode, voice autoplay, etc.)
- Tab switches (persona, mode, etc.)
- Model changes (OpenRouter model selection)
- Voice profile changes
- Page navigation

These are **state-only updates** — they persist to session and update UI, but do not call the model.

## Implementation Checklist

- [ ] Audit all `onClick` handlers in chat-related components
- [ ] Convert any auto-answer cards to input templates
- [ ] Ensure `onUserMessage` and `onUserVoice` are the only paths to `orchestrateTurn`
- [ ] Add guard: `if event.type not in {voice_input, text_submit, explicit_continue}: return`
- [ ] Test: clicking a preset populates input but does NOT send
- [ ] Test: only submit/speak triggers a response

## Files Likely Affected
- `frontend/app/chat/page.tsx`
- `frontend/components/chat/ChatInput.tsx`
- `frontend/components/chat/PresetCards.tsx` (if exists)
- `frontend/lib/acheevy/client.ts`
