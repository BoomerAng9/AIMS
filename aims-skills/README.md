# A.I.M.S. Skills Framework

Centralized trigger-aware system for Hooks, Tasks, and Skills.
ACHEEVY matches user prompts against trigger keywords to activate the right definition.

> **Brain File:** See [`ACHEEVY_BRAIN.md`](./ACHEEVY_BRAIN.md) for the complete single source of truth —
> identity, chain of command, all hooks, skills, tasks, verticals, recurring functions, and file map.

## Taxonomy

| Type    | Purpose                                         | Fires When              |
|---------|-------------------------------------------------|-------------------------|
| **Hook**  | Interceptors that fire BEFORE execution         | Guard rails, infra ops  |
| **Task**  | Executable units that DO work                   | Generate, render, query  |
| **Skill** | Persona/context injections that GUIDE work      | Design, standards, SOPs  |

## Trigger Priority

1. Plug Protocol (hooks/plug-protocol.md) — highest
2. Skills Registry match (keyword scan)
3. Legacy ACHEEVY keyword routing
4. Default (internal-llm)

## Definition Schema

Every `.md` file uses YAML frontmatter:

```yaml
---
id: "unique-id"
name: "Human Name"
type: "hook | task | skill"
status: "active | beta | disabled"
triggers: ["keyword1", "keyword2"]
description: "What this does"
execution:
  target: "api | cli | persona | internal"
  route: "/api/skills/id"
  command: "shell command"
dependencies:
  env: ["REQUIRED_VAR"]
  packages: ["npm-package"]
  files: ["path/to/file"]
priority: "critical | high | medium | low"
---
```

## Adding a New Definition

1. Create a `.md` file in the appropriate subdirectory
2. Add YAML frontmatter following the schema above
3. Add an entry to `frontend/lib/skills/registry.ts`
4. The trigger engine in `frontend/app/api/acheevy/route.ts` will pick it up automatically
