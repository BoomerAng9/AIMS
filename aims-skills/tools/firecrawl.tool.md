---
id: "firecrawl"
name: "Firecrawl"
type: "tool"
category: "web"
provider: "Firecrawl"
description: "Web scraping and data extraction API for converting web pages to structured data."
env_vars:
  - "FIRECRAWL_API_KEY"
docs_url: "https://docs.firecrawl.dev/"
aims_files: []
---

# Firecrawl — Web Scraping Tool Reference

## Overview

Firecrawl converts web pages into clean, structured data (markdown or JSON). Used by research Boomer_Angs and Lil_Hawks to extract information from websites for analysis and reporting.

## API Key Setup

| Variable | Required | Where to Get |
|----------|----------|--------------|
| `FIRECRAWL_API_KEY` | Optional | https://firecrawl.dev/ |

**Apply in:** `infra/.env.production`

## API Reference

### Base URL
```
https://api.firecrawl.dev/v1
```

### Auth Header
```
Authorization: Bearer $FIRECRAWL_API_KEY
```

### Scrape Single Page
```http
POST /scrape
{
  "url": "https://example.com",
  "formats": ["markdown", "html"]
}
```

### Crawl Website
```http
POST /crawl
{
  "url": "https://example.com",
  "limit": 10,
  "scrapeOptions": { "formats": ["markdown"] }
}
```

## Pricing
- Free: 500 credits/month
- Hobby ($16/mo): 3,000 credits/month
- Standard ($83/mo): 100,000 credits/month

## Troubleshooting

| Issue | Fix |
|-------|-----|
| 401 Unauthorized | Check `FIRECRAWL_API_KEY` |
| Blocked by site | Some sites block scraping; try with different headers |
| Timeout | Large sites take longer; increase timeout or reduce `limit` |
