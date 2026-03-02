# SOP-01: Fast Planning & Role Realization

> Turn raw user input into an executable plan without assuming who exactly will execute it.

## Preconditions

- User input received (chat, UI, voice, or API)
- Executor registry available (roles + capabilities)
- Tool/MCP Registry accessible

## Steps

### Step 1: Intent Extraction

- Summarize the user's request as a single-line **Intent Statement**
- Map to a workspace or vertical (e.g., "growth", "infra", "UI", "content", "security")
- Identify urgency level: immediate, scheduled, or background

### Step 2: Role Realization (Agentic)

Each available executor type introspects:
- "Given my capabilities and current skills, what part of this intent can I own?"
- Result: a set of proposed responsibilities — not fixed identities

The Primary Orchestrator collects proposals and resolves conflicts.

### Step 3: Tool & MCP Discovery

- Query the global Tool/MCP Registry (see `TOOL_MCP_REGISTRY.md`)
- List relevant APIs and MCP servers for the intent
- Draft a **Plan Outline**:
  - Numbered steps
  - Responsible role (abstract, not identity) per step
  - Tools/MCPs needed per step
  - Expected outputs per step

### Step 4: GSD Pre-Check

Hand the draft plan to the GSD Bridge to:
- Prune scope to minimum viable
- Enforce narrowness standard (7-10 skill budget per executor)
- Ensure each step has at least one verifiable data or tool interaction
- Flag missing evidence paths

See `ABSTRACT_SPEC.md` Section 1.3 for full GSD Bridge specification.

### Step 5: Plan Commit

- Persist the final Plan Outline to shared memory (DB, Notion, files)
- Tag each step with its SOP phase (this is SOP-01)
- Plan is now available for SOP-02 (Execution Loop)

## Integration Points

- **Chain of Command Engine:** `aims-skills/chain-of-command/engine.ts` — validates routing
- **Vertical Detection Hook:** `aims-skills/acheevy-verticals/vertical-detection.hook.ts` — auto-detects matching vertical
- **Automations Hook:** `aims-skills/hooks/automations.hook.ts` — detects automatable patterns

## Outputs

- Intent Statement (single line)
- Plan Outline (steps + roles + tools + outputs)
- GSD validation result (pass/fail with reasons)
