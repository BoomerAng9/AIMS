---
id: "nextauth"
name: "Auth.js"
type: "tool"
category: "auth"
provider: "Auth.js (formerly NextAuth.js)"
description: "Authentication framework for Next.js — handles OAuth providers, sessions, and JWT. Auth.js v5 is the current release."
env_vars:
  - "AUTH_SECRET"
  - "AUTH_URL"
  - "OWNER_EMAILS"
docs_url: "https://authjs.dev/getting-started"
aims_files:
  - "frontend/lib/auth.ts"
---

# Auth.js v5 — Authentication Tool Reference

> Formerly NextAuth.js. Rebranded to Auth.js with v5 — now supports Next.js, SvelteKit, Express, and more.

## Overview

Auth.js v5 handles all authentication for the AIMS frontend. It supports Google OAuth, GitHub OAuth, and Discord OAuth as identity providers. Sessions are managed via JWT.

**Key v5 changes:**
- Universal `auth()` method replaces `getServerSession(authOptions)`
- Config lives in root `auth.ts` (not API route)
- Env vars renamed: `NEXTAUTH_SECRET` → `AUTH_SECRET`, `NEXTAUTH_URL` → `AUTH_URL`
- Edge runtime compatible
- Built-in CSRF protection improvements

## Configuration

| Variable | Required | Where to Get | Purpose |
|----------|----------|--------------|---------|
| `AUTH_SECRET` | Yes | `npx auth secret` or `openssl rand -base64 32` | JWT signing secret |
| `AUTH_URL` | Yes | Your domain | `https://plugmein.cloud` |
| `OWNER_EMAILS` | Yes | Your email | Comma-separated super-admin emails |

> **Migration:** `NEXTAUTH_SECRET` and `NEXTAUTH_URL` still work as fallbacks but `AUTH_SECRET` / `AUTH_URL` are preferred.

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
  → Auth.js creates JWT session
  → User redirected to dashboard
  → OWNER_EMAILS get admin role
```

## AIMS Usage

```typescript
// auth.ts (root config — Auth.js v5 pattern)
import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import GitHub from 'next-auth/providers/github';

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google, GitHub],
});
```

```typescript
// In API route or server component (v5 pattern)
import { auth } from '@/auth';

const session = await auth();
if (!session) return new Response('Unauthorized', { status: 401 });
```

```typescript
// Legacy v4 pattern (still works during migration)
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
const session = await getServerSession(authOptions);
```

## Troubleshooting

| Issue | Fix |
|-------|-----|
| JWT decode error | Regenerate `AUTH_SECRET` (or `NEXTAUTH_SECRET`) |
| Callback URL mismatch | Set `AUTH_URL` to exact production URL |
| Provider not working | Check provider-specific env vars are set |
| v4 → v5 migration | See https://authjs.dev/getting-started/migrating-to-v5 |
