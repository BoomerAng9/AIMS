---
id: "cloudflare-browser-mcp"
name: "Cloudflare Browser Rendering MCP"
type: "tool"
category: "web"
provider: "Cloudflare"
description: "Headless browser automation via Cloudflare Workers Browser Rendering — screenshots, PDF generation, DOM interaction, scraping. Remote browser execution at edge."
env_vars:
  - "CF_BROWSER_MCP_ENABLED"
mcp_endpoint: "https://browser.mcp.cloudflare.com/mcp"
owner: "Scout_Ang"
secondary_owners: ["Gatekeeper_Ang", "Lab_Ang"]
---

# Cloudflare Browser Rendering MCP — A.I.M.S. Headless Browser

## Overview

Cloudflare Browser Rendering MCP provides headless Chromium browser automation
running on Cloudflare's edge network. ACHEEVY and the chain of command use this
for screenshots, PDF generation, web scraping, visual verification, and DOM interaction.

**Owner:** Scout_Ang (Research & Intelligence)
**Secondary Owners:** Gatekeeper_Ang (Security scanning), Lab_Ang (Testing)
**MCP Endpoint:** `https://browser.mcp.cloudflare.com/mcp`

## Capabilities

| Capability | MCP Tool | Description |
|-----------|----------|-------------|
| **Screenshot** | `browser_screenshot` | Capture full page or element screenshot |
| **Navigate** | `browser_navigate` | Open a URL in headless browser |
| **Get content** | `browser_get_content` | Extract page HTML or text content |
| **Click element** | `browser_click` | Click on a DOM element by selector |
| **Type text** | `browser_type` | Type into input fields |
| **PDF export** | `browser_pdf` | Generate PDF from page content |
| **Evaluate JS** | `browser_evaluate` | Run JavaScript in page context |
| **Wait for** | `browser_wait_for` | Wait for selector, navigation, or timeout |

## How Each Actor Uses Browser Rendering

### ACHEEVY (Orchestrator)
- Capture screenshots of deployed Plug instances for evidence
- Generate PDF reports from HTML dashboards
- Visual verification of deployment health
- **Can do:** Navigate, screenshot, get content, generate PDFs

### Boomer_Angs (Managers)
| Ang | Browser Usage |
|-----|-------------|
| **Scout_Ang** | Web scraping for research, capture reference screenshots, extract data from web pages |
| **Gatekeeper_Ang** | Visual security scans, verify SSL indicators, check for UI injection |
| **Lab_Ang** | Automated UI testing, visual regression detection |
| **Showrunner_Ang** | Capture competitor screenshots, generate social media preview images |
| **OpsConsole_Ang** | Screenshot health dashboards for reporting |

### Chicken Hawk (Coordinator)
- Capture deployment screenshots as evidence for job packets
- Visual verification of completed UI tasks
- Cannot run arbitrary JavaScript (Boomer_Ang-only)

### Lil_Hawks (Workers)
- Capture screenshots of their completed work
- Extract content from specific URLs assigned in their task
- Cannot navigate to arbitrary URLs or run JavaScript

## Use Cases for A.I.M.S.

### Deployment Verification
```
Plug deployed → ACHEEVY navigates to instance URL
  → browser_screenshot → capture landing page
  → Compare against expected layout
  → Attach screenshot as evidence in receipt
```

### Research Scraping
```
User asks about competitor/tool → Scout_Ang
  → browser_navigate → target URL
  → browser_get_content → extract text
  → Process content → return summary to ACHEEVY
```

### Evidence Collection (ORACLE Gate)
```
Lil_Hawk completes UI task
  → browser_screenshot of result
  → Attach to job packet as visual evidence
  → Gatekeeper_Ang reviews screenshot in ORACLE gate
```

### PDF Report Generation
```
Weekly health report → OpsConsole_Ang
  → Navigate to internal health dashboard
  → browser_pdf → generate PDF
  → Upload to Google Drive → share with user
```

## Security Rules

- All browser sessions run in Cloudflare's sandboxed environment — no VPS resources consumed
- No access to localhost or internal network addresses (edge execution only)
- JavaScript evaluation is Boomer_Ang-only (potential code execution risk)
- Screenshot capture of third-party sites follows rate limiting
- No credential entry into third-party sites (use proper OAuth flows instead)
- All browser operations are audit-logged
- Sessions are ephemeral — no persistent browser state between calls
