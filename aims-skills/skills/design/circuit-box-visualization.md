---
id: "circuit-box-visualization"
name: "Circuit Box Visualization"
type: "skill"
status: "active"
triggers: ["circuit box", "wiring", "services", "telemetry", "system map", "providers"]
description: "How Circuit Box is drawn, how services are represented, and the strict Owner vs User visibility boundary."
execution:
  target: "persona"
priority: "high"
---

# Circuit Box Visualization

> Circuit Box is the operational nerve center of A.I.M.S. — a visual system map with strict visibility rules.

## Two Surfaces, One Component

Circuit Box renders differently based on the viewer's role:

### Owners Circuit Box (Owner-Only Ops Space)

Full system map with complete visibility:

| Element | Visible |
|---------|---------|
| All providers (LLM, TTS, STT, search, email, etc.) | Yes |
| All internal services (Redis, n8n, agent runtime) | Yes |
| Telemetry (latency, token burn, error rates) | Yes |
| Policy levers (rate limits, cost caps, tier thresholds) | Yes |
| Kill switch | Yes |
| Audit trail (full event log) | Yes |
| Wiring between services (request flow visualization) | Yes |
| Provider cost breakdowns | Yes |
| Internal endpoints / service topology | Yes |
| Security multipliers / numeric tier thresholds | Yes |

### Users Circuit Box (User Tenant Space)

Plug-and-play view — only what the user needs to connect and control:

| Element | Visible |
|---------|---------|
| Their connected services (API keys they provided) | Yes |
| Service health status (green/yellow/red) | Yes |
| Usage meters (tokens used, quota remaining) | Yes |
| Their own credential input forms | Yes |
| Service descriptions (what each plug does) | Yes |
| Internal endpoints | **Never** |
| Provider cost breakdowns | **Never** |
| Internal service topology | **Never** |
| Security multipliers / tier thresholds | **Never** |
| Platform IP / secret material | **Never** |
| Other users' data or credentials | **Never** |

## Visual Language

### Service Nodes
- Each service is a **node** on the circuit board
- Nodes have: icon, label, status indicator (dot), and connection lines
- Active nodes pulse with a subtle glow matching their category color
- Disabled/disconnected nodes appear dimmed with dashed borders

### Wiring
- Connection lines between services use circuit-trace styling
- Active wires show telemetry pulses (animated dots traveling the path)
- Idle wires are static, low-opacity
- Error wires flash red

### Category Colors
| Category | Color | Usage |
|----------|-------|-------|
| LLM / AI | Gold (#D4AF37) | OpenRouter, Claude, Vertex |
| Voice | Cyan (#22D3EE) | ElevenLabs, Deepgram, Groq STT |
| Search | Blue (#3B82F6) | Brave, Tavily, Serper |
| Data | Violet (#8B5CF6) | Firebase, Prisma, Redis |
| Deploy | Emerald (#10B981) | Docker, Nginx, Certbot |
| Comms | Amber (#F59E0B) | Email, Telegram, Discord |
| Payments | Rose (#F43F5E) | Stripe |

### Layout
- Grid-based layout with snap-to-grid positioning
- Responsive: desktop shows full map, tablet collapses to category groups, mobile shows list view
- Zoom/pan controls on desktop (owner view only)
