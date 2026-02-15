---
id: "trigger-claw-buildout"
name: "Trigger CLAW Buildout"
type: "skill"
status: "active"
triggers: ["claw buildout", "build claw", "claw agent build"]
description: "Opens or continues a build task in the CLAW code agent per `docs/CHICKENHAWK_SPEC.md`."
execution:
  target: "api"
  route: "/api/acheevy/chicken-hawk/trigger-buildout"
priority: "high"
---

# Trigger CLAW Buildout Skill

> If CLAW isn't ready, build it. Keep building until it's green.

## Action: `trigger_claw_buildout`

### What It Does
1. Checks if a build task already exists for the CLAW agent
   - If yes: resumes the existing task
   - If no: creates a new build task
2. Dispatches build instructions to the CLAW code agent:
   - Ensure container is built and deployed on Hostinger VPS
   - Ensure all required APIs are implemented and passing
   - Run regression tests defined in A.I.M.S. blueprint
3. Monitors build progress and reports status back to ACHEEVY

### Build Requirements (per CHICKENHAWK_SPEC.md)
- [ ] Docker container builds successfully
- [ ] Container deploys to Hostinger VPS
- [ ] `POST /deploy` endpoint functional
- [ ] `POST /run` endpoint functional
- [ ] `GET /logs` endpoint functional
- [ ] Code generation pipeline end-to-end
- [ ] Build/test pipeline end-to-end
- [ ] Deploy pipeline end-to-end
- [ ] Health check endpoint returns 200
- [ ] Regression tests pass

### ACHEEVY Communication
While build is in progress, ACHEEVY tells the user:
> "The Chicken Hawk build is still being wired up. I'll route this task
> through the legacy pipeline while the CLAW code agent finishes the new stack."

When build completes:
> "Chicken Hawk is now live and wired to the new backend. Let's get to work."

### Parameters
```json
{
  "force_rebuild": false,
  "target_host": "76.13.96.107",
  "build_timeout_minutes": 30
}
```

### Returns
```json
{
  "build_task_id": "uuid",
  "status": "started|resumed|already_running",
  "estimated_completion": "ISO-8601"
}
```
