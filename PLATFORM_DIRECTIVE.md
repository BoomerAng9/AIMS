# A.I.M.S. Platform Implementation Directive

## First-Person Position: Building Our Replit Competitor

**Date:** February 12, 2026
**Issued By:** A.I.M.S. Leadership
**Status:** CANONICAL VISION DOCUMENT

---

## Our Mission Statement

We are building **A.I.M.S. (AI Managed Solutions)** -- a full-stack application creation
and deployment platform that enables **anyone** to build, deploy, and scale
production-ready web applications from **our infrastructure**.

We are **not** Replit. We are better. We own our infrastructure, we leverage
state-of-the-art AI agents (Boomer_Angs), and we deploy **real production
applications** with custom domains, CDN delivery, and enterprise-grade scalability.

---

## What We're Building

### Our Platform Capabilities

Users come to our platform and say:
- "Build me an Express.js app with authentication and a dashboard"
- "Create a React app that connects to Firebase"
- "Deploy a Next.js 14 site with Stripe payment integration"
- "Analyze this NIL contract for red flags"
- "Predict injury risk for this athlete based on historical data"
- "Generate a PFWA compliance report from these documents"

**We deliver:** A live, production-ready application at
`https://their-app.aims-platform.com` in **minutes, not hours**.

---

## Our Technology Stack

### Development Infrastructure (What We Own)

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **AI Orchestrator** | Chicken Hawk | Main gateway, multi-channel control plane |
| **Code Generation Engine** | ii-agent (Intelligent Internet) | Full-stack development |
| **Reasoning Engine** | II-Medical (Intelligent Internet) | Complex analysis: contracts, injury risk, compliance |
| **Research Agent** | ii-researcher (Intelligent Internet) | Web scraping, data gathering, API research |
| **Knowledge Base** | II-Commons (PostgreSQL + VectorChord) | RAG system, cross-project learning |
| **Multi-Agent Coordination** | CommonGround (Intelligent Internet) | Team workflows, orchestration |
| **Workflow Automation** | n8n (Separate VPS) | Data pipelines, scheduled tasks, webhooks |
| **Frontend Platform** | Next.js 14 + Tailwind | User dashboard, app creation UI |
| **AI Inference** | Vertex AI (Gemini 2.0 Flash) + Claude | LLM routing, multi-model support |
| **Hosting Infrastructure** | Hostinger Cloud Startup VPS | Docker, Nginx, SSL, CDN (we own it) |
| **Global Delivery** | BunnyCDN / Cloudflare | CDN for sub-50ms latency worldwide |

---

## Our Agent Architecture

### Chicken Hawk - The Orchestrator

Chicken Hawk is our **main control plane**. It:
- Receives user requests via web chat, Discord, Slack, or API
- Routes tasks to specialized **Lil_Hawks** (our sub-agents/bots)
- Maintains conversation context across all channels
- Coordinates multi-step workflows

**Chicken Hawk does NOT do the work -- it delegates to specialists.**

---

### Our Lil_Hawks (Specialized Boomer_Angs)

We deploy **function-specific Boomer_Angs**:

| Boomer_Ang | Powered By | Specialization |
|-----------|-----------|----------------|
| **Code_Ang** | ii-agent | Full-stack code generation (Express.js, React, Next.js, APIs) |
| **Medical_Ang** | II-Medical | NIL contracts, injury prediction, compliance analysis, legal reasoning |
| **Research_Ang** | ii-researcher | Web scraping (NCAA stats, NIL databases, recruiting intel) |
| **Test_Ang** | ii-agent + custom | Code quality, security scanning, deployment readiness |
| **Deploy_Ang** | Custom scripts | Docker builds, Nginx config, CDN routing, SSL setup |
| **Team_Ang** | CommonGround | Multi-agent coordination, workflow orchestration |
| **Scout_Ang** | II-Medical + ii-researcher | Player analysis, performance prediction (Per Form vertical) |
| **NIL_Ang** | II-Medical | NIL valuation, contract negotiation, market benchmarking |
| **Comms_Ang** | Custom + LLMs | User notifications, status updates, deployment logs |
| **Safety_Ang** | II-Medical | Compliance monitoring (NCAA, FERPA, legal regulations) |
| **PFWA_Ang** | II-Medical | Document analysis, action item extraction, report generation |

**Naming convention:** `[Function]_Ang` where function describes **what it does**,
not a generic label.

---

## IMPLEMENTATION NOTES (Internal - Codebase Mapping)

The directive above is the canonical product vision. Below maps directive
names to current codebase identifiers for implementation reference:

### Agent Name Mapping (Directive -> Codebase)

| Directive Name | Codebase ID | Codebase Class | Status |
|---------------|-------------|----------------|--------|
| Code_Ang | engineer-ang | Engineer_Ang | ACTIVE (alias: Code_Ang) |
| Medical_Ang | (new) | Medical_Ang | PLANNED (needs II-Medical integration) |
| Research_Ang | research-ang | Analyst_Ang + Research_Ang (container) | ACTIVE |
| Test_Ang | quality-ang | Quality_Ang | ACTIVE (alias: Test_Ang) |
| Deploy_Ang | automation-ang | Automation_Ang | ACTIVE (alias: Deploy_Ang) |
| Team_Ang | (new) | Team_Ang | PLANNED (needs CommonGround integration) |
| Scout_Ang | (new) | Scout_Ang | PLANNED (Per Form vertical agent) |
| NIL_Ang | (new) | NIL_Ang | PLANNED (NIL vertical agent) |
| Comms_Ang | voice-ang | Voice_Ang | ACTIVE (alias: Comms_Ang) |
| Safety_Ang | sentinel-ang | Sentinel_Ang | ACTIVE (alias: Safety_Ang) |
| PFWA_Ang | (new) | PFWA_Ang | PLANNED (document analysis agent) |

### Architecture Mapping

| Directive Claim | Actual State | Notes |
|----------------|-------------|-------|
| Firebase Auth | NextAuth + Redis | Migration to Firebase planned |
| Chicken Hawk | Execution engine | CH is executor and autonomous agent framework |
| ii-agent backing | Agent Zero (similar) | II-Agent exists at /backend/ii-agent/ |
| II-Commons (PostgreSQL) | SQLite (gateway) + Prisma (frontend) | Migration to PostgreSQL + VectorChord planned |
| BunnyCDN | Not configured | CDN integration planned for Phase 3 |

### Non-Negotiables (Confirmed in Codebase)

1. Platform Name: A.I.M.S. (AI Managed Solutions) -- CONFIRMED
2. Infrastructure Ownership: Hostinger VPS -- CONFIRMED (76.13.96.107)
3. Agent Naming: [Function]_Ang format -- TRANSITIONING
4. Brand Consistency: ACHEEVY, Chicken Hawk, Lil_Hawks, Plugs -- CONFIRMED
5. Design System: Glassmorphic, obsidian/gold palette -- CONFIRMED
6. Deployment Target: Docker + Docker Compose -- CONFIRMED (infra/docker-compose.prod.yml)
7. Multi-Tenancy: Isolated Docker networks -- CONFIRMED (sandbox-network)
