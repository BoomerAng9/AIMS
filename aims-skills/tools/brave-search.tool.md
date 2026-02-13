---
id: "brave-search"
name: "Brave Search"
type: "tool"
category: "search"
provider: "Brave"
description: "Privacy-first web search API — primary search provider for AIMS research and information gathering."
env_vars:
  - "BRAVE_SEARCH_API_KEY"
docs_url: "https://brave.com/search/api/"
aims_files:
  - "frontend/lib/services/search.ts"
---

# Brave Search — Web Search Tool Reference

## Overview

Brave Search is the primary web search provider for AIMS. It provides privacy-first search results via REST API. Used by research tasks, Make It Mine vertical, and any agent needing web data.

## API Key Setup

| Variable | Required | Where to Get |
|----------|----------|--------------|
| `BRAVE_SEARCH_API_KEY` | Yes | https://brave.com/search/api/ |

**Apply in:** `frontend/.env.local` or `infra/.env.production`

## API Reference

### Base URL
```
https://api.search.brave.com/res/v1/web/search
```

### Auth Header
```
X-Subscription-Token: $BRAVE_SEARCH_API_KEY
```

### Web Search
```http
GET /res/v1/web/search?q=AI+managed+solutions&count=10
Accept: application/json
```

**Response shape:**
```json
{
  "web": {
    "results": [
      {
        "title": "Result Title",
        "url": "https://example.com",
        "description": "Snippet text..."
      }
    ]
  }
}
```

## AIMS Usage

```typescript
import { BraveSearchService } from '@/lib/services/search';

const brave = new BraveSearchService();
const results = await brave.search('AI managed solutions', { count: 10 });
// returns: SearchResult[] with { title, url, snippet, source: 'brave' }
```

## Pricing
- Free: 2,000 queries/month
- Basic ($3/mo): 20,000 queries/month
- Pro: Custom pricing

## Rate Limits
- 1 request/second (free tier)
- 20 requests/second (paid)

## Search Provider Priority in AIMS
```
1. Brave Search (primary)
2. Tavily (fallback #1)
3. Serper (fallback #2)
```

## Troubleshooting

| Issue | Fix |
|-------|-----|
| 401 Unauthorized | Check `BRAVE_SEARCH_API_KEY` is set |
| 429 Rate limited | Reduce request frequency or upgrade plan |
| Empty results | Broaden query terms or check language parameter |
