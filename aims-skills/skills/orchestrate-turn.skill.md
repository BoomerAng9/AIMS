---
id: "orchestrate-turn"
name: "Orchestrate Turn"
type: "skill"
status: "active"
triggers: ["user_message", "voice_input", "text_submit", "explicit_continue"]
description: "Core orchestration skill: loads session state, composes system prompt with Application-Factory layer, calls model via OpenRouter, parses tool calls."
execution:
  target: "api"
  route: "/api/acheevy/orchestrate"
dependencies:
  env: ["OPENROUTER_API_KEY"]
priority: "critical"
---

# Orchestrate Turn Skill

> Every user message flows through this skill. It is the brain's main execution path.

## Trigger Conditions
Only these UI events may invoke this skill:
- `voice_input` — user spoke into the mic (transcribed via Groq Whisper)
- `text_submit` — user typed and pressed send
- `explicit_continue_button` — user clicked a "Continue" or "Next" action

**The following DO NOT invoke reasoning:**
- Toggles, tab switches, model changes, voice changes — these are state-only updates

## Execution Steps

### 1. Load Session State
```pseudo
session = load_session(session_id)
// Contains: mode, persona, path, rfp_id, current_step, sports_mode,
//           llm_model_key, voice_profile_key, qa_state
```

### 2. Compose System Prompt
Build the composed system prompt from layers:

```
Layer 1: Core Identity + Chain of Command
  ├── ACHEEVY identity (Section 1 of brain)
  ├── Chain of command rules (Section 2)
  └── Allowed/forbidden actions (Section 3)

Layer 2: Application-Factory
  ├── Persona behavior (from session.persona)
  ├── Path rules ("Manage It" vs "Guide Me DMAIC")
  ├── RFP 10-step document spine (INTERNAL ONLY — never shown to user)
  ├── Sports grading logic (if session.sports_mode = true)
  └── Model/policy pricing rules

Layer 3: Active Skills
  ├── Skill router output (matched skills for current context)
  └── Vertical context (if in a vertical conversation)

Layer 4: Conversation History
  └── Last N turns from session history
```

### 3. Call Model
- Route through the selected OpenRouter model (`session.llm_model_key`)
- Use **live HTTP** — no stubs, no mocks, no placeholder responses
- Stream response to frontend

### 4. Parse Tool Calls (Actions)
If the model requests actions, map to internal skills:

| Action | Skill |
|--------|-------|
| `startProcess` | `SKILL:start_process` |
| `advanceStep` | `SKILL:advance_step` |
| `approveHitl` | `SKILL:approve_hitl` |
| `uploadOfficialRfp` | `SKILL:upload_official_rfp` |
| `usageUpsert` | `SKILL:record_usage` |

### 5. Execute Tool Calls in Backend
All tool calls execute via real HTTP against live services.

### 6. Stream Response
- Text → streamed to chat UI
- Text → TTS (if `session.voice.autoplay = true`) → streamed audio to UI
- Persist exchange to session history

## No-Click-Trigger Rule
No preloaded placeholder card may trigger a full response on click alone.
Presets are allowed only as **question templates** — they populate the input field
and the user must submit or speak the message.
