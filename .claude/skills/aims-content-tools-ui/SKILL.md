---
name: aims-content-tools-ui
description: >
  A.I.M.S. content and research tools UI: input panel, output panel,
  history, and export actions for docs, transcripts, and analysis.
allowed-tools: Read, Glob, Grep, Edit
---

# A.I.M.S. Content & Research Tools UI Skill

This skill standardizes tools that take input (prompt, file, URL) and produce structured output (summary, brief, transcript analysis, etc.).

Use with `aims-global-ui`.

## When to Use

Activate when:

- Editing `app/tools/**`, `app/research/**`, or similar.
- The user describes "analysis tool", "research Plug", "SmartDocs-style UI".

---

## Layout

- Input Panel:
  - Text area, upload, or structured form.
  - Config options (model, depth, tone) if needed.
- Output Panel:
  - Scrollable area for formatted results.
  - Support for headings, bullets, tables, and code blocks as appropriate.
- History (optional):
  - List of past runs with timestamps and quick load.

Actions:

- Clear "Run / Generate" button.
- Copy, download, or export (as specified by project).

---

## Rules

- Always show progress (loading state, spinner, status text).
- Prevent accidental loss of input when re-running.
- Favor readability over dense, unformatted output.
