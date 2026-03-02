# Acceptance Criteria — prisma-database

## Schema Conventions

- [ ] All models include `id` (cuid), `createdAt` (default now), and `updatedAt` fields.
- [ ] Model names are PascalCase singular; field names are camelCase.
- [ ] Fields used in WHERE clauses or JOINs have `@@index` annotations.
- [ ] `UserRole` enum uses only canonical values: `OWNER`, `ADMIN`, `CUSTOMER`, `DEMO_USER`.
- [ ] `schema_consistency` KPI confirms schema matches canonical conventions.

## Migration Workflow

- [ ] All Prisma commands use `prisma@5` version pin (never unversioned `npx prisma`).
- [ ] `migrate dev` is used in development; `migrate deploy` is used in production.
- [ ] `migrate reset` is NEVER used in production.
- [ ] Generated migration SQL is reviewed before application — no unreviewed destructive changes.
- [ ] Existing migration files are never modified after creation.
- [ ] `migration_success_rate` KPI tracks successful vs. failed migrations.

## Query Patterns

- [ ] All queries use Prisma Client — no raw SQL unless documented performance justification exists.
- [ ] Sensitive fields (passwords, API keys, tokens) are excluded from default query selects.
- [ ] Multi-step operations use `prisma.$transaction` for atomicity.
- [ ] `query_latency_ms` KPI is tracked for queries exceeding 100ms.

## Build Verification

- [ ] `npm run build` passes after every schema change.
- [ ] `npx prisma@5 generate` is run after every schema modification to regenerate the client.
- [ ] Type errors caused by schema changes are fixed before the change is considered complete.

## Security

- [ ] No password hashes, API keys, or session tokens appear in query results by default.
- [ ] Database connection strings are never logged or included in error messages.
- [ ] Role-based access is enforced at the query level — users cannot access other users' data.

## Environment Parity

- [ ] Development and production schemas are identical (no migration drift).
- [ ] Seed data is only applied during initial setup, not on every deployment.
- [ ] `prisma db pull` (introspection) is used only for auditing, never as the primary schema source.
