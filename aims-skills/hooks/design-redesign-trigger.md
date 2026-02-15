---
id: "design-redesign-trigger"
name: "Design Redesign Trigger"
type: "hook"
status: "active"
triggers:
  - "redesign"
  - "overhaul"
  - "tear down"
  - "new background"
  - "new UI world"
  - "hangar"
  - "Circuit Box redesign"
  - "refresh"
  - "fix the UI"
description: "Detects redesign intent and enforces teardown + rebuild workflow with required output artifacts."
execution:
  target: "internal"
priority: "critical"
---

# Design Redesign Trigger Hook

> Redesign = Full Teardown + Rebuild. No patchwork layering. Ever.

## Trigger Conditions

This hook fires if ANY of the following are true:

### Keyword Triggers
The prompt includes any of: "redesign", "overhaul", "tear down", "new background", "new UI world", "hangar", "Circuit Box redesign", "refresh", "fix the UI"

### Structural Triggers
Any change touches:
- Global layout (root layout, navigation shell)
- Background system (page backgrounds, Hangar environment)
- Typography system (font scale, font family changes)
- Core component primitives (Button, Card, Input, etc.)
- Responsive layout across desktop/tablet/mobile

## Required Workflow

When the trigger fires, the following sequence is enforced:

### 1. Freeze
- Capture current UI state
- Document existing routes
- List "must-not-break" flows
- Take reference screenshots (or document component tree)

### 2. Teardown
- Remove or disable old layout/components/styles being replaced
- No layering new on top of old
- Document everything removed in the teardown log

### 3. Rebuild
- Implement new design using the design packet
- All components reference the token system
- No magic numbers, no inline style overrides

### 4. Audit
- Responsive fit: desktop (1440+), tablet (768-1439), mobile (<768)
- No clipping, no unbounded overflow on first paint
- Brand actor naming is exact (verified by brand-strings-enforcer)
- All primary content visible and centered on load

## Required Output Artifacts (Minimum)

No redesign PR is "done" without these:

| Artifact | Description |
|----------|-------------|
| **Design Packet** | Tokens + motion rules + layout rules + anchor imagery usage |
| **Teardown Log** | What was removed/disabled and why |
| **Before/After Route Map** | Routes that existed before and after the change |
| **Responsive Fit Report** | Desktop/tablet/mobile verification — no clipping |
| **Brand Strings Scan Report** | Confirm exact naming of all brand actors |

## Enforcement

If this hook fires and the required artifacts are not present in the PR:
- The PR is flagged as incomplete
- The `pr-evidence-checklist` hook will block merge
