# LUC Threat Model

## Assets

### Critical Assets
1. **User Credentials** - Authentication tokens, passwords
2. **API Keys** - Provider keys for external services
3. **Usage Data** - Billing-relevant consumption records
4. **Policy Data** - Configuration that controls access and costs
5. **Financial Data** - Stripe customer IDs, payment info

### Important Assets
1. **Workspace Data** - Tenant configurations
2. **Audit Logs** - Security and compliance records
3. **Session Data** - User session state

## Trust Boundaries

```
┌─────────────────────────────────────────────────────────────┐
│                      Internet (Untrusted)                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    CDN / Load Balancer                       │
│                    (Semi-Trusted)                            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Next.js Application                       │
│                    (Trusted)                                 │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              API Routes (Server-side)                  │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │            LUC Engine (Trusted)                  │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Database (Trusted)                      │
│                    (SQLite/PostgreSQL)                       │
└─────────────────────────────────────────────────────────────┘
```

## Entry Points

| ID | Entry Point | Trust Level | Description |
|----|-------------|-------------|-------------|
| E1 | API Routes | Authenticated | JSON API endpoints |
| E2 | Web UI | Browser | React frontend |
| E3 | Webhooks | Verified | Stripe webhooks |
| E4 | Admin API | Admin Only | Policy management |

## Top Threats

### T1: Authentication Bypass
**STRIDE**: Spoofing
**Risk**: High
**Attack**: Attacker bypasses authentication to access LUC data

**Mitigations**:
- Server-side session validation on all routes
- NextAuth with secure session handling
- Rate limiting on auth endpoints

### T2: Tenant Data Leakage
**STRIDE**: Information Disclosure
**Risk**: High
**Attack**: User accesses another workspace's usage data

**Mitigations**:
- Workspace ID in all queries
- Database-level tenant isolation
- API route validates workspace ownership

### T3: Quota Manipulation
**STRIDE**: Tampering
**Risk**: High
**Attack**: User manipulates usage records to avoid billing

**Mitigations**:
- Usage events are append-only
- Credits require audit trail
- Server-side quota calculation only

### T4: API Key Exposure
**STRIDE**: Information Disclosure
**Risk**: Critical
**Attack**: Provider API keys leaked through logs or errors

**Mitigations**:
- Keys in environment variables only
- Structured logging with redaction
- No keys in client-side code

### T5: Policy Escalation
**STRIDE**: Elevation of Privilege
**Risk**: High
**Attack**: User modifies policy to grant unlimited quota

**Mitigations**:
- RBAC on policy endpoints (admin only)
- Policy changes logged to audit
- Validation on policy apply

### T6: Denial of Service
**STRIDE**: Denial of Service
**Risk**: Medium
**Attack**: Attacker floods LUC APIs to consume resources

**Mitigations**:
- Rate limiting on all endpoints
- Request size limits
- Timeout on long operations

### T7: SQL Injection
**STRIDE**: Tampering
**Risk**: High
**Attack**: Malicious input in API requests executes SQL

**Mitigations**:
- Prisma ORM (parameterized queries)
- Zod input validation
- No raw SQL in codebase

### T8: XSS in UI
**STRIDE**: Spoofing
**Risk**: Medium
**Attack**: Malicious script in usage data executes in UI

**Mitigations**:
- React escapes by default
- CSP headers
- Input sanitization

## Security Controls

### Authentication
- NextAuth.js with Credentials provider
- Secure session cookies (httpOnly, secure, sameSite)
- Session expiry and rotation

### Authorization
- RBAC: ADMIN, MEMBER roles
- Workspace membership validation
- Route-level permission checks

### Input Validation
- Zod schemas on all API inputs
- Type coercion and sanitization
- Request size limits

### Logging
- Structured JSON logging
- Sensitive field redaction
- Audit trail for security events

### Rate Limiting
- Per-user rate limits
- More restrictive on sensitive endpoints
- Exponential backoff on failures

### Secure Headers
- Strict-Transport-Security
- Content-Security-Policy
- X-Content-Type-Options
- X-Frame-Options

## Security Testing

### Automated
- npm audit for dependency vulnerabilities
- Secret scanning (gitleaks)
- SAST in CI pipeline

### Manual
- Quarterly penetration testing
- Code review for security issues
- Policy review

## Incident Response

1. **Detect**: Monitor for anomalies
2. **Contain**: Revoke affected tokens
3. **Investigate**: Review audit logs
4. **Remediate**: Patch vulnerability
5. **Report**: Document incident
