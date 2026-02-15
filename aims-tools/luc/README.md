# LUC (Ledger Usage Calculator)

> **Pronunciation:** "LUKE" (not L-U-C)

Production-grade usage tracking, quota management, and billing engine for A.I.M.S. workspaces.

## Overview

LUC is a headless, brand-neutral module that provides:

- **Usage Tracking**: Append-only event logging for all billable operations
- **Quota Management**: Real-time quota checking and enforcement
- **Billing Engine**: Cost calculation based on service rates
- **Policy Layer**: Configurable limits, thresholds, and overage policies
- **Preset System**: Industry-specific calculators (e.g., Real Estate Flip)

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Consumers                             │
│  (UI, API Routes, MCP/ACP, CLI)                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     luc.adapters.ts                          │
│  - Request validation (Zod)                                  │
│  - Storage/Policy adapter interfaces                         │
│  - UI formatting helpers                                     │
│  - API client                                                │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      luc.engine.ts                           │
│  - Pure functions (no side effects)                          │
│  - canExecute, estimate, recordUsage, creditUsage           │
│  - generateSummary, generateLucState                         │
│  - Quota calculations                                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    luc.constants.ts                          │
│  - SERVICE_KEYS (stable, never change)                       │
│  - SERVICE_CATALOG (metadata)                                │
│  - LUC_DEFAULTS (thresholds)                                │
│  - PLAN_IDS, OVERAGE_POLICIES                               │
└─────────────────────────────────────────────────────────────┘
```

## Service Keys (Stable)

Service keys are immutable identifiers. Once published, they must never change.

| Key | Description | Unit |
|-----|-------------|------|
| `llm_tokens_in` | LLM input tokens | token |
| `llm_tokens_out` | LLM output tokens | token |
| `n8n_executions` | n8n workflow runs | execution |
| `node_runtime_seconds` | Node compute time | second |
| `swarm_cycles` | Agent swarm cycles | cycle |
| `brave_queries` | Web search queries | query |
| `voice_chars` | TTS characters | character |
| `stt_minutes` | STT duration | minute |
| `container_hours` | Container runtime | hour |
| `storage_gb_month` | Storage allocation | GB-month |
| `bandwidth_gb` | Data transfer | GB |
| `boomer_ang_invocations` | Boomer_Ang calls | invocation |
| `agent_executions` | Agent tasks | execution |
| `deploy_operations` | Deployment ops | operation |
| `api_calls` | Generic API calls | call |

## Required Flow

Every billable capability must follow this pattern:

```typescript
import { LucAdapter } from "@/aims-tools/luc";

// 1. Check if operation is allowed
const check = await luc.canExecute({
  workspaceId,
  serviceKey: "llm_tokens_in",
  units: estimatedTokens,
});

if (!check.canExecute) {
  throw new Error(check.reason);
}

// 2. Execute the capability
const result = await executeCapability();

// 3. Record actual usage
const usage = await luc.recordUsage({
  workspaceId,
  serviceKey: "llm_tokens_in",
  units: actualTokens,
  metadata: { toolId: "my_tool" },
});

// 4. Return result with LUC state
return {
  ...result,
  luc_state: usage,
};
```

## Configuration

LUC uses a policy-driven configuration system:

1. **Platform Defaults** - Base configuration
2. **Workspace Overrides** - Per-workspace customization
3. **Project Overrides** - Per-project limits (stub)
4. **Environment Overrides** - Per-env settings (stub)

Plan limits are stored in policy storage, not hardcoded.

## Default Thresholds

| Setting | Default | Description |
|---------|---------|-------------|
| `SOFT_WARN_THRESHOLD` | 80% | Show warning |
| `HARD_WARN_THRESHOLD` | 95% | Critical warning |
| `OVERAGE_BUFFER` | 10% | Allow before blocking |
| `BILLING_CYCLE_DAYS` | 30 | Billing period |

## UI Integration

### Status Strip

The global status strip shows:
- Overall LUC usage percentage
- Warning level indicator
- Active Boomer_Angs count
- Link to /workspace/luc

### Workspace LUC Page

Features:
- Service selector dropdown
- Units input
- Simulate vs Live mode toggle
- Estimate display with quota impact
- Historical usage breakdown

## Presets

LUC supports industry-specific presets for specialized calculators.

### Real Estate Flip Preset

Located at: `/aims-tools/luc/presets/real-estate-flip/`

- `preset.json` - Field definitions
- `formulas.json` - Calculation formulas

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/luc/can-execute` | Check quota |
| POST | `/api/luc/estimate` | Estimate impact |
| POST | `/api/luc/record` | Record usage |
| POST | `/api/luc/credit` | Credit usage |
| GET | `/api/luc/summary` | Get summary |
| GET | `/api/luc/state` | Get LUC state |

## Testing

```bash
# Run unit tests
npm run test:luc

# Run integration tests
npm run test:luc:integration

# Run preset validation
npm run test:luc:presets
```

## Non-Negotiables

1. **No provider keys in user's hands** - Metering is per tenant/workspace
2. **All billable calls gated and metered** - No exceptions
3. **Policy-driven limits** - No hardcoded plan limits in services
4. **UI is a consumer** - All math/logic in headless engine
5. **Use Boomer_Ang spelling** - Not "BoomerAng" or "Boomer Ang"

## Module Files

- `luc.constants.ts` - Service keys, defaults, categories
- `luc.schemas.ts` - Zod validation schemas
- `luc.engine.ts` - Pure business logic functions
- `luc.adapters.ts` - UI/API bindings
- `tool.manifest.ts` - Tool registration
- `README.md` - This file
