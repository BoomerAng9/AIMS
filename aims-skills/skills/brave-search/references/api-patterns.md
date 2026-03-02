# Brave Search API Reference

## Base URL

```
https://api.search.brave.com/res/v1/web/search
```

## Authentication

```http
GET /res/v1/web/search?q=<query>
Accept: application/json
Accept-Encoding: gzip
X-Subscription-Token: <BRAVE_API_KEY>
```

## Query Parameters

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

## Response Schema

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

## Pro AI Features

| Feature | Param | Description |
|---------|-------|-------------|
| **AI Summary** | `summary=true` | Returns a `summarizer.key` to fetch AI-generated summary |
| **Extra Snippets** | `extra_snippets=true` | Up to 5 additional content excerpts per result |
| **Higher Rate Limits** | — | 20 req/sec vs 1 req/sec on free tier |

## Fetching AI Summary (Pro AI)

If `summarizer.key` is present in the response:

```http
GET https://api.search.brave.com/res/v1/summarizer/search?key=<summarizer_key>
Accept: application/json
X-Subscription-Token: <BRAVE_API_KEY>
```
