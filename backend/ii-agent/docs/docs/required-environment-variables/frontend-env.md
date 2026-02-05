---
id: frontend-env
title: Frontend Environment Variables
slug: /required-environment-variables/frontend-env
sidebar_position: 10
---

These values drive the Vite build that runs inside the Docker stack. They all live in `docker/.stack.env`. Update the file directly, then restart the stack so the frontend rebuilds with the new configuration.

## `VITE_API_URL`

1. Decide how the browser should reach the backend:
   - `http://localhost:8000` works when you run the stack locally without tunnels and open the site on the same machine.
2. Paste the exact origin (scheme + host + port) into `VITE_API_URL`.
3. Confirm the backend actually responds at that address before rebuilding the site.

## `VITE_GOOGLE_CLIENT_ID`

1. In the [Google Cloud Console](https://console.cloud.google.com/), create an OAuth client (type **Web Application**).
2. Add every browser origin that will load your frontend to “Authorized JavaScript origins” (in this case `http://localhost:1420`).
3. Set the redirect URI to match `GOOGLE_REDIRECT_URI` used by the backend (defaults to `http://localhost:8000/auth/google/callback`).
4. Copy the generated client ID and assign it to `VITE_GOOGLE_CLIENT_ID`.

## `VITE_STRIPE_PUBLISHABLE_KEY` (Optional, for payment flow)

1. Open the Stripe Dashboard → Developers → API keys.
2. Copy the “Publishable key” (test or live). Start with the test key while iterating.
3. Paste it into `VITE_STRIPE_PUBLISHABLE_KEY`.

## `VITE_SENTRY_DSN`

- Optional. If you want browser error tracking, create a project in Sentry and copy its DSN.
- Paste the DSN (looks like `https://public@sentry.io/12345`) into `VITE_SENTRY_DSN`.
