---
name: auth-flow
description: |
  Authentication Flow skill for session management and OAuth configuration.
  Use when: configuring auth providers, debugging login failures,
  managing sessions, or enforcing role-based access control.
role: Specialist Executor
intent: Handle authentication, session management, and OAuth provider configuration.
kpis:
  - auth_success_rate
  - session_validation_latency_ms
  - provider_availability
status: active
priority: medium
triggers:
  - auth provider configuration needed
  - login or session issue reported
  - role-based access enforcement required
execution: sequential
dependencies:
  - nextauth.tool.md
  - google-oauth.tool.md
  - frontend/lib/auth.ts
---

# Authentication Flow

## Core Rules

1. **No Passwords** — A.I.M.S. uses OAuth exclusively. Never implement password-based login, password reset, or credential storage.
2. **Always Check Session** — Every protected route and API endpoint must validate the session before proceeding. Use `getServerSession()` on the server and `useSession()` on the client.
3. **OWNER_EMAILS = Super Admin** — Email addresses in the `OWNER_EMAILS` environment variable receive the `OWNER` role automatically. This is the only way to assign the owner role.
4. **JWT Sessions** — Sessions use JWT strategy (not database sessions). Token payload includes `id`, `email`, `role`, and `name`.
5. **HTTPS Only** — Auth cookies must have `secure: true` and `sameSite: 'lax'`. Never allow auth over plain HTTP in production.

## Provider Priority

| Priority | Provider | Client ID Env Var               | Notes                          |
|----------|----------|---------------------------------|--------------------------------|
| 1        | Google   | `GOOGLE_CLIENT_ID`              | Primary — most users have Google |
| 2        | GitHub   | `GITHUB_CLIENT_ID`              | Developer audience fallback    |
| 3        | Discord  | `DISCORD_CLIENT_ID`             | Community/gaming audience      |

- Providers are displayed in priority order on the login page.
- If a provider's env vars are missing, it is silently excluded from the login page — no errors.
- At least one provider must be configured or the app must show a clear "Auth not configured" message.

## Role Hierarchy

| Role        | Level | Capabilities                                      |
|-------------|-------|---------------------------------------------------|
| `OWNER`     | 4     | Full platform access, agent management, infra ops  |
| `ADMIN`     | 3     | User management, plug catalog admin, billing       |
| `CUSTOMER`  | 2     | Plug usage, ACHEEVY chat, dashboard access         |
| `DEMO_USER` | 1     | Read-only demo mode, no deployments, no billing    |

- Role assignment: `OWNER` via `OWNER_EMAILS`, `ADMIN` via owner invitation, `CUSTOMER` on sign-up, `DEMO_USER` for unauthenticated demo access.
- Use `requireRole(minRole)` middleware for API protection.

## API Key Checks

- API keys for service-to-service calls use the `X-API-Key` header.
- Keys are validated against `API_KEYS` environment variable (comma-separated).
- API key auth bypasses OAuth but still requires role context via the key's associated role.

## Session Flow

```
User clicks "Sign in with Google"
  -> NextAuth redirects to Google OAuth
  -> Google returns auth code
  -> NextAuth exchanges code for tokens
  -> JWT callback enriches token with role (check OWNER_EMAILS)
  -> Session callback exposes id, email, role, name
  -> Client receives session via useSession()
```

## Anti-Patterns

- Never store tokens in localStorage — use httpOnly cookies via NextAuth.
- Never expose the JWT secret in client-side code.
- Never skip session checks on "internal" pages — all routes are potentially accessible.
- Never hardcode role checks — always use the `requireRole()` helper.
