---
id: "gridiron-scout-run"
name: "Gridiron Scout Run"
type: "skill"
status: "active"
triggers: ["scout run", "scan prospects", "start scouting", "nightly scan"]
description: "Triggers or monitors a Gridiron Sandbox scout run — Lil_Hawks scrape, debate, and log prospects."
execution:
  target: "api"
  route: "/api/gridiron/scout-hub/trigger-scan"
priority: "high"
---

# Gridiron Scout Run Skill

> Triggers the Lil_Hawk adversarial scouting pipeline.

## Action: `gridiron_scout_run`

### What It Does
1. Sends `POST /api/gridiron/scout-hub/trigger-scan` to the Scout Hub container
2. Scout Hub spawns Lil_Hawk pairs per prospect:
   - **Lil_Bull_Hawk** argues the prospect is UNDERRATED
   - **Lil_Bear_Hawk** argues the prospect is OVERRATED
3. Data sources: Brave Search API, Firecrawl (MaxPreps, Hudl, 247, Rivals)
4. Output: Scouting Debate Logs delivered to the War Room

### Target Pools
- **High School:** Top 300 (configurable via `HS_POOL_SIZE`)
- **College:** ~551 prospects (199 drafted + ~352 UDFAs)

### ACHEEVY Communication
While scanning:
> "The Lil_Hawks are out scouting — I'll let you know when the debate logs hit the War Room."

When complete:
> "Scout run complete. [X] prospects scanned, [Y] debate logs delivered to the War Room."
