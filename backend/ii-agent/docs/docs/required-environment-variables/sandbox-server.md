---
id: sandbox-server
title: Sandbox Server Integration
slug: /required-environment-variables/sandbox-server
sidebar_position: 17
---

These variables configure the external sandbox provider (e.g., e2b) that powers interactive coding environments.

## `E2B_API_KEY`

1. Log into the [e2b dashboard](https://e2b.dev/) (or your equivalent provider).
2. Navigate to **API Keys** and create a new key scoped for development use.
3. Copy the key (looks like `e2b_live_...`) and paste it into `docker/.stack.env`.
4. Rotate the key if you suspect compromise—do not commit it to Git.


The backend provisions isolated sandboxes for executing user code. These variables define the template and lifecycle policies.

## `SANDBOX_TEMPLATE_ID`

1. Open the sandbox provisioning portal or service you use for backend execution (internal tool, provider dashboard, etc.).
2. Locate the template/image you want the stack to spawn (for example “ii-backend-dev”).
3. Copy its unique identifier and place it in `docker/.stack.env` as `SANDBOX_TEMPLATE_ID`.
4. If you do not know which template to use, ask the infrastructure team for the default dev template.

## `TIME_TIL_CLEAN_UP`

- Specifies how long (in seconds) an idle sandbox lives before auto-shutdown.
- Choose a value that balances cost and usability. Example: `900` (15 minutes) keeps sessions alive long enough for debugging without leaving unused containers running.

