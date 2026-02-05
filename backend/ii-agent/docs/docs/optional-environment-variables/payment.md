---
id: optional-payment
title: Payment Configuration (Optional)
sidebar_position: 10
slug: /optional-environment-variables/payment
---

Configure Stripe only if you plan to charge for plans through the hosted frontend. Without these values, the UI will hide checkout flows and the backend will reject billing-related calls.

## Prerequisites

- A Stripe account with live or test mode enabled.
- Two products (Plus and Pro) with both monthly and annual prices, or the equivalent names you plan to display in the UI.
- A webhook endpoint (e.g., your ngrok HTTPS URL pointing to `/billing/webhook`) registered in the Stripe dashboard.

## Variables

| Variable | Description |
| --- | --- |
| `STRIPE_SECRET_KEY` | Server-side key used to create checkout sessions and manage subscriptions. Use the test key while experimenting. |
| `STRIPE_PRICE_PLUS_MONTHLY` | Price ID for the Plus monthly plan. Copy it from the Stripe dashboard (Pricing → Price ID). |
| `STRIPE_PRICE_PRO_MONTHLY` | Price ID for the Pro monthly plan. |
| `STRIPE_PRICE_PLUS_ANNUALLY` | Annual price ID for the Plus plan. |
| `STRIPE_PRICE_PRO_ANNUALLY` | Annual price ID for the Pro plan. |
| `STRIPE_WEBHOOK_SECRET` | Signing secret provided by Stripe when you register a webhook endpoint; the backend verifies incoming events with it. |

## Setup Checklist

1. Create or reuse the desired products/prices in Stripe, note their price IDs, and paste them into the corresponding variables.
2. Copy the secret key (`sk_live_...` or `sk_test_...`) from the Stripe dashboard and assign it to `STRIPE_SECRET_KEY`.
3. Register a webhook for `/billing/webhook` using your public ngrok URL and grab the signing secret for `STRIPE_WEBHOOK_SECRET`.
4. Restart the stack so the backend reloads the new Stripe credentials. The frontend will automatically surface billing UI if both the publishable and secret keys exist.
