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
description: "Search the web using Brave (primary), Tavily, or Serper with automatic fallback."
execution:
  target: "api"
  route: "/api/search"
  command: ""
dependencies:
  env:
    - "BRAVE_SEARCH_API_KEY"
  packages: []
  files:
    - "frontend/lib/services/search.ts"
    - "aims-skills/skills/unified-search.skill.md"
priority: "high"
---

# Web Search Task

## Endpoint
**POST** `/api/search`

```json
{
  "query": "AI managed solutions platform",
  "count": 10,
  "provider": "auto"
}
```

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

## Provider Auto-Selection
When `provider: "auto"`, uses the fallback chain: Brave → Tavily → Serper.

## API Keys
- Primary: `BRAVE_SEARCH_API_KEY` — https://brave.com/search/api/
- Fallback 1: `TAVILY_API_KEY` — https://tavily.com/
- Fallback 2: `SERPER_API_KEY` — https://serper.dev/
