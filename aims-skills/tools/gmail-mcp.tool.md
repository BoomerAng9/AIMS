---
id: "gmail-mcp"
name: "Gmail MCP"
type: "tool"
category: "email"
provider: "Google"
description: "Gmail email management via MCP — search, read, compose, reply, label. Primary email communication channel for AIMS client interactions."
env_vars:
  - "GMAIL_MCP_ENABLED"
mcp_endpoint: "Claude Code Connector (Gmail)"
owner: "Plug_Ang"
secondary_owners: ["Showrunner_Ang"]
---

# Gmail MCP — A.I.M.S. Email Communication

## Overview

Gmail MCP gives ACHEEVY and the chain of command the ability to search, read,
compose, and manage email. This is the primary outbound communication channel
for client notifications, deliverable sharing, and follow-ups.

**Owner:** Plug_Ang (Operations & Integration)
**Secondary Owner:** Showrunner_Ang (Content & Outreach)
**MCP Transport:** Claude Code Connector (OAuth-authenticated)

## Capabilities

| Capability | MCP Tool | Description |
|-----------|----------|-------------|
| **Search email** | `gmail_search` | Search inbox with Gmail query operators |
| **Read email** | `gmail_get_message` | Read full email content and attachments |
| **Send email** | `gmail_send_email` | Compose and send new email |
| **Reply** | `gmail_reply` | Reply to an existing thread |
| **Draft** | `gmail_create_draft` | Create email draft for review |
| **List labels** | `gmail_list_labels` | Get all labels/folders |
| **Label email** | `gmail_modify_labels` | Add/remove labels from messages |
| **List threads** | `gmail_list_threads` | List email threads with filters |

## How Each Actor Uses Gmail

### ACHEEVY (Orchestrator)
- Send deliverable notifications to clients
- Draft follow-up emails after task completion
- Search inbox for client context during conversations
- **Can do:** Search, read, draft emails
- **CRITICAL:** Sending email ALWAYS requires HITL approval (the user must confirm before send)
- **Cannot do:** Delete emails, modify account settings

### Boomer_Angs (Managers)
| Ang | Gmail Usage |
|-----|-------------|
| **Plug_Ang** | Manage email integration health, configure templates |
| **Showrunner_Ang** | Draft marketing/outreach emails, content distribution |
| **Scout_Ang** | Search inbox for research context, client history |
| **Chronicle_Ang** | Read email threads for timeline reconstruction |

### Chicken Hawk (Coordinator)
- Read emails referenced in task assignments
- Cannot send or draft emails (Boomer_Ang-only)

### Lil_Hawks (Workers)
- Read specific emails linked in their task packet
- Cannot search, send, draft, or label emails

## Email Templates (Convention)

### Deliverable Notification
```
Subject: Your {deliverable_type} is ready — A.I.M.S.
Body:
  Hi {client_name},

  Your {deliverable_type} has been completed and is ready for review.

  {deliverable_link}

  If you have any questions, just reply to this email or chat with me at plugmein.cloud.

  — ACHEEVY, A.I.M.S.
```

### Onboarding Welcome
```
Subject: Welcome to A.I.M.S. — Let's get started
Body:
  Hi {client_name},

  Welcome to A.I.M.S.! I'm ACHEEVY, your AI service manager.

  To get started, please complete your intake form:
  {paperform_link}

  Once submitted, I'll have your environment ready within minutes.

  — ACHEEVY, A.I.M.S.
```

### Receipt Delivery
```
Subject: Task Complete — Receipt #{receipt_id}
Body:
  Hi {client_name},

  Task "{task_summary}" has been completed.

  Receipt: #{receipt_id}
  Evidence: {evidence_links}
  LUC Cost: {luc_amount}

  — ACHEEVY, A.I.M.S.
```

## Security Rules (CRITICAL)

- **ALL outbound emails require HITL approval** — ACHEEVY drafts, human confirms
- OAuth tokens managed by Claude Code Connector — never exposed to agents
- Email content is never stored in agent memory beyond the active session
- No bulk email operations (max 10 emails per session without explicit approval)
- No email forwarding to external addresses without HITL approval
- Attachment sending requires explicit user confirmation
- All email operations are audit-logged with recipient, subject, and timestamp
