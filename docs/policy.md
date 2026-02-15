# LUC Policy Documentation

## Overview

LUC uses a layered policy system where configuration cascades from platform defaults through workspace-specific overrides. This allows flexible customization while maintaining platform-wide governance.

## Policy Hierarchy

```
┌──────────────────────────────────┐
│         Platform Defaults         │  (Lowest priority)
├──────────────────────────────────┤
│       Workspace Overrides         │
├──────────────────────────────────┤
│        Project Overrides          │  (Stub - future)
├──────────────────────────────────┤
│      Environment Overrides        │  (Stub - future)
└──────────────────────────────────┘  (Highest priority)
```

## Platform Defaults

These are the base settings applied to all workspaces:

```json
{
  "softWarnThreshold": 0.8,
  "hardWarnThreshold": 0.95,
  "overageBuffer": 0.1,
  "billingCycleDays": 30,
  "showBoomerAngNames": false
}
```

## Workspace Policy Schema

```typescript
{
  quotaOverrides?: Record<ServiceKey, number>;
  rateOverrides?: Record<ServiceKey, number>;
  overagePolicy?: "block" | "allow_overage" | "soft_limit";
  softWarnThreshold?: number; // 0-1
  hardWarnThreshold?: number; // 0-1
  showBoomerAngNames?: boolean;
  customSettings?: Record<string, unknown>;
}
```

## Effective Policy Calculation

When a policy value is needed:

1. Start with platform default
2. Apply workspace override if present
3. Apply project override if present (future)
4. Apply environment override if present (future)

Example:
```javascript
const effectiveSoftWarn =
  envPolicy?.softWarnThreshold ??
  projectPolicy?.softWarnThreshold ??
  workspacePolicy?.softWarnThreshold ??
  platformDefaults.softWarnThreshold;
```

## Policy Versioning

All policies are versioned for audit and rollback:

- **Draft**: Work-in-progress, not applied
- **Effective**: Currently active policy
- **Superseded**: Previously effective, now replaced

## Changing Policies

### Create/Edit Draft

```typescript
await policyService.saveDraft("WORKSPACE", workspaceId, {
  softWarnThreshold: 0.75,
  quotaOverrides: {
    llm_tokens_in: 50000
  }
}, userId);
```

### Apply Draft

```typescript
await policyService.applyPolicy(draftId, userId, "Increasing LLM quota");
```

### Rollback

```typescript
await policyService.rollbackPolicy(
  "WORKSPACE",
  workspaceId,
  targetVersion,
  userId,
  "Reverting due to billing issue"
);
```

## Validation

All policies are validated via Zod schemas before apply:

- Thresholds must be 0-1
- Quota overrides must reference valid service keys
- Overage policy must be one of the allowed values

## Audit Trail

Every policy change is logged to the audit table:

- Who made the change (userId)
- What changed (previousValue, newValue)
- When it changed (timestamp)
- Why it changed (reason)

## Best Practices

1. **Test in Draft**: Always create a draft first and validate
2. **Document Reason**: Provide clear reason when applying
3. **Gradual Rollout**: Start with one workspace before platform-wide
4. **Keep History**: Don't delete policy versions
5. **Monitor Impact**: Watch for usage pattern changes after apply

## Quota Override Examples

### Increase LLM Quota for Power Users

```json
{
  "quotaOverrides": {
    "llm_tokens_in": 500000,
    "llm_tokens_out": 250000
  }
}
```

### Stricter Thresholds for Budget Control

```json
{
  "softWarnThreshold": 0.5,
  "hardWarnThreshold": 0.75,
  "overagePolicy": "block"
}
```

### Enterprise Unlimited

```json
{
  "quotaOverrides": {
    "llm_tokens_in": -1,
    "llm_tokens_out": -1,
    "n8n_executions": -1
  },
  "overagePolicy": "soft_limit"
}
```

## Troubleshooting

### Policy Not Applied
- Check draft was promoted to effective
- Verify no newer effective policy exists
- Check audit log for apply event

### Quota Still Exceeded
- Policy changes don't retroactively adjust usage
- Wait for billing period reset
- Or manually credit usage

### Rollback Failed
- Ensure target version exists
- Check user has admin permission
- Verify reason is provided
