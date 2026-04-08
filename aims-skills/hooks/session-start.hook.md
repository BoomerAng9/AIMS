---
id: "session-start"
name: "Session Start"
type: "hook"
status: "active"
triggers: ["session_start", "new_session", "reconnect"]
description: "Initializes session state on every new chat session. Loads last-used persona, path, LLM model, and voice profile from Firestore."
execution:
  target: "internal"
priority: "critical"
---

# Session Start Hook

> Every session begins with a fully hydrated state. No blank-slate conversations.

## Fires When
- A new chat session is created (new `session_id`)
- A user reconnects after session timeout
- A user switches devices mid-session

## Actions

### 1. Initialize Session State
Load or create the canonical session object:

```json
{
  "session_id": "uuid",
  "user_id": "uid",
  "mode": "Default|BusinessBuilder|GrowthAdvisor|DIY",
  "persona": "ProConsultant|Strategist|Entertainer|Analyst|HeadCoach|SportsInsider|Custom",
  "path": "ManageIt|GuideMe_DMAIC",
  "rfp_id": "uuid|null",
  "current_step": "RFP|RFP_Response|Proposal|SoW|Quote|PO|Assignment|QA|Delivery|Completion",
  "sports_mode": false,
  "llm_model_key": "openrouter:model_id",
  "voice_profile_key": "voice_id",
  "qa_state": {
    "last_user_turn_id": "uuid",
    "last_agent_turn_id": "uuid"
  }
}
```

### 2. Hydrate from Firestore
- Load the user's last-used persona from `users/{uid}/preferences/persona`
- Load the user's last-used LLM model from `users/{uid}/preferences/llm_model`
- Load the user's last-used voice profile from `users/{uid}/preferences/voice_profile`
- Load the user's last-used path from `users/{uid}/preferences/path`
- If no preferences exist, use defaults: `ProConsultant`, `ManageIt`, default model, default voice

### 3. Persist to Redis
- Write session state to Redis with TTL (session timeout)
- Key: `session:{session_id}`

### 4. Emit Session Ready Event
- Notify the frontend that session state is hydrated
- Frontend renders the correct persona chip, model pill, and voice indicator

## Dependencies
- Firestore (user preferences)
- Redis (session cache)
- UEF Gateway (session routing)
