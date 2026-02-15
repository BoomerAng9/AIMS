---
id: "pr-evidence-checklist"
name: "PR Evidence Checklist"
type: "hook"
status: "active"
triggers: ["pr", "pull request", "merge"]
description: "Requires evidence artifacts before merge: screenshots, responsive checks, routes list, telemetry proof, naming scan."
execution:
  target: "internal"
priority: "high"
---

# PR Evidence Checklist Hook

> No proof, no merge. Every PR must include verifiable evidence.

## Required Evidence (All PRs)

| Evidence | Format | Description |
|----------|--------|-------------|
| **Brand Strings Scan** | Text report | Output of brand-strings-enforcer showing 0 violations |
| **Routes List** | Markdown table | All affected routes with before/after status |
| **Build Success** | CI output | `npm run build` passes for affected packages |

## Additional Evidence (Design / Redesign PRs)

When the `design-redesign-trigger` hook has fired:

| Evidence | Format | Description |
|----------|--------|-------------|
| **Design Packet** | Markdown | Tokens, motion rules, layout rules, anchor usage |
| **Teardown Log** | Markdown | What was removed/disabled |
| **Responsive Screenshots** | Images or descriptions | Desktop (1440+), tablet (768), mobile (375) |
| **Responsive Fit Report** | Markdown | Confirmation: no clipping, no overflow, centered on load |
| **Before/After Route Map** | Markdown | Routes that existed before and after |

## Additional Evidence (Integration PRs)

| Evidence | Format | Description |
|----------|--------|-------------|
| **Integration Test** | Test output | Successful connection/message delivery |
| **Security Check** | Text | Confirmation no credentials exposed in code |

## Additional Evidence (Deploy PRs)

| Evidence | Format | Description |
|----------|--------|-------------|
| **Health Check** | Test output | All services responding post-deploy |
| **Telemetry Proof** | Screenshot/log | Monitoring shows normal operation |
| **Rollback Plan** | Markdown | Steps to revert if issues arise |

## PR Template

PRs should include an evidence section:

```markdown
## Evidence

- [ ] Brand strings scan: 0 violations
- [ ] Routes list: [link or inline]
- [ ] Build success: [CI link]
- [ ] Responsive check: [screenshots or description]
- [ ] Teardown log: [if redesign]
- [ ] Design packet: [if design work]
```

## Enforcement

- PR review checklist is auto-generated based on which hooks fired
- Missing evidence items are flagged as warnings
- Critical evidence (brand scan, build success) blocks merge
- Non-critical evidence (screenshots) generates a warning but allows merge with reviewer approval
