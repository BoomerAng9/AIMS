# Acceptance Criteria — orchestrate-turn

## Trigger Handling

- [ ] Turns are triggered only by explicit user input: `voice_input`, `text_submit`, or `explicit_continue`.
- [ ] No auto-triggered turns — no polling, no timers, no "are you still there?" prompts.
- [ ] Each trigger type is correctly identified and logged.

## Session State (Step 1)

- [ ] Session is loaded from Redis on every turn, or a new session is initialized if none exists.
- [ ] `session_id`, `message_history`, `active_tools`, `user_profile`, and `skill_context` are all present.
- [ ] Session load failure produces a clear error and does not proceed to Step 2.

## Prompt Composition (Step 2)

- [ ] System prompt is composed from exactly four layers: base personality, skill overlay, tool definitions, session context.
- [ ] Layers are concatenated in the correct order (base -> skill -> tools -> session).
- [ ] Active skill context correctly overrides base behavior when applicable.

## Model Call (Step 3)

- [ ] Model is selected via the `openrouter-llm` skill routing table.
- [ ] Thinking level is set based on task complexity (not hardcoded).
- [ ] Streaming is enabled for all model calls.
- [ ] Model call failure triggers the fallback chain from `openrouter-llm`.

## Tool Parsing (Step 4)

- [ ] Tool calls are extracted from model response and validated against `active_tools`.
- [ ] Tool arguments are validated against the tool's JSON schema.
- [ ] Invalid tool calls are rejected with a clear error message appended to history.
- [ ] Tools are queued for execution, never executed inline during parsing.

## Tool Execution (Step 5)

- [ ] User permissions are checked before every tool execution.
- [ ] Destructive actions and cost-threshold tools require human approval before execution.
- [ ] Tool results (success or error) are appended to message history.
- [ ] Session state in Redis is updated after tool execution.
- [ ] `tool_call_success_rate` KPI is emitted per tool execution.

## Response Streaming (Step 6)

- [ ] Model response is streamed to the user in real-time (not batched).
- [ ] If tool results require a follow-up model call, the pipeline loops back to Step 3.
- [ ] Session state is updated in Redis after the complete turn.
- [ ] `turn_latency_ms` KPI is emitted measuring total turn duration (Step 1 through Step 6).

## State Consistency

- [ ] `session_state_consistency` KPI verifies Redis state matches expected state after every turn.
- [ ] Message history is trimmed to stay within context window limits.
- [ ] Orphaned tool calls (started but not completed) are cleaned up on turn completion.

## Performance

- [ ] Target turn latency: <2000ms for text-only turns, <5000ms for tool-calling turns.
- [ ] Streaming first token should arrive within 500ms of model call initiation.
- [ ] Session state load/save operations complete within 50ms.
