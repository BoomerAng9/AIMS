---
id: "plausible"
name: "Plausible"
type: "tool"
category: "analytics"
provider: "Plausible"
description: "Privacy-first, lightweight web analytics — no cookies, GDPR compliant."
env_vars:
  - "PLAUSIBLE_HOST"
  - "PLAUSIBLE_DOMAIN"
docs_url: "https://plausible.io/docs"
aims_files: []
---

# Plausible — Analytics Tool Reference

## Overview

Plausible is a privacy-first analytics alternative. No cookies, no personal data collection, fully GDPR/CCPA compliant. Used for basic traffic metrics without the overhead of full product analytics.

## Configuration

| Variable | Required | Where to Get |
|----------|----------|--------------|
| `PLAUSIBLE_HOST` | Optional | https://plausible.io |
| `PLAUSIBLE_DOMAIN` | Optional | Your tracked domain |

**Apply in:** `frontend/.env.local`

## Integration

Simple script tag — no SDK needed:
```html
<script defer data-domain="plugmein.cloud" src="https://plausible.io/js/script.js"></script>
```

## Pricing
- Self-hosted: Free (open source)
- Cloud ($9/mo): 10K pageviews/month
