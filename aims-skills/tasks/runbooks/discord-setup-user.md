---
id: "discord-setup-user"
name: "Discord Setup — User Runbook"
type: "task"
status: "active"
triggers: ["discord setup", "connect discord"]
description: "Step-by-step guide for users to connect Discord notifications in A.I.M.S."
execution:
  target: "internal"
priority: "medium"
---

# Discord Setup — User Runbook

## Prerequisites
- An active A.I.M.S. account
- A Discord server where you have Manage Webhooks permission

## Steps

### 1. Open Circuit Box
Navigate to your Circuit Box (user view) from the dashboard or sidebar.

### 2. Find Discord
Look for the "Discord" service card under the **Communications** category.

### 3. Choose Connection Method

**Option A — Webhook (Recommended)**
1. In your Discord server, go to Server Settings → Integrations → Webhooks
2. Create a new webhook, choose the target channel
3. Copy the webhook URL
4. Paste it into the A.I.M.S. Discord setup form

**Option B — Bot**
1. Click "Authorize Bot" in the A.I.M.S. Discord setup form
2. Select your Discord server
3. Grant the requested permissions
4. Choose the default notification channel

### 4. Verify Connection
Click "Send Test Message" to receive a test embed in your Discord channel.

### 5. Configure Notifications
Select which events trigger Discord messages:
- [ ] Deliverable ready
- [ ] Approval needed
- [ ] Status updates
- [ ] Weekly summary

### 6. Done
Your Discord is connected. Notifications will appear in your chosen channel.

## Troubleshooting

| Issue | Solution |
|-------|----------|
| No test message | Verify webhook URL is correct and channel exists |
| Permission error | Ensure the webhook/bot has Send Messages permission |
| Want to disconnect | Go to Circuit Box → Discord → Disconnect |
