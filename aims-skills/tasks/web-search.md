---
id: "web-search"
name: "Web Search"
type: "task"
status: "active"
triggers:
  - "search web"
  - "find online"
  - "lookup"
  - "google"
  - "research"
  - "search for"
  - "brave search"
  - "news search"
description: "Search the web using Brave Pro AI (primary), Tavily, or Serper with automatic fallback."
execution:
  target: "api"
  route: "/api/search"
  command: ""
dependencies:
  env:
    - "BRAVE_API_KEY"
  packages: []
  files:
    - "frontend/lib/services/search.ts"
    - "aims-skills/skills/brave-search.skill.md"
    - "aims-skills/skills/unified-search.skill.md"
priority: "high"
---

# Web Search Task

## Provider Priority (Enforced)

```
1. Brave Search Pro AI  (BRAVE_API_KEY)    ← ALWAYS FIRST
2. Tavily               (TAVILY_API_KEY)   ← fallback #1
3. Serper / Google      (SERPER_API_KEY)   ← fallback #2
```

## Endpoint

**POST** `/api/search`

```json
{
  "query": "AI managed solutions platform",
  "count": 10,
  "provider": "auto",
  "freshness": null,
  "summary": false
}
```

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `query` | string | required | Search query |
| `count` | int | 10 | Max results (max 20) |
| `provider` | string | `"auto"` | `"auto"`, `"brave"`, `"tavily"`, `"serper"` |
| `freshness` | string | null | Brave only: `"pd"` (day), `"pw"` (week), `"pm"` (month) |
| `summary` | bool | false | Brave Pro AI: request AI summary |

**Response:**
```json
{
  "results": [
    {
      "title": "Page Title",
      "url": "https://example.com",
      "snippet": "Content excerpt...",
      "source": "brave"
    }
  ],
  "provider": "brave",
  "success": true
}
```

## Brave Pro AI — Advanced Response Sections

When querying Brave directly, these additional sections are available:

| Section | What it Contains | When to Use |
|---------|-----------------|-------------|
| `web.results` | Standard web results | Always |
| `news.results` | Breaking/recent news | Per\|Form headlines, market updates |
| `videos.results` | Video results with duration/views | Content discovery |
| `discussions.results` | Forum/Reddit threads | Sentiment analysis, community research |
| `faq.results` | Question/answer pairs | Quick knowledge extraction |
| `infobox.results` | Knowledge graph entities | Company/person lookups |
| `locations.results` | Local business/place results | Real estate scout, local search |
| `summarizer.key` | Key to fetch AI summary | Research reports, deep analysis |

## cURL Example (Direct Brave)

```bash
curl "https://api.search.brave.com/res/v1/web/search?q=brave+search&summary=true&extra_snippets=true" \
  -H "Accept: application/json" \
  -H "Accept-Encoding: gzip" \
  -H "X-Subscription-Token: ${BRAVE_API_KEY}"
```

## Use Case Examples

### General Research
```json
{ "query": "AI agent frameworks 2026", "count": 10 }
```

### Breaking News (Per|Form)
```json
{ "query": "NFL draft 2026", "count": 5, "freshness": "pd" }
```

### Deep Research with AI Summary
```json
{ "query": "containerized AI solutions market", "summary": true }
```

## API Keys

| Provider | Env Var | URL |
|----------|---------|-----|
| Brave Pro AI | `BRAVE_API_KEY` | https://brave.com/search/api/ |
| Tavily | `TAVILY_API_KEY` | https://tavily.com/ |
| Serper | `SERPER_API_KEY` | https://serper.dev/ |
