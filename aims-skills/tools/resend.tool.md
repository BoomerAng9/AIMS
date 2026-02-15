---
id: "resend"
name: "Resend"
type: "tool"
category: "email"
provider: "Resend"
description: "Modern transactional email API with React email templates — primary email provider for AIMS."
env_vars:
  - "RESEND_API_KEY"
docs_url: "https://resend.com/docs"
aims_files:
  - "backend/uef-gateway/src/integrations/index.ts"
---

# Resend — Email Tool Reference

## Overview

Resend is the primary transactional email provider for AIMS. It handles user notifications, onboarding emails, receipts, and outreach through a simple REST API with React email template support.

## API Key Setup

| Variable | Required | Where to Get |
|----------|----------|--------------|
| `RESEND_API_KEY` | Yes | https://resend.com/api-keys |

**Apply in:** `infra/.env.production`

## API Reference

### Base URL
```
https://api.resend.com
```

### Auth Header
```
Authorization: Bearer $RESEND_API_KEY
```

### Send Email
```http
POST /emails
Content-Type: application/json

{
  "from": "ACHEEVY <noreply@plugmein.cloud>",
  "to": ["user@example.com"],
  "subject": "Your AI Managed Solutions Report",
  "html": "<h1>Report Ready</h1><p>Your research is complete.</p>"
}
```

**Response:**
```json
{
  "id": "email_id_xxx"
}
```

### Get Email Status
```http
GET /emails/{email_id}
```

## Pricing
- Free: 100 emails/day, 3000/month
- Pro ($20/mo): 50,000 emails/month
- Custom domain verification required for production

## Domain Setup
1. Add domain at https://resend.com/domains
2. Add DNS records (SPF, DKIM, DMARC)
3. Verify domain
4. Use verified domain as sender: `noreply@plugmein.cloud`

## Troubleshooting

| Issue | Fix |
|-------|-----|
| 401 Unauthorized | Check `RESEND_API_KEY` |
| Domain not verified | Add DNS records at Resend dashboard |
| Email not delivered | Check spam folder; verify domain SPF/DKIM |
