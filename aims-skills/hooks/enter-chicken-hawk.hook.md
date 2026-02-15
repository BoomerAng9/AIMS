---
id: "enter-chicken-hawk"
name: "Enter Chicken Hawk"
type: "hook"
status: "active"
triggers: ["chicken hawk", "chicken_hawk_vertical", "claw", "build me an app"]
description: "Fires on first entry to Chicken Hawk vertical. Checks CLAW replacement readiness and triggers buildout if not ready."
execution:
  target: "internal"
priority: "critical"
---

# Enter Chicken Hawk Hook

> Before Chicken Hawk can serve live traffic, the CLAW replacement must be green-lit.

## Fires When
- User explicitly requests "Chicken Hawk"
- User clicks the Chicken Hawk vertical in the dashboard
- ACHEEVY escalates a conversation into "build me an app/tool/automation" and the brain's tool-selection policy prefers Chicken Hawk
- First entry to `vertical = "ChickenHawk"` in a session

## Readiness Check

```pseudo
HOOK:onEnterChickenHawk:
  status = SKILL:claw_replacement_status()
  if status != "ready":
    SKILL:trigger_claw_buildout()
    ACHEEVY_explain("The Chicken Hawk build is still being wired up.
      I'll route this task through the legacy pipeline while the
      CLAW code agent finishes the new stack.")
  else:
    ACHEEVY_acknowledge("Chicken Hawk is live and wired to the
      new backend. Let's get to work.")
```

## Session State Changes
When this hook fires:
- `session.mode` stays `"Default"` (Chicken Hawk is a vertical, not a mode)
- `session.vertical` is set to `"ChickenHawk"`
- `session.path` is set as requested by the user

## Routing Rules
ACHEEVY routes coding/deployment tasks to Chicken Hawk when:
1. `vertical = "ChickenHawk"` explicitly, OR
2. A general conversation escalates into "build me an app / tool / automation" and the brain's tool-selection policy prefers Chicken Hawk

For all such calls:
- Execute only via live HTTP/gRPC against the CLAW replacement — never via mock results
- Return logs and status as natural-language updates in the conversation

## Dependencies
- `SKILL:claw_replacement_status` — health check
- `SKILL:trigger_claw_buildout` — buildout trigger
- Hostinger VPS (CLAW container)
