---
id: "brave-search"
name: "Brave Search"
type: "skill"
status: "active"
triggers:
  - "search"
  - "web search"
  - "find online"
  - "look up"
  - "research"
  - "brave search"
description: "Brave Search is the AIMS standard for web search. Pro AI tier. Every agent must use Brave as the primary search provider."
execution:
  target: "api"
  route: "/api/search"
dependencies:
  env:
    - "BRAVE_API_KEY"
  files:
    - "frontend/lib/services/search.ts"
    - "aims-skills/tools/brave-search.tool.md"
    - "aims-skills/tasks/web-search.md"
priority: "critical"
---

# Brave Search Skill — AIMS Standard Search Provider

## Status: PRIMARY — Not Optional

Brave Search Pro AI is the **standard** search provider for all A.I.M.S. agents.
Every search operation MUST attempt Brave first. Tavily and Serper are fallbacks only.

```
Priority Chain (enforced by hook):
  1. Brave Search (BRAVE_API_KEY) ← ALWAYS TRY FIRST
  2. Tavily (TAVILY_API_KEY)      ← only if Brave fails
  3. Serper (SERPER_API_KEY)      ← only if both fail
```

## Environment Variable

```
BRAVE_API_KEY=<your-key>
```

Set in:
- `infra/.env.production` (Docker reads this)
- `frontend/.env.local` (local dev)

**NOT** `BRAVE_SEARCH_API_KEY` — the code accepts both for backwards compatibility but `BRAVE_API_KEY` is canonical.

## API Reference

### Base URL
```
https://api.search.brave.com/res/v1/web/search
```

### Authentication
```http
GET /res/v1/web/search?q=<query>
Accept: application/json
Accept-Encoding: gzip
X-Subscription-Token: <BRAVE_API_KEY>
```

### Query Parameters

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `q` | string | required | Search query |
| `count` | int | 10 | Results per page (max 20) |
| `offset` | int | 0 | Pagination offset |
| `country` | string | auto | 2-letter country code |
| `search_lang` | string | auto | Search language |
| `safesearch` | string | moderate | `off`, `moderate`, `strict` |
| `freshness` | string | none | `pd` (past day), `pw` (past week), `pm` (past month), `py` (past year) |
| `text_decorations` | bool | true | Bold/highlight markers in snippets |
| `result_filter` | string | none | Comma-separated: `discussions`, `faq`, `infobox`, `news`, `query`, `summarizer`, `videos`, `web` |
| `goggles_id` | string | none | Custom Goggle URL for re-ranking |
| `units` | string | auto | `metric` or `imperial` |
| `extra_snippets` | bool | false | Up to 5 extra snippets per result (Pro AI only) |
| `summary` | bool | false | Enable AI summarizer (Pro AI only) |

### Response Schema (Complete)

```json
{
  "type": "search",
  "query": {
    "original": "string",
    "altered": "string",
    "cleaned": "string",
    "safesearch": true,
    "is_navigational": true,
    "is_news_breaking": true,
    "more_results_available": true,
    "summary_key": "string"
  },
  "web": {
    "type": "search",
    "results": [
      {
        "title": "string",
        "url": "string",
        "description": "string",
        "page_age": "string",
        "page_fetched": "string",
        "profile": {
          "name": "string",
          "url": "string",
          "long_name": "string",
          "img": "string"
        },
        "language": "en",
        "extra_snippets": ["string"]
      }
    ],
    "family_friendly": true
  },
  "news": {
    "type": "news",
    "results": [
      {
        "title": "string",
        "url": "string",
        "description": "string",
        "page_age": "string",
        "profile": { "name": "string", "img": "string" }
      }
    ]
  },
  "videos": {
    "type": "videos",
    "results": [
      {
        "type": "video_result",
        "url": "string",
        "title": "string",
        "description": "string",
        "video": {
          "duration": "string",
          "views": 1,
          "creator": "string",
          "publisher": "string"
        }
      }
    ]
  },
  "discussions": {
    "type": "search",
    "results": [
      {
        "title": "string",
        "url": "string",
        "description": "string"
      }
    ]
  },
  "faq": {
    "type": "faq",
    "results": [
      {
        "question": "string",
        "answer": "string",
        "title": "string",
        "url": "string"
      }
    ]
  },
  "infobox": {
    "type": "graph",
    "results": [
      {
        "title": "string",
        "url": "string",
        "description": "string"
      }
    ]
  },
  "locations": {
    "type": "locations",
    "results": [
      {
        "title": "string",
        "url": "string",
        "description": "string"
      }
    ]
  },
  "summarizer": {
    "type": "summarizer",
    "key": "string"
  },
  "mixed": {
    "type": "mixed",
    "main": [{ "type": "web|news|videos|infobox", "index": 0 }],
    "top": [],
    "side": []
  }
}
```

### Pro AI Features (We Have These)

| Feature | Param | Description |
|---------|-------|-------------|
| **AI Summary** | `summary=true` | Returns a `summarizer.key` to fetch AI-generated summary |
| **Extra Snippets** | `extra_snippets=true` | Up to 5 additional content excerpts per result |
| **Higher Rate Limits** | — | 20 req/sec vs 1 req/sec on free tier |

### Fetching AI Summary (Pro AI)

If `summarizer.key` is present in the response:
```http
GET https://api.search.brave.com/res/v1/summarizer/search?key=<summarizer_key>
Accept: application/json
X-Subscription-Token: <BRAVE_API_KEY>
```

## Usage in AIMS Code

```typescript
import { braveSearch, unifiedSearch } from '@/lib/services/search';

// Direct Brave search
const results = await braveSearch.search('AI managed solutions', { count: 10 });

// Unified search (Brave first, auto-fallback)
const results = await unifiedSearch('AI managed solutions');
```

## When to Use Each Response Section

| Section | Use Case |
|---------|----------|
| `web.results` | General research, link gathering |
| `news.results` | Per\|Form headlines, trending content, market research |
| `videos.results` | Content discovery, tutorial finding |
| `discussions.results` | Reddit/forum sentiment, community insights |
| `faq.results` | Quick answers, knowledge extraction |
| `infobox.results` | Entity data (people, companies, places) |
| `locations.results` | Real estate scout, local business lookup |
| `summarizer` | AI-generated summary for research reports |

## Rate Limits (Pro AI Tier)

- **20 requests/second**
- **No monthly cap** on Pro AI
- If 429 returned: back off 1 second, retry once, then fall to Tavily

## Rules for All Agents

1. **Brave is primary** — always try Brave before any other search provider
2. **Use `result_filter`** — don't fetch all sections when you only need `web`
3. **Use `freshness`** — for news/trending content, set `freshness=pd` or `pw`
4. **Use `extra_snippets=true`** — Pro AI feature, gives richer context per result
5. **Use `summary=true`** — for research tasks, fetch the AI summary
6. **Attribute sources** — always include URLs in output
7. **Cache within session** — don't re-search the same query in the same conversation
