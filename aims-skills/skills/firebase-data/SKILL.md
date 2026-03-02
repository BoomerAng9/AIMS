---
name: firebase-data
description: |
  Firebase/Firestore data patterns — tenant isolation, collection conventions,
  role-based access. Use when: store, firestore, firebase, database, persist, save data.
role: Specialist Executor
intent: Read and write persistent data in Firestore following tenant isolation and role-based access rules
kpis: [query_latency_ms, write_success_rate, isolation_violation_count]
status: active
priority: high
triggers:
  - store
  - firestore
  - firebase
  - database
  - persist
  - save data
execution:
  target: internal
  route: ""
dependencies:
  env:
    - FIREBASE_PROJECT_ID
  files:
    - aims-skills/tools/firebase.tool.md
    - aims-skills/lib/firebase.ts
---

# Firebase Data Patterns Skill

## When This Fires

Triggers when any agent needs to read/write persistent data in Firestore.

## Collection Naming Convention

```
{entity}                    → Top-level collections (users, workspaces)
{entity}/{id}/{subcollection} → Nested data (users/uid/conversations)
```

## Core Workflow

1. Determine data operation (read, write, append, query)
2. Validate caller role against Data Access table below
3. Scope query to user/workspace (tenant isolation enforced)
4. Execute Firestore operation
5. Log to audit trail (append-only for write operations)
6. Return result or structured error

## Tenant Isolation Rules

1. **Always scope queries to user/workspace** — Never query across tenants
2. **Use subcollections for user data** — `users/{uid}/conversations/{cid}`
3. **Audit log is append-only** — No updates, no deletes
4. **Role cards are read-only** — Only admin can modify

## Data Access by Role

| Role | Read | Write | Collections |
|------|------|-------|-------------|
| Primary Orchestrator (ACHEEVY) | Yes | Yes | conversations, vertical_progress |
| Specialist Executor (Boomer_Ang) | Yes | Limited | workspaces (own domain) |
| Code Generation Executor (Chicken Hawk) | Yes | No | role_cards, policies |
| Worker Executor (Lil_Hawk) | No | Append | audit_log (evidence only) |

## Quality Gates

- Every query is scoped to a tenant (no cross-tenant queries)
- Write operations are logged in the audit trail
- Role-based access is validated before execution
- Connection failures return structured errors, not exceptions

## Hooks

- **trigger:** Data persistence intent detected
- **pre_gsd:** Validate `FIREBASE_PROJECT_ID` and `FIREBASE_PRIVATE_KEY`, check caller role
- **post_gsd:** Log operation to audit trail

## Limits

- Firestore document size: 1 MiB max
- Batch writes: 500 operations per batch
- Subcollection depth: follow `{entity}/{id}/{subcollection}` pattern

## API Key Check

```
if (!FIREBASE_PROJECT_ID) → "Firestore not configured. Data will not persist."
if (!FIREBASE_PRIVATE_KEY) → "Firebase auth missing. Check service account."
```
