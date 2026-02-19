---
id: "brave-search"
name: "Brave Search Pro AI"
type: "tool"
category: "search"
provider: "Brave"
tier: "Pro AI"
description: "Privacy-first web search API — AIMS standard search provider. Pro AI tier with AI summaries and extra snippets."
env_vars:
  - "BRAVE_API_KEY"
docs_url: "https://brave.com/search/api/"
aims_files:
  - "frontend/lib/services/search.ts"
  - "aims-skills/skills/brave-search.skill.md"
  - "aims-skills/tasks/web-search.md"
  - "aims-skills/hooks/search-provider-priority.hook.md"
---

# Brave Search Pro AI — Tool Reference

## AIMS Standard

Brave Search is the **primary and mandatory** search provider for A.I.M.S.
All agents must attempt Brave before any fallback (Tavily, Serper).

## Environment Variable

```
BRAVE_API_KEY=<your-key>
```

**Canonical name:** `BRAVE_API_KEY`
**Legacy alias:** `BRAVE_SEARCH_API_KEY` (accepted for backwards compat)

Set in: `infra/.env.production` and `frontend/.env.local`

## API Endpoints

### Web Search
```http
GET https://api.search.brave.com/res/v1/web/search?q=<query>
Accept: application/json
Accept-Encoding: gzip
X-Subscription-Token: <BRAVE_API_KEY>
```

### AI Summarizer (Pro AI)
```http
GET https://api.search.brave.com/res/v1/summarizer/search?key=<summarizer_key>
Accept: application/json
X-Subscription-Token: <BRAVE_API_KEY>
```

## Query Parameters

| Param | Type | Description |
|-------|------|-------------|
| `q` | string | Search query (required) |
| `count` | int | Results per page (max 20) |
| `offset` | int | Pagination offset |
| `country` | string | 2-letter country code |
| `search_lang` | string | Search language |
| `safesearch` | string | `off`, `moderate`, `strict` |
| `freshness` | string | `pd`, `pw`, `pm`, `py` |
| `extra_snippets` | bool | Pro AI: up to 5 extra snippets/result |
| `summary` | bool | Pro AI: enable AI summarizer |
| `result_filter` | string | Comma-separated sections to include |

## Response Sections

| Section | Type | Contains |
|---------|------|----------|
| `web` | search | Standard web results |
| `news` | news | News articles |
| `videos` | videos | Video results with metadata |
| `discussions` | search | Forum/Reddit threads |
| `faq` | faq | Question/answer pairs |
| `infobox` | graph | Knowledge graph entities |
| `locations` | locations | Local/place results |
| `summarizer` | summarizer | AI summary key |
| `mixed` | mixed | Recommended display ordering |

## AIMS Code Usage

```typescript
import { braveSearch, unifiedSearch } from '@/lib/services/search';

// Direct
const results = await braveSearch.search('query', { count: 10 });

// Unified (Brave first, auto-fallback)
const results = await unifiedSearch('query');
```

## Rate Limits

| Tier | Requests/sec | Monthly |
|------|-------------|---------|
| Free | 1/sec | 2,000 |
| Pro AI | 20/sec | Unlimited |

## Search Provider Priority

```
1. Brave Search Pro AI  ← ALWAYS FIRST (this tool)
2. Tavily               ← fallback #1
3. Serper               ← fallback #2
```

See: `aims-skills/hooks/search-provider-priority.hook.md`
