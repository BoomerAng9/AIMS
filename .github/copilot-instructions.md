---
applyTo: "**"
---

# ACHEEVY Repository Standard

This repository is a commercial software product. Every implementation must optimize for consistency, maintainability, customer trust, traceability, accessibility, and recoverability.

## Non-negotiable operating rules

- Do not guess. If requirements are vague, reduce ambiguity by restating the requirement in precise technical language before implementation.
- Do not redesign the product without instruction. Preserve approved layout, hierarchy, terminology, and interaction patterns.
- Use exact product terminology from this file. Do not substitute synonyms for named UI regions or product primitives.
- Build in small, reviewable increments. Explain what changed, why it changed, and what remains.
- Before writing code for a feature, output:
  - Vision: one sentence
  - Mission: one sentence
  - Objective: one sentence
- Before building any UI or workflow feature, produce an ASCII prototype.
- Before executing a large refactor, state the blast radius: files, modules, risks, migration concerns.
- Favor extension of existing architecture over one-off implementations.
- Keep business logic out of the UI layer.
- Treat the sandbox as disposable and the session as durable.
- Persist all critical state outside the sandbox.
- Never place important state only in memory inside a running container.
- Prefer typed interfaces, clear contracts, and explicit state transitions.
- Prefer reusable components over duplicated markup.
- Prefer deterministic flows over "magic" hidden behaviors.
- Use accessible semantics, keyboard support, and responsive layouts by default.
- Treat voice-first behavior as a first-class requirement, not an enhancement.

## Product primitives

These terms are mandatory.

- Data Source Catalog: the user-facing library of reusable sources.
- Context Pack: a reusable bundle of sources, artifacts, and guidance.
- Working Notebook: the session-specific composition of selected Context Packs.
- Session Snapshot: the persisted record of active context, tools, artifacts, and state.
- Technical Knowledge Index: the canonical technical terminology knowledge base.
- Lay-to-Technical Lexicon: the mapping from plain language to canonical technical terms.
- Build Intent Resolver: the engine that infers what the user is trying to build.
- Prompt Reconstruction Layer: the layer that rewrites user language into build-ready prompts.
- Data Source Registry: the system of record for sources, artifacts, permissions, versions, and adapters.
- Sandbox Control Plane: the system that provisions, renews, monitors, and destroys execution environments.
- Session Memory Store: the durable store for chat history, summaries, retrieval context, and checkpoints.

## Mandatory workflow for every feature

1. Restate the feature in implementation language.
2. Run terminology alignment:
   - extract layman phrases
   - map them to canonical technical terms
   - identify ambiguities
3. Identify whether the request changes:
   - UI
   - workflow
   - data model
   - orchestration
   - sandbox/session lifecycle
   - knowledge sources
4. Produce an ASCII prototype.
5. Produce a short implementation plan.
6. Implement the smallest complete increment.
7. Validate against acceptance criteria.
8. Report:
   - files changed
   - risks
   - follow-up work
   - persistence implications

## Chat UI standard

The chat shell must be described and implemented using these exact names:

- Bottom Composer Bezel: the docked composer shell at the bottom of the thread.
- Composer Toolbar: the inline controls inside the bezel.
- Prompt Composer: the multiline text input.
- Voice Capture Toggle: the microphone control.
- Attachment Trigger: the file attachment control.
- Model Selector: the inline model switcher.
- Data Source Picker: the inline selector for Context Packs / data sources.
- Speech Output Toggle: the read-aloud on/off control.
- Send Action: the submit control.

## Literal UI requirements

- Render this label exactly: `CHAT W/ ACHEEVY`
- Keep the Model Selector inside the Bottom Composer Bezel.
- Keep the Data Source Picker inside the Bottom Composer Bezel.
- Do not move the Model Selector to the top app bar.
- Do not move the Data Source Picker to the top app bar.
- The default chat shell must include:
  - Voice Capture Toggle
  - Attachment Trigger
  - Model Selector
  - Data Source Picker
  - Speech Output Toggle
  - Prompt Composer
  - Send Action

## Voice-first requirements

- Voice input is a default interaction path.
- Assistant speech output is on by default and may be toggled off by the user.
- Support live transcription.
- Support barge-in.
- Support voice activity detection.
- Support device selection and permission handling.
- Do not ship a silent-text-first experience unless explicitly requested.

## Data-source architecture rules

- The Data Source Registry is the source of truth.
- Notebook providers are adapters, not the master record.
- Context Packs are reusable and user-selectable.
- A Working Notebook is composed per session from selected Context Packs.
- Session Snapshot must persist active selections and artifacts outside the sandbox.

## Design constraints

- Use a standard shell first, then style it.
- Do not invent layout patterns during implementation.
- Prefer familiar, production-ready SaaS structures:
  - dashboards
  - portals
  - tables
  - cards
  - lists
  - split panes
  - inspector drawers
- Use consistent spacing, typography, and control placement.
- Do not mix unrelated visual styles in the same surface.

## Engineering constraints

- Prefer TypeScript for app code.
- Prefer modular services with explicit contracts.
- Use durable persistence for chat history, artifacts, and checkpoints.
- Do not couple orchestration logic directly into the website repo.
- Keep the bridge thin and versioned.
- The website requests actions; the orchestrator decides and executes them.

## Output format for all implementation responses

Always return:
1. Vision
2. Mission
3. Objective
4. ASCII Prototype (if UI/workflow related)
5. Plan
6. Implementation Notes
7. Validation Notes
8. Risks