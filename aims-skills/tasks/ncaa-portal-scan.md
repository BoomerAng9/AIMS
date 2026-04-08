---
id: "ncaa-portal-scan"
name: "NCAA Transfer Portal Scan"
type: "task"
status: "active"
schedule: "0 */4 * * *"
description: "Boomer_Ang monitors the transfer portal for new entries, commitments, and withdrawals every 4 hours."
assigned_to: "boomer_ang"
verified_by: "lil_hawk"
target_module: "transfer_portal"
execution:
  target: "api"
  route: "/api/perform/automation"
  method: "POST"
  body:
    agentName: "boomer_ang"
    taskType: "PORTAL_SCAN"
    targetModule: "transfer_portal"
    triggeredBy: "SCHEDULE"
priority: "high"
---

# NCAA Transfer Portal Scan

> Every-4-hours scan for transfer portal activity during open windows.

## Pipeline

1. **Boomer_Ang** initiates scan via `POST /api/perform/automation`
2. Window-aware scheduling:
   - **Spring Window** (April 16 – April 25): max priority, every 2 hours
   - **Summer Window** (August): moderate, every 4 hours
   - **Off-window**: reduced, every 12 hours
3. Search sources via Brave Search API:
   - `"transfer portal" "entered portal" OR "committed" OR "withdrawn" site:on3.com OR site:247sports.com`
4. For each player detected:
   - Extract: name, position, eligibility, previous school, destination (if committed)
   - Match schools to `PerformTeam` records
   - Estimate NIL valuation based on position + star rating
   - Calculate P.A.I. score from available stats
   - Create/update `TransferPortalEntry` with `verified: false`
5. **Lil_Hawk** verification:
   - Confirm player identity and school match
   - Validate commitment status against official announcements
   - Cross-reference NIL valuations with On3 NIL database
   - Set `verified: true` when confirmed
6. Update portal stats and complete automation run

## ACHEEVY Communication

While scanning:
> "Boomer_Ang is monitoring the portal — checking for new entries and commits."

When complete:
> "Portal scan complete. [X] new entries, [Y] commitments, [Z] verified by Lil_Hawk."

## Special: Portal Window Alerts

During active windows, high-profile entries (5-star or PAI > 85) trigger:
- Discord webhook notification
- Priority verification by Lil_Hawk within 30 minutes
