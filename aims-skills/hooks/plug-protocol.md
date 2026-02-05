---
id: "plug-protocol"
name: "Plug Protocol"
type: "hook"
status: "active"
triggers:
  - "build"
  - "spin up"
  - "create"
  - "deploy"
  - "launch"
  - "start"
  - "fabricate"
  - "scaffold"
description: "Intercepts build/deploy requests and routes them through the Plug Registry before any code generation."
execution:
  target: "internal"
  route: "/api/plugs/[plugId]"
dependencies:
  files:
    - "frontend/lib/plugs/registry.ts"
    - "frontend/app/api/plugs/[plugId]/route.ts"
    - "aiPLUGS/"
priority: "critical"
---

# Plug Protocol Hook

## What It Does
When a user says "build," "create," "deploy," or any build trigger word:
1. STOP -- do not generate generic code
2. SEARCH the Plug Registry for a matching Plug definition
3. RETRIEVE the Plug's data models, prompt chains, and context from `aiPLUGS/`
4. EXECUTE the Plug Fabrication sequence

## Current Priority
**Perform** (Sports Analytics & Scouting) is the priority build target.
Search for "Perform" or "Per Form" in `aiPLUGS/perform_plug.md`.

## Plug Registry Location
`frontend/lib/plugs/registry.ts` indexes all plugs with:
- `findPlugById(id)` -- direct lookup
- `findPlugByKeywords(query)` -- semantic keyword match
- `getActivePlugs()` -- filter by status

## Active Plugs
| ID | Name | Vertical | Status |
|----|------|----------|--------|
| perform | Perform | Sports Analytics | Active |
| flip-scorecard | Flip Scorecard | Real Estate | Coming Soon |
| lease-analyzer | Lease Analyzer | Real Estate | Coming Soon |
| auto-invite | Auto-Invite Bot | Growth | Coming Soon |
| market-intel | Market Intel Report | Marketing | Coming Soon |

## Implementation
Already wired in `frontend/app/api/acheevy/route.ts` via `matchesPlugProtocol()`.
