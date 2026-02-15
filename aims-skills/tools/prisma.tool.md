---
id: "prisma"
name: "Prisma"
type: "tool"
category: "database"
provider: "Prisma"
description: "Type-safe ORM for Node.js — handles database schema, migrations, and queries."
env_vars:
  - "DATABASE_URL"
docs_url: "https://www.prisma.io/docs"
aims_files:
  - "frontend/prisma/schema.prisma"
  - "frontend/lib/db/prisma.ts"
---

# Prisma — Database ORM Tool Reference

## Overview

Prisma is the type-safe ORM for AIMS frontend database operations. It manages the schema, migrations, and queries for user data, sessions, and application state. Uses SQLite in development and can be switched to PostgreSQL for production.

## Configuration

| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| `DATABASE_URL` | Yes | `file:./dev.db` | Database connection string |

**Apply in:** `frontend/.env.local`

**Development:** SQLite (`file:./dev.db`)
**Production:** PostgreSQL (`postgresql://user:pass@host:5432/aims`)

## Key Commands

```bash
# Generate Prisma Client (after schema changes)
npx prisma generate

# Run migrations
npx prisma migrate dev --name "description"

# Push schema without migration (dev only)
npx prisma db push

# Open Prisma Studio (visual DB editor)
npx prisma studio

# Reset database
npx prisma migrate reset
```

## Schema Location

`frontend/prisma/schema.prisma` — defines all models (User, Session, Account, etc.)

## AIMS Usage

```typescript
import { prisma } from '@/lib/db/prisma';

// Find user
const user = await prisma.user.findUnique({
  where: { email: 'user@example.com' },
});

// Create record
const workspace = await prisma.workspace.create({
  data: { name: 'My Project', ownerId: user.id },
});

// Query with relations
const userWithWorkspaces = await prisma.user.findUnique({
  where: { id: userId },
  include: { workspaces: true },
});
```

## Migration Workflow

1. Edit `schema.prisma`
2. Run `npx prisma migrate dev --name "add-field"`
3. Prisma generates SQL migration file
4. Client auto-regenerates with new types
5. Commit migration files to git

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Client not generated | Run `npx prisma generate` |
| Migration drift | Run `npx prisma migrate reset` (dev only!) |
| SQLite locked | Only one process should write at a time |
| Type errors after schema change | Regenerate client: `npx prisma generate` |
