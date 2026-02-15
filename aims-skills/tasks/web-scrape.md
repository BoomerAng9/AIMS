---
id: "web-scrape"
name: "Web Scrape"
type: "task"
status: "active"
triggers:
  - "scrape"
  - "crawl"
  - "extract"
  - "scrape website"
  - "get data from"
description: "Scrape web pages for structured data using Firecrawl (primary) or Apify (specialized)."
execution:
  target: "api"
  route: "/api/scrape"
  command: ""
dependencies:
  env:
    - "FIRECRAWL_API_KEY"
  packages:
    - "@mendable/firecrawl-js"
  files:
    - "aims-skills/tools/firecrawl.tool.md"
    - "aims-skills/tools/apify.tool.md"
priority: "medium"
---

# Web Scrape Task

## Endpoint
**POST** `/api/scrape`

```json
{
  "url": "https://example.com",
  "format": "markdown",
  "limit": 1
}
```

**Response:**
```json
{
  "content": "# Page Title\n\nExtracted content...",
  "url": "https://example.com",
  "success": true
}
```

## Provider Selection
- **Firecrawl** — General web scraping (default)
- **Apify** — Platform-specific scrapers (Google Maps, Amazon, etc.)

## API Keys
- Primary: `FIRECRAWL_API_KEY` — https://firecrawl.dev/
- Specialized: `APIFY_API_KEY` — https://console.apify.com/
