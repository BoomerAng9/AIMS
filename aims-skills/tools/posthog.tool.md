---
id: "posthog"
name: "PostHog"
type: "tool"
category: "analytics"
provider: "PostHog"
description: "Product analytics, feature flags, and A/B testing platform."
env_vars:
  - "POSTHOG_HOST"
docs_url: "https://posthog.com/docs"
aims_files: []
---

# PostHog — Analytics Tool Reference

## Overview

PostHog provides product analytics, session recording, feature flags, and A/B testing. In AIMS it's used for tracking user behavior, measuring activation/retention, and running feature experiments.

## Configuration

| Variable | Required | Where to Get |
|----------|----------|--------------|
| `POSTHOG_HOST` | Optional | https://app.posthog.com |

**Apply in:** `frontend/.env.local`

## Key Features
- Event tracking (page views, clicks, conversions)
- Session recordings
- Feature flags (toggle features per user/group)
- A/B testing
- Funnels and retention analysis

## Pricing
- Free: 1M events/month
- Growth ($0.00031/event): Unlimited features
