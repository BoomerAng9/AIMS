---
id: "gridiron-ncaa-modules"
name: "Gridiron NCAA Modules"
type: "skill"
status: "active"
triggers: ["coaching carousel", "transfer portal", "nil tracker", "nil rankings", "revenue budget", "cap space", "free agency"]
description: "Routes user requests about NCAA coaching changes, transfer portal, NIL deals, and school revenue budgets to the appropriate Per|Form module."
execution:
  target: "frontend"
  routes:
    coaching_carousel: "/perform/coaching-carousel"
    transfer_portal: "/perform/transfer-portal"
    nil_tracker: "/perform/nil-tracker"
    revenue_budget: "/perform/revenue-budget"
priority: "high"
---

# Gridiron NCAA Modules Skill

> Routes ACHEEVY user requests to the four NCAA football management modules.

## Modules

### 1. Coaching Carousel
**Triggers:** "coaching carousel", "coaching changes", "who got hired", "who got fired", "new head coach"
**Route:** `/perform/coaching-carousel`
**API:** `GET /api/perform/coaching-carousel`
**Agents:** Boomer_Ang (scan), Lil_Hawk (verify)

Shows real-time coaching hires, firings, resignations, and retirements across FBS programs. Tracks contract values, buyouts, and coaching records.

### 2. Transfer Portal
**Triggers:** "transfer portal", "portal entries", "who transferred", "portal window", "portal tracker"
**Route:** `/perform/transfer-portal`
**API:** `GET /api/perform/transfer-portal`
**Agents:** Boomer_Ang (scan), Lil_Hawk (verify)

Live tracker for the NCAA transfer portal. Shows player entries, commitments, withdrawals with P.A.I. scores, star ratings, and NIL valuations.

### 3. NIL Rankings & Tracker
**Triggers:** "nil tracker", "nil rankings", "nil deals", "nil valuation", "biggest nil deal"
**Route:** `/perform/nil-tracker`
**API:** `GET /api/perform/nil`
**Agents:** Boomer_Ang (weekly update), Lil_Hawk (verify)

Tracks and ranks NIL deals by team and player. Shows deal types, brand partnerships, collective spending, and trending valuations.

### 4. School Revenue Budget (Free Agency System)
**Triggers:** "revenue budget", "cap space", "free agency", "school budget", "who can spend", "over budget"
**Route:** `/perform/revenue-budget`
**API:** `GET /api/perform/revenue-budget`
**Agents:** Boomer_Ang (bi-monthly calc), Lil_Hawk (verify)

Models NCAA school finances like NFL salary cap system. Shows total revenue, NIL budgets, cap space remaining, spending tiers, and transaction logs.

## ACHEEVY Routing Logic

When user mentions any trigger phrase:
1. Identify which module matches
2. Provide a brief summary of current state (pull from API ?stats=true)
3. Offer to open the full dashboard or dive deeper
4. If data seems stale, offer to trigger a manual Boomer_Ang scan

## Example Interactions

**User:** "What's the latest on the coaching carousel?"
**ACHEEVY:** "Let me check the carousel. [calls API] We've tracked 10 coaching changes this season — 5 hires, 3 firings, 1 resignation, 1 retirement. The biggest move: Bill Belichick to UNC with a $50M contract. Want me to open the full carousel view?"

**User:** "Who has the most NIL money?"
**ACHEEVY:** "Texas leads the NIL rankings with $32M in total estimated value, followed by Ohio State at $30.5M. Travis Hunter has the top individual deal at $4.5M with Nike. Want to see the full breakdown?"

**User:** "Which schools have cap space to make portal moves?"
**ACHEEVY:** "Looking at the free agency board... Texas has $3.5M in cap space, Oregon has $3M, and Colorado has $3M remaining. On the other end, Texas A&M is running tight with only $500K of headroom. Want to see the full leaderboard?"
