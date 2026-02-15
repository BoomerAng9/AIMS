---
id: "agent-zero"
name: "Agent Zero"
type: "tool"
category: "workflow"
provider: "Agent Zero"
description: "Autonomous multi-agent framework with Docker sandboxing for complex task execution."
env_vars:
  - "OPENROUTER_API_KEY"
docs_url: "https://github.com/frdel/agent-zero"
aims_files:
  - "infra/docker-compose.prod.yml"
---

# Agent Zero — Autonomous Agent Tool Reference

## Overview

Agent Zero is an autonomous multi-agent framework that runs in a Docker sandbox. It can execute complex multi-step tasks using LLM-powered reasoning, code execution, and tool use. In AIMS it's a Tier 1 agent accessible through the ii-agents Docker profile.

## Configuration

Uses `OPENROUTER_API_KEY` for LLM access (same key as the main AIMS platform).

## Docker Setup

```yaml
# infra/docker-compose.prod.yml
agent-zero:
  image: agent-zero:latest
  profiles: ["ii-agents"]
  ports:
    - "50001:50001"
  environment:
    - OPENROUTER_API_KEY=${OPENROUTER_API_KEY}
```

**Deployment:** `docker compose --profile ii-agents up -d`

## Port
- `50001` — Agent Zero web interface

## Use Cases
- Complex multi-step coding tasks
- Research that requires tool use + code execution
- Autonomous debugging and testing workflows
