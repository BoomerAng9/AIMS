---
id: "unified-search"
name: "Unified Search"
type: "skill"
status: "active"
triggers:
  - "search"
  - "find"
  - "lookup"
  - "research online"
  - "web search"
  - "google it"
description: "Guides agents on search provider selection, fallback chain, and result handling."
execution:
  target: "api"
  route: "/api/search"
dependencies:
  env:
    - "BRAVE_API_KEY"
  files:
    - "aims-skills/tools/brave-search.tool.md"
    - "aims-skills/tools/tavily.tool.md"
    - "aims-skills/tools/serper.tool.md"
    - "frontend/lib/services/search.ts"
priority: "high"
---

# Unified Search Skill

## When This Fires

Triggers when any agent needs to search the web for information, research, or data gathering.

## Provider Priority Chain

```
1. Brave Search (BRAVE_API_KEY)
   ↓ if key missing or rate limited
2. Tavily (TAVILY_API_KEY)
   ↓ if key missing or rate limited
3. Serper (SERPER_API_KEY)
   ↓ if all fail
4. Return error: "No search providers available"
```

### Provider Selection by Use Case

| Use Case | Best Provider | Why |
|----------|--------------|-----|
| General web search | Brave | Fast, privacy-first, good snippets |
| Deep content extraction | Tavily | Returns full content, not just snippets |
| Google-specific results | Serper | Uses actual Google index |
| Real-time news | Brave | Freshest results |

## API Key Check

Before searching, verify at least one provider is configured:
```
BRAVE_API_KEY → use Brave
TAVILY_API_KEY → use Tavily
SERPER_API_KEY → use Serper
None set → return error, suggest user add a search API key
```

## Result Format

All providers return the same `SearchResult` interface:
```typescript
{
  title: string;    // Page title
  url: string;      // Full URL
  snippet: string;  // Content excerpt
  source: string;   // 'brave' | 'tavily' | 'serper'
}
```

## Rules

1. **Always attribute sources** — Include URLs in any research output
2. **Limit results** — Default to 10, max 20 per query
3. **Cache results** — Don't re-search the same query within a session
4. **Combine providers** — For thorough research, query 2+ providers and deduplicate
5. **Cost awareness** — Brave free tier is 2000/month; don't waste on trivial queries
