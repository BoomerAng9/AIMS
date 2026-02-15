---
id: "apify"
name: "Apify"
type: "tool"
category: "web"
provider: "Apify"
description: "Library of 500+ pre-built web scrapers and automation tools."
env_vars:
  - "APIFY_API_KEY"
docs_url: "https://docs.apify.com/"
aims_files: []
---

# Apify — Web Scraper Library Tool Reference

## Overview

Apify provides 500+ pre-built web scrapers (called "actors") for specific platforms: Google Maps, Amazon, LinkedIn, Twitter, etc. In AIMS it's used for specialized data extraction that general scrapers can't handle.

## API Key Setup

| Variable | Required | Where to Get |
|----------|----------|--------------|
| `APIFY_API_KEY` | Optional | https://console.apify.com/account/integrations |

**Apply in:** `infra/.env.production`

## API Reference

### Base URL
```
https://api.apify.com/v2
```

### Auth
```
?token=$APIFY_API_KEY
```

### Run an Actor
```http
POST /acts/{actorId}/runs?token=$APIFY_API_KEY
{
  "startUrls": [{ "url": "https://example.com" }],
  "maxPagesPerCrawl": 10
}
```

### Get Results
```http
GET /datasets/{datasetId}/items?token=$APIFY_API_KEY
```

## Popular Actors
- Google Maps Scraper
- Amazon Product Scraper
- LinkedIn Profile Scraper
- Website Content Crawler

## Pricing
- Free: $5/month credits
- Personal ($49/mo): Full access

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Actor not found | Check actor ID in Apify Store |
| Run failed | Check actor input schema matches expected format |
