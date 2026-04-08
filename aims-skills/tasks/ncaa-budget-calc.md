---
id: "ncaa-budget-calc"
name: "NCAA Revenue Budget Calculation"
type: "task"
status: "active"
schedule: "0 6 1,15 * *"
description: "Boomer_Ang recalculates school revenue budgets and cap space twice monthly. Lil_Hawk verifies financial data accuracy."
assigned_to: "boomer_ang"
verified_by: "lil_hawk"
target_module: "revenue_budget"
execution:
  target: "api"
  route: "/api/perform/automation"
  method: "POST"
  body:
    agentName: "boomer_ang"
    taskType: "BUDGET_CALC"
    targetModule: "revenue_budget"
    triggeredBy: "SCHEDULE"
priority: "medium"
---

# NCAA Revenue Budget Calculation

> Twice-monthly (1st and 15th) recalculation of school budgets and cap space,
> modeling NCAA football finances like NFL free agency.

## Pipeline

1. **Boomer_Ang** initiates calculation via `POST /api/perform/automation`
2. Data collection:
   - Pull current NIL spending from `NilDeal` table (sum per team)
   - Pull coaching salary data from `CoachingChange` table (new contracts)
   - Scan for revenue updates: USA Today athletic department finances, Knight Commission data
3. For each school with a `SchoolRevenueBudget` record:
   - Update `nilSpent` from aggregated active NIL deals
   - Recalculate `nilRemaining` = `nilBudget` - `nilSpent`
   - Recalculate `capSpace` = `nilBudget` - `nilSpent`
   - Update `coachingSalary` if new coaching contracts detected
   - Recalculate `spendingTier` based on total spend:
     - ELITE: top 10% (>$25M NIL budget)
     - HIGH: top 25% ($15M–$25M)
     - MID: middle 50% ($8M–$15M)
     - LOW: bottom 25% ($4M–$8M)
     - MINIMAL: bottom 10% (<$4M)
   - Rank schools by cap space → `capRank`
4. Log transactions for significant changes:
   - New coaching hires → `COACH_HIRE` transaction
   - Large NIL deals (>$500K) → `NIL_DEAL` transaction
   - Coaching buyouts → `COACH_BUYOUT` transaction
5. **Lil_Hawk** verification:
   - Validate revenue figures against public filings
   - Cross-reference NIL totals with NIL tracker data
   - Flag anomalies (e.g., nilSpent > nilBudget, revenue drops >20%)
   - Verify spending tier assignments
6. Complete run with summary

## ACHEEVY Communication

While calculating:
> "Boomer_Ang is running the cap numbers — updating every school's budget and free agency position."

When complete:
> "Budget update complete. [X] schools recalculated. Top cap space: [Team] at $[Y]M. [Z] schools over budget."

## The "Free Agency" Model

This system models NCAA football finances like the NFL:
- **NIL Budget** = Salary Cap equivalent
- **Cap Space** = Budget remaining for portal pickups and new NIL deals
- **Over Budget** = Schools that have spent more than their allocated NIL budget
- **Budget Transactions** = Like NFL transaction wire — every significant financial move is logged
- Teams with more cap space can be more aggressive in the transfer portal
- Schools over budget risk player departures (like NFL cap casualties)
