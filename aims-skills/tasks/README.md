# Tasks

> Tasks are executable units that produce artifacts. They DO the work.

## Structure

```
tasks/
├── README.md              ← You are here
├── templates/             ← Reusable output templates
│   ├── design-packet.md
│   ├── redesign-teardown-log.md
│   └── owners-vs-users-surface-map.md
├── runbooks/              ← Step-by-step execution playbooks
│   ├── circuit-box-owners.md
│   ├── circuit-box-users.md
│   ├── telegram-setup-user.md
│   ├── discord-setup-user.md
│   └── whatsapp-setup-user.md
└── [existing task definitions]
    ├── gemini-research.md
    ├── n8n-workflow.md
    ├── remotion.md
    └── ...
```

## Templates vs Runbooks

| Type | Purpose | Output |
|------|---------|--------|
| **Template** | Defines WHAT must be produced | A filled-in document |
| **Runbook** | Defines HOW to execute a procedure | Completed procedure with evidence |

## Adding a New Task

1. Create the task file in the appropriate subdirectory
2. Add YAML frontmatter with triggers, execution target, and output schema
3. Document in `ACHEEVY_BRAIN.md` Section 7
