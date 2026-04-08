---
id: "ncaa-nil-update"
name: "NCAA NIL Rankings Update"
type: "task"
status: "active"
schedule: "0 8 * * 1"
description: "Boomer_Ang compiles weekly NIL deal data and recalculates team and player rankings. Lil_Hawk verifies deal values."
assigned_to: "boomer_ang"
verified_by: "lil_hawk"
target_module: "nil_tracker"
execution:
  target: "api"
  route: "/api/perform/automation"
  method: "POST"
  body:
    agentName: "boomer_ang"
    taskType: "NIL_UPDATE"
    targetModule: "nil_tracker"
    triggeredBy: "SCHEDULE"
priority: "medium"
---

# NCAA NIL Rankings Update

> Weekly (Monday 8 AM) compilation of NIL deals and recalculation of rankings.

## Pipeline

1. **Boomer_Ang** initiates weekly update via `POST /api/perform/automation`
2. Scan NIL deal sources:
   - Brave Search: `"NIL deal" OR "NIL collective" college football site:on3.com OR site:sportico.com`
   - On3 NIL Valuations (if API available)
3. For each new deal detected:
   - Extract: player, school, brand/collective, estimated value, deal type
   - Match to `PerformTeam` and existing player records
   - Create `NilDeal` record with `verified: false`
4. Recalculate rankings:
   - **Team Rankings** (`NilTeamRanking`):
     - Sum all active deals per team → `totalNilValue`
     - Average per rostered player → `avgPerPlayer`
     - Rank schools 1-N by total value
     - Calculate trend vs previous week
   - **Player Rankings** (`NilPlayerRanking`):
     - Sum deals per player → `estimatedTotal`
     - Factor in social media following if available
     - Rank players 1-N
5. **Lil_Hawk** verification:
   - Spot-check top 20 deals for accuracy
   - Flag deals with suspicious values (>$5M or <$1K)
   - Verify brand/collective names against known entities
   - Mark verified deals

## ACHEEVY Communication

While processing:
> "Boomer_Ang is crunching this week's NIL numbers — rankings update incoming."

When complete:
> "NIL rankings refreshed. [X] new deals tracked, total NIL market: $[Y]M across [Z] schools."

## Calculation Notes

- Only ACTIVE deals count toward rankings
- Expired deals automatically transition status on expiresDate
- Collective deals are weighted 1:1 with endorsements
- Social media deals are estimated at follower_count × $0.01 per post if no explicit value
