# A.I.M.S. MCP & Toolchain Status Report

**Date:** 2026-02-13
**Branch:** `claude/review-recent-changes-Gc4LU`
**Scope:** MCP servers, tool registries, n8n workflows, search APIs, agent bridge

---

## Executive Summary

MCP infrastructure is **fully implemented** in the II-Agent subsystem (Python backend) with 6+ configured tool servers. The tool registry policy framework is defined. Search APIs (Brave, Tavily, Serper) have complete client implementations but require API keys in production `.env`. The n8n bridge is wired to VPS 2. Agent Bridge security gateway is operational with payment blocking enforced.

---

## 1. MCP Core Implementation

### MCP Tool Engine
- **File:** `backend/ii-agent/src/ii_tool/tools/mcp_tool.py`
- **Status:** REAL — Full implementation
- **Features:** Async execution, error handling, retry logic, result formatting
- **Library:** `fastmcp` Client
- **Integration:** Registered as tool type in II-Agent tool registry

### MCP Server Configuration
- **File:** `backend/ii-agent/setting_mcp.json`
- **Status:** REAL — Playwright MCP server configured
- **Server:** `@playwright/mcp@latest` (npx-based)

### MCP Database Schema
- **File:** `backend/ii-agent/src/ii_agent/migrations/versions/5794bd91f5ac_add_metadata_field_to_mcp_settings.py`
- **Status:** REAL — Alembic migration for MCP settings metadata

### MCP Frontend UI
| Component | File | Status |
|-----------|------|--------|
| MCP Settings | `backend/ii-agent/frontend/src/components/agent-setting/mcp-setting.tsx` | REAL (69 lines) |
| MCP Tool Display | `backend/ii-agent/frontend/src/components/agent-setting/mcp-tool.tsx` | REAL (283 lines) |
| MCP Connection | `backend/ii-agent/frontend/src/components/agent-setting/connect-tool-mcp.tsx` | REAL |
| MCP Icon | `backend/ii-agent/frontend/src/assets/icons/mcp-tool.svg` | REAL |

### MCP Tool Catalog
- **File:** `backend/ii-agent/frontend/src/constants/mcp.tsx`
- **Status:** REAL — 6+ tools configured

| Tool | Type | Auth | Status |
|------|------|------|--------|
| Algolia | HTTP | API Key | Configured |
| Auth0 | HTTP | Environment | Configured |
| Canva | CLI | npx | Configured |
| Cloudflare | SSE | Bearer Token | Configured |
| Firebase | CLI | npx | Configured |
| Hugging Face | HTTP | Bearer Token | Configured |

---

## 2. Tool Registry & Policy Framework

### Tool Registry Contract
- **File:** `aims-skills/chain-of-command/policies/tool-registry-contract.json`
- **Version:** 2.0.0
- **Status:** REAL — Policy specification

**Wrapper Types Defined:**
| Type | Description |
|------|-------------|
| `SERVICE_WRAPPER` | HTTP service call wrapper |
| `JOB_RUNNER_WRAPPER` | Background job execution |
| `CLI_WRAPPER` | Command-line tool wrapper |
| `MCP_BRIDGE_WRAPPER` | MCP protocol bridge |

**Enforcement Rules:**
- Every tool access goes through Port Authority (Gateway)
- Boomer_Ang-only wrapping of capabilities
- Each wrapper requires: build metadata, SBOM, permission manifest, LUC metering keys, audit events

### Capability Registry
- **File:** `infra/deploy-platform/registry/capability-registry.json`
- **Version:** 2.0.0
- **Status:** REAL — Registry specification

**Execution Backends:**
| Backend | Status | Notes |
|---------|--------|-------|
| Chicken Hawk | SPEC DEFINED | Primary execution engine — see `docs/CHICKENHAWK_SPEC.md` |
| AgentZero | Reference | Sandbox agent framework |
| n8n | REAL | Workflow automation |

**Capability Categories:**
- `crane_ops` — deployment operations
- `lane_management` — routing and placement
- `crew_admin` — worker management

### Bot Moniker Rules
- **File:** `infra/deploy-platform/registry/bot-moniker-rules.json`
- **Version:** 2.0.0
- **Status:** REAL — Naming convention specification
- **Pattern:** `<Function>_<CrewRole>_Lil_Hawk_<ShiftId>-<Serial>`
- **Crew Roles:** CraneOps, YardOps, SafetyOps, LoadOps, DispatchOps

---

## 3. Search API Integrations

### Brave Search
- **File:** `frontend/lib/search/brave.ts`
- **Status:** REAL — Complete client implementation
- **Features:** Web search, news search, video search, summarized search (AI context)
- **Env Var:** `BRAVE_API_KEY`
- **Production Ready:** Yes, once API key is set

### Tavily
- **Files:** `backend/ii-agent/src/ii_tool/integrations/web_visit/tavily.py`, `frontend/lib/services/search.ts`
- **Status:** REAL — Web content extraction + search
- **Features:** Async extraction, content compression, batch URLs
- **Env Var:** `TAVILY_API_KEY`
- **Production Ready:** Yes, once API key is set

### Serper
- **File:** `frontend/lib/services/search.ts`
- **Status:** REAL — Multi-provider search client
- **Features:** Google search results via Serper API
- **Env Var:** `SERPER_API_KEY`
- **Production Ready:** Yes, once API key is set

### Unified Search Abstraction
- **File:** `frontend/lib/services/search.ts`
- **Status:** REAL — Provider fallback chain
- **Chain:** Brave → Tavily → Serper (first available key wins)

---

## 4. n8n Integration

### n8n Service
- **Location:** `infra/n8n/`
- **Docker:** `n8nio/n8n:latest` on port 5678
- **Profile:** `--profile n8n` (optional, not default)
- **Status:** REAL — Full Docker service definition

### n8n Bridge Client
- **File:** `frontend/lib/n8n-bridge.ts`
- **Status:** REAL — Remote n8n integration
- **Features:**
  - Health check endpoint
  - PMO webhook trigger
  - API key + basic auth support
  - Configurable remote URL

### n8n Workflows
- **File:** `infra/n8n/workflows/pmo-intake.json`
- **Status:** REAL — PMO intake workflow definition

### n8n Schema Pool
- **File:** `backend/uef-gateway/src/pmo/n8n-schema-pool.ts`
- **Status:** REAL — Schema management for n8n payloads

### n8n Deployment Script
- **File:** `scripts/deploy-n8n-workflows.mjs`
- **Status:** REAL — Automated workflow deployment

---

## 5. Agent Bridge Security Gateway

- **File:** `infra/agent-bridge/index.ts`
- **Port:** 3010
- **Status:** REAL — Full implementation

### Security Controls

| Control | Status | Details |
|---------|--------|---------|
| Rate Limiting | ACTIVE | 100 req/min default |
| Operation Whitelist | ACTIVE | search, analyze, summarize, generate, read, write, edit, code |
| Payment Blocking | ENFORCED | 16 blocked keywords + regex patterns |
| Payload Sanitization | ACTIVE | Strips passwords, tokens, keys, credentials |
| Pattern Detection | ACTIVE | Credit card numbers, CVV, billing address, etc. |
| Request Logging | ACTIVE | Sanitized IP + path logging |
| Helmet Headers | ACTIVE | Security headers via helmet |
| CORS Restriction | ACTIVE | Only allows UEF Gateway origin |

### Routes

| Endpoint | Direction | Purpose |
|----------|-----------|---------|
| `POST /agent/request` | AIMS → Agent | Forward request with security checks |
| `POST /agent/response` | Agent → AIMS | Forward response with pattern blocking |
| `POST /agent/ingest` | Agent → UEF | Reverse path for agent-initiated messages |
| `GET /health` | — | Health check |
| `GET /security` | — | Security status report |
| `GET /operations` | — | List allowed/blocked operations |

---

## 6. Chicken Hawk Status (NOT YET BUILT)

Chicken Hawk is the A.I.M.S. execution engine (OpenClaw was removed in commit `98de4fe`). Full spec: `docs/CHICKENHAWK_SPEC.md`. Current state:

| Component | Status | Notes |
|-----------|--------|-------|
| Specification | DEFINED | Bot moniker rules, capability registry |
| Core Engine | NOT BUILT | Planner/executor/verifier loop |
| Policy Engine | NOT BUILT | Circuit Box integration |
| Audit Logger | NOT BUILT | Immutable event log |
| Voice Gateway | NOT BUILT | Deepgram STT + ElevenLabs TTS routing |
| Tool Adapters | NOT BUILT | Behind policy gates |
| Docker Service | NOT BUILT | Needs docker-compose entry |

**Dependency:** Circuit Box consolidation must happen first to establish the control plane.

---

## 7. Readiness Summary

| Component | Implementation | Production Ready |
|-----------|---------------|-----------------|
| MCP Core (II-Agent) | COMPLETE | Yes (with II-Agent deploy) |
| MCP UI | COMPLETE | Yes |
| Tool Registry Policy | COMPLETE | Yes (specification) |
| Capability Registry | COMPLETE | Yes (specification) |
| Brave Search | COMPLETE | Needs `BRAVE_API_KEY` |
| Tavily | COMPLETE | Needs `TAVILY_API_KEY` |
| Serper | COMPLETE | Needs `SERPER_API_KEY` |
| n8n Service | COMPLETE | Needs VPS 2 deploy |
| n8n Bridge | COMPLETE | Needs credentials |
| Agent Bridge | COMPLETE | Yes |
| Chicken Hawk | NOT STARTED | Blocks deploy pipeline |

---

*Generated by A.I.M.S. MCP & Toolchain Audit — 2026-02-13*
