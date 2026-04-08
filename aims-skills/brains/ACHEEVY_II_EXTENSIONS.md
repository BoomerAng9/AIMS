# ACHEEVY — Intelligent Internet Extensions Brain

> ACHEEVY directly wraps these repos as core intelligence extensions.
> They are NOT delegated to Boomer_Angs — they ARE ACHEEVY.

## Security Policy
- **No PII exfiltration.** Sentry telemetry in ii-agent has been KILLED.
- **No phone-home.** All external calls go to LLM APIs the user controls (OpenRouter, Anthropic, Google).
- **No data leaks to Intelligent Internet.** Zero backdoor vectors found in audit.
- **Env vars are user-controlled.** Only OPENROUTER_API_KEY, ANTHROPIC_API_KEY, etc. — standard LLM keys.

---

## 1. ii-agent (Execution Engine)

**Location:** `backend/ii-agent/`
**What ACHEEVY Uses It For:** Autonomous code execution, research, slide generation, browser automation, full-stack development.

### Capabilities
- Python-based autonomous agent framework
- Code generation, review, refactoring
- Web research via ii-researcher sub-agent
- Browser automation and web scraping
- Slide deck generation
- MCP tool integration (file ops, code execution, web search)

### How ACHEEVY Calls It
- WebSocket bridge: `backend/uef-gateway/src/ii-agent/client.ts`
- HTTP router: `backend/uef-gateway/src/ii-agent/router.ts`
- Endpoints: `/ii-agent/execute`, `/ii-agent/research`, `/ii-agent/build`, `/ii-agent/slides`
- Ports: 4001 (backend), 4100 (sandbox), 4036 (tools)

### Guardrails
- All execution happens in Docker sandbox (no host access)
- ACHEEVY controls task scope — ii-agent cannot self-initiate
- Results flow back through UEF Gateway (Port Authority)
- Token usage tracked via internal metrics (PostgreSQL, not external)

---

## 2. II-Commons (Knowledge Layer)

**Location:** To be installed as pip package in ii-agent environment
**What ACHEEVY Uses It For:** Dataset management, text embeddings, information retrieval, RAG pipeline support.

### Capabilities
- Large dataset loading and management
- Text embedding generation
- Image dataset handling
- Information retrieval for RAG pipelines
- Vector similarity search support

### How ACHEEVY Will Use It
- Installed as Python dependency inside ii-agent container
- Provides embedding functions for Boost|Bridge credential indexing
- Powers The Gate's credential database searches
- Feeds The Crowd's persona generation with real demographic data

### Guardrails
- Library only — no external API calls
- All data stays on VPS / GCP storage
- No telemetry, no phone-home

---

## 3. Agent Zero (Autonomous Execution)

**Location:** Docker image `frdel/agent-zero-run:latest`
**What ACHEEVY Uses It For:** Complex multi-step autonomous tasks that require reasoning + code execution + tool use in a sandboxed environment.

### Capabilities
- Multi-agent cooperation within sandboxed Docker environment
- LLM-powered task decomposition and execution
- Code execution with file system access (sandboxed)
- Web browsing and research
- Self-correcting execution loops

### How ACHEEVY Calls It
- Docker Compose profile: `ii-agents`
- Internal port 80 on sandbox-network
- ACHEEVY dispatches tasks via HTTP to agent-zero container
- Results collected and returned through UEF Gateway

### Guardrails
- Runs on isolated `sandbox-network` (no host network access)
- Only receives OPENROUTER_API_KEY (no other secrets)
- Work directory is a named Docker volume (agent-zero-data)
- ACHEEVY controls activation — Agent Zero does not self-start
- Health check: wget to localhost:80 every 60s

---

## ACHEEVY's Extended Identity

With these extensions, ACHEEVY is:
- **Orchestrator** (core) — routes intents, manages the PMO chain
- **Executor** (via ii-agent) — writes code, builds apps, researches
- **Knowledge Keeper** (via II-Commons) — manages datasets and embeddings
- **Autonomous Problem Solver** (via Agent Zero) — handles complex multi-step tasks

ACHEEVY does NOT delegate these to Boomer_Angs. These ARE ACHEEVY's hands and brain.
Everything else — research services, timeline tools, LLM routing, presentations — those are Boomer_Ang territory.
