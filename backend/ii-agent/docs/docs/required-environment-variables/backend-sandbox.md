---
id: backend-sandbox
title: Backend Sandbox Configuration
slug: /required-environment-variables/backend-sandbox
sidebar_position: 15
---

The backend provisions isolated sandboxes for executing user code. These variables define the template and lifecycle policies.

## `SANDBOX_TEMPLATE_ID`

1. Open the sandbox provisioning portal or service you use for backend execution (internal tool, provider dashboard, etc.).
2. Locate the template/image you want the stack to spawn (for example “ii-backend-dev”).
3. Copy its unique identifier and place it in `docker/.stack.env` as `SANDBOX_TEMPLATE_ID`.
4. If you do not know which template to use, ask the infrastructure team for the default dev template.

## `TIME_TIL_CLEAN_UP`

- Specifies how long (in seconds) an idle sandbox lives before auto-shutdown.
- Choose a value that balances cost and usability. Example: `900` (15 minutes) keeps sessions alive long enough for debugging without leaving unused containers running.

## Validation Checklist

1. Boot the stack and trigger a feature that launches a sandbox.
2. In the sandbox provider dashboard, confirm new instances use the template ID you configured.
3. Observe the clean-up timer to verify idle sandboxes terminate close to the configured interval.
