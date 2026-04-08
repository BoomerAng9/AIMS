---
id: "advance-step"
name: "Advance Step"
type: "skill"
status: "active"
triggers: ["advanceStep", "next step", "move forward"]
description: "Advances the internal RFP document spine to the next step. Stores artifacts in Firestore/Storage."
execution:
  target: "api"
  route: "/api/acheevy/actions/advance-step"
priority: "high"
---

# Advance Step Skill

> Moves the engagement forward one step in the 10-step spine.

## Action: `advanceStep`

### Steps and Transitions
```
RFP → RFP_Response → Proposal → SoW* → Quote* → PO* → Assignment → QA → Delivery → Completion
                                  ↑        ↑       ↑
                              HITL gates (require approve_hitl)
```

### What It Does
1. Validates the current step is complete (evidence gate check)
2. If next step is a HITL gate (SoW/Quote/PO), blocks until `approve_hitl` is called
3. Stores artifacts from the completed step:
   - Draft documents → Firestore `rfp_simulations/{rfp_id}/artifacts/{step}`
   - File attachments → Cloud Storage `rfp/{rfp_id}/{step}/`
4. Updates `session.current_step` to the next step
5. Logs transition to audit ledger

### Parameters
```json
{
  "rfp_id": "uuid",
  "step": "RFP|RFP_Response|Proposal|SoW|Quote|PO|Assignment|QA|Delivery|Completion",
  "payload": {
    "artifacts": ["list of artifact references"],
    "notes": "string"
  }
}
```

### HITL Gate Behavior
When advancing to SoW, Quote, or PO:
- ACHEEVY **must ask for explicit approval** before writing a "final" document
- The user sees: "I've drafted the [document]. Would you like to review and approve it?"
- Only after `approve_hitl` is called does the step finalize

### Returns
```json
{
  "rfp_id": "uuid",
  "previous_step": "string",
  "current_step": "string",
  "status": "active|awaiting_approval|completed"
}
```
