---
name: brave-search
description: |
  Brave Search Pro AI — primary web search for all A.I.M.S. agents.
  Use when: search, web search, find online, look up, research.
role: Specialist Executor
intent: Retrieve relevant web results for any query using Brave Search Pro AI
kpis: [search_latency_ms, result_relevance_score, fallback_rate]
status: active
priority: critical
triggers:
  - search
  - web search
  - find online
  - look up
  - research
  - brave search
execution:
  target: api
  route: /api/search
dependencies:
  env:
    - BRAVE_API_KEY
  files:
    - frontend/lib/services/search.ts
    - aims-skills/tools/brave-search.tool.md
    - aims-skills/tasks/web-search.md
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

## Core Workflow

1. Agent detects search intent (via triggers or explicit user request)
2. Build query with appropriate parameters (`count`, `freshness`, `result_filter`)
3. Call Brave Search API with `X-Subscription-Token` header
4. Parse response — extract relevant section (`web`, `news`, `videos`, `discussions`, `faq`)
5. If `summary=true` was set, fetch AI summary via summarizer endpoint
6. Return structured results with source URLs attributed
7. On failure (429, 5xx, timeout): fall through to Tavily, then Serper

## API Reference

See [references/api-patterns.md](references/api-patterns.md) for the complete API spec including:
- Base URL and authentication
- Query parameters table
- Full response schema
- Pro AI features (AI Summary, Extra Snippets, higher rate limits)
- Rate limits (20 req/sec on Pro AI)

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

## Quality Gates

- Every search result MUST include source URLs (attribution required)
- Cache within session — don't re-search the same query in the same conversation
- Use `result_filter` — don't fetch all sections when you only need `web`
- Use `freshness` — for news/trending content, set `freshness=pd` or `pw`
- Use `extra_snippets=true` — Pro AI feature, gives richer context per result
- Use `summary=true` — for research tasks, fetch the AI summary

## Hooks

- **trigger:** Search intent detected (via skill router or explicit user request)
- **pre_gsd:** Validate `BRAVE_API_KEY` exists, check rate limit budget
- **post_gsd:** Log search query + result count to audit, cache results

## Limits

- 20 requests/second (Pro AI tier)
- No monthly cap on Pro AI
- If 429 returned: back off 1 second, retry once, then fall to Tavily
