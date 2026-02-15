---
name: estate-scout-neighborhood
display: "Scout Neighborhood"
description: "Analyze a neighborhood for investment opportunity, gentrification risk, and community stability"
trigger:
  - "scout {neighborhood}"
  - "analyze neighborhood"
  - "what's happening in {neighborhood}"
  - "blockwise scout"
target: "/api/estate/scout/scout-neighborhood"
method: POST
params:
  neighborhood: "Name of the neighborhood to analyze"
  city: "City name"
  state: "State abbreviation"
status: "active"
vertical: "Estate"
agent: "Scout Boomer_Ang"
---

# Estate Scout — Neighborhood Intelligence

When a user asks about a specific neighborhood or area for real estate investment,
the Scout Boomer_Ang activates.

## What Scout Does
1. Searches for recent development activity, permits, and news
2. Calculates three scores:
   - **Gentrification Score** (1-10): How fast is displacement happening?
   - **Investment Opportunity Score** (1-10): Deal quality + timing
   - **Community Stability Score** (1-10): How vulnerable are current residents?
3. Identifies distressed properties, estate sales, and off-market opportunities
4. Tracks institutional buyer activity (hedge funds buying up the block)

## Voice Interface Example
> **User:** "Scout, what's happening in West End Atlanta?"
> **Scout:** "West End is heating up. Found 8 properties under $150K. 3 distressed, 2 estate sales. New Beltline extension permits filed. Institutional buyers took 4 this quarter. Move FAST."

## Response Format
Scout returns neighborhood intel with scores, property leads, and a recommendation.
Always include the Community Stability Score — we build wealth WITHOUT displacing families.
