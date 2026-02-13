---
id: "discord-message"
name: "Send Discord Message"
type: "task"
status: "active"
triggers:
  - "discord"
  - "send discord"
  - "message discord"
description: "Send a message to a Discord channel via webhook or bot."
execution:
  target: "api"
  route: "/api/social/gateway"
  command: ""
dependencies:
  env:
    - "DISCORD_CLIENT_ID"
  files:
    - "frontend/lib/social/gateway.ts"
    - "aims-skills/tools/discord.tool.md"
priority: "medium"
---

# Send Discord Message Task

## Endpoint
**POST** `/api/social/gateway`

```json
{
  "platform": "discord",
  "action": "send",
  "channelId": "1234567890",
  "content": "Your report is ready!"
}
```

## API Key
Set `DISCORD_CLIENT_ID` and `DISCORD_CLIENT_SECRET` — https://discord.com/developers/applications
