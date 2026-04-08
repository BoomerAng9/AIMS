---
name: plug-spin-up
type: skill
triggers:
  - "spin up"
  - "deploy tool"
  - "launch agent"
  - "start instance"
  - "one click deploy"
execution:
  target: backend
  module: plug-catalog/deploy-engine
  method: spinUp
---

# Plug Spin-Up Skill

## Purpose
One-click deployment of any plug from the catalog. User selects a tool,
optionally customizes it, and AIMS handles container creation, port
assignment, nginx config, and health checks.

## Deployment Flow

```
User selects plug from catalog
  ↓
Customization screen (optional)
  ↓ defaults work out of the box
Spin Up button
  ↓
1. Validate plug + delivery mode
2. Resolve env vars (defaults + customizations + overrides)
3. Allocate port (51000+ range, 10-port increments)
4. Generate Docker Compose
5. Generate nginx reverse proxy config
6. Start container
7. Run health check
8. Return URL + status
```

## Customization Options
Each plug defines its own customization options. Common patterns:
- LLM model selection (Claude, GPT-4, etc.)
- Worker/agent count
- Feature toggles (headless mode, sandbox, etc.)
- Resource limits

## Security
- All plugs run on aims-network by default
- Sandbox plugs run on sandbox-network (no internet, agent-bridge only)
- Enterprise security level enables: mTLS, network segmentation, audit logging
- Deploy Security Packet (DSP) generated for enterprise deployments

## Glass Box Events
Every deployment step emits an event visible in the Deploy Dock logs:
validate → configure → provision → build → deploy → health → ready

## LUC Cost
Estimated before deployment based on: tier + GPU + memory + security level.
User must approve LUC quote before deployment starts.
