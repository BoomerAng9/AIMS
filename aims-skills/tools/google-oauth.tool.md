---
id: "google-oauth"
name: "Google OAuth 2.0"
type: "tool"
category: "cloud"
provider: "Google"
description: "OAuth 2.0 provider for Google account authentication in AIMS."
env_vars:
  - "GOOGLE_CLIENT_ID"
  - "GOOGLE_CLIENT_SECRET"
docs_url: "https://developers.google.com/identity/protocols/oauth2"
aims_files:
  - "frontend/lib/auth.ts"
---

# Google OAuth 2.0 — Auth Tool Reference

## Overview

Google OAuth provides the primary authentication method for AIMS users. Configured as a NextAuth provider, it allows users to sign in with their Google account.

## API Key Setup

| Variable | Required | Where to Get |
|----------|----------|--------------|
| `GOOGLE_CLIENT_ID` | Yes | https://console.cloud.google.com/apis/credentials |
| `GOOGLE_CLIENT_SECRET` | Yes | Same — OAuth 2.0 Client IDs |

**Apply in:** `frontend/.env.local` or `infra/.env.production`

## Setup Steps

1. Go to GCP Console > APIs & Services > Credentials
2. Create OAuth 2.0 Client ID (Web application)
3. Add authorized redirect URI: `https://plugmein.cloud/api/auth/callback/google`
4. Copy Client ID and Secret to env vars

## Auth Flow

```
User clicks "Sign in with Google"
  → Redirect to accounts.google.com
  → User grants consent
  → Google redirects to /api/auth/callback/google
  → NextAuth creates session
  → User redirected to dashboard
```

## Owner Role

Set `OWNER_EMAILS` in env to grant super-admin access:
```
OWNER_EMAILS=your@email.com
```

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Redirect URI mismatch | Add exact URI to GCP credentials |
| Client ID invalid | Regenerate at GCP Console |
| OAuth consent screen not approved | Submit for verification if using external users |
