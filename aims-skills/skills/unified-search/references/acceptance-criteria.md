# Acceptance Criteria: unified-search

## Must Pass

- [ ] Provider fallback chain implemented: Brave -> Tavily -> Serper -> Error
- [ ] API key check runs before any search attempt -- skip providers with missing keys
- [ ] Every search result includes source URL attribution -- never present results as original knowledge
- [ ] Default result limit is 5 -- only increase when task explicitly requires comprehensive research
- [ ] Results cached for conversation session duration -- no duplicate API calls for same/similar queries
- [ ] Error handling covers: 401 (skip), 429 (skip + cooldown), 500 (retry once then skip), timeout >5s (abort + next)
- [ ] All providers fail gracefully with diagnostic error message to user
- [ ] `SearchResult` type used for all returned results (title, url, snippet, source, optional date/score)
- [ ] Brave preferred for routine searches (cheapest provider)

## Should Pass

- [ ] Provider selection adapts to use case (news -> Brave, academic -> Tavily, local -> Serper)
- [ ] Multi-provider merge/dedup available for deep research tasks (only when user explicitly requests)
- [ ] Search latency < 2 seconds for primary provider response
- [ ] Rate limit tracking per provider to avoid repeated failures
- [ ] Cost tracking: log API call counts per provider per session

## Security

- [ ] API keys never logged, never returned in responses, never exposed to frontend
- [ ] Search queries sanitized (no injection via user input to API calls)
- [ ] Results filtered for known malicious domains if applicable
