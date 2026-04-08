---
id: "gridiron-war-room-status"
name: "War Room Status"
type: "skill"
status: "active"
triggers: ["war room status", "rankings status", "gridiron status", "perform status"]
description: "Reports the current state of the Gridiron Sandbox — rankings, content pipeline, service health."
execution:
  target: "api"
  route: "/api/gridiron/war-room/status"
priority: "normal"
---

# War Room Status Skill

> Quick check on the Gridiron Sandbox health and output.

## Action: `gridiron_war_room_status`

### What It Reports
1. **Service health** — Scout Hub, Film Room, War Room container status
2. **Rankings count** — HS Top 300 and College Top 551 current totals
3. **Prospects graded** — total processed through GROC + Luke formula
4. **Content queue** — blogs and podcasts awaiting publish
5. **Last scout delivery** — when the last Lil_Hawk debate batch arrived
6. **Connection status** — ElevenLabs, Brave, Chicken Hawk, Vertex AI

### ACHEEVY Communication
> "Here's the War Room status: [X] prospects ranked, [Y] content pieces ready, all [N] services green."
