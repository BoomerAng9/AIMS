# Chicken Hawk Rebuild Specification

**Date:** 2026-02-13
**Version:** 3.0.0
**Status:** SPECIFICATION — Implementation pending
**Replaces:** OpenClaw sandbox (removed commit `98de4fe`)

---

## 1. Overview

Chicken Hawk is the A.I.M.S. execution engine — the throughput regulator between Boomer_Ang supervision and Lil_Hawk atomic workers. It converts high-level deployment plans into deterministic execution packets, enforcing policy gates at every step.

### Command Chain

```
User → ACHEEVY → Boomer_Angs → Chicken Hawk → Squad → Lil_Hawk
```

### Core Principle

**"Packet first. Proof always."** — Chicken Hawk won't start a run until every gate is green, and won't mark a run done until every proof is collected.

---

## 2. Architecture

### 2.1 Services

| Service | Port | Network | VPS | Purpose |
|---------|------|---------|-----|---------|
| `chickenhawk-core` | 4001 | aims-network | VPS 2 | Planner/executor/verifier loop |
| `chickenhawk-policy` | 4002 | aims-network | VPS 2 | Circuit Box policy enforcement |
| `chickenhawk-audit` | 4003 | aims-network | VPS 2 | Immutable event log + evidence locker |
| `chickenhawk-voice-gateway` | 4004 | aims-network | VPS 2 | Voice I/O routing for spoken deploys |

### 2.2 Network Topology

```
┌─────────────────────────────────────────────────────┐
│  VPS 1 (plugmein.cloud)                             │
│  ┌─────────────┐  ┌──────────────┐                  │
│  │ Next.js App  │──│ UEF Gateway  │                  │
│  │ (frontend)   │  │ (port 3001)  │                  │
│  └──────────────┘  └──────┬───────┘                  │
│                           │ HTTPS                    │
└───────────────────────────┼──────────────────────────┘
                            │
┌───────────────────────────┼──────────────────────────┐
│  VPS 2 (n8n VPS)          │                          │
│                    ┌──────┴───────┐                  │
│                    │ Agent Bridge │                   │
│                    │ (port 3010)  │                   │
│                    └──────┬───────┘                   │
│           ┌───────────────┼───────────────┐          │
│  ┌────────┴──────┐ ┌──────┴──────┐ ┌──────┴──────┐  │
│  │ chickenhawk-  │ │ chickenhawk-│ │ chickenhawk- │  │
│  │ core (4001)   │ │ policy(4002)│ │ audit (4003) │  │
│  └───────────────┘ └─────────────┘ └──────────────┘  │
│                    ┌──────────────┐                   │
│                    │     n8n      │                   │
│                    │ (port 5678)  │                   │
│                    └──────────────┘                   │
└──────────────────────────────────────────────────────┘
```

---

## 3. chickenhawk-core

### 3.1 Execution Loop

```
receive_manifest(manifest)
  → policy_check(manifest)         # chickenhawk-policy
  → luc_budget_check(manifest)     # LUC gate
  → plan(manifest)                 # decompose into Lil_Hawk tasks
  → spawn_squad(shift_id, tasks)   # create Squad + Lil_Hawks
  → for each wave in plan.waves:
      → execute_wave(wave)
      → verify_wave(wave)          # collect proofs
      → if failed: rollback_wave(wave)
  → collect_evidence()             # chickenhawk-audit
  → report_up(result)              # to Boomer_Ang supervisor
```

### 3.2 Manifest Schema

```json
{
  "manifest_id": "MF-001",
  "requested_by": "ACHEEVY",
  "approved_by": "Forge_Ang",
  "shift_id": "SFT-221",
  "plan": {
    "waves": [
      {
        "wave_id": 1,
        "tasks": [
          {
            "function": "Deploy",
            "crew_role": "CraneOps",
            "target": "service-name",
            "params": {}
          }
        ],
        "concurrency": 2,
        "gate": "all_pass"
      }
    ]
  },
  "budget_limit_usd": 5.00,
  "timeout_seconds": 300
}
```

### 3.3 Squad & Lil_Hawk Spawning

Per `bot-moniker-rules.json` v2.0.0:

- **Lil_Hawk naming:** `<Function>_<CrewRole>_Lil_Hawk_<ShiftId>-<Serial>`
- **Squad naming:** `Squad_<ShiftId>-<BatchSerial>` (mandatory when N>1)
- **KYB registration at birth:** serial ID, charter, flight recorder binding
- **Identity format:** `KYB-LH-<shift_id>-<serial>`

### 3.4 Lil_Hawk Roster (Role-Bound Names)

| Handle | Role | Capability |
|--------|------|------------|
| `Lil_Messenger_Hawk` | Notification dispatch | Telegram, email, webhook callbacks |
| `Lil_Schema_Hawk` | Schema validation | JSON schema, API contract verification |
| `Lil_Probe_Hawk` | Health probing | Service health checks, endpoint verification |
| `Lil_Patch_Hawk` | Code patching | File edits, config updates, migrations |
| `Lil_Lock_Hawk` | Access control | Permission changes, secret rotation |
| `Lil_Trace_Hawk` | Observability | Log collection, metric snapshots, traces |
| `Lil_Deploy_Handler_Hawk` | Deployment | Container deployment, rolling updates |
| `Lil_Build_Surgeon_Hawk` | Build management | Compilation, bundling, artifact creation |
| `Lil_Workflow_Smith_Hawk` | Workflow creation | n8n workflow deployment and management |
| `Lil_Webhook_Ferryman_Hawk` | Webhook routing | Incoming/outgoing webhook management |
| `Lil_Intake_Scribe_Hawk` | PMO intake | Request intake, classification, routing |
| `Lil_Policy_Sentinel_Hawk` | Policy enforcement | Gate checks, approval verification |
| `Lil_Attestation_Hawk` | Evidence collection | Proof hashes, attestation generation |
| `Lil_Interface_Forge_Hawk` | UI generation | Component scaffolding, page creation |
| `Lil_Motion_Tuner_Hawk` | Animation/UX | Motion design, interaction tuning |
| `Lil_Proofrunner_Hawk` | Test execution | Test runs, validation suites |
| `Lil_Secret_Keeper_Hawk` | Secret management | Vault operations, key management |
| `Lil_Chain_Of_Custody_Hawk` | Audit trail | Evidence chain, custody logging |

### 3.5 Execution Constraints

- **No autonomous decisions:** Lil_Hawks report logs only
- **No direct tool execution:** Only registered Capability Registry calls via gateway + LUC authorization
- **Tied to shift:** Every Lil_Hawk must be tied to a ShiftId
- **Owner-only:** Chicken Hawk runs on owner's VPS, not shared infrastructure
- **Evidence required:** No proof, no done

---

## 4. chickenhawk-policy

### 4.1 Circuit Box Integration

Circuit Box becomes Chicken Hawk's control plane. Policy levers:

| Lever | Type | Description |
|-------|------|-------------|
| Autonomy Level | enum | `manual` / `supervised` / `auto` |
| Tool Permissions | map | Per-tool allow/deny/require-approval |
| Network Egress | boolean | Allow outbound HTTP from Lil_Hawks |
| Git Write Gate | boolean | Allow git push / commit operations |
| Voice Provider Routing | enum | `elevenlabs` / `deepgram` / `browser` |
| Evidence Required | boolean | Require proof artifacts before task completion |
| Emergency Stop | button | Halt all active Squads immediately |
| Budget Cap (USD) | number | Maximum LUC spend per shift |
| Concurrency Limit | number | Maximum parallel Lil_Hawks |
| Shift Timeout | seconds | Maximum duration for a shift |

### 4.2 Policy Check Flow

```
chickenhawk-core.execute(task)
  → chickenhawk-policy.canExecute(task, context)
    → check autonomy_level
    → check tool_permissions[task.tool]
    → check luc_budget_remaining >= task.estimated_cost
    → check concurrency_limit >= active_lil_hawks
    → if requires_approval: await Boomer_Ang approval
    → return { allowed: boolean, reason: string }
```

### 4.3 Badge Level Enforcement

From `capability-registry.json`:

| Badge | Auto-approve | Approval Required |
|-------|-------------|-------------------|
| Green (Low Risk) | Eligible when autonomy=auto | No (unless policy overrides) |
| Amber (Medium Risk) | Never | Yes — Boomer_Ang supervisor |
| Red (High Risk) | Never | Yes — explicit owner approval |

---

## 5. chickenhawk-audit

### 5.1 Event Log

Every action emits an immutable event:

```json
{
  "event_id": "EVT-001",
  "timestamp": "2026-02-13T12:00:00Z",
  "shift_id": "SFT-221",
  "squad_id": "Squad_SFT-221-B01",
  "lil_hawk": "Deploy_CraneOps_Lil_Hawk_SFT-221-LH041",
  "action": "deploy_workload",
  "input_hash": "sha256:abc...",
  "output_hash": "sha256:def...",
  "status": "success",
  "duration_ms": 1234,
  "luc_cost_usd": 0.05,
  "policy_ref": "capability-registry.deploy_workload",
  "approved_by": "Forge_Ang"
}
```

### 5.2 Flight Recorder

Per `bot-moniker-rules.json`:

- **Enabled:** true
- **Retention:** 90 days
- **Fields:** action, input, output, duration, status, error, squad_id
- **Storage:** Local file-based (VPS 2) + optional cloud backup

### 5.3 Evidence Locker

Artifacts collected per task:

| Artifact | Format | Purpose |
|----------|--------|---------|
| `RUN_LOG` | JSON | Complete execution log |
| `PROOF_HASHES` | SHA-256 | Input/output content hashes |
| `ATTESTATION` | Signed JSON | Cryptographic proof of execution |
| `SCREENSHOTS` | PNG | Visual evidence (UI tasks) |
| `DIFF_PATCHES` | Unified diff | Code change evidence |

---

## 6. chickenhawk-voice-gateway

### 6.1 Purpose

Routes voice I/O for spoken deployment commands through the same policy gates as text commands.

### 6.2 Flow

```
User speaks → Browser MediaRecorder
  → STT (Groq Whisper primary / Deepgram fallback)
  → Transcript → ACHEEVY intent classification
  → Chicken Hawk manifest (same as text flow)
  → Result → TTS (ElevenLabs primary / Deepgram fallback)
  → Audio playback to user
```

### 6.3 Provider Routing

Controlled by Circuit Box `voice_provider_routing` lever:

| Provider | Role | Voice ID |
|----------|------|----------|
| ElevenLabs | TTS Primary | `pNInz6obpgDQGcFmaJgB` (Adam) |
| Deepgram Aura-2 | TTS Fallback | `aura-asteria-en` |
| Groq Whisper | STT Primary | `whisper-large-v3-turbo` |
| Deepgram Nova-3 | STT Fallback | `nova-3` |

---

## 7. Tool Adapters

Each tool adapter wraps a capability behind a policy gate:

### 7.1 Adapter Pattern

```typescript
interface ToolAdapter {
  id: string;                    // e.g., "deploy_workload"
  wrapper_type: string;          // SERVICE_WRAPPER | JOB_RUNNER | CLI | MCP_BRIDGE
  required_permissions: string[];
  luc_metered: boolean;

  execute(params: any, context: ExecutionContext): Promise<ToolResult>;
}

interface ExecutionContext {
  shift_id: string;
  lil_hawk_id: string;
  squad_id: string;
  budget_remaining_usd: number;
  policy_snapshot: PolicySnapshot;
}
```

### 7.2 Registered Adapters

| Adapter | Wrapper Type | Backend |
|---------|-------------|---------|
| `deploy_workload` | SERVICE_WRAPPER | Docker API |
| `health_check` | SERVICE_WRAPPER | HTTP probe |
| `run_n8n_workflow` | MCP_BRIDGE_WRAPPER | n8n API |
| `send_notification` | SERVICE_WRAPPER | Telegram/webhook |
| `git_operations` | CLI_WRAPPER | git CLI |
| `file_operations` | CLI_WRAPPER | fs API |
| `search_web` | SERVICE_WRAPPER | Brave/Tavily |
| `run_tests` | JOB_RUNNER_WRAPPER | npm/pytest |

---

## 8. Docker Compose (VPS 2)

```yaml
# chickenhawk services — docker-compose.chickenhawk.yml
services:
  chickenhawk-core:
    build: ./chickenhawk/core
    ports:
      - "4001:4001"
    environment:
      - NODE_ENV=production
      - POLICY_URL=http://chickenhawk-policy:4002
      - AUDIT_URL=http://chickenhawk-audit:4003
      - N8N_URL=http://n8n:5678
      - AGENT_BRIDGE_URL=http://agent-bridge:3010
    networks:
      - aims-network
    restart: unless-stopped
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.5'

  chickenhawk-policy:
    build: ./chickenhawk/policy
    ports:
      - "4002:4002"
    environment:
      - NODE_ENV=production
      - CIRCUIT_BOX_CONFIG=/config/circuit-box.json
    volumes:
      - ./config:/config:ro
    networks:
      - aims-network
    restart: unless-stopped

  chickenhawk-audit:
    build: ./chickenhawk/audit
    ports:
      - "4003:4003"
    environment:
      - NODE_ENV=production
      - EVIDENCE_DIR=/data/evidence
      - RETENTION_DAYS=90
    volumes:
      - chickenhawk-evidence:/data/evidence
    networks:
      - aims-network
    restart: unless-stopped

volumes:
  chickenhawk-evidence:

networks:
  aims-network:
    external: true
```

---

## 9. Security Model

### 9.1 Owner-Only Deployment

- Chicken Hawk runs exclusively on the owner's VPS (VPS 2)
- No shared infrastructure, no multi-tenant
- Agent Bridge provides the only ingress from VPS 1
- All traffic through Agent Bridge security gateway (rate limiting, payment blocking, pattern detection)

### 9.2 Least Privilege

- Each Lil_Hawk receives only the permissions for its specific function
- No Lil_Hawk has access to secrets beyond its task scope
- Tool adapters enforce permission boundaries
- Network egress controlled by Circuit Box lever

### 9.3 Anti-Hijack

- Three-wall defense: input sanitization → capability containment → audit trail
- Lil_Hawks cannot change their own scope or permissions
- All tool calls go through Port Authority (gateway)
- Kill switch available at all times via Circuit Box

---

## 10. Implementation Phases

### Phase 1: Core Engine (MVP)
- `chickenhawk-core` with manifest parsing and sequential execution
- `chickenhawk-policy` with basic Circuit Box levers
- `chickenhawk-audit` with file-based event log
- Docker Compose definition

### Phase 2: Squad Management
- Parallel Lil_Hawk execution within waves
- Squad lifecycle management (spawn, monitor, cleanup)
- KYB registration at birth
- Concurrency control

### Phase 3: Voice Gateway
- `chickenhawk-voice-gateway` with provider routing
- Spoken deployment commands through same policy gates
- Audio evidence collection

### Phase 4: Advanced Features
- n8n workflow adapter (MCP bridge)
- Auto-heal and drift detection
- Dashboard integration (Circuit Box UI)
- Evidence locker cloud backup

---

*Generated by A.I.M.S. Chicken Hawk Rebuild Specification — 2026-02-13*
