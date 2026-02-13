---
id: "auth-flow"
name: "Authentication Flow"
type: "skill"
status: "active"
triggers:
  - "login"
  - "auth"
  - "sign in"
  - "sign up"
  - "authentication"
  - "session"
description: "Guides agents on authentication flow, provider configuration, and session management."
execution:
  target: "internal"
  route: ""
dependencies:
  files:
    - "aims-skills/tools/nextauth.tool.md"
    - "aims-skills/tools/google-oauth.tool.md"
    - "frontend/lib/auth.ts"
priority: "medium"
---

# Authentication Flow Skill

## When This Fires

Triggers when agents need to handle authentication, check sessions, or configure auth providers.

## Rules

1. **Never store passwords** — AIMS uses OAuth only (no password auth)
2. **Always check session** — Every API route must verify `getServerSession()`
3. **OWNER_EMAILS = super admin** — These emails get full platform access
4. **JWT-based sessions** — No server-side session storage needed
5. **HTTPS only** — OAuth callbacks require HTTPS in production

## Provider Priority
- Google OAuth (primary — most users have Google accounts)
- GitHub OAuth (developer audience)
- Discord OAuth (community audience)

## API Key Check
```
if (!NEXTAUTH_SECRET) → Auth will fail; generate with openssl
if (!GOOGLE_CLIENT_ID) → Google sign-in unavailable
if (!NEXTAUTH_URL) → Callback URLs will be wrong
```
