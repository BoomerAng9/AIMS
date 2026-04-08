---
id: "spawn-simulation-room"
name: "Spawn Simulation Room"
type: "skill"
status: "active"
triggers: ["spawn sim", "simulation room", "live sim", "autonomous space"]
description: "Creates a new LiveSim room with a subset of Boomer_Angs and Lil_Hawks for autonomous multi-agent interaction."
execution:
  target: "api"
  route: "/api/acheevy/livesim/spawn"
dependencies:
  env: ["OPENROUTER_API_KEY"]
priority: "high"
---

# Spawn Simulation Room Skill

> Creates a live autonomous space where agents interact in real time.

## Action: `spawn_simulation_room`

### What It Does
1. Creates a new simulation room in Firestore: `sim_rooms/{room_id}`
2. Seeds the room with the specified agents (Boomer_Angs and/or Lil_Hawks)
3. Starts the autonomous simulation loop (SIM_LOOP)
4. Pushes initial state to WebSocket clients

### SIM_LOOP (LiveSim only)
```pseudo
SIM_LOOP:
  agents_plan = ACHEEVY.decide_multi_agent_step(context)
  for each agent_call in agents_plan:
    result = call_agent_service(agent_call)  // Boomer_Ang or Lil_Hawk
    write_to_sim_logs(result)
  push_sim_logs_to_websocket_clients()
  wait(interval)  // configurable: 30s - 5min between steps
  GOTO SIM_LOOP
```

### Parameters
```json
{
  "topic": "string — what the simulation is about",
  "seed_agents": ["MarketingAng", "Lil_Research_Hawk", "AnalystAng"],
  "interval_seconds": 60,
  "max_rounds": 50,
  "owner_id": "uid"
}
```

### Agent Behavior in Sim
- ACHEEVY remains the **conductor** — decides what each agent works on next
- Agents operate autonomously (no user prompt required)
- Each agent has its own persona and capability scope
- Agent-to-agent messages are logged to `sim_logs` Firestore collection
- All activity is visible on the LiveSim UI as a timeline stream

### What Users See
```
Timeline:
  [10:01] MarketingAng is drafting a blog section about X.
  [10:02] Lil_Research_Hawk fetched new data for topic Y.
  [10:03] AnalystAng analyzed the data and found pattern Z.
  [10:04] MarketingAng incorporated the findings into the blog draft.
```

### Visibility Rules
- Read-only for normal visitors
- Users can "Ask this crew a question" (routes through onSimUserMessage hook)
- Owner can pause/resume/terminate the simulation

### Returns
```json
{
  "room_id": "uuid",
  "topic": "string",
  "agents": ["list"],
  "status": "running",
  "websocket_channel": "sim:{room_id}"
}
```
