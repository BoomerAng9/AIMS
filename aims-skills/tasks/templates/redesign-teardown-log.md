---
id: "redesign-teardown-log"
name: "Redesign Teardown Log"
type: "task"
status: "active"
triggers: ["teardown", "teardown log", "redesign log"]
description: "Template for documenting what was removed, what was rebuilt, and what was verified during a redesign."
execution:
  target: "internal"
priority: "high"
---

# Redesign Teardown Log

> Document everything that changed. No silent removals.

## Metadata

| Field | Value |
|-------|-------|
| **Date** | |
| **Scope** | (e.g., "Full dashboard redesign", "Chat UI overhaul") |
| **Triggered by** | (prompt/issue that initiated the redesign) |
| **Design Packet** | (link to completed design packet) |

## 1. Pre-Teardown Freeze

### Routes (Before)
| Route | Page | Status |
|-------|------|--------|
| | | Active / Deprecated / Removed |

### Must-Not-Break Flows
| Flow | Description | Protected |
|------|-------------|-----------|
| | | Yes / No |

### Component Tree Snapshot
```
[Document the component hierarchy that existed before teardown]
```

## 2. Teardown Actions

### Files Removed
| File | Reason |
|------|--------|
| | |

### Files Disabled / Deprecated
| File | Action | Reason |
|------|--------|--------|
| | Disabled / Deprecated | |

### Styles Removed
| Style/Class | Scope | Reason |
|-------------|-------|--------|
| | | |

### Dependencies Removed
| Package | Reason |
|---------|--------|
| | |

## 3. Rebuild Actions

### Files Created
| File | Purpose |
|------|---------|
| | |

### Files Modified
| File | What Changed |
|------|-------------|
| | |

### New Dependencies
| Package | Purpose |
|---------|---------|
| | |

## 4. Verification

### Routes (After)
| Route | Page | Status | Changed? |
|-------|------|--------|----------|
| | | | |

### Responsive Fit
| Viewport | Width | Status | Notes |
|----------|-------|--------|-------|
| Desktop | 1440px | Pass / Fail | |
| Tablet | 768px | Pass / Fail | |
| Mobile | 375px | Pass / Fail | |

### Brand Strings Scan
- [ ] `A.I.M.S.` — correct everywhere
- [ ] `ACHEEVY` — correct everywhere
- [ ] `Chicken Hawk` — correct everywhere
- [ ] `Boomer_Ang` / `Boomer_Angs` — correct everywhere
- [ ] `Lil_*_Hawk` — correct everywhere
- [ ] `Circuit Box` — correct everywhere

### Quality Checks
- [ ] No clipping on first paint (all viewports)
- [ ] No unbounded overflow
- [ ] Content centered with consistent padding
- [ ] All critical flows still work
- [ ] Build passes (`npm run build`)

## Sign-Off

- [ ] Freeze documented
- [ ] Teardown complete — no patchwork layering
- [ ] Rebuild complete — all components use token system
- [ ] Verification passed — responsive, naming, quality
