# A.I.M.S. MCP Capabilities — Master Reference

> **Version:** 1.0.0
> **Effective:** 2026-02-23
> **Owner:** Plug_Ang (MCP Bridge Master)

## Overview

A.I.M.S. connects to external services through **Model Context Protocol (MCP)** servers.
Each MCP connection is a capability that ACHEEVY and the chain of command can invoke
to interact with the real world — files, email, calendars, code, containers, forms.

**All MCP calls flow through Port Authority (UEF Gateway).** No agent directly touches
credentials. MCP servers handle auth, and Port Authority meters usage via LUC.

---

## Connected MCP Servers (10)

### Productivity & Collaboration

| # | MCP Server | Endpoint | Owner | Tool Doc |
|---|-----------|----------|-------|----------|
| 1 | **Google Drive** | Claude Code Connector | Scout_Ang | `google-drive-mcp.tool.md` |
| 2 | **GitHub** | Claude Code Connector | Patchsmith_Ang | `github-mcp.tool.md` |
| 3 | **Notion** | Claude Code Connector | Scribe_Ang | `notion-mcp.tool.md` |
| 4 | **Gmail** | Claude Code Connector | Plug_Ang | `gmail-mcp.tool.md` |
| 5 | **Google Calendar** | Claude Code Connector | OpsConsole_Ang | `google-calendar-mcp.tool.md` |

### Cloudflare Edge Platform

| # | MCP Server | Endpoint | Owner | Tool Doc |
|---|-----------|----------|-------|----------|
| 6 | **Browser Rendering** | `https://browser.mcp.cloudflare.com/mcp` | Scout_Ang | `cloudflare-browser-mcp.tool.md` |
| 7 | **CF Containers** | `https://containers.mcp.cloudflare.com/mcp` | Runner_Ang | `cloudflare-containers-mcp.tool.md` |
| 8 | **Workers** | Claude Code Connector | Buildsmith | `cloudflare-workers-mcp.tool.md` |
| 9 | **Workers Builds** | `https://builds.mcp.cloudflare.com/mcp` | Buildsmith | `cloudflare-builds-mcp.tool.md` |

### Integration Bridges

| # | MCP Server | Endpoint | Owner | Tool Doc |
|---|-----------|----------|-------|----------|
| 10 | **Pipedream** (Paperform) | `https://mcp.pipedream.net/v2` | Plug_Ang | `pipedream-mcp.tool.md` |

---

## Actor → MCP Permission Matrix

This matrix defines which actors can use which MCP tools and at what permission level.

### Legend
- **F** = Full (read + write + delete)
- **W** = Write (read + create + update)
- **R** = Read only
- **—** = No access

| Actor | Drive | GitHub | Notion | Gmail | Calendar | Browser | CF Containers | Workers | Builds | Paperform |
|-------|-------|--------|--------|-------|----------|---------|--------------|---------|--------|-----------|
| **ACHEEVY** | W | W | W | W* | W* | R | R | R | R | W |
| **Scout_Ang** | W | R | W | R | R | F | — | — | — | R |
| **Patchsmith_Ang** | R | F | R | — | — | — | — | — | W | — |
| **Buildsmith** | R | W | R | — | — | — | W | F | F | — |
| **Runner_Ang** | — | R | — | — | — | — | F | W | R | — |
| **Scribe_Ang** | W | — | F | — | — | — | — | — | — | — |
| **Chronicle_Ang** | R | — | W | R | — | — | — | — | — | — |
| **Plug_Ang** | R | — | R | F | W | — | — | W | — | F |
| **OpsConsole_Ang** | R | — | W | — | F | R | R | — | — | — |
| **Showrunner_Ang** | R | — | W | W* | W | R | — | — | — | — |
| **Gatekeeper_Ang** | — | R | — | — | — | R | R | R | R | — |
| **Bridge_Ang** | — | — | — | — | — | — | — | W | — | — |
| **Dockmaster_Ang** | — | — | — | — | — | — | W | — | — | — |
| **Lab_Ang** | — | — | — | — | — | W | — | — | — | — |
| **Chicken Hawk** | R | R | R | — | R | R | R | R | R | R |
| **Lil_Hawks** | R | R | R | — | — | R | — | — | — | R |

\* = Requires HITL approval for outbound actions (sending email, creating calendar events with external attendees)

---

## HITL Gates on MCP Actions

These actions **always** require human approval before execution:

| MCP | Action | Why |
|-----|--------|-----|
| Gmail | Send email | Outbound communication visible to others |
| Gmail | Forward email | Data leaving organization |
| Calendar | Create event with external attendees | Visible to others |
| GitHub | Merge PR | Production code change |
| GitHub | Force push | Destructive |
| Notion | Delete page | Irreversible data loss |
| Drive | Delete file | Irreversible data loss |
| Drive | Share externally | Data leaving organization |
| CF Containers | Delete container | Service disruption |
| Workers | Delete Worker | Service disruption |
| Paperform | Delete form | Data loss |

---

## MCP → Workflow Integration Patterns

### 1. Onboarding Pipeline
```
Paperform submission → n8n webhook
  → Notion: Create client project page
  → Google Drive: Create client folder
  → Gmail: Send welcome email (HITL)
  → Google Calendar: Book onboarding call (HITL)
  → ACHEEVY: Notify user in chat
```

### 2. Deployment Pipeline
```
GitHub PR merged → webhook
  → Workers Builds: Trigger build
  → Browser Rendering: Screenshot deployment
  → Notion: Update deploy history
  → Gmail: Send deploy notification (HITL)
```

### 3. Research Pipeline
```
User asks question → ACHEEVY
  → Notion: Search knowledge base
  → Google Drive: Search documents
  → Browser Rendering: Scrape web sources
  → Notion: Store new findings
  → ACHEEVY: Deliver answer with sources
```

### 4. Factory Controller (FDH) Pipeline
```
Event detected → Factory Controller
  → GitHub: Read changed files, create branch
  → Workers Builds: Build edge functions
  → CF Containers: Deploy if edge workload
  → Browser Rendering: Visual verification
  → GitHub: Open PR with evidence
  → Notion: Log FDH run
  → Gmail: Notify stakeholder (HITL)
```

---

## Adding a New MCP Connection

1. Connect the MCP server in Claude Code Connectors (or add endpoint to `.mcp.json`)
2. Create `aims-skills/tools/{name}-mcp.tool.md` following the template pattern
3. Add entry to `aims-skills/tools/index.ts` TOOL_REGISTRY
4. Add to capability-packs.json Pack G (MCP Bridge Integrations)
5. Assign owner (Boomer_Ang) and secondary owners
6. Update this file (MCP_CAPABILITIES.md)
7. Update ACHEEVY_BRAIN.md Section 12 (MCP Capabilities)
8. Test via Port Authority health check
