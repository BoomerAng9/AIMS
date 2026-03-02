---
name: prisma-database
description: |
  Prisma Database Operations guide.
  Use when: an agent needs to modify the database schema, run migrations, write Prisma
  queries, or troubleshoot database-related issues.
role: Specialist Executor
intent: Guide agents on Prisma schema conventions, migration workflow, and query patterns.
kpis:
  - migration_success_rate
  - query_latency_ms
  - schema_consistency
status: active
priority: medium
triggers:
  - database
  - schema
  - query
  - migration
  - prisma
  - sql
execution: sequential — identify schema need → modify schema → generate migration → apply migration → verify
dependencies:
  - prisma.tool.md
  - frontend/prisma/schema.prisma
---

# Prisma Database Operations

This skill governs all database interactions in A.I.M.S. — schema design, migration
workflow, query patterns, and troubleshooting.

## Schema Change Workflow

Follow these 5 steps for every schema change. No shortcuts.

### Step 1: Edit the Schema

Modify `frontend/prisma/schema.prisma` with the required changes. Follow these conventions:

- Model names: PascalCase singular (e.g., `User`, `PlugInstance`, `SessionLog`)
- Field names: camelCase (e.g., `createdAt`, `userId`, `instanceStatus`)
- Always include `id`, `createdAt`, `updatedAt` on every model
- Use `@default(cuid())` for IDs, `@default(now())` for timestamps
- Add `@@index` for fields used in WHERE clauses or JOINs

### Step 2: Generate Migration

```bash
cd frontend && npx prisma@5 migrate dev --name <descriptive-name>
```

> **IMPORTANT**: Use `prisma@5` — Prisma v7 has breaking changes (removed `url` from `datasource`).
> Do NOT use `npx prisma migrate dev` without the version pin.

### Step 3: Review the Migration SQL

Check the generated SQL in `frontend/prisma/migrations/<timestamp>_<name>/migration.sql`.
Verify:

- No destructive changes (DROP COLUMN, DROP TABLE) without explicit approval
- Indexes are created for new query patterns
- Default values are set for new non-nullable columns on existing tables

### Step 4: Generate Prisma Client

```bash
cd frontend && npx prisma@5 generate
```

This regenerates the TypeScript client with the new schema types.

### Step 5: Verify

```bash
cd frontend && npm run build
```

Build must pass. If it fails, the schema change introduced a type error that must be fixed.

## Rules

1. **Always use `prisma@5`** — never use unversioned `npx prisma` commands. Prisma v7 broke
   the `datasource` block and is not compatible with our schema.

2. **Never modify migration files after they are created.** If a migration is wrong, create
   a new migration to fix it. Editing existing migrations causes drift between environments.

3. **Use canonical `UserRole` values** — `OWNER`, `ADMIN`, `CUSTOMER`, `DEMO_USER`. Never use
   `MEMBER`, `USER`, or other non-canonical role names. The Prisma schema enum and auth.ts
   must always agree.

4. **All queries go through Prisma Client** — never write raw SQL in application code unless
   there is a documented performance reason. Raw SQL bypasses type safety and audit logging.

5. **Sensitive fields must be excluded from default selects.** Use Prisma's `select` or `omit`
   to never return password hashes, API keys, or session tokens in query results.

## Dev vs Production

| Operation | Development | Production |
|---|---|---|
| Schema change | `npx prisma@5 migrate dev` | `npx prisma@5 migrate deploy` |
| Reset database | `npx prisma@5 migrate reset` | **NEVER** — data loss |
| Seed data | `npx prisma@5 db seed` | Only for initial setup |
| Generate client | `npx prisma@5 generate` | `npx prisma@5 generate` |
| Introspect | `npx prisma@5 db pull` | For auditing only |

## Common Query Patterns

### Find with Relations

```typescript
const user = await prisma.user.findUnique({
  where: { id: userId },
  include: {
    plugInstances: true,
    sessions: { orderBy: { createdAt: "desc" }, take: 5 }
  }
});
```

### Upsert

```typescript
const instance = await prisma.plugInstance.upsert({
  where: { slug: instanceSlug },
  update: { status: "RUNNING", updatedAt: new Date() },
  create: { slug: instanceSlug, userId, status: "PROVISIONING" }
});
```

### Transaction

```typescript
const [instance, log] = await prisma.$transaction([
  prisma.plugInstance.update({ where: { id }, data: { status: "STOPPED" } }),
  prisma.sessionLog.create({ data: { instanceId: id, action: "STOP", userId } })
]);
```

## Anti-Patterns

- Using `prisma migrate reset` in production (destroys all data).
- Writing raw SQL for standard CRUD operations.
- Using `MEMBER` or `USER` as role values (must be `OWNER`, `ADMIN`, `CUSTOMER`, `DEMO_USER`).
- Running unversioned `npx prisma` commands (defaults to latest, which may be v7+).
- Not reviewing generated migration SQL before applying.
