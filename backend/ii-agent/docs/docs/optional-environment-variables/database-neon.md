---
id: optional-database-neon
title: Neon Database Automation (Optional)
sidebar_position: 15
slug: /optional-environment-variables/database-neon
---

Set these values only if you want the agent to spin up throwaway Postgres instances on [Neon](https://neon.tech/). Without the key the agent will default to the static Postgres container defined in the stack.

| Variable | Description |
| --- | --- |
| `DATABASE_NEON_DB_API_KEY` | Personal access token from the Neon dashboard with permission to create branches/projects. |

Once populated, restart the stack. The tool server will authenticate against Neon when tasks call database-related tools; review Neon usage limits before enabling the integration.
