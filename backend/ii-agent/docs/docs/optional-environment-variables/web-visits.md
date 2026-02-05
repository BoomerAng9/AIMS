---
id: optional-web-visits
title: Web Visit Providers (Optional)
sidebar_position: 13
slug: /optional-environment-variables/web-visits
---

Browsing-heavy tasks (summarizing articles, scraping structured data, etc.) rely on dedicated providers that can fetch and render pages. Provide any subset of the keys below; the tool server will use whichever providers are configured.

| Variable | Provider | Description |
| --- | --- | --- |
| `WEB_VISIT_FIRECRAWL_API_KEY` | Firecrawl | High-throughput crawling plus Markdown extraction. Create a key inside the Firecrawl dashboard. |
| `WEB_VISIT_GEMINI_API_KEY` | Google Gemini | Allows the agent to combine Gemini models with browsing helpers for reasoning over fetched pages. Reuse a Gemini API key with browsing access. |
| `WEB_VISIT_JINA_API_KEY` | Jina AI | Browser + summarization pipeline hosted by Jina. Generate a key from your account. |
| `WEB_VISIT_TAVILY_API_KEY` | Tavily | Provides browsing plus deep-read APIs. Available from the Tavily dashboard. |

After editing `docker/.stack.env`, restart `docker/docker-compose.stack.yaml` (e.g., rerun `./scripts/run_stack.sh`) so the tool server picks up the new keys.
