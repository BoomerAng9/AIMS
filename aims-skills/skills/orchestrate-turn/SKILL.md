---
name: orchestrate-turn
description: |
  Orchestrate Turn — ACHEEVY brain main execution path.
  Use when: a user message arrives (voice or text) and the system needs to process it
  through the full ACHEEVY pipeline: load state, compose prompt, call model, parse tools,
  stream response.
role: Primary Orchestrator
intent: Process every user message through the ACHEEVY brain's main execution path (load state -> compose prompt -> call model -> parse tools -> stream response).
kpis:
  - turn_latency_ms
  - tool_call_success_rate
  - session_state_consistency
status: active
priority: critical
triggers:
  - user_message
  - voice_input
  - text_submit
  - explicit_continue
execution: sequential — 6-step pipeline (load session -> compose prompt -> call model -> parse tool calls -> execute tools -> stream response)
dependencies:
  - OPENROUTER_API_KEY
---

# Orchestrate Turn

This is the core execution skill for ACHEEVY. Every user message — whether typed or spoken —
flows through this 6-step pipeline. This skill is the heartbeat of the platform.

## Trigger Conditions

| Trigger | Source | Description |
|---|---|---|
| `voice_input` | Microphone / ElevenLabs STT | User spoke a command or question |
| `text_submit` | Chat input field | User typed and submitted a message |
| `explicit_continue` | "Continue" button in UI | User explicitly requested continuation of a paused workflow |

### No-Click-Trigger Rule

ACHEEVY must NEVER auto-trigger a turn without explicit user input. No polling, no timers,
no "are you still there?" prompts. The user initiates every turn.

## Execution Steps

### Step 1: Load Session State

Load the current session from Redis (or initialize a new one):

- `session_id` — unique per user conversation
- `message_history` — rolling context window (last N messages)
- `active_tools` — tools currently available to ACHEEVY
- `user_profile` — role, permissions, platform mode (PRIVATE/PUBLIC)
- `skill_context` — any active skill that should influence the prompt

### Step 2: Compose System Prompt

Build the system prompt from four layers:

1. **Base personality** — ACHEEVY's core identity, tone, and behavioral rules
2. **Skill overlay** — if a skill is active, inject its instructions into the system prompt
3. **Tool definitions** — list of available tools with their schemas
4. **Session context** — recent message history, user profile, active state

The four layers are concatenated in order. Later layers can override earlier ones
(e.g., a skill can override the default tone for a specific workflow).

### Step 3: Call Model

Route to the appropriate LLM via the `openrouter-llm` skill:

- Include the composed system prompt
- Include the user's message as the latest user turn
- Set appropriate thinking level based on task complexity
- Enable streaming for real-time response delivery

### Step 4: Parse Tool Calls

If the model response contains tool calls:

- Extract tool name and arguments from the response
- Validate tool name against `active_tools`
- Validate arguments against the tool's JSON schema
- Queue tools for execution (do not execute inline during parsing)

### Step 5: Execute Tools

For each queued tool call:

- Check user permissions (does this user/role have access to this tool?)
- Execute the tool via the UEF Gateway
- Capture the tool result (success or error)
- Append the tool result to the message history
- If the tool modifies session state, update Redis

If any tool requires human approval (destructive actions, cost thresholds), pause and
prompt the user before executing.

### Step 6: Stream Response

Stream the model's text response to the user in real-time:

- If tool calls were executed, the response includes tool results
- If the model needs another turn (e.g., after tool results), loop back to Step 3
- Update session state in Redis with the complete turn
- Emit `turn_latency_ms` KPI

## State Consistency

After every turn:

- `session_state_consistency` KPI verifies that Redis state matches the expected state
- Message history is trimmed to stay within context window limits
- Orphaned tool calls (started but not completed) are cleaned up

## Anti-Patterns

- Auto-triggering turns without user input (violates no-click-trigger rule).
- Executing tools inline during parsing (must queue and execute in Step 5).
- Skipping permission checks on tool execution (security violation).
- Not streaming the response (users expect real-time feedback, not batch).
- Allowing message history to grow unbounded (will exceed context window).
