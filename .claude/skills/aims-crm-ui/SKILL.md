---
name: aims-crm-ui
description: >
  A.I.M.S. CRM and client/project management UI: sidebar navigation, list
  or kanban views, filters, and detail panels for leads, clients, and projects.
allowed-tools: Read, Glob, Grep, Edit
---

# A.I.M.S. CRM UI Skill

This skill defines the CRM / client & project management pattern for A.I.M.S. Used when building Plugs that manage contacts, projects, or pipelines.

Use with `aims-global-ui`.

## When to Use

Activate when:

- Editing routes like `app/crm/**`, `app/clients/**`, `app/projects/**`.
- The user says "CRM", "client manager", "project board", or "pipeline".

---

## Layout

- Left Sidebar:
  - Sections like: Overview, Leads, Clients, Projects, Pipelines.
- Top Bar (main area):
  - Search field.
  - Filter controls (status, owner, priority).
  - "Add [Lead/Client/Project]" primary button.
- Main Content:
  - Either:
    - Table view with sortable columns and status chips, or
    - Kanban-style columns per stage.

Detail view:

- Desktop: slide-over panel from right.
- Mobile: full-screen modal.

---

## Rules

- Always show current status and next steps clearly.
- For long lists, support pagination or lazy load.
- Keep navigation, filters, and buttons consistent across CRM sections.
