---
id: "integration-whatsapp"
name: "WhatsApp Integration"
type: "skill"
status: "active"
triggers: ["whatsapp", "whatsapp message", "whatsapp notify"]
description: "WhatsApp Business API integration rules, template messages, and user setup flow."
execution:
  target: "api"
  route: "/api/skills/whatsapp"
dependencies:
  env: ["WHATSAPP_API_TOKEN", "WHATSAPP_PHONE_NUMBER_ID"]
priority: "medium"
---

# WhatsApp Integration Skill

## Overview
ACHEEVY can send notifications and updates to users via WhatsApp Business API.

## User Setup Flow
1. User navigates to Circuit Box (user view) and selects "WhatsApp"
2. User provides their phone number
3. Platform sends an opt-in confirmation message
4. User confirms opt-in — connection is established
5. User can manage notification preferences in settings

## Message Types
| Type | Usage |
|------|-------|
| **Template message** | Pre-approved messages for notifications (required by WhatsApp policy) |
| **Session message** | Free-form within 24hr response window after user-initiated contact |

## Template Messages (Pre-Approved)
- `delivery_ready` — "Hi {{name}}, your {{deliverable_type}} is ready. View it at {{link}}"
- `approval_needed` — "Hi {{name}}, your approval is needed for {{description}}. Reply YES to approve."
- `status_update` — "Hi {{name}}, update on {{engagement_id}}: {{status}}"

## Security
- Phone numbers stored encrypted in tenant-scoped storage
- API credentials are platform-owned, never exposed
- Opt-in/opt-out tracked and enforced
- No internal details in any message content
