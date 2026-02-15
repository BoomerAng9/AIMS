---
id: "integration-telegram"
name: "Telegram Integration"
type: "skill"
status: "active"
triggers: ["telegram", "telegram bot", "telegram notify"]
description: "Telegram Bot API integration rules, message formatting, and user setup flow."
execution:
  target: "api"
  route: "/api/skills/telegram"
dependencies:
  env: ["TELEGRAM_BOT_TOKEN"]
priority: "medium"
---

# Telegram Integration Skill

## Overview
ACHEEVY can send notifications, updates, and deliverables to users via Telegram Bot API.

## User Setup Flow
1. User navigates to Circuit Box (user view) and selects "Telegram"
2. User provides their Telegram chat ID or clicks a bot link to auto-register
3. Platform stores the chat ID in user tenant space (never exposed in logs)
4. User can test the connection with a "Send Test Message" button

## Message Formatting
- Use Telegram MarkdownV2 for rich formatting
- Keep messages concise — Telegram is for notifications, not long-form
- Include action links back to the platform where appropriate
- Respect Telegram rate limits (30 messages/second globally, 1 message/second per chat)

## What Gets Sent
| Event | Message |
|-------|---------|
| Deliverable ready | "Your [type] is ready. View it here: [link]" |
| Approval needed | "Action required: [description]. Approve in A.I.M.S." |
| Status update | "Update on [engagement]: [status]" |

## Security
- Bot token is platform-owned, never exposed to users
- User chat IDs stored in tenant-scoped Firestore collection
- No internal endpoints, agent names, or orchestration details in messages
