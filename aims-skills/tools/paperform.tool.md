---
id: "paperform"
name: "Paperform"
type: "tool"
category: "workflow"
provider: "Paperform"
description: "Beautiful, powerful form builder for data collection, payments, bookings, and client intake — accessed via Pipedream MCP bridge."
env_vars:
  - "PIPEDREAM_API_KEY"
  - "PIPEDREAM_MCP_URL"
docs_url: "https://paperform.co/help"
aims_files:
  - "aims-skills/tools/pipedream-mcp.tool.md"
  - "aims-skills/skills/integrations/paperform.skill.md"
  - "aims-skills/brains/PLUG_ANG_BRAIN.md"
owner: "Plug_Ang"
---

# Paperform — A.I.M.S. Form & Data Collection Tool

## Overview

Paperform is a form builder that combines the power of forms, the beauty of design, and the
intelligence of conditional logic into a single tool. A.I.M.S. uses Paperform for:

- **Client onboarding forms** — structured intake for new users and projects
- **Needs analysis questionnaires** — Plug selection, service scoping, requirements gathering
- **Payment collection** — Stripe-connected form payments for one-off services
- **Booking & scheduling** — Appointment forms for consultations and demos
- **Survey & feedback** — Post-delivery satisfaction surveys, NPS tracking
- **Data collection** — Structured data capture for any vertical workflow

**Owner:** Plug_Ang (Operations & Integration PMO)
**MCP Bridge:** Pipedream (`https://mcp.pipedream.net/v2`)
**API Base:** `https://api.paperform.co/v1`

## MCP Connection

Paperform is accessed through the **Pipedream MCP bridge**, not directly. All tool calls
flow through Port Authority → Pipedream MCP → Paperform API.

```
ACHEEVY intent → Port Authority → Pipedream MCP → Paperform API
                                     ↑
                     Credential isolation (API key never exposed)
```

### Authentication

Paperform uses a **Bearer API key** for authentication:

| Variable | Required | Where to Get | Purpose |
|----------|----------|--------------|---------|
| `PAPERFORM_API_KEY` | Yes (stored in Pipedream) | Paperform Dashboard > Integrations > API | Authenticate API calls |
| `PIPEDREAM_API_KEY` | Yes | Pipedream Dashboard > Settings | Authenticate MCP bridge |
| `PIPEDREAM_MCP_URL` | Yes | Default: `https://mcp.pipedream.net/v2` | MCP server endpoint |

**Note:** The `PAPERFORM_API_KEY` is stored **inside Pipedream** (encrypted at rest).
A.I.M.S. agents never see or handle this key directly — Pipedream proxies the calls.

## Available MCP Tools

### Form Management

| Tool | Description | ACHEEVY Use Case |
|------|-------------|-----------------|
| `paperform_list_forms` | List all forms in the account | Browse available intake forms |
| `paperform_get_form` | Get form details by ID/slug | Inspect form structure before sharing |
| `paperform_create_form` | Create a new form programmatically | Auto-generate intake forms for new verticals |
| `paperform_update_form` | Update form fields, logic, or settings | Modify forms based on vertical requirements |
| `paperform_delete_form` | Delete a form | Clean up deprecated intake forms |

### Submission Management

| Tool | Description | ACHEEVY Use Case |
|------|-------------|-----------------|
| `paperform_list_submissions` | List submissions for a form | Pull client responses for processing |
| `paperform_get_submission` | Get a specific submission | Retrieve individual intake data |
| `paperform_delete_submission` | Delete a submission | GDPR/data cleanup |

### Triggers (Event Sources)

| Trigger | Description | ACHEEVY Use Case |
|---------|-------------|-----------------|
| `paperform_new_submission` | Fires on new form submission | Auto-process client intake, kick off onboarding |
| `paperform_partial_submission` | Fires on partial/abandoned submission | Follow up with leads who didn't finish intake |

## API Reference

### Base URL
```
https://api.paperform.co/v1
```

### Auth Header (handled by Pipedream — never sent from AIMS directly)
```
Authorization: Bearer $PAPERFORM_API_KEY
```

### Key Endpoints

**List All Forms:**
```http
GET /forms
# Returns: { results: [{ form_id, title, slug, status, created_at }] }
```

**Get Form Details:**
```http
GET /forms/{form_id}
# Returns: { form_id, title, slug, fields: [...], settings: {...} }
```

**List Submissions:**
```http
GET /forms/{form_id}/submissions
# Returns: { results: [{ submission_id, data: {...}, created_at }] }
```

**Get Single Submission:**
```http
GET /forms/{form_id}/submissions/{submission_id}
# Returns: { submission_id, data: { field_key: value, ... }, created_at }
```

## Form Types for A.I.M.S. Verticals

| Vertical | Form Purpose | Key Fields |
|----------|-------------|------------|
| **Client Onboarding** | New user intake | Name, company, goals, budget range, timeline |
| **Plug Needs Analysis** | Service scoping | Current tools, pain points, requirements, scale |
| **Project Kickoff** | Engagement start | Objectives, deliverables, stakeholders, constraints |
| **Feedback & NPS** | Post-delivery | Satisfaction (1-10), comments, would recommend |
| **Support Request** | Issue intake | Category, urgency, description, screenshots |
| **Booking** | Consultation scheduling | Date/time, topic, contact info |
| **Payment** | One-off service payment | Service type, amount, payment details (Stripe-connected) |

## How Each Actor Uses Paperform

### ACHEEVY (Orchestrator)
- Detects form-related intent: "I need a client intake form", "create a questionnaire"
- Routes to `plug_needs_analysis` tool or custom form creation workflow
- Monitors new submissions as automation triggers (via n8n webhook → Pipedream)
- Presents form links to users during onboarding and vertical Phase A conversations
- **Can do:** Create forms, list submissions, share form links, trigger form-based workflows
- **Cannot do:** Delete forms without human approval (HITL gate)

### Boomer_Angs (Managers)
- **Plug_Ang** owns the Paperform connection — manages API keys, monitors health, configures webhooks
- **Buildsmith** can request form creation for new app onboarding flows
- **Scout_Ang** can pull submission data for research/analysis tasks
- **Chronicle_Ang** can pull submission data for timeline context
- **All Boomer_Angs** can request form data through Plug_Ang delegation

### Chicken Hawk (Coordinator)
- Dispatches form tasks to Lil_Hawks: "Create this intake form", "Pull submissions from form X"
- Ensures form tasks have proper job packets and evidence
- Cannot connect/disconnect Paperform (Boomer_Ang-only)
- **Dispatch patterns:**
  - `CREATE_FORM` → Lil_Interface_Forge_Hawk (form design) or Lil_Workflow_Smith_Hawk (form automation)
  - `PULL_SUBMISSIONS` → Lil_Webhook_Ferryman_Hawk (data retrieval)
  - `PROCESS_SUBMISSION` → Relevant Lil_Hawk per vertical

### Lil_Hawks (Workers)
- **Lil_Interface_Forge_Hawk** — Designs form structure (fields, logic, styling)
- **Lil_Workflow_Smith_Hawk** — Wires form submissions to n8n workflows
- **Lil_Webhook_Ferryman_Hawk** — Handles submission data routing and webhook delivery
- **Lil_Proofrunner_Hawk** — Validates form submission data for completeness
- **All Lil_Hawks** — Can read submission data for their assigned tasks (via bounded delegation)
- **Cannot:** Create/delete forms, manage API keys, or access credentials

## Integration with A.I.M.S. Workflows

### Submission → n8n Automation
```
Paperform submission → Pipedream webhook → n8n trigger
  → Process data (extract, validate, enrich)
  → Store in Firestore (tenant-scoped)
  → Notify user via preferred channel (chat, email, Telegram)
  → Kick off vertical workflow (onboarding, project setup, etc.)
```

### Form Creation Workflow
```
User intent: "I need an intake form for [purpose]"
  → ACHEEVY classifies as form creation task
  → Routes to Plug_Ang (Paperform MCP)
  → Chicken Hawk dispatches to Lil_Interface_Forge_Hawk
  → Lil_Hawk creates form via paperform_create_form tool
  → Form URL returned to ACHEEVY
  → ACHEEVY presents form link to user
```

## Conditional Logic & Calculations

Paperform supports advanced logic that ACHEEVY can leverage:
- **Conditional fields** — Show/hide fields based on previous answers
- **Calculated fields** — Auto-compute values (pricing, scores, eligibility)
- **Page logic** — Route to different form sections based on responses
- **Success page logic** — Custom post-submission behavior

When creating forms programmatically, use these to build intelligent intake flows
that adapt to user responses — reducing friction and improving data quality.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Form not found | Verify form ID/slug via `paperform_list_forms` |
| Submission empty | Check form field mapping — field keys are case-sensitive |
| Webhook not firing | Verify Pipedream webhook is connected to the form |
| API rate limited | Paperform limits vary by plan — throttle calls or batch requests |
| Auth error via Pipedream | Re-authenticate Paperform in Pipedream Dashboard |
| Form creation fails | Ensure required fields (title, at least one field) are provided |
