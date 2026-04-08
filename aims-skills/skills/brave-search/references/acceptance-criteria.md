# Brave Search — Acceptance Criteria

## Functional Requirements

1. **Primary provider**: All search operations attempt Brave Search first before any fallback
2. **Fallback chain**: Brave → Tavily → Serper, triggered only on Brave failure (429, 5xx, timeout)
3. **Authentication**: Every request includes `X-Subscription-Token` header with `BRAVE_API_KEY`
4. **Result filtering**: Use `result_filter` parameter to avoid fetching unnecessary response sections
5. **Freshness control**: Time-sensitive queries use `freshness` parameter (`pd`, `pw`, `pm`, `py`)
6. **AI summary**: Research tasks set `summary=true` and fetch summarizer endpoint if key returned
7. **Extra snippets**: Pro AI requests set `extra_snippets=true` for richer context

## Non-Functional Requirements

1. **Latency**: P95 search response < 2 seconds
2. **Rate limit compliance**: Stay within 20 req/sec Pro AI limit
3. **Backoff**: On 429, wait 1 second, retry once, then fall to next provider
4. **Caching**: Same query within same conversation session returns cached result
5. **Attribution**: Every result returned to user includes source URL

## Failure Modes

| Scenario | Expected Behavior |
|----------|-------------------|
| `BRAVE_API_KEY` missing | Fall to Tavily immediately |
| 429 rate limit | Back off 1s, retry once, then Tavily |
| 5xx server error | Fall to Tavily immediately |
| Network timeout (>5s) | Fall to Tavily |
| All providers fail | Return error message to user, log failure |
