---
id: "sendgrid"
name: "SendGrid"
type: "tool"
category: "email"
provider: "Twilio SendGrid"
description: "Transactional email service — fallback email provider for AIMS."
env_vars:
  - "SENDGRID_API_KEY"
  - "SENDGRID_FROM_EMAIL"
docs_url: "https://docs.sendgrid.com/api-reference"
aims_files:
  - "backend/uef-gateway/src/integrations/index.ts"
---

# SendGrid — Email Tool Reference

## Overview

SendGrid is the fallback transactional email provider for AIMS when Resend is unavailable. It offers high-volume email delivery through Twilio's infrastructure.

## API Key Setup

| Variable | Required | Where to Get |
|----------|----------|--------------|
| `SENDGRID_API_KEY` | Optional | https://app.sendgrid.com/settings/api_keys |
| `SENDGRID_FROM_EMAIL` | Optional | Verified sender in SendGrid |

**Apply in:** `infra/.env.production`

## API Reference

### Base URL
```
https://api.sendgrid.com/v3
```

### Auth Header
```
Authorization: Bearer $SENDGRID_API_KEY
```

### Send Email
```http
POST /mail/send
Content-Type: application/json

{
  "personalizations": [{ "to": [{ "email": "user@example.com" }] }],
  "from": { "email": "noreply@plugmein.cloud" },
  "subject": "Your Report",
  "content": [{ "type": "text/html", "value": "<p>Report ready.</p>" }]
}
```

## Email Provider Priority
```
1. Resend (primary)
2. SendGrid (fallback)
```

## Pricing
- Free: 100 emails/day
- Essentials ($19.95/mo): 50,000 emails/month

## Troubleshooting

| Issue | Fix |
|-------|-----|
| 401 | Check `SENDGRID_API_KEY` |
| 403 Forbidden | Verify sender email in SendGrid dashboard |
