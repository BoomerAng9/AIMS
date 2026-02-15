---
id: "discord"
name: "Discord"
type: "tool"
category: "messaging"
provider: "Discord"
description: "Discord bot and webhook integration for community engagement and ACHEEVY interactions."
env_vars:
  - "DISCORD_CLIENT_ID"
  - "DISCORD_CLIENT_SECRET"
docs_url: "https://discord.com/developers/docs"
aims_files:
  - "frontend/app/api/discord/webhook/route.ts"
  - "frontend/lib/social/gateway.ts"
---

# Discord — Messaging Tool Reference

## Overview

Discord integration provides bot functionality and webhook-based interactions for community engagement. Messages flow through the social gateway to ACHEEVY, same as Telegram.

## API Key Setup

| Variable | Required | Where to Get |
|----------|----------|--------------|
| `DISCORD_CLIENT_ID` | Yes | https://discord.com/developers/applications |
| `DISCORD_CLIENT_SECRET` | Yes | Same — OAuth2 section |

**Apply in:** `frontend/.env.local` or `infra/.env.production`

## API Reference

### Base URL
```
https://discord.com/api/v10
```

### Auth Header
```
Authorization: Bot $DISCORD_BOT_TOKEN
```

### Send Message
```http
POST /channels/{channel_id}/messages
{
  "content": "Hello from ACHEEVY!"
}
```

### Interaction Webhook
Discord sends interactions to your registered endpoint. AIMS handles these at `/api/discord/webhook`.

## Bot Setup

1. Create application at https://discord.com/developers/applications
2. Create Bot under application settings
3. Copy Client ID and Secret
4. Set interaction endpoint URL: `https://plugmein.cloud/api/discord/webhook`
5. Add bot to server with appropriate permissions

## Troubleshooting

| Issue | Fix |
|-------|-----|
| 401 Unauthorized | Check bot token |
| Interaction verification failed | Verify public key in webhook handler |
| Bot offline | Check bot is invited to server with correct permissions |
