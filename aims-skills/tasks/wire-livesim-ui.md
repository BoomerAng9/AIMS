---
id: "wire-livesim-ui"
name: "Wire LiveSim UI"
type: "task"
status: "active"
triggers: ["livesim ui", "simulation page", "autonomous space ui"]
description: "Build the LiveSim page on plugmein.cloud: live agent transcript, explanation panel, and 'Ask this crew a question' interaction."
execution:
  target: "internal"
priority: "high"
---

# Wire LiveSim UI Task

## Objective
Build the LiveSim autonomous simulation page on plugmein.cloud.

## Page Layout

### Desktop
```
┌──────────────────────────┬──────────────────┐
│                          │                  │
│  Live Agent Transcript   │  Explanation     │
│  (timeline stream)       │  Panel           │
│                          │                  │
│  [10:01] MarketingAng    │  What's          │
│  is drafting blog...     │  happening:      │
│                          │  [description]   │
│  [10:02] Lil_Research    │                  │
│  _Hawk fetched data...   │  ┌────────────┐  │
│                          │  │ Ask this    │  │
│  [10:03] AnalystAng      │  │ crew a      │  │
│  analyzed patterns...    │  │ question    │  │
│                          │  └────────────┘  │
│                          │                  │
│                          │  Active Agents:  │
│                          │  - MarketingAng  │
│                          │  - AnalystAng    │
│                          │  - Lil_Research  │
│                          │    _Hawk         │
└──────────────────────────┴──────────────────┘
```

### Mobile
```
┌─────────────────────────┐
│ Header: Room Topic      │
│ [Agents] [Status]       │
├─────────────────────────┤
│                         │
│ Live Transcript         │
│ (scrollable timeline)   │
│                         │
├─────────────────────────┤
│ [Ask this crew a Q]     │
└─────────────────────────┘
```

## Technical Requirements

### WebSocket Connection
- Connect to `ws://plugmein.cloud/api/livesim/{room_id}`
- Receive real-time `sim_log` events
- Render each event as a timeline entry with:
  - Timestamp
  - Agent name (with role badge)
  - Action description
  - Status indicator (in-progress, completed)

### "Ask this crew a question" Flow
1. User clicks the button → input field appears
2. User types or speaks their question
3. Question routes through `HOOK:onSimUserMessage`
4. ACHEEVY selects a relevant agent and invites them into a bounded Q&A (max 3 turns)
5. Agent response appears in the transcript with a special "user interaction" styling

### Data Source
- Firestore collection: `sim_rooms/{room_id}/sim_logs`
- Real-time listener for new entries
- WebSocket for low-latency push

## Implementation Checklist
- [ ] Create `/livesim/[room_id]` page route
- [ ] Build `AgentTimeline` component (real-time WebSocket feed)
- [ ] Build `SimExplainer` panel (room description + agent roster)
- [ ] Build `AskCrewButton` with input flow
- [ ] Wire WebSocket connection to sim room
- [ ] Responsive layout for desktop/tablet/mobile
- [ ] Loading state while connecting to room
- [ ] Handle room not found / room closed states
