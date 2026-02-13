---
id: "prisma-database"
name: "Prisma Database Operations"
type: "skill"
status: "active"
triggers:
  - "database"
  - "schema"
  - "query"
  - "migration"
  - "prisma"
  - "sql"
description: "Guides agents on Prisma schema conventions, migration workflow, and query patterns."
execution:
  target: "internal"
  route: ""
dependencies:
  files:
    - "aims-skills/tools/prisma.tool.md"
    - "frontend/prisma/schema.prisma"
    - "frontend/lib/db/prisma.ts"
priority: "medium"
---

# Prisma Database Operations Skill

## When This Fires

Triggers when any agent needs to modify the database schema, run migrations, or write complex queries.

## Schema Change Workflow

```
1. Edit frontend/prisma/schema.prisma
2. npx prisma migrate dev --name "descriptive-name"
3. npx prisma generate (auto-runs after migrate)
4. Commit migration files to git
5. In production: npx prisma migrate deploy
```

## Rules

1. **Always use migrations** — Never use `db push` in production
2. **Name migrations descriptively** — `add-workspace-tier`, not `update`
3. **Never delete columns in production** — Mark deprecated, migrate data first
4. **Use relations** — Prisma handles joins; don't write raw SQL
5. **Regenerate client** — After any schema change, run `prisma generate`

## Dev vs Production

| Setting | Dev | Production |
|---------|-----|------------|
| DB | SQLite (`file:./dev.db`) | PostgreSQL |
| Migrations | `migrate dev` | `migrate deploy` |
| Reset | `migrate reset` (OK) | NEVER reset |
| Studio | `prisma studio` (OK) | Not exposed |
