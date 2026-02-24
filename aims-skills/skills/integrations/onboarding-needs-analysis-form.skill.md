---
id: "onboarding-needs-analysis-form"
name: "Onboarding Needs Analysis Form"
type: "skill"
status: "active"
triggers: ["onboarding form", "needs analysis", "client intake", "new user form", "sign up form", "get started form"]
description: "Complete Paperform specification for the A.I.M.S. onboarding needs analysis — the first form every new user completes to scope their service requirements."
execution:
  target: "mcp"
  bridge: "pipedream"
  route: "https://mcp.pipedream.net/v2"
  tool: "paperform_create_form"
dependencies:
  env: ["PIPEDREAM_API_KEY", "PIPEDREAM_MCP_URL"]
  tools: ["pipedream-mcp", "paperform"]
  mcps: ["gmail-mcp", "notion-mcp", "google-drive-mcp", "google-calendar-mcp"]
priority: "critical"
---

# Onboarding Needs Analysis Form — A.I.M.S.

## Purpose

This is the **first form every new A.I.M.S. user completes**. It captures who they are,
what they need, and how ACHEEVY should serve them. The submission triggers the full
onboarding pipeline: Notion project page, Drive client folder, welcome email, and
optional consultation booking.

**When to use:** ACHEEVY presents this form link during first interaction or when
a user says "get started", "sign up", "I need help with...", or any onboarding intent.

**Form builder:** Paperform (via Pipedream MCP)
**Slug:** `aims-onboarding-needs-analysis`

---

## Form Specification

### Form Settings
```json
{
  "title": "Let's Get Started — A.I.M.S.",
  "slug": "aims-onboarding-needs-analysis",
  "description": "Tell us about yourself and what you need. ACHEEVY will have your environment ready in minutes.",
  "theme": {
    "background": "#F8FAFC",
    "accent": "#F59E0B",
    "font": "Inter",
    "button_color": "#F59E0B",
    "button_text_color": "#1E293B"
  },
  "settings": {
    "show_progress_bar": true,
    "allow_partial_submissions": true,
    "redirect_on_complete": "https://plugmein.cloud/chat",
    "success_message": "Welcome to A.I.M.S.! ACHEEVY is reviewing your submission now. Head to chat to get started."
  }
}
```

---

### Page 1: About You

| Field | Type | Key | Required | Options/Validation |
|-------|------|-----|----------|--------------------|
| **Full Name** | Text (short) | `full_name` | Yes | Min 2 chars |
| **Email** | Email | `email` | Yes | Valid email format |
| **Company / Organization** | Text (short) | `company` | No | — |
| **Your Role** | Select | `role` | Yes | Founder / CEO, CTO / Technical Lead, Marketing / Growth, Operations, Product Manager, Developer, Freelancer / Consultant, Other |
| **Industry** | Select | `industry` | No | Technology, E-commerce, Healthcare, Finance, Education, Real Estate, Media / Entertainment, Professional Services, Non-profit, Other |
| **Team Size** | Select | `team_size` | No | Just me, 2-5, 6-20, 21-50, 51-200, 200+ |

---

### Page 2: What Brings You Here?

| Field | Type | Key | Required | Options |
|-------|------|-----|----------|---------|
| **What do you need help with?** | Multi-select | `needs` | Yes | Deploy an AI tool or agent, Build a custom application, Automate repetitive tasks, Manage infrastructure / containers, Research & analysis, Content creation & publishing, Client onboarding & intake, Financial tracking & billing, Other |
| **Primary Goal** | Text (long) | `primary_goal` | Yes | Placeholder: "In one sentence, what would success look like for you?" |
| **What's your biggest pain point right now?** | Text (long) | `pain_point` | No | Placeholder: "What's taking too much time, costing too much, or just not working?" |

**Conditional Logic:**
- If `needs` includes "Deploy an AI tool or agent" → show Page 3A (Tool Deployment)
- If `needs` includes "Build a custom application" → show Page 3B (Custom Build)
- If `needs` includes "Automate repetitive tasks" → show Page 3C (Automation)
- If none of the above → skip to Page 4 (Timeline & Budget)

---

### Page 3A: Tool Deployment (Conditional — shown if "Deploy an AI tool or agent" selected)

| Field | Type | Key | Required | Options |
|-------|------|-----|----------|---------|
| **What kind of tool are you looking for?** | Multi-select | `tool_type` | Yes | AI chatbot / assistant, Research agent, Code generation tool, Data analysis platform, Content creation tool, Monitoring / observability, Communication bot (Telegram, Discord, Slack), Custom agent, Not sure — help me decide |
| **Hosting preference** | Select | `hosting_pref` | Yes | Managed by A.I.M.S. (recommended), Self-hosted (I'll run it myself), Hybrid (managed + export option) |
| **Expected usage scale** | Select | `usage_scale` | No | Light (testing / personal), Medium (small team, daily use), Heavy (production, high traffic), Enterprise (multi-tenant, SLA required) |

---

### Page 3B: Custom Build (Conditional — shown if "Build a custom application" selected)

| Field | Type | Key | Required | Options |
|-------|------|-----|----------|---------|
| **What are you building?** | Text (long) | `build_description` | Yes | Placeholder: "Describe the app, tool, or platform you want to build." |
| **Current tech stack** | Text (short) | `current_stack` | No | Placeholder: "e.g., React, Node.js, PostgreSQL, AWS" |
| **Do you have existing code?** | Select | `has_code` | Yes | Yes — I have a repo, Partially — some prototype/wireframes, No — starting from scratch |
| **Integration requirements** | Multi-select | `integrations` | No | Stripe / payments, Email (Gmail, SendGrid), Slack / Discord, CRM (Salesforce, HubSpot), Database (Postgres, MongoDB, Firebase), AI / LLM APIs, Calendar, Cloud storage, None / Not sure |

---

### Page 3C: Automation (Conditional — shown if "Automate repetitive tasks" selected)

| Field | Type | Key | Required | Options |
|-------|------|-----|----------|---------|
| **What tasks do you want to automate?** | Text (long) | `automation_tasks` | Yes | Placeholder: "Describe the manual process you want automated." |
| **How often does this task run?** | Select | `task_frequency` | Yes | Multiple times per day, Daily, Weekly, Monthly, On-demand / event-triggered |
| **Current tools involved** | Text (short) | `current_tools` | No | Placeholder: "e.g., Google Sheets, email, Slack, manual copy-paste" |
| **Urgency** | Select | `automation_urgency` | No | Critical — costing money/time daily, Important — would save significant effort, Nice-to-have — efficiency improvement, Exploring — just curious what's possible |

---

### Page 4: Timeline & Budget

| Field | Type | Key | Required | Options |
|-------|------|-----|----------|---------|
| **Timeline** | Select | `timeline` | Yes | ASAP — need it this week, 1-2 weeks, 1 month, 2-3 months, No rush — exploring |
| **Monthly budget range** | Select | `budget` | No | Free tier / testing ($0), Starter ($25-100/mo), Growth ($100-500/mo), Pro ($500-2,000/mo), Enterprise ($2,000+/mo), Not sure — help me estimate |
| **Would you like a free consultation?** | Select | `wants_consultation` | No | Yes — book a 15-min call, Maybe later, No thanks — just get started |

**Conditional Logic:**
- If `wants_consultation` = "Yes" → show Page 5 (Booking)
- Otherwise → submit

---

### Page 5: Book a Consultation (Conditional — shown if consultation requested)

| Field | Type | Key | Required | Options |
|-------|------|-----|----------|---------|
| **Preferred date/time** | Date + Time | `consultation_datetime` | Yes | Next 14 days, business hours |
| **Preferred contact method** | Select | `contact_method` | Yes | Video call (Zoom/Meet), Phone call, Chat on A.I.M.S. |
| **Anything specific you want to discuss?** | Text (long) | `consultation_notes` | No | — |

---

### Calculated Fields (Hidden)

| Field | Key | Logic |
|-------|-----|-------|
| **Service Tier** | `calc_tier` | Based on `budget` + `usage_scale` + `team_size` → Free / Starter / Growth / Pro / Enterprise |
| **Recommended Path** | `calc_path` | Based on `needs` → Deploy It (tool deployment) / Guide Me (custom build) / Automate It (automation) |
| **Priority Score** | `calc_priority` | Based on `timeline` + `automation_urgency` + `budget` → 1-10 scale |
| **LUC Estimate** | `calc_luc_estimate` | Based on `calc_tier` + `usage_scale` → monthly LUC token estimate |

---

## Submission Processing Pipeline

```
Form submitted → Paperform webhook fires → Pipedream receives
  │
  ├─→ 1. VALIDATE
  │     Check required fields, email format, sanitize inputs
  │
  ├─→ 2. STORE (Firestore)
  │     Collection: users/{uid}/intake
  │     Document: submission data + calculated fields + timestamp
  │
  ├─→ 3. NOTION (via Notion MCP)
  │     Create project page in Projects/ database
  │     Set status: "Intake"
  │     Link to submission data
  │
  ├─→ 4. GOOGLE DRIVE (via Drive MCP)
  │     Create folder: Clients/{company or name}/
  │     Subfolders: Intake/, Deliverables/, Receipts/
  │
  ├─→ 5. GMAIL (via Gmail MCP — HITL approved template)
  │     Send welcome email with:
  │       - Confirmation of submission
  │       - What happens next
  │       - Link to chat: plugmein.cloud/chat
  │
  ├─→ 6. GOOGLE CALENDAR (via Calendar MCP — if consultation requested)
  │     Check availability → create event
  │     Send calendar invite to user email
  │
  ├─→ 7. ACHEEVY NOTIFICATION
  │     Post in user's chat session:
  │       "Welcome! I've reviewed your intake form. Based on your needs,
  │        I recommend [calc_path]. Let's get started."
  │
  └─→ 8. AUDIT
        Log intake event to audit trail
        Evidence: form submission ID, calculated fields, actions taken
```

---

## Actor Responsibilities

| Actor | Role in Onboarding |
|-------|-------------------|
| **ACHEEVY** | Presents form link, processes submission notification, delivers welcome message in chat |
| **Plug_Ang** | Owns Paperform connection, manages form health, processes webhook |
| **Scout_Ang** | Stores submission in Drive, creates project folder |
| **Scribe_Ang** | Creates Notion project page from submission data |
| **OpsConsole_Ang** | Books consultation on Calendar if requested |
| **Showrunner_Ang** | Drafts welcome email (from approved template) |
| **Chicken Hawk** | Dispatches folder creation, page creation, email sending to Lil_Hawks |

---

## How ACHEEVY Presents the Form

### In Chat (first interaction)
```
ACHEEVY: "Welcome to A.I.M.S.! I'm ACHEEVY, your AI service manager.

To get you set up, I'll need a few details about what you're looking for.
It takes about 2 minutes:

[Complete Your Intake Form →](https://paperform.co/fill/aims-onboarding-needs-analysis)

Once you submit, I'll have your personalized recommendation ready in minutes."
```

### After Submission (in chat)
```
ACHEEVY: "Got it! Based on your intake, here's what I recommend:

**Path:** {calc_path}
**Tier:** {calc_tier}
**Estimated LUC:** {calc_luc_estimate}/month

{If Deploy It: "I found several tools in our catalog that match your needs. Want me to show you the options?"}
{If Guide Me: "Let's scope your custom build. I'll walk you through the details."}
{If Automate It: "I can see some quick automation wins. Let me show you what's possible."}

{If consultation booked: "Your consultation is booked for {date}. You'll get a calendar invite shortly."}"
```

---

## Partial Submission Handling

If a user starts but doesn't finish the form:

1. Paperform fires `partial_submission` event after 24 hours
2. ACHEEVY checks if user has an active chat session
3. If yes: gentle nudge in chat — "I noticed you started your intake form but didn't finish. Want to pick up where you left off?"
4. If no: Gmail sends follow-up email (HITL approved template)
5. If no response after 7 days: mark lead as "abandoned" in Notion
