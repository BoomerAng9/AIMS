---
id: optional-image-search
title: Image Search (Optional)
sidebar_position: 14
slug: /optional-environment-variables/image-search
---

If you want the agent to fetch reference images (instead of generating new ones), supply a SerpAPI key dedicated to image search.

| Variable | Description |
| --- | --- |
| `IMAGE_SEARCH_SERPAPI_API_KEY` | SerpAPI key with image-search quota. When provided, the tool server uses the SerpAPI image endpoint; otherwise it relies on DuckDuckGo image scraping. |

Set the variable inside `docker/.stack.env`, restart the tool server, and then ask the agent for images to verify that the SerpAPI quota is being used by checking the SerpAPI dashboard.
