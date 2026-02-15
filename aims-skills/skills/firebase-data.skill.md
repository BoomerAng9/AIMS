---
id: "firebase-data"
name: "Firebase Data Patterns"
type: "skill"
status: "active"
triggers:
  - "store"
  - "firestore"
  - "firebase"
  - "database"
  - "persist"
  - "save data"
description: "Guides agents on Firestore data patterns, tenant isolation, and collection conventions."
execution:
  target: "internal"
  route: ""
dependencies:
  env:
    - "FIREBASE_PROJECT_ID"
  files:
    - "aims-skills/tools/firebase.tool.md"
    - "aims-skills/lib/firebase.ts"
priority: "high"
---

# Firebase Data Patterns Skill

## When This Fires

Triggers when any agent needs to read/write persistent data in Firestore.

## Collection Naming Convention

```
{entity}                    → Top-level collections (users, workspaces)
{entity}/{id}/{subcollection} → Nested data (users/uid/conversations)
```

## Tenant Isolation Rules

1. **Always scope queries to user/workspace** — Never query across tenants
2. **Use subcollections for user data** — `users/{uid}/conversations/{cid}`
3. **Audit log is append-only** — No updates, no deletes
4. **Role cards are read-only** — Only admin can modify

## Data Access by Role

| Role | Read | Write | Collections |
|------|------|-------|-------------|
| ACHEEVY | Yes | Yes | conversations, vertical_progress |
| Boomer_Ang | Yes | Limited | workspaces (own domain) |
| Chicken Hawk | Yes | No | role_cards, policies |
| Lil_Hawk | No | Append | audit_log (evidence only) |

## API Key Check

```
if (!FIREBASE_PROJECT_ID) → "Firestore not configured. Data will not persist."
if (!FIREBASE_PRIVATE_KEY) → "Firebase auth missing. Check service account."
```
