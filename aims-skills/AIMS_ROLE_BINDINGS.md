# A.I.M.S. Role Bindings

> This file binds concrete agents and tools to the abstract roles defined in `ABSTRACT_SPEC.md`.
> Edit here when identities change; do NOT edit the abstract spec for identity changes.

## 1. Role → Agent Bindings

### Primary Orchestrator Executor

- **Bound Agent:** ACHEEVY
- **Notes:** Only user-facing orchestrator. Decides planning, delegation, synthesis. "Think it. Prompt it. Let ACHEEVY manage it."

### Specialist Executors

Boomer_Ang instances — each defines its own objective, KPIs, and skill bundle (max 7-10 skills).

| Agent | Objective | Domain |
| --- | --- | --- |
| Bridge_Ang | MCP bridges, protocol translation | Integration |
| Betty-Ann_Ang | PMO oversight, quality assurance | Quality |
| Buildsmith | NtNtN builder, orchestrates construction | Engineering |
| Chronicle_Ang | Audit ledger, compliance tracking | Compliance |
| Gatekeeper_Ang | Security gates, policy enforcement | Security |
| Index_Ang | Knowledge indexing, RAG integration | Knowledge |
| Lab_Ang | Research experimentation, data analysis | Research |
| Licensing_Ang | IP protection, licensing compliance | Legal |
| OpsConsole_Ang | Platform operations, infrastructure monitoring | Operations |
| Patchsmith_Ang | Code maintenance, hotfixes | Engineering |
| Picker_Ang | Stack selection, NtNtN recommendations | Architecture |
| Plug_Ang | Container provisioning, plugin management | Deployment |
| Runner_Ang | Task execution, job orchestration | Execution |
| Scout_Ang | Market research, competitive analysis | Research |
| Scribe_Ang | Documentation, knowledge capture | Documentation |
| Showrunner_Ang | Event coordination, live operations | Events |
| SME_Ang | MCP routing, integration knowledge | Integration |
| Composio_Ang | Cross-platform OAuth integrations | Integration |
| Node_Trigger_Ang | n8n orchestration | Automation |

### Code Generation Executor

- **Bound Agent:** Chicken Hawk
- **Notes:** Generates code, follows SKILL.md patterns. Coordinator and throughput regulator. Routes to Lil_Hawks for execution.

### Code Execution Executor

- **Bound Agent:** CodeAng (ii-agent sandbox)
- **Notes:** Runs code in sandboxed containers via ii-agent.

### Strategy / Deep Reasoning Executor

- **Bound Agent:** AVVA NOON
- **Notes:** Long-form reasoning, architectural decisions, conversational analysis.

### Automation Executors

| System | Type | Purpose |
| --- | --- | --- |
| OpenClaw container | Persistent agent host | File-based skills, loops, local memory |
| n8n | Workflow engine | Graphs, webhooks, cron jobs |
| Cloud Tasks / cron | GCP scheduler | Timed jobs, scale-to-zero |

### Review Executors

| Reviewer | Type |
| --- | --- |
| Betty-Ann_Ang | Senior Boomer_Ang (PMO quality gate) |
| Quality_Ang | Testing, verification specialist |
| Human operators | Admins, lead engineers (HITL gates) |

### Worker Executors (Lil_Hawks)

Dispatched by Chicken Hawk. Report only to Chicken Hawk. Follow `Lil_<Role>_Hawk` naming.

| Agent | Specialty |
| --- | --- |
| Lil_Attestation_Hawk | Evidence certification |
| Lil_Build_Surgeon_Hawk | Surgical code fixes |
| Lil_Chain_Of_Custody_Hawk | Evidence chain management |
| Lil_Creddy_Hawk | Financial/credential handling |
| Lil_Deploy_Handler_Hawk | Deployment execution |
| Lil_Intake_Scribe_Hawk | Intake packet formatting |
| Lil_Interface_Forge_Hawk | UI component creation |
| Lil_Messenger_Hawk | Inter-agent messaging |
| Lil_Motion_Tuner_Hawk | Animation refinement |
| Lil_Policy_Sentinel_Hawk | Policy compliance |
| Lil_Proofrunner_Hawk | Evidence collection |
| Lil_Secret_Keeper_Hawk | Secure secret handling |
| Lil_Webhook_Ferryman_Hawk | Webhook routing |
| Lil_Workflow_Smith_Hawk | Workflow construction |

## 2. Tool & MCP Bindings

### STT/TTS Providers

- Groq Whisper, Deepgram, ElevenLabs, Gemini Voice
- **Bound to:** Voice-related skills in Specialist Executors, media pipeline Automation Executors

### Media & Persona Stack

- Nano Banana Pro 2, Key AI, Google Vids, Remotion
- **Bound to:** Synthetic SME and media pipeline skills, visual report generation

### Infra & Deployment

- Docker, Nginx, Cloudflare, Hostinger VPS, GCP
- **Bound to:** Automation Executors for CI/CD, infra changes (OpsConsole_Ang, Runner_Ang)

### MCP Servers

| MCP Server | Primary Owner (Role) | Access Level |
| --- | --- | --- |
| Google Drive | Specialist (Scout_Ang) | Write |
| GitHub | Specialist (Patchsmith_Ang) | Write |
| Notion | Specialist (Scribe_Ang) | Write |
| Gmail | Specialist (Plug_Ang) | Write |
| Google Calendar | Specialist (OpsConsole_Ang) | Write |
| Browser Rendering | Specialist (Scout_Ang) | Full |
| CF Containers | Specialist (Runner_Ang) | Full |
| Workers | Specialist (Buildsmith) | Full |
| Workers Builds | Specialist (Buildsmith) | Full |
| Pipedream (Paperform) | Specialist (Plug_Ang) | Write |

## 3. Chain of Command Mapping

```
Primary Orchestrator (ACHEEVY)
  → Specialist Executors (Boomer_Angs)
    → Code Generation Executor (Chicken Hawk)
      → Worker Executors (Lil_Hawks)
```

- ACHEEVY delegates ONLY to Boomer_Angs
- Boomer_Angs supervise Chicken Hawk
- Chicken Hawk dispatches to Lil_Hawks
- Lil_Hawks report ONLY to Chicken Hawk
- Only ACHEEVY speaks to the user
