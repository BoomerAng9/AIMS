---
id: "telegram-setup-user"
name: "Telegram Setup — User Runbook"
type: "task"
status: "active"
triggers: ["telegram setup", "connect telegram"]
description: "Step-by-step guide for users to connect Telegram notifications in A.I.M.S."
execution:
  target: "internal"
priority: "medium"
---

# Telegram Setup — User Runbook

## Prerequisites
- An active A.I.M.S. account
- A Telegram account

## Steps

### 1. Open Circuit Box
Navigate to your Circuit Box (user view) from the dashboard or sidebar.

### 2. Find Telegram
Look for the "Telegram" service card under the **Communications** category.

### 3. Start Connection
Click the Telegram card. You'll see two options:
- **Auto-connect** — Click the bot link to open Telegram and start a chat with the A.I.M.S. bot. Send `/start` to register.
- **Manual** — Enter your Telegram chat ID directly.

### 4. Verify Connection
After connecting, click "Send Test Message" to receive a test notification in Telegram.

### 5. Configure Notifications
Select which events trigger Telegram messages:
- [ ] Deliverable ready
- [ ] Approval needed
- [ ] Status updates
- [ ] Weekly summary

### 6. Done
Your Telegram is connected. You'll receive notifications based on your preferences.

## Troubleshooting

| Issue | Solution |
|-------|----------|
| No test message received | Ensure you started the bot with `/start` |
| Wrong chat ID | Use `@userinfobot` on Telegram to find your ID |
| Want to disconnect | Go to Circuit Box → Telegram → Disconnect |
