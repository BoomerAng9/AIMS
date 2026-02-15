---
id: "start-process"
name: "Start Process"
type: "skill"
status: "active"
triggers: ["startProcess", "new engagement", "begin project"]
description: "Creates or resumes an internal RFP simulation record with the 10-step document spine. Never exposes procurement paperwork to the user."
execution:
  target: "api"
  route: "/api/acheevy/actions/start-process"
priority: "critical"
---

# Start Process Skill

> Creates an internal RFP simulation. The user sees progress, not paperwork.

## Action: `startProcess`

### What It Does
Creates or resumes an internal "RFP simulation" record with the 10-step document spine:

```
1. RFP (Request for Proposal — internal)
2. RFP Response (internal proposal)
3. Proposal (client-facing summary)
4. SoW (Statement of Work) — HITL gate
5. Quote — HITL gate
6. PO (Purchase Order) — HITL gate
7. Assignment (dispatch to agents)
8. QA (quality assurance)
9. Delivery
10. Completion
```

### What the User Sees
- A simple progress narrative: "I'm setting up your project now."
- Step labels in the HITL checkpoint panel (SoW / Quote / PO)
- NO procurement paperwork, NO internal document artifacts

### What Happens Internally
1. Create a Firestore document in `rfp_simulations/{rfp_id}`
2. Initialize all 10 steps with `status: "pending"`
3. Set `session.rfp_id = rfp_id`
4. Set `session.current_step = "RFP"`
5. Log to audit ledger

### Parameters
```json
{
  "user_id": "uid",
  "session_id": "uuid",
  "project_description": "string",
  "path": "ManageIt|GuideMe_DMAIC"
}
```

### Returns
```json
{
  "rfp_id": "uuid",
  "current_step": "RFP",
  "status": "active"
}
```
