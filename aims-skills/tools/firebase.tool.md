---
id: "firebase"
name: "Firebase / Firestore"
type: "tool"
category: "database"
provider: "Google"
description: "Real-time NoSQL database (Firestore) and authentication backend for AIMS persistence layer."
env_vars:
  - "FIREBASE_PROJECT_ID"
  - "FIREBASE_CLIENT_EMAIL"
  - "FIREBASE_PRIVATE_KEY"
docs_url: "https://firebase.google.com/docs/firestore"
aims_files:
  - "aims-skills/lib/firebase.ts"
  - "aims-skills/scripts/init-firestore-schema.ts"
---

# Firebase / Firestore — Database Tool Reference

## Overview

Firebase provides the persistence layer (Layer 4) for AIMS. Firestore stores user profiles, conversation state, vertical progress, role cards, and audit logs. Firebase Auth handles user identity alongside NextAuth.

## API Key Setup

| Variable | Required | Where to Get | Purpose |
|----------|----------|--------------|---------|
| `FIREBASE_PROJECT_ID` | Yes | Firebase Console > Project Settings | Project identifier |
| `FIREBASE_CLIENT_EMAIL` | Yes | GCP Console > IAM > Service Accounts | Service account email |
| `FIREBASE_PRIVATE_KEY` | Yes | Service Account JSON key | Authentication |

**Apply in:** `infra/.env.production`

**GCP Project:** `ai-managed-services`

## Key Collections

| Collection | Purpose | Access |
|-----------|---------|--------|
| `users` | User profiles, subscription tier | ACHEEVY, Boomer_Angs |
| `conversations` | Chat history, session state | ACHEEVY |
| `vertical_progress` | Business builder vertical state | ACHEEVY, verticals |
| `audit_log` | Immutable execution log | Gateway (write-only) |
| `role_cards` | Agent role definitions | Chain of Command |
| `workspaces` | Multi-tenant workspace data | All agents |

## AIMS Usage

```typescript
import { db } from '@/lib/firebase';

// Read document
const userDoc = await db.collection('users').doc(userId).get();
const userData = userDoc.data();

// Write document
await db.collection('conversations').doc(sessionId).set({
  messages: [],
  vertical: 'idea-generator',
  phase: 'A',
  updated_at: new Date(),
});

// Query
const activeUsers = await db.collection('users')
  .where('subscription_tier', '==', 'pro')
  .where('active', '==', true)
  .get();
```

## Setup Script

```bash
cd aims-skills && npx ts-node scripts/init-firestore-schema.ts
```

Creates initial collections and security rules.

## Security Rules

File: `firestore.rules` — Enforces tenant isolation:
- Users can only read/write their own data
- Audit log is append-only (no deletes)
- Role cards are read-only for non-admin

## Pricing
- Free (Spark): 50K reads/day, 20K writes/day, 1GB storage
- Blaze (pay-as-you-go): $0.06/100K reads, $0.18/100K writes

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Permission denied | Check `FIREBASE_PRIVATE_KEY` has correct service account role |
| Project not found | Verify `FIREBASE_PROJECT_ID` matches Firebase Console |
| Private key format | Key must include `\n` line breaks (JSON format) |
