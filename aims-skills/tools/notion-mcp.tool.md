---
id: "notion-mcp"
name: "Notion MCP"
type: "tool"
category: "workflow"
provider: "Notion"
description: "Notion workspace management via MCP — pages, databases, blocks, comments. Knowledge base, project tracking, and documentation hub for AIMS."
env_vars:
  - "NOTION_MCP_ENABLED"
mcp_endpoint: "Claude Code Connector (Notion)"
owner: "Scribe_Ang"
secondary_owners: ["Chronicle_Ang", "Scout_Ang"]
---

# Notion MCP — A.I.M.S. Knowledge Base & Project Tracking

## Overview

Notion MCP gives ACHEEVY and the chain of command access to the A.I.M.S. Notion
workspace for knowledge management, project tracking, client wikis, and structured
documentation. This is the primary knowledge base and structured data layer.

**Owner:** Scribe_Ang (Documentation & Publishing)
**Secondary Owners:** Chronicle_Ang (Timelines), Scout_Ang (Research)
**MCP Transport:** Claude Code Connector (OAuth-authenticated)

## Capabilities

### Pages
| Capability | MCP Tool | Description |
|-----------|----------|-------------|
| **Search pages** | `notion_search` | Full-text search across workspace |
| **Get page** | `notion_get_page` | Read page properties and metadata |
| **Create page** | `notion_create_page` | Create new page in a parent (page or database) |
| **Update page** | `notion_update_page` | Update page properties |
| **Get blocks** | `notion_get_block_children` | Read page content (blocks) |
| **Append blocks** | `notion_append_block_children` | Add content to a page |

### Databases
| Capability | MCP Tool | Description |
|-----------|----------|-------------|
| **Query database** | `notion_query_database` | Filter and sort database entries |
| **Create database** | `notion_create_database` | Create structured database with properties |
| **Create entry** | `notion_create_page` | Add entry to a database |
| **Update entry** | `notion_update_page` | Modify database entry properties |

### Comments
| Capability | MCP Tool | Description |
|-----------|----------|-------------|
| **List comments** | `notion_list_comments` | Read discussion threads |
| **Create comment** | `notion_create_comment` | Add comments to pages |

## How Each Actor Uses Notion

### ACHEEVY (Orchestrator)
- Search knowledge base to answer user questions from existing docs
- Create project pages when new engagements begin
- Update status in project tracking databases
- **Can do:** Search, read, create pages, update status
- **Cannot do:** Delete pages or databases without HITL approval

### Boomer_Angs (Managers)
| Ang | Notion Usage |
|-----|-------------|
| **Scribe_Ang** | Create and maintain documentation, wikis, runbooks, SOPs |
| **Chronicle_Ang** | Build structured timelines, link source materials |
| **Scout_Ang** | Store research findings, build knowledge graphs |
| **OpsConsole_Ang** | Update ops dashboards, incident logs |
| **Showrunner_Ang** | Manage content calendars, editorial workflows |

### Chicken Hawk (Coordinator)
- Read task specs from Notion databases
- Update task status as work progresses
- Attach Notion page links as evidence

### Lil_Hawks (Workers)
- Read assigned task details from Notion
- Append completion notes to task pages
- Cannot create or delete pages

## Notion Workspace Structure (Convention)

```
A.I.M.S. Workspace/
├── Projects/              ← Database: all active client projects
│   ├── Status (select)
│   ├── Owner (person)
│   ├── LUC Budget (number)
│   └── Timeline (date range)
├── Knowledge Base/
│   ├── Platform Docs/     ← Internal SOPs, runbooks
│   ├── Plug Library/      ← Plug documentation per catalog item
│   └── Research/          ← Scout_Ang findings
├── Operations/
│   ├── Incident Log/      ← Database: incidents and resolutions
│   ├── Deploy History/    ← Database: deployment records
│   └── Health Reports/    ← Weekly health summaries
├── Clients/
│   └── {client_name}/
│       ├── Intake Notes/
│       ├── Deliverables/
│       └── Receipts/
└── Templates/
    ├── Project Kickoff/
    ├── Incident Report/
    └── Weekly Summary/
```

## Integration Patterns

### Knowledge Retrieval (RAG-like)
```
User asks question → ACHEEVY searches Notion first
  → If found: use page content as context for response
  → If not found: delegate to Scout_Ang for web research
  → Scout_Ang stores findings back in Notion for next time
```

### Project Lifecycle
```
New client → ACHEEVY creates project entry in Projects database
  → Sets status: "Intake"
  → Links to Paperform submission (if applicable)
  → Updates status through: Intake → Active → Delivered → Closed
```

### Receipt Storage
```
Task complete → BAMARAM receipt sealed
  → Create Notion page in Clients/{name}/Receipts/
  → Attach evidence blocks (screenshots, logs, links)
  → Link to Drive deliverable files
```

## Security Rules

- OAuth tokens managed by Claude Code Connector — never exposed to agents
- All Notion operations flow through Port Authority
- Page deletion requires HITL approval
- Workspace-level settings changes are FORBIDDEN
- Database schema changes require Scribe_Ang approval
- All operations are audit-logged
