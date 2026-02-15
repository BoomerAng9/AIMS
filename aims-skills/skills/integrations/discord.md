---
id: "integration-discord"
name: "Discord Integration"
type: "skill"
status: "active"
triggers: ["discord", "discord bot", "discord webhook", "discord notify"]
description: "Discord bot and webhook integration rules, channel setup, and notification routing."
execution:
  target: "api"
  route: "/api/skills/discord"
dependencies:
  env: ["DISCORD_BOT_TOKEN", "DISCORD_WEBHOOK_URL"]
priority: "medium"
---

# Discord Integration Skill

## Overview
ACHEEVY can deliver notifications and status updates to Discord channels via bot or webhook.

## User Setup Flow
1. User navigates to Circuit Box (user view) and selects "Discord"
2. User provides a webhook URL or authorizes the bot to their server
3. Platform validates the webhook and stores it in user tenant space
4. User selects which events trigger Discord notifications

## Delivery Methods
| Method | Use Case |
|--------|----------|
| **Webhook** | Simple notifications — no bot presence needed |
| **Bot** | Interactive commands, richer embeds, thread management |

## Message Format
- Use Discord embeds for structured messages (title, description, color, fields)
- Embed color matches event type (gold for ACHEEVY updates, emerald for success, red for alerts)
- Include a footer with engagement ID for traceability

## Security
- Webhook URLs stored encrypted in tenant-scoped storage
- Bot token is platform-owned, never exposed
- No internal endpoints or orchestration details in messages
- User Discord credentials never leave their tenant boundary
