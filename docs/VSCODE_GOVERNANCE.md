# VS Code Governance — A.I.M.S. Unified Platform

## Change Order ID: CO-VSCE-001

**Effective Date:** February 5, 2026  
**Status:** Active  
**Owner:** Platform Architecture / ACHEEVY (Digital CEO)

---

## Overview

This document formalizes the governance model for VS Code editor sessions within the A.I.M.S. platform. The editor is now a **governed build surface**, not a standalone IDE.

All editor actions comply with:
- **ACP** (Actor Control Policy) — who can do what
- **UCP** (Usage Control Policy) — how much/how long/how risky
- **LUC** (Lumin Usage Credits) — metered consumption

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    VS Code Editor                        │
│  ┌─────────────────────────────────────────────────┐    │
│  │              Command Palette / Tasks             │    │
│  └─────────────────────┬───────────────────────────┘    │
│                        │                                 │
│  ┌─────────────────────▼───────────────────────────┐    │
│  │           scripts/aims-run.sh                    │    │
│  │         (Governed Command Gateway)               │    │
│  └─────────────────────┬───────────────────────────┘    │
│                        │                                 │
│  ┌─────────────────────▼───────────────────────────┐    │
│  │           .aims/context.json                     │    │
│  │    (Runtime Context: tenant, job, actor)         │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
                         │
           ┌─────────────┼─────────────┐
           │             │             │
           ▼             ▼             ▼
      ┌────────┐   ┌────────┐   ┌────────┐
      │  ACP   │   │  UCP   │   │  LUC   │
      │ Policy │   │ Budget │   │ Meter  │
      └────────┘   └────────┘   └────────┘
```

---

## Context Object

Every VS Code session requires a context file at `.aims/context.json`:

```json
{
  "tenant_id": "tnt_acheevy_001",
  "user_id": "usr_boomerang9",
  "job_id": "job_branding_integration",
  "actor_id": "builder_ang",
  "environment": "dev",
  "budget_envelope_id": "be_dev_unlimited",
  "risk_tier": "low",
  "capabilities": {
    "can_edit_files": true,
    "can_run_tests": true,
    "can_build": true,
    "can_deploy_dev": true,
    "can_deploy_staging": false,
    "can_deploy_prod": false,
    "can_modify_secrets": false
  },
  "limits": {
    "max_iterations": 100,
    "max_wall_time_minutes": 120,
    "max_cpu_minutes": 60,
    "max_luc_spend": 1000
  }
}
```

---

## Boomer_Ang Actors

| Actor ID | Capabilities | Use Case |
|----------|-------------|----------|
| `builder_ang` | Edit, Build, Test, Deploy Dev | Primary development |
| `tester_ang` | Test, Coverage only | QA validation |
| `ii_agent` | Autonomous execution | Headless automation |
| `reviewer_ang` | Read-only, Comments | Code review |

---

## Allowed Commands

| Command | Description | Capability Required |
|---------|-------------|---------------------|
| `next-dev` | Start Next.js dev server | `can_edit_files` |
| `test` | Run test suite | `can_run_tests` |
| `build` | Build production artifact | `can_build` |
| `claude` | Claude Code CLI (governed) | `can_edit_files` |
| `ii-frontend` | ii-agent frontend dev | `can_edit_files` |
| `ii-backend` | ii-agent backend dev | `can_edit_files` |
| `deploy-vps` | Deploy to VPS | `can_deploy_dev` |
| `healthcheck` | Check service health | (any) |
| `lint` | Run linter | `can_edit_files` |
| `format` | Run formatter | `can_edit_files` |

---

## Blocked Operations

The following are explicitly blocked:
- Direct `kubectl`, `helm`, `terraform` execution
- SSH to production servers
- Secret modification
- Cross-tenant workspace access
- Infinite agent loops (hard UCP stop)
- Production deployment from editor

---

## Extension Policy

### Allowed Extensions
- Git
- ESLint
- Prettier
- Docker (read/build only)
- Claude Code extension
- Python
- TypeScript

### Blocked Extensions
- Remote SSH
- Kubernetes
- Cloud credential managers
- Arbitrary marketplace installs

---

## Audit Logging

All actions are logged to `.aims/logs/editor-actions.log`:

```
2026-02-05T01:41:00Z | action=build | actor=builder_ang | job=job_123 | tenant=tnt_acheevy_001 | details=Building frontend artifact
```

---

## Budget Enforcement

UCP limits are enforced per job:
- **Max Iterations**: 100 (configurable)
- **Max Wall Time**: 120 minutes
- **Max CPU Minutes**: 60
- **Max LUC Spend**: 1000 credits

When limits are reached:
1. Graceful halt with clear message
2. Audit log entry
3. Option to request approval

---

## Fonts

The A.I.M.S. platform uses these Google Fonts:
- **DOTO** — Primary headings, futuristic tech aesthetic
- **Permanent Marker** — Accent text, bold statements
- **Caveat** — Handwritten feel, personal notes

---

## Usage

### Via Command Palette
1. `Ctrl+Shift+P` → "Tasks: Run Task"
2. Select from AIMS tasks

### Via Launch Config
1. `F5` or Run panel
2. Select configuration

### Via Terminal
```bash
./scripts/aims-run.sh <action>
```

---

## Acceptance Criteria

✅ VS Code sessions cannot run without context object  
✅ All actions attributable to tenant/job/actor  
✅ Claude Code CLI halts on UCP limits  
✅ No editor session can deploy to prod  
✅ Audit logs capture all actions  

---

## Related Documents

- [ACP Policy Engine](./PROTOCOLS_ACP_UCP_MCP.md)
- [LUC Integration Guide](./LUC_INTEGRATION_GUIDE.md)
- [AIMS Overview](./AIMS_OVERVIEW.md)
