# LUC Requirements Document

## Objective

Build a production-grade Ledger Usage Calculator (LUC) for A.I.M.S. that provides:
- Headless usage tracking and billing engine
- Real-time quota management and enforcement
- Policy-driven configuration with layered overrides
- Industry-specific preset calculators (e.g., Real Estate Flip)

## Inputs

### User Inputs
- Workspace ID (tenant identifier)
- Service key (billable capability identifier)
- Usage units (amount consumed)
- Optional metadata (tool ID, route, Boomer_Ang owner)

### Configuration Inputs
- Plan definitions with quota limits
- Policy overrides at workspace/project/environment levels
- Threshold settings (soft warn, hard warn, overage buffer)

### Preset Inputs (Flip Secrets)
- Input fields defined in preset JSON
- User-provided values for calculation

## Outputs

### API Responses
- `canExecute`: Boolean permission with quota details
- `estimate`: Projected impact without mutation
- `recordUsage`: Confirmation with updated quota state
- `creditUsage`: Rollback confirmation
- `summary`: Full usage breakdown with costs

### UI Displays
- Status strip with overall usage percentage
- Active Boomer_Angs count
- Per-service quota breakdown
- Warning indicators at thresholds
- Preset calculation results

## Acceptance Criteria

### Core Engine
- [ ] LUC engine exists as a headless module callable from API and UI
- [ ] All functions are pure (no side effects)
- [ ] Service keys are stable and registered via tool.manifest.ts

### Gating
- [ ] `canExecute` gates ALL billable actions
- [ ] No operation proceeds without quota check
- [ ] Blocked when quota exceeded (based on policy)

### Metering
- [ ] `recordUsage` writes immutable events
- [ ] Quota aggregates update atomically
- [ ] Credits can reverse usage events

### Configuration
- [ ] Plan limits stored in policy storage, not hardcoded
- [ ] Policy layers: platform → workspace → project → environment
- [ ] Rollback to previous known-good policy supported

### UI
- [ ] Warnings appear at 80% (soft) and 95% (hard) thresholds
- [ ] Status strip shows LUC state and active Boomer_Angs
- [ ] /workspace/luc provides full calculator interface

### Presets
- [ ] Flip Secrets preset loads and calculates correctly
- [ ] All math in headless engine, not UI components
- [ ] Test cases validate expected outputs

### Evidence
- [ ] All gates produce evidence artifacts
- [ ] Evidence browsable in admin UI
- [ ] CI/CD pipeline enforces gates

## Non-Negotiables

1. No provider keys in user's hands
2. Every billable call gated and metered via LUC
3. Policy-driven limits (not hardcoded in services)
4. UI is a consumer (all logic in headless engine)
5. Use "Boomer_Ang" spelling only
