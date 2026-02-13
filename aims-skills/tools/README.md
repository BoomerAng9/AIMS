# A.I.M.S. Tool Reference Documentation

This directory contains reference documentation for every external tool, API, and integration used by AIMS. These files are the knowledge base that ACHEEVY, Boomer_Angs, Chicken Hawk, and Lil_Hawks reference when wiring, debugging, or building with a tool.

## File Format

Every `.tool.md` file uses this structure:

```yaml
---
id: "tool-id"
name: "Human Name"
type: "tool"
category: "ai|voice|search|payments|database|email|messaging|infra|cloud|video|workflow|web|auth|ui|analytics"
provider: "Company Name"
description: "One-line description"
env_vars: ["VAR_NAME_1", "VAR_NAME_2"]
docs_url: "https://official-docs-url"
aims_files: ["path/to/implementation.ts"]
---
```

## How Agents Use These Files

1. **Chicken Hawk** reads tool docs before spawning Lil_Hawks to ensure correct API usage
2. **Boomer_Angs** reference docs when designing integration strategies
3. **ACHEEVY** checks env_vars to verify keys are configured before routing work
4. **Lil_Hawks** follow code examples and endpoint specs during execution

## Relationship to Skills & Tasks

| File Type | Location | Purpose |
|-----------|----------|---------|
| Tool Doc (here) | `tools/*.tool.md` | API reference, setup, env vars, code examples |
| Skill | `skills/*.skill.md` | Behavioral rules for HOW agents use a tool |
| Task | `tasks/*.md` | Executable work unit triggered by keywords |

Tool docs are pure reference. Skills and Tasks reference tool docs via `dependencies.files`.

## Programmatic Discovery

Import `TOOL_REGISTRY` from `tools/index.ts` for runtime tool discovery:

```typescript
import { TOOL_REGISTRY } from './tools';
const aiTools = TOOL_REGISTRY.filter(t => t.category === 'ai');
```
