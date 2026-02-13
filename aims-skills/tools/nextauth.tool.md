---
id: "nextauth"
name: "NextAuth.js"
type: "tool"
category: "auth"
provider: "NextAuth.js"
description: "Authentication framework for Next.js — handles OAuth providers, sessions, and JWT."
env_vars:
  - "NEXTAUTH_SECRET"
  - "NEXTAUTH_URL"
  - "OWNER_EMAILS"
docs_url: "https://next-auth.js.org/getting-started/introduction"
aims_files:
  - "frontend/lib/auth.ts"
---

# NextAuth.js — Authentication Tool Reference

## Overview

NextAuth.js handles all authentication for the AIMS frontend. It supports Google OAuth, GitHub OAuth, and Discord OAuth as identity providers. Sessions are managed via JWT.

## Configuration

| Variable | Required | Where to Get | Purpose |
|----------|----------|--------------|---------|
| `NEXTAUTH_SECRET` | Yes | `openssl rand -base64 32` | JWT signing secret |
| `NEXTAUTH_URL` | Yes | Your domain | `https://plugmein.cloud` |
| `OWNER_EMAILS` | Yes | Your email | Comma-separated super-admin emails |

**Apply in:** `frontend/.env.local` or `infra/.env.production`

## Auth Providers

| Provider | Env Vars Needed |
|----------|----------------|
| Google | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` |
| GitHub | `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` |
| Discord | `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET` |

## Auth Flow

```
User clicks sign-in
  → Redirect to OAuth provider
  → Provider authenticates user
  → Callback to /api/auth/callback/{provider}
  → NextAuth creates JWT session
  → User redirected to dashboard
  → OWNER_EMAILS get admin role
```

## AIMS Usage

```typescript
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// In API route or server component
const session = await getServerSession(authOptions);
if (!session) return new Response('Unauthorized', { status: 401 });
```

## Troubleshooting

| Issue | Fix |
|-------|-----|
| JWT decode error | Regenerate `NEXTAUTH_SECRET` |
| Callback URL mismatch | Set `NEXTAUTH_URL` to exact production URL |
| Provider not working | Check provider-specific env vars are set |
