---
name: estate-analyze-flip
display: "Analyze Flip Deal"
description: "Run the LUC Flip Calculator on a property — purchase, repairs, ARV, financing, verdict"
trigger:
  - "flip {address}"
  - "analyze deal"
  - "blockwise flip"
  - "is this a good deal"
  - "analyze {address}"
target: "/api/estate/scout/analyze-flip"
method: POST
params:
  purchasePrice: "Purchase price of the property"
  repairCosts: "Total estimated repair/renovation costs"
  arv: "After Repair Value"
  holdingPeriodMonths: "Expected time to complete and sell (default: 6)"
  loanToValue: "LTV percentage (default: 80)"
  interestRate: "Annual HML interest rate (default: 12)"
status: "active"
vertical: "Estate"
agent: "Flip Boomer_Ang"
---

# Flip Deal Analyzer

When a user provides property numbers (purchase price, repair estimate, ARV),
the Flip Boomer_Ang runs the full LUC calculator.

## What Flip Does
1. Applies the 70% Rule to determine Maximum Offer Price
2. Calculates all costs: acquisition, renovation, financing, holding, selling
3. Computes Net Profit, ROI, and Cash-on-Cash Return
4. Rates the deal: Excellent / Good / Marginal / Pass
5. Suggests OPM (Other People's Money) funding structures
6. Shows rental hold alternative (BRRRR analysis)

## Voice Interface Example
> **User:** "Flip, analyze 1234 Oak Street. $130K purchase, $22K repairs, ARV $185K."
> **Flip:** "1234 Oak. Total project: $160K. Profit: $25K (13.5% margin). Max offer: $135K. YES—this deal works."

## Decision Logic
- ROI >= 20% AND Profit >= $25K → "YES — MOVE ON THIS"
- ROI >= 10% AND Profit >= $15K → "MAYBE — NEGOTIATE HARDER"
- Below thresholds → "NO — WALK AWAY"
