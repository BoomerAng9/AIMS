---
id: "google-calendar-mcp"
name: "Google Calendar MCP"
type: "tool"
category: "workflow"
provider: "Google"
description: "Google Calendar management via MCP — create, read, update events, check availability. Scheduling layer for AIMS consultations, demos, and operational tasks."
env_vars:
  - "GOOGLE_CALENDAR_MCP_ENABLED"
mcp_endpoint: "Claude Code Connector (Google Calendar)"
owner: "OpsConsole_Ang"
secondary_owners: ["Plug_Ang"]
---

# Google Calendar MCP — A.I.M.S. Scheduling & Time Management

## Overview

Google Calendar MCP gives ACHEEVY and the chain of command the ability to manage
scheduling — create events, check availability, set reminders, and coordinate
meetings. This powers consultation booking, demo scheduling, and operational
task coordination.

**Owner:** OpsConsole_Ang (Operations Console)
**Secondary Owner:** Plug_Ang (Client-facing scheduling)
**MCP Transport:** Claude Code Connector (OAuth-authenticated)

## Capabilities

| Capability | MCP Tool | Description |
|-----------|----------|-------------|
| **List events** | `google_calendar_list_events` | Get events in a time range |
| **Create event** | `google_calendar_create_event` | Schedule a new event |
| **Update event** | `google_calendar_update_event` | Modify event details |
| **Delete event** | `google_calendar_delete_event` | Cancel an event |
| **Get event** | `google_calendar_get_event` | Read event details |
| **Check availability** | `google_calendar_freebusy` | Check free/busy for scheduling |

## How Each Actor Uses Google Calendar

### ACHEEVY (Orchestrator)
- Check owner availability when user requests a meeting
- Create consultation events after Paperform booking submission
- Schedule deployment windows based on availability
- Send calendar invites as part of onboarding flow
- **Can do:** Read events, check availability, create drafts
- **CRITICAL:** Creating events with external attendees requires HITL approval

### Boomer_Angs (Managers)
| Ang | Calendar Usage |
|-----|---------------|
| **OpsConsole_Ang** | Schedule maintenance windows, ops reviews, health check cycles |
| **Plug_Ang** | Create client demo bookings, consultation slots |
| **Showrunner_Ang** | Schedule content publishing, campaign launches |
| **Scout_Ang** | Block research deep-dive time, schedule report deliveries |

### Chicken Hawk (Coordinator)
- Read scheduled deadlines for task prioritization
- Cannot create or modify events

### Lil_Hawks (Workers)
- Read event details linked to their task assignments
- Cannot interact with calendar directly

## Calendar Structure (Convention)

| Calendar | Purpose | Owner |
|----------|---------|-------|
| **A.I.M.S. Operations** | Maintenance windows, deployments, health checks | OpsConsole_Ang |
| **Client Bookings** | Consultations, demos, onboarding calls | Plug_Ang |
| **Content Calendar** | Publishing schedule, campaign dates | Showrunner_Ang |
| **Deadlines** | Project milestones, delivery dates | ACHEEVY |

## Integration with Paperform

```
Paperform booking submission → n8n webhook
  → Extract date/time and contact info
  → google_calendar_freebusy → check availability
  → google_calendar_create_event → book the slot
  → gmail_send_email → send confirmation
  → ACHEEVY notifies user in chat
```

## Security Rules

- OAuth tokens managed by Claude Code Connector — never exposed to agents
- External attendee invites require HITL approval
- Event deletion requires HITL approval
- Calendar sharing settings changes are FORBIDDEN
- All-day blocking events require Boomer_Ang authorization
- All calendar operations are audit-logged
