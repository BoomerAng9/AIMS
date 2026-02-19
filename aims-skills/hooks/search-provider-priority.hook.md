---
id: "search-provider-priority"
name: "Search Provider Priority"
type: "hook"
status: "active"
fires_when: "Any agent performs a web search"
description: "Enforces Brave Search Pro AI as the primary search provider. Blocks any search call that skips Brave without a valid reason."
---

# Search Provider Priority Hook

## Purpose

Ensures every search operation in A.I.M.S. respects the standard provider chain:

```
1. Brave Search Pro AI  (BRAVE_API_KEY)    ← MANDATORY FIRST ATTEMPT
2. Tavily               (TAVILY_API_KEY)   ← only on Brave failure
3. Serper               (SERPER_API_KEY)   ← only on both failures
```

## When This Fires

- Any call to `/api/search`
- Any use of `unifiedSearch()` from `frontend/lib/services/search.ts`
- Any agent task that involves web research, news ingestion, or data gathering
- Per|Form content pipeline search operations
- Make It Mine research tasks

## Enforcement Rules

### MUST

1. **Try Brave first** — if `BRAVE_API_KEY` is set, it MUST be the first provider attempted
2. **Log the provider used** — every search result must include `source: "brave"|"tavily"|"serper"`
3. **Use Pro AI features** — when doing research tasks, set `summary=true` and `extra_snippets=true`
4. **Use freshness filters** — for news/trending content, set `freshness=pd|pw`

### MUST NOT

1. **Skip Brave** — never jump straight to Tavily or Serper when Brave key is available
2. **Hardcode a non-Brave default** — code must not default to another provider
3. **Ignore rate limits** — if Brave returns 429, back off 1s then retry once before falling back

## Validation Check

Before executing any search:

```pseudo
IF BRAVE_API_KEY is set AND BRAVE_API_KEY is not empty:
  provider = brave
  attempt brave search
  IF 429 or 5xx:
    wait 1 second
    retry once
    IF still fails:
      fall to tavily
  IF success:
    return results with source="brave"
ELSE:
  log warning: "Brave API key missing — falling back to Tavily"
  attempt tavily → serper chain
```

## Environment Variable

The canonical env var is `BRAVE_API_KEY` (not `BRAVE_SEARCH_API_KEY`).

Code accepts both for backwards compatibility:
```typescript
process.env.BRAVE_API_KEY || process.env.BRAVE_SEARCH_API_KEY
```

## Related Files

| File | Role |
|------|------|
| `aims-skills/skills/brave-search.skill.md` | Full API reference and usage guide |
| `aims-skills/tasks/web-search.md` | Task definition with endpoint spec |
| `aims-skills/tools/brave-search.tool.md` | Tool manifest |
| `frontend/lib/services/search.ts` | Implementation (BraveSearchService + unifiedSearch) |
