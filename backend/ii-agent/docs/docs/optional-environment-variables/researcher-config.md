---
id: optional-researcher-config
title: Researcher Agent Config (Optional)
slug: /optional-environment-variables/researcher-config
sidebar_position: 17
description: Configure the RESEARCHER_AGENT_CONFIG variable to enable research-specialized sub-agents.
---

Use `RESEARCHER_AGENT_CONFIG` to define the LLM stacks that power the dedicated research workflow. The JSON payload should describe each specialized role plus the shared credentials it needs. Populate this variable only when you want II-Agent to spin up the researcher/report builder chain.

```bash
RESEARCHER_AGENT_CONFIG='{
  "final_report_builder": {
    "model": "gemini-2.5-pro",
    "application_model_name": "gemini-2.5-pro",
    "api_key": "<GEMINI_API_KEY>",
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
    "api_key": "<GEMINI_API_KEY>",
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
    "api_key": "<DEEPSEEK_API_KEY>",
    "base_url": "https://api.deepseek.com/beta",
    "api_type": "openai"
  }
}'
```

## Implementation notes

- **Builders need full configs.** Both `report_builder` roles must include the full LLM configuration block (model, application model name, API key, retry/size limits, and toggles) so they can render structured drafts without reusing the base agent credentials. Customize `temperature`, `max_message_chars`, or any other fields to match your latency/cost requirements.
- **Researcher must use the completion API.** The `researcher` role runs long-form reasoning, so wire it to an OpenAI-compatible completion endpoint (DeepSeek, OpenAI, Anthropic-compatible shim, etc.) and provide `api_type` + `base_url` as needed.
- **Scope secrets carefully.** Store the JSON in `.stack.env` (never in version control) and restart the backend service after edits so the new config loads into the process environment.
