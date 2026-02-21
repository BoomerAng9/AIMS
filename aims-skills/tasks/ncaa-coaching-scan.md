---
id: "ncaa-coaching-scan"
name: "NCAA Coaching Carousel Scan"
type: "task"
status: "active"
schedule: "0 6,18 * * *"
description: "Boomer_Ang scans coaching news sources for new hires, firings, resignations, and retirements across FBS programs."
assigned_to: "boomer_ang"
verified_by: "lil_hawk"
target_module: "coaching_carousel"
execution:
  target: "api"
  route: "/api/perform/automation"
  method: "POST"
  body:
    agentName: "boomer_ang"
    taskType: "COACHING_SCAN"
    targetModule: "coaching_carousel"
    triggeredBy: "SCHEDULE"
priority: "high"
---

# NCAA Coaching Carousel Scan

> Twice-daily automated scan for coaching changes across all FBS programs.

## Pipeline

1. **Boomer_Ang** initiates the scan via `POST /api/perform/automation`
2. Searches coaching news via Brave Search API:
   - Queries: `"college football coaching hire" OR "head coach fired" OR "coaching change" site:espn.com OR site:247sports.com`
   - Date-filtered to last 12 hours
3. For each detected change:
   - Extracts: coach name, school, change type, contract details
   - Matches school to `PerformTeam` via fuzzy name match
   - Creates or updates `CoachingChange` record with `verified: false`
4. **Lil_Hawk** verification pass:
   - Cross-references change against 2+ sources
   - Validates contract numbers against official announcements
   - Sets `verified: true` and `verifiedBy: "lil_hawk"` when confirmed
5. Completes automation run with summary

## ACHEEVY Communication

While scanning:
> "Boomer_Ang is checking the coaching carousel — scanning for new hires and departures."

When complete:
> "Coaching carousel updated. [X] new changes detected, [Y] verified by Lil_Hawk."

## Error Handling

- If Brave Search fails: retry 2x with backoff, then mark run as PARTIAL
- If team matching fails: log unmatched changes for manual review
- If source conflicts: flag for Lil_Hawk manual verification

## Evidence

Required artifacts: `COACHING_SCAN_LOG`, `SOURCE_URLS`, `VERIFICATION_REPORT`
