---
id: "tavily"
name: "Tavily"
type: "tool"
category: "search"
provider: "Tavily"
description: "AI-optimized search API — fallback #1 search provider for AIMS."
env_vars:
  - "TAVILY_API_KEY"
docs_url: "https://docs.tavily.com/"
aims_files:
  - "frontend/lib/services/search.ts"
---

# Tavily — Search API Tool Reference

## Overview

Tavily is an AI-optimized search API designed for LLM applications. In AIMS it serves as fallback #1 when Brave Search is unavailable or rate-limited.

## API Key Setup

| Variable | Required | Where to Get |
|----------|----------|--------------|
| `TAVILY_API_KEY` | Optional | https://tavily.com/ |

**Apply in:** `frontend/.env.local` or `infra/.env.production`

## API Reference

### Base URL
```
https://api.tavily.com
```

### Search
```http
POST /search
Content-Type: application/json

{
  "api_key": "$TAVILY_API_KEY",
  "query": "AI managed solutions",
  "max_results": 10
}
```

**Response shape:**
```json
{
  "results": [
    {
      "title": "Result Title",
      "url": "https://example.com",
      "content": "Extracted content..."
    }
  ]
}
```

## AIMS Usage

```typescript
import { TavilySearchService } from '@/lib/services/search';

const tavily = new TavilySearchService();
const results = await tavily.search('AI tools', { count: 10 });
// returns: SearchResult[] with { title, url, snippet, source: 'tavily' }
```

## Pricing
- Free: 1,000 searches/month
- Pro ($100/mo): 10,000 searches/month

## Troubleshooting

| Issue | Fix |
|-------|-----|
| 401 Unauthorized | Check `TAVILY_API_KEY` in POST body (not header) |
| Slow response | Tavily does deep extraction; allow 3-5s timeout |
