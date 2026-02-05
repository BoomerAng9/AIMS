---
id: "best-practices"
name: "Best Practices & Standards"
type: "skill"
status: "active"
triggers:
  - "prd"
  - "sop"
  - "kpi"
  - "okr"
  - "best practice"
  - "standard"
  - "process"
  - "documentation"
  - "template"
  - "checklist"
  - "procedure"
description: "Generate PRDs, SOPs, KPI dashboards, OKR frameworks, and PR checklists aligned with ORACLE gates."
execution:
  target: "api"
  route: "/api/skills/best-practices"
dependencies:
  files:
    - "docs/ORACLE_CONCEPTUAL_FRAMEWORK.md"
    - "docs/PROTOCOLS_ACP_UCP_MCP.md"
    - "docs/LUC_INTEGRATION_GUIDE.md"
priority: "high"
---

# Best Practices & Standards Skill

## Available Templates

### PRD (Product Requirements Document)
```markdown
# PRD: [Feature Name]

## Problem Statement
What problem does this solve?

## Target User
Who is this for? (1000 people framework)

## Requirements
### Must Have (P0)
- [ ] Requirement 1
### Should Have (P1)
- [ ] Requirement 2
### Nice to Have (P2)
- [ ] Requirement 3

## Success Metrics
- KPI 1: [metric] (target: [value])
- KPI 2: [metric] (target: [value])

## Technical Approach
- Stack: [what technologies]
- Integration points: [what connects where]

## ORACLE Gate Alignment
- Gate 3 (Strategy): How does this align with sprint intent?
- Gate 4 (Judge): Estimated token/compute cost
```

### SOP (Standard Operating Procedure)
```markdown
# SOP: [Process Name]
Version: 1.0 | Owner: [role] | Last Updated: [date]

## Purpose
Why this process exists.

## Scope
What this covers and what it does not.

## Steps
1. Step 1: [action]
   - Input: [what you need]
   - Output: [what this produces]
2. Step 2: [action]
   ...

## Quality Gates
- [ ] ORACLE Gate 1: Technical validation
- [ ] ORACLE Gate 2: Security check
- [ ] ORACLE Gate 7: Documentation complete

## Escalation
If [condition], escalate to [role].
```

### KPI Dashboard Schema
```json
{
  "dashboard": "[Name]",
  "metrics": [
    {
      "name": "Deploy Time (p50)",
      "current": 0,
      "target": 300,
      "unit": "seconds",
      "source": "UEF Gateway logs"
    },
    {
      "name": "Activation Rate",
      "current": 0,
      "target": 0.8,
      "unit": "percentage",
      "source": "First plug run within 10 min"
    },
    {
      "name": "7-Day Retention",
      "current": 0,
      "target": 0.6,
      "unit": "percentage",
      "source": "Firestore user activity"
    },
    {
      "name": "Revenue Per Workspace",
      "current": 0,
      "target": 29,
      "unit": "USD/month",
      "source": "Stripe"
    },
    {
      "name": "Cost Per Run",
      "current": 0,
      "target": 0.05,
      "unit": "USD",
      "source": "LUC Engine"
    }
  ]
}
```

### OKR Framework
```markdown
# OKR: [Quarter]

## Objective 1: [Big Goal]
- KR1: [Measurable result] (baseline: X, target: Y)
- KR2: [Measurable result] (baseline: X, target: Y)
- KR3: [Measurable result] (baseline: X, target: Y)

## Objective 2: [Big Goal]
...
```

### PR Review Checklist (ORACLE-Aligned)
```markdown
## Pre-Merge Checklist
- [ ] Gate 1 (Technical): `npx next build` passes, no lint errors
- [ ] Gate 2 (Security): No API keys, no .env files committed
- [ ] Gate 3 (Strategy): Changes match PR description and sprint goal
- [ ] Gate 4 (Judge): LUC cost estimate acceptable
- [ ] Gate 5 (Perception): No hallucinated/placeholder code
- [ ] Gate 6 (Effort): Minimal diff, no unnecessary changes
- [ ] Gate 7 (Documentation): README/docs updated if public API changed
```

## DMAIC / DMADV Alignment
- **Define:** PRD template captures the "what" and "why"
- **Measure:** KPI schema captures baseline + target
- **Analyze:** OKR framework connects objectives to key results
- **Improve/Design:** SOP template standardizes execution
- **Control/Verify:** PR checklist ensures quality via ORACLE gates
