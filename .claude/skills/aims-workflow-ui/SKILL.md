---
name: aims-workflow-ui
description: >
  A.I.M.S. workflow and automation builder UI: lists of workflows,
  editable step sequences, configuration panels, and run logs.
allowed-tools: Read, Glob, Grep, Edit
---

# A.I.M.S. Workflow Builder UI Skill

This skill defines the UI pattern for building and managing workflows and automations (e.g., n8n-backed flows, Boomer_Ang routines).

Use with `aims-global-ui`.

## When to Use

Activate when:

- Editing `app/workflows/**`, `app/automation/**`, or similar builder UIs.
- The user says: "automation builder", "workflow editor", "n8n flows UI".

---

## Layout

- Left Sidebar:
  - List of workflows with status and quick actions.
- Main Builder:
  - Visual or structured list of steps in order.
  - Each step clickable to edit.
- Right Config Panel (desktop) / bottom sheet (mobile):
  - Inputs for the selected step's settings.

Runs / Logs:

- Panel or tab for recent runs, statuses, and errors.

---

## Rules

- Make "Add step" and "Reorder steps" obvious.
- Clearly distinguish between editing a workflow vs viewing execution logs.
- Surface validation errors in a clear, actionable way.
