---
id: optional-researcher-config-tool
title: Researcher Agent Tool Config (Optional)
slug: /optional-environment-variables/researcher-config-tool
sidebar_position: 18
description: Reference copy of the RESEARCHER_AGENT_CONFIG tool payload.
---

Use this page whenever you need to paste the exact `RESEARCHER_AGENT_CONFIG` payload shared in the toolkit. Replace the sample API keys with your own before committing changes or deploying the stack.

## Tool config payload

```bash
RESEARCHER_AGENT_CONFIG='{
  "final_report_builder": {
    "model": "gemini-2.5-pro",
    "application_model_name": "gemini-2.5-pro",
    "api_key": "key",
    "base_url": null,
    "max_retries": 3,
    "max_message_chars": 30000,
    "temperature": 0.0,
    "vertex_region": null,
    "vertex_project_id": null,
    "api_type": "gemini",
    "thinking_tokens": 0,
    "azure_endpoint": null,
    "azure_api_version": null,
    "cot_model": false
  },
  "report_builder": {
    "model": "gemini-2.5-flash",
    "application_model_name": "gemini-2.5-flash",
    "api_key": "key",
    "base_url": null,
    "max_retries": 3,
    "max_message_chars": 30000,
    "temperature": 0.0,
    "vertex_region": null,
    "vertex_project_id": null,
    "api_type": "gemini",
    "thinking_tokens": 0,
    "azure_endpoint": null,
    "azure_api_version": null,
    "cot_model": false
  },
  "researcher": {
    "model": "deepseek-reasoner",
    "application_model_name": "r1",
    "api_key": "key",
    "base_url" : "https://api.deepseek.com/beta",
    "api_type": "openai"
  }
}'
```

## Notes

- The `researcher` role must call a completion API. Keep the `api_type` and `base_url` values aligned with your provider’s OpenAI-compatible endpoint.
- Each builder entry (`report_builder`, `final_report_builder`) must include a complete LLM config block so they can render drafts independently of the default stack settings.
