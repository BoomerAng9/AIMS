---
id: "claw-replacement-status"
name: "CLAW Replacement Status"
type: "skill"
status: "active"
triggers: ["claw status", "claw health", "chicken hawk ready"]
description: "Checks if the Chicken Hawk execution engine is built, running, and passing smoke tests on Hostinger VPS."
execution:
  target: "api"
  route: "/api/acheevy/chicken-hawk/claw-status"
priority: "critical"
---

# CLAW Replacement Status Skill

> Before Chicken Hawk serves live traffic, the CLAW replacement must be verified.

## Action: `claw_replacement_status`

### What It Checks
1. **Container built and running** on Hostinger VPS (76.13.96.107)
   - Docker container `claw-agent` is in `running` state
   - Container health check endpoint returns 200
2. **Required APIs passing smoke tests**
   - `POST /deploy` — deploy endpoint responds
   - `POST /run` — execution endpoint responds
   - `GET /logs` — log retrieval endpoint responds
3. **Feature completeness per `docs/CHICKENHAWK_SPEC.md`**
   - Code generation pipeline functional
   - Build/test pipeline functional
   - Deploy pipeline functional

### Return Values
```json
{
  "status": "ready|building|degraded|offline",
  "container_running": true,
  "api_health": {
    "deploy": "pass|fail",
    "run": "pass|fail",
    "logs": "pass|fail"
  },
  "feature_parity": {
    "code_gen": true,
    "build_test": true,
    "deploy": true
  },
  "last_checked": "ISO-8601"
}
```

### Status Semantics
| Status | Meaning |
|--------|---------|
| `ready` | All checks pass. Chicken Hawk can serve live traffic. |
| `building` | Container exists but some APIs are not yet functional. Build in progress. |
| `degraded` | Running but some features are failing. Use with fallback. |
| `offline` | Container not running or unreachable. Trigger buildout. |
