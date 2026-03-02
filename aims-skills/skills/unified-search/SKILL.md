---
name: unified-search
description: |
  Unified Search skill for A.I.M.S.
  Use when: performing web searches, research lookups, or any task requiring
  real-time internet data with automatic provider selection and fallback.
role: Specialist Executor
intent: Provide web search with automatic provider selection and fallback chain across Brave, Tavily, and Serper.
kpis:
  - search_latency_ms
  - result_relevance_score
  - provider_fallback_rate
status: active
priority: high
triggers:
  - search
  - find
  - lookup
  - research online
  - web search
  - google it
execution: sequential
dependencies:
  - BRAVE_API_KEY
  - TAVILY_API_KEY (optional)
  - SERPER_API_KEY (optional)
---

# Unified Search

## Provider Priority Chain

The unified search system uses a waterfall fallback strategy:

```
Brave Search  -->  Tavily  -->  Serper  -->  Error
  (primary)      (fallback)   (fallback)   (all failed)
```

If the primary provider fails (rate limit, timeout, API error), the system automatically falls through to the next provider. If all providers fail, return an error with diagnostic info.

## Provider Selection by Use Case

| Use Case | Preferred Provider | Reason |
|----------|-------------------|--------|
| General web search | Brave | Best balance of speed and quality |
| News / current events | Brave | Real-time index, good freshness |
| Academic / research | Tavily | Better depth and source quality |
| Local business / maps | Serper | Google-backed local results |
| Quick factual lookups | Brave | Fastest response time |
| Competitive analysis | Tavily | Better at extracting structured data |

## API Key Check

Before executing a search, verify API keys are available:

```typescript
const providers = [
  { name: 'brave', key: process.env.BRAVE_API_KEY },
  { name: 'tavily', key: process.env.TAVILY_API_KEY },
  { name: 'serper', key: process.env.SERPER_API_KEY },
].filter(p => p.key);

if (providers.length === 0) {
  throw new Error('No search provider API keys configured');
}
```

## SearchResult Interface

```typescript
type SearchResult = {
  title: string;
  url: string;
  snippet: string;
  source: 'brave' | 'tavily' | 'serper';
  publishedDate?: string;
  relevanceScore?: number;
};
```

## Rules

1. **Always attribute sources.** Every search result returned to the user must include the source URL. Never present search results as original knowledge.

2. **Limit results to what's needed.** Default to 5 results. Only increase if the task explicitly requires comprehensive research. Fewer results = lower cost and faster response.

3. **Cache results.** Cache search results for the duration of the conversation session. If the same query (or semantically similar query) is made twice, return cached results instead of making a new API call.

4. **Combine providers when depth is needed.** For research tasks, query multiple providers and merge/deduplicate results for broader coverage. Use this sparingly -- only when the user explicitly asks for thorough research.

5. **Cost awareness.** Each API call has a cost. Prefer Brave (cheapest) for routine searches. Escalate to Tavily/Serper only when Brave fails or the use case demands it. Never make speculative or exploratory API calls without user intent.

## Error Handling

| Error | Action |
|-------|--------|
| 401 Unauthorized | Skip provider, log key issue, try next |
| 429 Rate Limited | Skip provider, try next, note cooldown |
| 500 Server Error | Retry once with 1s delay, then skip |
| Timeout (>5s) | Abort, try next provider |
| All providers fail | Return error to user with available diagnostic info |

## References

- `references/acceptance-criteria.md` -- Acceptance criteria for this skill
