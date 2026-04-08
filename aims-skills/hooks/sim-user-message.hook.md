---
id: "sim-user-message"
name: "Sim User Message"
type: "hook"
status: "active"
triggers: ["livesim_user_input", "ask_crew"]
description: "Routes user messages into the LiveSim autonomous space. ACHEEVY may invite a Boomer_Ang or Lil_Hawk into a bounded Q&A (max 3 turns)."
execution:
  target: "internal"
priority: "high"
---

# Sim User Message Hook

> Users can interact with the autonomous simulation — but only through ACHEEVY, and only in bounded exchanges.

## Fires When
- User clicks "Ask this crew a question" in the LiveSim UI
- User sends a message while `mode = "LiveSim"`

## Behavior

### 1. Route Through ACHEEVY
The user message is ALWAYS routed through ACHEEVY first. ACHEEVY decides:
- Which agent(s) in the simulation are relevant to the question
- Whether to invite them into a bounded Q&A

### 2. Bounded Q&A
If ACHEEVY invites a Boomer_Ang or Lil_Hawk:
- Maximum 3 turns of back-and-forth between user and the invited agent
- ACHEEVY remains visible as conductor ("Let me bring in MarketingAng for this.")
- After 3 turns, control returns to ACHEEVY

### 3. Log to sim_logs
All user-agent exchanges in LiveSim are logged to the `sim_logs` Firestore collection:
```json
{
  "session_id": "uuid",
  "turn_type": "user_to_agent",
  "user_id": "uid",
  "agent_id": "MarketingAng",
  "message": "...",
  "timestamp": "ISO-8601",
  "bounded_turn": 1
}
```

### 4. Push to WebSocket
Updated sim_logs are pushed to all connected WebSocket clients viewing the LiveSim page.

## Guards
- User cannot directly address an agent by name — ACHEEVY selects who responds
- Bounded Q&A enforces max 3 turns — no infinite loops
- Only ACHEEVY speaks to the user in the main chat stream
