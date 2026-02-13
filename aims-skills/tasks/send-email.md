---
id: "send-email"
name: "Send Email"
type: "task"
status: "active"
triggers:
  - "email"
  - "send email"
  - "notify"
  - "send notification"
  - "email user"
description: "Send transactional email via Resend (primary) or SendGrid (fallback)."
execution:
  target: "api"
  route: "/api/email/send"
  command: ""
dependencies:
  env:
    - "RESEND_API_KEY"
  packages:
    - "resend"
  files:
    - "aims-skills/tools/resend.tool.md"
    - "aims-skills/tools/sendgrid.tool.md"
priority: "medium"
---

# Send Email Task

## Endpoint
**POST** `/api/email/send`

```json
{
  "to": "user@example.com",
  "subject": "Your Research Report",
  "html": "<h1>Report Ready</h1><p>Details inside.</p>",
  "from": "ACHEEVY <noreply@plugmein.cloud>"
}
```

**Response:**
```json
{
  "id": "email_xxx",
  "provider": "resend",
  "success": true
}
```

## Provider Priority
```
1. Resend (RESEND_API_KEY)
2. SendGrid (SENDGRID_API_KEY)
```

## API Keys
- Primary: `RESEND_API_KEY` — https://resend.com/api-keys
- Fallback: `SENDGRID_API_KEY` — https://app.sendgrid.com/settings/api_keys
