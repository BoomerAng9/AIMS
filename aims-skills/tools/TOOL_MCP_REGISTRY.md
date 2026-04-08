# A.I.M.S. Tool & MCP Registry — Consolidated Reference

> **Version:** 1.0.0
> **Effective:** 2026-03-01
> **Spec Reference:** `aims-skills/ABSTRACT_SPEC.md` Section 1.4

This document is the consolidated registry of all tools and MCP servers available to
A.I.M.S. executors. It follows the abstract spec's Tool & MCP Management format.

All tool access flows through Port Authority (UEF Gateway). No executor directly
touches credentials. MCP servers handle auth, and Port Authority meters usage via LUC.

---

## Registry Format

Each entry follows this schema:

```yaml
tool:
  name: "<branded name>"
  endpoint: "<URL or MCP address>"
  protocol: "rest | mcp | sdk | cli"
  operations: ["<list of supported operations>"]
  allowed_roles: ["<abstract roles>"]
  vertical_constraints: "<vertical or 'all'>"
  cost: "<pricing model>"
  quotas: "<rate limits>"
  status: "active | deprecated | planned"
  tool_doc: "<path to .tool.md file>"
```

---

## 1. Search & Research

| Tool | Endpoint | Protocol | Allowed Roles | Status | Doc |
|------|----------|----------|---------------|--------|-----|
| **Brave Search** | `api.search.brave.com` | REST | All executors | active | `brave-search.tool.md` |
| **Tavily** | `api.tavily.com` | REST | All executors | active (fallback) | `tavily.tool.md` |
| **Serper** | `google.serper.dev` | REST | All executors | active (fallback) | `serper.tool.md` |
| **Firecrawl** | `api.firecrawl.dev` | REST | Specialist, Primary | active | `firecrawl.tool.md` |
| **Apify** | `api.apify.com` | REST | Specialist | active | `apify.tool.md` |

**Priority chain:** Brave → Tavily → Serper (enforced by hook)

## 2. Voice & Media

| Tool | Endpoint | Protocol | Allowed Roles | Status | Doc |
|------|----------|----------|---------------|--------|-----|
| **ElevenLabs** | `api.elevenlabs.io` | REST | Primary, Specialist | active | `elevenlabs.tool.md` |
| **Deepgram** | `api.deepgram.com` | REST | Primary, Specialist | active (TTS fallback) | `deepgram.tool.md` |
| **Kling AI** | `api.klingai.com` | REST | Specialist | active | `kling-ai.tool.md` |
| **Mercury LLM** | Inception Labs | SDK | Specialist | active | `mercury-llm.tool.md` |

## 3. AI / LLM Providers

| Tool | Endpoint | Protocol | Allowed Roles | Status | Doc |
|------|----------|----------|---------------|--------|-----|
| **Anthropic Claude** | `api.anthropic.com/v1` | REST | All executors | active | `anthropic-claude.tool.md` |
| **OpenRouter** | `openrouter.ai/api/v1` | REST | All executors | active | `openrouter.tool.md` |
| **Groq** | `api.groq.com` | REST | Specialist | active | `groq.tool.md` |
| **Vertex AI** | GCP Vertex endpoints | SDK | Primary, Specialist | active | `vertex-ai.tool.md` |

## 4. Data & Storage

| Tool | Endpoint | Protocol | Allowed Roles | Status | Doc |
|------|----------|----------|---------------|--------|-----|
| **Firebase/Firestore** | GCP Firestore | SDK | All executors (role-scoped) | active | `firebase.tool.md` |
| **Prisma** | Local ORM | SDK | Code Gen, Specialist | active | `prisma.tool.md` |
| **Redis** | `aims-redis:6379` | TCP | All executors | active | `redis.tool.md` |

## 5. Billing & Payments

| Tool | Endpoint | Protocol | Allowed Roles | Status | Doc |
|------|----------|----------|---------------|--------|-----|
| **Stripe** | `api.stripe.com` | REST | Primary, Specialist | active | `stripe.tool.md` |

## 6. Email & Communication

| Tool | Endpoint | Protocol | Allowed Roles | Status | Doc |
|------|----------|----------|---------------|--------|-----|
| **Resend** | `api.resend.com` | REST | Primary, Specialist | active | `resend.tool.md` |
| **SendGrid** | `api.sendgrid.com` | REST | Specialist | active (fallback) | `sendgrid.tool.md` |
| **Discord** | Discord API | REST | Automation | active | `discord.tool.md` |
| **Telegram** | Telegram Bot API | REST | Automation | active | `telegram.tool.md` |

## 7. Infrastructure & Deployment

| Tool | Endpoint | Protocol | Allowed Roles | Status | Doc |
|------|----------|----------|---------------|--------|-----|
| **GCP Cloud** | GCP APIs | SDK/CLI | Primary, Specialist | active | `gcp-cloud.tool.md` |
| **Hostinger VPS** | `76.13.96.107` | SSH | Primary | active | `hostinger-vps.tool.md` |
| **nginx** | Local config | CLI | Primary, Specialist | active | `nginx.tool.md` |
| **Certbot** | Let's Encrypt | CLI | Automation | active | `certbot.tool.md` |
| **E2B** | `api.e2b.dev` | REST | Code Execution | active | `e2b.tool.md` |

## 8. Auth & Security

| Tool | Endpoint | Protocol | Allowed Roles | Status | Doc |
|------|----------|----------|---------------|--------|-----|
| **NextAuth** | Local middleware | SDK | Specialist | active | `nextauth.tool.md` |
| **Google OAuth** | Google APIs | REST | Specialist | active | `google-oauth.tool.md` |

## 9. Analytics & Tracking

| Tool | Endpoint | Protocol | Allowed Roles | Status | Doc |
|------|----------|----------|---------------|--------|-----|
| **PostHog** | `app.posthog.com` | REST | Specialist | active | `posthog.tool.md` |
| **Plausible** | `plausible.io` | REST | Specialist | active | `plausible.tool.md` |

## 10. UI & Rendering

| Tool | Endpoint | Protocol | Allowed Roles | Status | Doc |
|------|----------|----------|---------------|--------|-----|
| **Three.js** | Local library | SDK | Specialist | active | `threejs.tool.md` |
| **21st.dev Magic** | `21st.dev` | REST | Specialist | active | `21st-dev-magic.tool.md` |

## 11. Automation & Integration

| Tool | Endpoint | Protocol | Allowed Roles | Status | Doc |
|------|----------|----------|---------------|--------|-----|
| **Composio** | `api.composio.dev` | REST | Automation | active | `composio.tool.md` |
| **Boost.space Integrator** | Boost.space APIs | REST | Automation | active | `boost-space-integrator.tool.md` |
| **Boost.space Remote** | Boost.space APIs | REST | Automation | active | `boost-space-remote.tool.md` |
| **Paperform** | Via Pipedream MCP | MCP | Specialist | active | `paperform.tool.md` |
| **Agent Zero** | Local agent | SDK | Specialist | active | `agent-zero.tool.md` |

---

## MCP Servers (10 Connected)

### Productivity & Collaboration

| # | Server | Endpoint | Protocol | Owner Role | Capabilities |
|---|--------|----------|----------|------------|-------------|
| 1 | **Google Drive** | Claude Code Connector | MCP | Specialist (Scout) | search, read, create, share files |
| 2 | **GitHub** | Claude Code Connector | MCP | Specialist (Patchsmith) | repos, PRs, issues, code search |
| 3 | **Notion** | Claude Code Connector | MCP | Specialist (Scribe) | search, read, create pages/databases |
| 4 | **Gmail** | Claude Code Connector | MCP | Specialist (Plug) | search, read, send emails |
| 5 | **Google Calendar** | Claude Code Connector | MCP | Specialist (OpsConsole) | list, create, update events |

### Cloudflare Edge Platform

| # | Server | Endpoint | Protocol | Owner Role | Capabilities |
|---|--------|----------|----------|------------|-------------|
| 6 | **Browser Rendering** | `browser.mcp.cloudflare.com` | MCP/SSE | Specialist (Scout) | screenshot, HTML, markdown extraction |
| 7 | **CF Containers** | `containers.mcp.cloudflare.com` | MCP/SSE | Specialist (Runner) | init, exec, file ops in sandbox |
| 8 | **Workers** | Claude Code Connector | MCP | Code Generation | KV, R2, D1, Workers, Hyperdrive |
| 9 | **Workers Builds** | `builds.mcp.cloudflare.com` | MCP/SSE | Code Generation | list builds, view logs, debug |

### Integration Bridges

| # | Server | Endpoint | Protocol | Owner Role | Capabilities |
|---|--------|----------|----------|------------|-------------|
| 10 | **Pipedream** | `mcp.pipedream.net/v2` | MCP/SSE | Specialist (Plug) | Paperform webhooks, integrations |

---

## Role → Tool Permission Matrix

Uses abstract roles from `ABSTRACT_SPEC.md`:

| Permission Level | Symbol | Description |
|-----------------|--------|-------------|
| Full | **F** | Read + write + delete |
| Write | **W** | Read + create + update |
| Read | **R** | Read only |
| None | **—** | No access |

| Role | Search | Voice | LLM | Data | Billing | Email | Infra | MCP |
|------|--------|-------|-----|------|---------|-------|-------|-----|
| **Primary Orchestrator** | F | W | F | W | W | W | F | W |
| **Specialist Executor** | F | W | W | W* | R | W | R | W* |
| **Code Generation** | R | — | W | R | — | — | R | W |
| **Code Execution** | — | — | R | R | — | — | R | R |
| **Automation Executor** | R | R | R | W* | — | W | R | R |
| **Review Executor** | R | — | R | R | R | R | R | R |
| **Worker Executor** | R | — | R | Append | — | — | — | R |

\* Scoped to own domain/vertical only

---

## Planning-Phase Selection Rules

1. Identify intent → determine which tools are needed
2. Check tool availability (API key present, service healthy)
3. Verify caller role has permission for each tool
4. Estimate cost impact (LUC metering)
5. Select minimal tool set — don't load tools you won't use

## Execution-Phase Invocation Rules

1. All calls go through Port Authority (UEF Gateway)
2. Never pass raw credentials — Port Authority injects auth
3. Log every invocation: tool, operation, caller, timestamp, result status
4. On failure: retry once, then fall to documented fallback, then error
5. Respect rate limits — back off on 429

## Logging Fields

| Field | Description |
|-------|-------------|
| `tool` | Tool name from registry |
| `operation` | Specific operation invoked |
| `caller` | Abstract role of caller |
| `timestamp` | ISO 8601 timestamp |
| `latency_ms` | Round-trip time |
| `status` | `success`, `error`, `fallback` |
| `tokens_consumed` | For LLM tools only |
| `cost_estimate` | LUC cost estimate |

---

## References

- **Abstract Spec:** `aims-skills/ABSTRACT_SPEC.md` (Section 1.4)
- **Role Bindings:** `aims-skills/AIMS_ROLE_BINDINGS.md`
- **MCP Capabilities:** `aims-skills/tools/MCP_CAPABILITIES.md` (detailed per-server reference)
- **Individual Tool Docs:** `aims-skills/tools/<name>.tool.md`
