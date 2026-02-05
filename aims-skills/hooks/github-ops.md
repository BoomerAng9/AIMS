---
id: "github-ops"
name: "GitHub Operations"
type: "hook"
status: "active"
triggers:
  - "pr"
  - "pull request"
  - "merge"
  - "branch"
  - "commit"
  - "github"
  - "push"
  - "review"
  - "release"
description: "Enforces PR/merge/branch best practices aligned with ORACLE gates."
execution:
  target: "cli"
  command: "gh"
dependencies:
  env: []
  packages: ["gh"]
  files:
    - "docs/ORACLE_CONCEPTUAL_FRAMEWORK.md"
priority: "high"
---

# GitHub Operations Hook

## Branch Naming Convention
```
feat/<ticket-or-slug>    -- New features
fix/<ticket-or-slug>     -- Bug fixes
chore/<ticket-or-slug>   -- Maintenance, deps, config
docs/<ticket-or-slug>    -- Documentation only
refactor/<slug>          -- Code restructure
```

## Commit Message Format
```
<type>(<scope>): <description>

[optional body]

Co-Authored-By: ACHEEVY <acheevy@aims.dev>
```

Types: feat, fix, chore, docs, refactor, test, perf

## PR Template
```markdown
## Summary
<1-3 bullet points>

## Changes
- [ ] File 1: description
- [ ] File 2: description

## ORACLE Gate Checklist
- [ ] Gate 1 (Technical): Linting passes, no type errors
- [ ] Gate 2 (Security): No secrets committed, OWASP check
- [ ] Gate 3 (Strategy): Changes align with sprint intent
- [ ] Gate 4 (Judge): Token/compute cost acceptable
- [ ] Gate 5 (Perception): No hallucinated code
- [ ] Gate 6 (Effort): Minimal token/step footprint
- [ ] Gate 7 (Documentation): README/docs updated if needed

## Test Plan
- [ ] Unit tests pass
- [ ] Build succeeds (`npx next build`)
```

## CLI Commands
```bash
# Create PR
gh pr create --title "feat(plugs): add Perform plug" --body "..."

# Review PR
gh pr review <number> --approve

# Merge PR
gh pr merge <number> --squash

# View PR checks
gh pr checks <number>
```

## Merge Strategy
- Default: **Squash merge** to main
- Feature branches merge into main only after ORACLE gate checklist passes
