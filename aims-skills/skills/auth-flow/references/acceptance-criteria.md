# Acceptance Criteria — auth-flow

## Functional Requirements

### FR-1: OAuth Provider Configuration
- [ ] Google OAuth provider is configured and functional
- [ ] GitHub OAuth provider is configured and functional
- [ ] Discord OAuth provider is configured and functional
- [ ] Missing provider env vars cause silent exclusion — no runtime errors
- [ ] At least one provider must be available or a clear "Auth not configured" message is shown

### FR-2: Session Management
- [ ] JWT session strategy is used (not database sessions)
- [ ] Session token includes `id`, `email`, `role`, and `name`
- [ ] `getServerSession()` works on all protected server routes
- [ ] `useSession()` works on all protected client components
- [ ] Session cookies are `secure: true` and `sameSite: 'lax'`

### FR-3: Role Assignment
- [ ] Emails in `OWNER_EMAILS` env var are assigned `OWNER` role on login
- [ ] New users default to `CUSTOMER` role
- [ ] `ADMIN` role is assigned via owner invitation flow
- [ ] `DEMO_USER` role is assigned for unauthenticated demo access
- [ ] `requireRole(minRole)` middleware correctly blocks underprivileged access

### FR-4: API Key Authentication
- [ ] Service-to-service calls use `X-API-Key` header
- [ ] API keys are validated against `API_KEYS` env var
- [ ] API key auth includes role context for authorization

### FR-5: Security Enforcement
- [ ] No password-based auth exists anywhere in the codebase
- [ ] Auth cookies are never sent over plain HTTP in production
- [ ] JWT secret is never exposed in client-side code
- [ ] Tokens are never stored in localStorage

## Non-Functional Requirements

### NFR-1: Performance
- [ ] Session validation latency is under 50ms for JWT decode
- [ ] OAuth redirect flow completes in under 3 seconds (network permitting)

### NFR-2: Reliability
- [ ] Auth system degrades gracefully if one OAuth provider is down (others still work)
- [ ] Session expiry redirects to login page without data loss

### NFR-3: Security
- [ ] All destructive API actions are gated behind `requireRole()` middleware
- [ ] Session hijacking mitigated by short-lived JWTs (default 24h)
- [ ] CSRF protection via `sameSite` cookie attribute

### NFR-4: Observability
- [ ] Failed login attempts are logged (without sensitive data)
- [ ] Role escalation attempts are logged and alerted
