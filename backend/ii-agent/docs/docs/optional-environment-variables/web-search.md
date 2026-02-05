---
id: optional-web-search
title: Web Search Providers (Optional)
sidebar_position: 12
slug: /optional-environment-variables/web-search
---

Agents can query multiple search providers through the tool server. You only need to supply keys for the providers you intend to use; unset values cause the tool server to fall back to DuckDuckGo.

| Variable | Provider | Notes |
| --- | --- | --- |
| `WEB_SEARCH_SERPAPI_API_KEY` | SerpAPI | Supports Google/Bing/News/Images search. Sign up at [serpapi.com](https://serpapi.com/) and copy the key from the dashboard. |
| `WEB_SEARCH_JINA_API_KEY` | Jina AI Search | Provides a structured/general search endpoint. Create an account at [jina.ai](https://jina.ai/) and generate an API token. |
| `WEB_SEARCH_TAVILY_API_KEY` | Tavily | Great for RAG-like search experiences. Obtain a key from [tavily.com](https://tavily.com). |

Populate any combination of the above keys, then restart the tool server. The agent will automatically route search requests to the available providers, falling back to DuckDuckGo when none respond.
