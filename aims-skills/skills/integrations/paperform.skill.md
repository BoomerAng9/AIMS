---
id: "integration-paperform"
name: "Paperform Integration"
type: "skill"
status: "active"
triggers: ["paperform", "form", "intake form", "questionnaire", "survey", "client intake", "needs analysis form", "booking form", "feedback form"]
description: "Paperform form builder integration — form creation, submission management, automated intake workflows, and data collection for all AIMS verticals."
execution:
  target: "mcp"
  bridge: "pipedream"
  route: "https://mcp.pipedream.net/v2"
dependencies:
  env: ["PIPEDREAM_API_KEY", "PIPEDREAM_MCP_URL"]
  tools: ["pipedream-mcp", "paperform"]
priority: "high"
---

# Paperform Integration Skill

## Overview

ACHEEVY and the full chain of command use Paperform to create, manage, and process forms
for client intake, needs analysis, feedback collection, booking, and payment processing.
All access goes through the Pipedream MCP bridge — no direct API calls from agents.

## When to Activate This Skill

Activate when the user or a workflow needs:
- A new form for any purpose (intake, survey, booking, payment)
- To retrieve or process form submissions
- To wire form submissions to automation workflows
- To share a form link with a client or prospect
- To analyze form response data

**Trigger phrases:** "create a form", "intake form", "questionnaire", "survey",
"client onboarding form", "needs analysis", "booking form", "feedback form",
"get form submissions", "form responses"

## Form Creation Protocol

When creating a form, follow this protocol:

### 1. CLASSIFY the form purpose
| Purpose | Template Pattern | Key Fields |
|---------|-----------------|------------|
| **Client Onboarding** | Multi-step, professional | Name, company, industry, goals, budget, timeline |
| **Needs Analysis** | Conditional logic, adaptive | Current stack, pain points, requirements, scale, priorities |
| **Feedback/NPS** | Short, focused | Rating (1-10), what worked, what didn't, would recommend |
| **Support Request** | Structured triage | Category, urgency, description, steps to reproduce, screenshots |
| **Booking** | Calendar-connected | Service type, preferred date/time, contact info, notes |
| **Payment** | Stripe-connected | Service selection, quantity, payment details |
| **Custom** | User-defined | As specified by user |

### 2. DESIGN the form structure
- Use clear, concise field labels
- Group related fields into logical sections
- Apply conditional logic to reduce friction (show only relevant fields)
- Add calculated fields where useful (cost estimates, eligibility scores)
- Include a clear success message and next steps

### 3. CREATE via MCP
```
Tool: paperform_create_form
Via: Pipedream MCP (https://mcp.pipedream.net/v2)
Owner: Plug_Ang
```

### 4. WIRE submissions to workflow
- Connect form to n8n webhook for automated processing
- Store submissions in tenant-scoped Firestore collection
- Notify relevant parties via preferred channel

### 5. DELIVER the form URL
- Present the live form URL to the user
- Include any embedding instructions if needed

## Submission Processing Protocol

When processing submissions:

1. **RETRIEVE** — Pull submissions via `paperform_list_submissions` or `paperform_get_submission`
2. **VALIDATE** — Check for completeness and data quality
3. **ENRICH** — Cross-reference with existing user/project data in Firestore
4. **ROUTE** — Send to the appropriate workflow based on form purpose
5. **STORE** — Persist processed data in tenant-scoped storage
6. **NOTIFY** — Inform the user and relevant team members
7. **EVIDENCE** — Log the processing as an audit artifact

## Actor-Specific Behaviors

### ACHEEVY
- Present form options during vertical Phase A conversations
- Auto-share relevant intake forms during onboarding
- Process new submissions as conversation context
- Never expose form API keys or internal form IDs to users
- Always present forms as "your intake form" or "your questionnaire" — never "Paperform"

### Boomer_Angs
- Plug_Ang manages all Paperform connections and credentials
- Other Angs request form access through Plug_Ang delegation
- Any Ang can read submission data for their domain (with Plug_Ang approval)

### Chicken Hawk
- Dispatch form creation tasks with clear specifications
- Ensure form tasks produce evidence (form URL, submission count, processing log)
- Route submission data to relevant Lil_Hawks for processing

### Lil_Hawks
- Execute bounded form tasks only (create, read, process)
- Cannot delete forms or manage connections
- Must attach evidence to completed form tasks

## Integration Rules (Hard)

- **Never expose Paperform API keys** — they live inside Pipedream only
- **Never call Paperform API directly** — always go through Pipedream MCP
- **Never store raw submission data outside tenant scope** — Firestore tenant isolation applies
- **Never delete forms without HITL approval** — form deletion is a "Guide Me" lane action
- **Always log form operations** — creation, reads, and processing are audited
- **Never reveal "Paperform" to users** — refer to forms as "your intake form", "your questionnaire", etc.

## Integration Rules (Soft)

- Prefer multi-step forms over single long pages for complex intake
- Use conditional logic to keep forms short and relevant
- Include progress indicators on multi-step forms
- Auto-populate fields when user data is already known
- Set up partial submission tracking for lead recovery
- Use calculated fields for instant cost estimates

## A.I.M.S. Vertical Form Templates

### Onboarding Intake (Phase A → Phase B transition)
```
Section 1: About You
  - Full name (required)
  - Company/Organization
  - Role/Title
  - Industry

Section 2: Your Goals
  - What brings you to A.I.M.S.? (multi-select)
  - Primary objective (text)
  - Timeline (select: ASAP / 1-3 months / 3-6 months / exploring)

Section 3: Current Setup
  - Current tools/platforms (text)
  - Team size (number)
  - Monthly budget range (select)

Section 4: Next Steps
  - Preferred contact method (select)
  - Anything else? (text)
  - [Submit → triggers onboarding workflow]
```

### Plug Needs Analysis
```
Section 1: Current Pain Points
  - What problem are you solving? (text, required)
  - What tools have you tried? (text)
  - What's not working? (text)

Section 2: Requirements
  - Must-have features (multi-select from vertical-specific list)
  - Nice-to-have features (multi-select)
  - Integration requirements (multi-select: Slack, Email, CRM, etc.)

Section 3: Scale & Budget
  - Expected users/volume (select)
  - Budget range (select)
  - Self-hosted or managed? (select)

  [Submit → triggers plug recommendation engine]
```

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Form creation fails | Ensure title and at least one field are provided |
| Submissions not appearing | Check Pipedream connection is active and authenticated |
| Webhook not triggering | Verify webhook URL in Pipedream matches n8n endpoint |
| Field data missing | Verify field key names match between form and processing logic |
| Rate limited | Throttle submission pulls; batch processing recommended |
