# Deploy Platform Guide

> "Boomer_Angs on the Port" - A.I.M.S. Containerized Execution System

## Overview

The Deploy Platform is A.I.M.S.'s execution layer where work gets done. It uses a shipping port metaphor to make complex deployments intuitive and watchable.

## Visual Metaphor

| Real-World | System Equivalent |
|------------|-------------------|
| Container stacks | Versioned deploys |
| Cranes | Heavy-lift infra tasks |
| Ground crew | Lil_Hawk worker bots |
| Manifest | Deploy instructions |
| Shift | Work period (clock-in to clock-out) |
| Receipt | Signed audit log |

## Governance Chain

```
User → ACHEEVY → Boomer_Ang → Chicken_Hawk → Squad → Lil_Hawks
                                                        ↓
User ← ACHEEVY ← Receipt ←─────────────────────────────┘
```

| Step | Actor | Responsibility |
|------|-------|----------------|
| 1 | User | Requests work via ACHEEVY |
| 2 | ACHEEVY | Approves plan, creates Manifest |
| 3 | Boomer_Ang | Validates scope against DSP limits |
| 4 | Chicken_Hawk | Receives contract, spawns Squad |
| 5 | Squad | Coordinates Lil_Hawk workers |
| 6 | Lil_Hawks | Execute tasks, emit events |
| 7 | Receipt | Sealed proof of completion |
| 8 | ACHEEVY | Verifies receipt, reports to User |

## Core Components

### Chicken_Hawk

The execution engine mascot. Responsible for:
- Receiving contracts from ACHEEVY/Boomer_Ang
- Spawning and managing Squads
- Coordinating Lil_Hawk workers
- Sealing receipts

**Evolution Levels:**
- `base` - Standard execution
- `powered` - Enhanced capabilities
- `maxPower` - Full authority

### Squad

A coordinated group of Lil_Hawks assigned to a Shift.

**Naming Pattern:** `Squad_<ShiftId>-<BatchSerial>`

Example: `Squad_SH-ABC12345-001`

### Lil_Hawks

Individual worker bots with personas and career progression.

**Canonical ID Pattern:** `<Function>_<CrewRole>_Lil_Hawk_<ShiftId>-<Serial>`

Example: `Build_Crane_Lil_Hawk_SH-ABC12345-001`

**Persona Handle:** `X_Lil_Hawk` (e.g., `Lil_Packer_Hawk`, `Lil_RedFlag_Hawk`)

## Workforce Hierarchy

```
Hatchling → Apprentice → Journeyman → Foreman → Chicken_Hawk_Candidate → Chicken_Hawk
```

| Level | Description | Permissions |
|-------|-------------|-------------|
| Hatchling | New worker, needs mentorship | Read-only, observe |
| Apprentice | Learning phase | Limited solo tasks |
| Journeyman | Trusted independent worker | Full execution |
| Foreman | Can mentor, high privilege | Supervisory access |
| Chicken_Hawk_Candidate | Promotion track | Near-full authority |
| Chicken_Hawk | Full engine authority | Everything |

## Execution Lanes

### Deploy It (Fast Lane)

For pre-approved operations with low Operational Exposure Index (OEI).

**Requirements:**
- DSP gates pre-approved
- OEI below threshold
- No new integrations
- No secrets scope expansion

**User Experience:** Watch the crew work, get receipt.

### Guide Me (Consultative Lane)

For requests requiring approval before execution.

**Triggers:**
- High uncertainty
- Security packet requires hold
- New integrations
- Production impact
- Secrets scope expansion
- Anomaly detected

**User Experience:** Review Manifest → Approve → Watch → Receipt

## Shift Lifecycle

```
clock_in → execution → verification → debrief → clock_out
```

| Phase | Description |
|-------|-------------|
| clock_in | Squad assembled, Lil_Hawks roll call |
| execution | Waves executed, capabilities run |
| verification | Attestation, compliance checks |
| debrief | Performance review, lessons learned |
| clock_out | Receipt sealed, KYB finalized |

## Capability Registry

### Crane Ops (Heavy Infrastructure)

| Capability | Description |
|------------|-------------|
| infrastructure_deploy | Deploy cloud resources |
| database_migration | Schema changes, data moves |
| heavy_compute | Large-scale processing |

**Lil_Hawks:** Lil_Popeye_Hawk, Lil_IronWing_Hawk, Lil_StackMaster_Hawk

### Load Ops (File/Data Movement)

| Capability | Description |
|------------|-------------|
| file_operations | Upload, download, transform |
| data_transfer | Move data between systems |
| config_updates | Configuration changes |

**Lil_Hawks:** Lil_Busy_Hawk, Lil_Scurry_Hawk, Lil_Parcel_Hawk

### Deploy Ops (Build & Release)

| Capability | Description |
|------------|-------------|
| container_build | Build container images |
| artifact_publish | Push to registries |
| deployment_execute | Roll out changes |

**Lil_Hawks:** Lil_Packer_Hawk, Lil_ShipIt_Hawk, Lil_Rollout_Hawk

### Safety Ops (Security & Compliance)

| Capability | Description |
|------------|-------------|
| security_scan | Vulnerability scanning |
| anomaly_detection | Behavior analysis |
| compliance_check | Standards verification |

**Lil_Hawks:** Lil_RedFlag_Hawk, Lil_Seatbelt_Hawk, Lil_Guardian_Hawk

## Y-ISO Standards

Internal quality and safety framework:

| Standard | Name | Description |
|----------|------|-------------|
| Y-ISO-01 | Manifest Integrity | Every deploy has complete Manifest |
| Y-ISO-02 | Environment Isolation | Stage ≠ Prod |
| Y-ISO-03 | Secrets Hygiene | No plaintext secrets |
| Y-ISO-04 | Observability | Full tracing and logging |
| Y-ISO-05 | Rollback Readiness | Always revertible |
| Y-ISO-06 | Human Escalation | Know when to ask |
| Y-ISO-07 | Continuous Certification | Regular audits |

## Deploy Security Packet (DSP)

Every Shift requires an approved DSP containing:

### Sections

1. **Identity & Access** - Who can do what
2. **Network** - Allowlists, firewall rules
3. **Secrets & Data** - Permitted secrets, data access
4. **Supply Chain** - Approved dependencies
5. **Runtime Hardening** - Security configurations
6. **Detection & Response** - Monitoring rules
7. **Audit Evidence** - Compliance artifacts

### DSP ID Pattern

`DSP-<8 alphanumeric chars>`

Example: `DSP-ABC12345`

## Live Ops Theater

Watch-only view for users to observe operations without interaction.

### Features

- Real-time event stream (sanitized)
- Lil_Hawk status indicators
- Security indicators (mTLS, allowlist, scans)
- Progress timeline
- Comedy captions (optional)

### Caption Types

| Type | Example |
|------|---------|
| roll_call | "All hands on deck! Roll call in progress." |
| execution | "Wave 2 in progress. Stay in your lanes." |
| humor | "Container sealed tighter than my lips about that rollback." |
| values | "Every manifest is a chance to level up." |
| completion | "Shift complete. Receipt sealed. Good work, team." |

### Redaction Rules

- Secrets: Always omitted
- Internal endpoints: Omitted
- Stack traces: Summarized
- Debug info: Omitted

## Circuit Box Integration

ACHEEVY calls Deploy Platform tools through the Circuit Box:

### Available Tools

| Tool | Description |
|------|-------------|
| `deploy_it` | Fast dispatch lane |
| `guide_me` | Consultative lane |
| `spawn_shift` | Create new Shift |
| `execute_wave` | Run wave operations |
| `verify_shift` | Run verification |
| `seal_receipt` | Finalize Shift |
| `get_shift_status` | Check progress |
| `trigger_rollback` | Initiate rollback |
| `emergency_kill_switch` | Halt all operations |

### Validation Gates

| Gate | Description |
|------|-------------|
| dsp_gate_check | DSP approved and active |
| oei_check | Operational Exposure Index |
| quota_check | User quota and rate limits |
| certification_check | Lil_Hawk certifications |

## File Structure

```
infra/deploy-platform/
├── circuit-box/
│   ├── acheevy-tools.json         # Tool definitions
│   ├── chicken-hawk-dispatch.json # API contract
│   └── circuit-box-config.json    # Hub configuration
├── lore/
│   ├── workforce-structure.json   # Career levels
│   ├── y-iso-standards.json       # Quality standards
│   ├── lil-hawk-designations.json # Worker types
│   ├── live-ops-theater.json      # Theater config
│   ├── evolution-bounds.json      # Safe tuning
│   └── career-record-schema.json  # Career tracking
├── contracts/
│   ├── shift-contract-schema.json # Shift contract
│   └── deploy-security-packet.json # DSP schema
└── registry/
    ├── capability-registry.json   # Available ops
    └── bot-moniker-rules.json     # Naming rules
```

## Example Flow

```
1. User: "Deploy my app to staging"

2. ACHEEVY analyzes intent, creates Manifest:
   - Target: staging
   - Capabilities: container_build, deployment_execute
   - Waves: 2 (build, deploy)

3. Circuit Box validates:
   - DSP: Approved for staging
   - OEI: Low (0.2)
   - Quota: OK

4. Chicken_Hawk spawns Squad:
   - Squad_SH-ABC12345-001
   - Lil_Packer_Hawk (build)
   - Lil_ShipIt_Hawk (deploy)
   - Lil_RedFlag_Hawk (safety)

5. Lil_Hawks execute:
   - Wave 1: Build container
   - Wave 2: Deploy to staging
   - Events stream to Live Ops Theater

6. Verification:
   - Security scan passed
   - Health check passed
   - Attestation signed

7. Receipt sealed:
   - RCP-XYZ78901
   - KYB flight recorder archived

8. ACHEEVY to User:
   "Done! Your app is deployed to staging.
    Receipt: RCP-XYZ78901"
```
