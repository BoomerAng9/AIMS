---
id: "google-drive-mcp"
name: "Google Drive MCP"
type: "tool"
category: "cloud"
provider: "Google"
description: "Google Drive file management via MCP — search, read, create, share files and folders. Primary document storage and collaboration layer for AIMS."
env_vars:
  - "GOOGLE_DRIVE_MCP_ENABLED"
mcp_endpoint: "Claude Code Connector (Google Drive)"
owner: "Scout_Ang"
secondary_owners: ["Chronicle_Ang", "Scribe_Ang"]
---

# Google Drive MCP — A.I.M.S. Document & File Management

## Overview

Google Drive MCP gives ACHEEVY and the chain of command read/write access to the
organization's Google Drive. This is the primary document storage, collaboration,
and file retrieval layer for A.I.M.S. operations.

**Owner:** Scout_Ang (Research & Intelligence)
**Secondary Owners:** Chronicle_Ang (Timeline artifacts), Scribe_Ang (Documentation)
**MCP Transport:** Claude Code Connector (OAuth-authenticated)

## Capabilities

| Capability | MCP Tool | Description |
|-----------|----------|-------------|
| **Search files** | `google_drive_search` | Full-text search across Drive with query operators |
| **Read file** | `google_drive_read` | Read file content (docs, sheets, text, PDF) |
| **List files** | `google_drive_list` | List files in a folder or root |
| **Create file** | `google_drive_create` | Create new docs, sheets, or upload files |
| **Update file** | `google_drive_update` | Modify existing file content |
| **Share file** | `google_drive_share` | Set permissions (view, comment, edit) |
| **Create folder** | `google_drive_create_folder` | Organize files into folders |
| **Get metadata** | `google_drive_get_metadata` | File size, owner, last modified, sharing state |

## How Each Actor Uses Google Drive

### ACHEEVY (Orchestrator)
- Search Drive for client documents mentioned in conversation
- Share deliverable links with users after task completion
- Store sealed receipts and evidence artifacts
- **Can do:** Search, read, create, share
- **Cannot do:** Delete files without HITL approval

### Boomer_Angs (Managers)
| Ang | Drive Usage |
|-----|------------|
| **Scout_Ang** | Search for research materials, read reference docs, store research reports |
| **Chronicle_Ang** | Read timeline source materials, store timeline artifacts, search historical docs |
| **Scribe_Ang** | Create documentation, update specs, manage doc templates |
| **Buildsmith** | Read project specs, store build artifacts, share deployment docs |
| **Showrunner_Ang** | Read presentation assets, store slide decks |

### Chicken Hawk (Coordinator)
- Attach Drive links as evidence in job packets
- Read task specs from shared Drive folders
- Cannot create or delete files (Boomer_Ang-only)

### Lil_Hawks (Workers)
- Read files assigned to their task (bounded access)
- Upload completed artifacts to designated folders
- Cannot share or delete files

## Drive Folder Structure (Convention)

```
A.I.M.S. Drive/
├── Clients/
│   └── {client_id}/
│       ├── Intake/          ← onboarding docs, form exports
│       ├── Deliverables/    ← completed work products
│       └── Receipts/        ← sealed BAMARAM receipts
├── Research/
│   └── {topic}/             ← Scout_Ang research outputs
├── Templates/
│   ├── Proposals/
│   ├── SOWs/
│   └── Reports/
├── Operations/
│   ├── Runbooks/
│   └── Audits/
└── Exports/
    └── {plug_name}/         ← Plug Export documentation
```

## Security Rules

- All Drive access flows through Port Authority (UEF Gateway)
- OAuth tokens managed by Claude Code Connector — never exposed to agents
- Tenant isolation: agents can only access Drive folders scoped to the active project
- File deletion requires HITL approval (Guide Me lane)
- Sharing outside organization requires HITL approval
- All file operations are audit-logged

## Integration Patterns

### Evidence Storage
```
Task complete → Lil_Hawk produces artifact
  → Upload to Clients/{client_id}/Deliverables/
  → Attach Drive link to receipt
  → ACHEEVY shares link with user
```

### Research Pipeline
```
User asks question → Scout_Ang searches Drive first
  → If found: use existing docs as context
  → If not found: web search → create new doc → store in Research/
```

### Template System
```
User needs proposal → ACHEEVY checks Templates/Proposals/
  → Copy template → populate with project data
  → Share with user for review
```
