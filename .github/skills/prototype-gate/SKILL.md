# Prototype Gate

Use this skill before implementing any UI, UX, workflow, or orchestration change.

## Required output

Always provide this header before implementation:
- Vision: one sentence
- Mission: one sentence
- Objective: one sentence

If the request affects UI, UX, workflow, or orchestration, provide an ASCII prototype before code changes.

## Required sequence

1. Restate the request in implementation language.
2. Translate layman phrasing into canonical product terminology.
3. Identify the affected lane:
   - experience
   - knowledge
   - execution
   - persistence
4. Produce the ASCII prototype.
5. State the smallest safe increment.
6. Implement.
7. Validate.
8. Report risks and persistence implications.

## Chat-specific rules

- Use the label exactly as: `CHAT W/ ACHEEVY`
- Keep the Model Selector inside the Bottom Composer Bezel.
- Keep the Data Source Picker inside the Bottom Composer Bezel.
- Treat voice-first behavior as a default requirement.