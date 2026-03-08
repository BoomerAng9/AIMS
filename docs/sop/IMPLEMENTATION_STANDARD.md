# ACHEEVY Implementation SOP

This SOP is the standard operating procedure for customer-facing A.I.M.S. implementation work.

## Step 1. Intake

- Restate the request in implementation language.
- Extract goals, constraints, dependencies, and deliverables.
- Identify ambiguous layman phrases before writing code.

## Step 2. Terminology Alignment

- Map user phrases into canonical technical terms.
- Add new canonical terms to the Technical Knowledge Index.
- Add synonyms and layman phrases to the Lay-to-Technical Lexicon.
- Flag unresolved ambiguity when more than one canonical mapping is plausible.

## Step 3. Architecture Check

Determine which lane is being changed:

- Experience
- Knowledge
- Execution
- Persistence

Do not blur the lane boundaries without an explicit reason.

## Step 4. Prototype Gate

Before UI, workflow, or orchestration implementation, output:

- Vision
- Mission
- Objective
- ASCII Prototype

## Step 5. Implementation Plan

- Define the smallest complete increment.
- Identify files to change.
- State risks and rollback points.
- Note persistence implications.

## Step 6. Build

- Extend existing architecture instead of adding one-off paths.
- Keep business logic out of the UI layer.
- Prefer typed interfaces and explicit state transitions.
- Treat the sandbox as disposable and the session as durable.

## Step 7. Validation

Validate the increment against the acceptance criteria.

Minimum validation set:

- functional behavior
- UI placement
- voice path when applicable
- persistence and recovery behavior when applicable
- accessibility basics

## Step 8. Standardization

If the work pattern will repeat, capture it as one of the following:

- a prompt file
- an instruction file
- an Agent Skill
- a terminology entry

## Chat Shell Requirement

When the feature affects chat UI, the default shell must use the Bottom Composer Bezel and render the label exactly as `CHAT W/ ACHEEVY`.
