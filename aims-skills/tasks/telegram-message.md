---
id: "telegram-message"
name: "Send Telegram Message"
type: "task"
status: "active"
triggers:
  - "telegram"
  - "send telegram"
  - "message telegram"
description: "Send a message to a Telegram user or group via the Bot API."
execution:
  target: "api"
  route: "/api/social/gateway"
  command: ""
dependencies:
  env:
    - "TELEGRAM_BOT_TOKEN"
  files:
    - "frontend/lib/social/gateway.ts"
    - "aims-skills/tools/telegram.tool.md"
priority: "medium"
---

# Send Telegram Message Task

## Endpoint
**POST** `/api/social/gateway`

```json
{
  "platform": "telegram",
  "action": "send",
  "chatId": "123456789",
  "text": "Your report is ready!",
  "parseMode": "Markdown"
}
```

## API Key
Set `TELEGRAM_BOT_TOKEN` — get from @BotFather on Telegram.
