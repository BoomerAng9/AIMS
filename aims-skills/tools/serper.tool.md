---
id: "serper"
name: "Serper"
type: "tool"
category: "search"
provider: "Serper"
description: "Google Search API — fallback #2 search provider for AIMS."
env_vars:
  - "SERPER_API_KEY"
docs_url: "https://serper.dev/docs"
aims_files:
  - "frontend/lib/services/search.ts"
---

# Serper — Google Search API Tool Reference

## Overview

Serper provides fast access to Google Search results via API. In AIMS it's the third-priority search provider, used when both Brave and Tavily are unavailable.

## API Key Setup

| Variable | Required | Where to Get |
|----------|----------|--------------|
| `SERPER_API_KEY` | Optional | https://serper.dev/ |

**Apply in:** `frontend/.env.local` or `infra/.env.production`

## API Reference

### Base URL
```
https://google.serper.dev
```

### Auth Header
```
X-API-KEY: $SERPER_API_KEY
```

### Search
```http
POST /search
Content-Type: application/json

{
  "q": "AI managed solutions",
  "num": 10
}
```

**Response shape:**
```json
{
  "organic": [
    {
      "title": "Result Title",
      "link": "https://example.com",
      "snippet": "Snippet text..."
    }
  ]
}
```

## AIMS Usage

```typescript
import { SerperSearchService } from '@/lib/services/search';

const serper = new SerperSearchService();
const results = await serper.search('AI tools', { count: 10 });
// returns: SearchResult[] with { title, url, snippet, source: 'serper' }
```

## Pricing
- Free: 2,500 queries (one-time credit)
- Pro ($50/mo): 50,000 queries/month

## Search Priority
Serper is fallback #2: `Brave → Tavily → Serper`
