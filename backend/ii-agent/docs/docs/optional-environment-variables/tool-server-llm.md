---
id: optional-tool-server-llm
title: Tool-Server LLM Override (Optional)
sidebar_position: 16
slug: /optional-environment-variables/tool-server-llm
---

By default the tool server shares the backend LLM configuration, but you can point it at a dedicated OpenAI-compatible endpoint. This is useful when the tool server needs a cheaper or faster model for text compression, summarization, or tool routing.

| Variable | Description |
| --- | --- |
| `LLM_CONFIG__OPENAI_API_KEY` | API key for the OpenAI-compatible endpoint the tool server should use (OpenAI, Azure OpenAI, Together, OpenRouter, etc.). |
| `LLM_CONFIG__OPENAI_BASE_URL` | Base URL for the API (leave blank to use api.openai.com). |
| `LLM_CONFIG__OPENAI_MODEL` | Model identifier to request (e.g., `gpt-4o-mini`, `gpt-5-mini`). |

Populate the variables, restart the tool server, and check its logs to ensure it successfully loads the override configuration.
