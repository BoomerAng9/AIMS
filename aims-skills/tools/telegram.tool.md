---
id: "telegram"
name: "Telegram Bot"
type: "tool"
category: "messaging"
provider: "Telegram"
description: "Bot API for Telegram messaging — alternate entry point for ACHEEVY interactions."
env_vars:
  - "TELEGRAM_BOT_TOKEN"
docs_url: "https://core.telegram.org/bots/api"
aims_files:
  - "frontend/app/api/telegram/webhook/route.ts"
  - "frontend/lib/social/gateway.ts"
---

# Telegram Bot — Messaging Tool Reference

## Overview

The Telegram Bot API provides an alternate entry point for users to interact with ACHEEVY via Telegram. Messages are received via webhook and routed through the social gateway to the ACHEEVY orchestrator.

## API Key Setup

| Variable | Required | Where to Get |
|----------|----------|--------------|
| `TELEGRAM_BOT_TOKEN` | Yes | https://t.me/BotFather — `/newbot` command |

**Apply in:** `frontend/.env.local` or `infra/.env.production`

## API Reference

### Base URL
```
https://api.telegram.org/bot{TOKEN}
```

### Set Webhook
```http
POST /setWebhook
{
  "url": "https://plugmein.cloud/api/telegram/webhook"
}
```

### Send Message
```http
POST /sendMessage
{
  "chat_id": 123456789,
  "text": "Hello from ACHEEVY!",
  "parse_mode": "Markdown"
}
```

### Send Photo
```http
POST /sendPhoto
{
  "chat_id": 123456789,
  "photo": "https://example.com/image.png",
  "caption": "Here's your result"
}
```

## Webhook Setup

1. Create bot via @BotFather: `/newbot`
2. Copy token to `TELEGRAM_BOT_TOKEN`
3. Register webhook:
   ```
   curl -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook?url=https://plugmein.cloud/api/telegram/webhook"
   ```

## AIMS Message Flow

```
User sends Telegram message
  → Webhook hits /api/telegram/webhook
  → Social gateway normalizes message format
  → Routes to ACHEEVY orchestrator
  → ACHEEVY processes and responds
  → Response sent back via sendMessage API
```

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Webhook not receiving | Verify URL is HTTPS and publicly accessible |
| 401 Unauthorized | Check `TELEGRAM_BOT_TOKEN` is correct |
| Bot not responding | Check webhook registration with `getWebhookInfo` |
