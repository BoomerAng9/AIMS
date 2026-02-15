---
id: "approve-hitl"
name: "Approve HITL"
type: "skill"
status: "active"
triggers: ["approveHitl", "approve", "sign off"]
description: "Hard gate for SoW/Quote/PO steps. ACHEEVY must ask for explicit approval before finalizing documents or sending outbound actions."
execution:
  target: "api"
  route: "/api/acheevy/actions/approve-hitl"
priority: "critical"
---

# Approve HITL Skill

> Human-in-the-loop gates are non-negotiable. No auto-approval. No shortcuts.

## Action: `approveHitl`

### HITL Gate Steps
These steps require explicit human approval:
1. **SoW (Statement of Work)** — the scope commitment
2. **Quote** — the price commitment
3. **PO (Purchase Order)** — the payment commitment

### What It Does
1. Validates the approver has authority (`approver_id` matches session owner or designated approver)
2. Records the approval with timestamp and approver identity
3. Seals the document as "final" (immutable from this point)
4. Advances the step to the next in the spine
5. Logs approval to the triple audit ledger

### Approval Flow
```
1. ACHEEVY drafts the document (SoW/Quote/PO)
2. ACHEEVY presents it: "Here's the [document]. Review it carefully."
3. User reviews and says "approve" / "looks good" / clicks approve button
4. This skill fires and records the approval
5. Step advances to next
```

### What ACHEEVY Must NOT Do
- Auto-approve any HITL gate
- Proceed past a HITL gate without explicit user confirmation
- Present approval as optional ("Would you like to skip this?")
- Bundle multiple approvals into one ("Approve SoW, Quote, and PO at once")

### Parameters
```json
{
  "rfp_id": "uuid",
  "step": "SoW|Quote|PO",
  "approver_id": "uid"
}
```

### Returns
```json
{
  "rfp_id": "uuid",
  "step": "string",
  "approved": true,
  "approved_by": "uid",
  "approved_at": "ISO-8601",
  "next_step": "string"
}
```
