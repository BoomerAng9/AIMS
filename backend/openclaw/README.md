# OpenClaw - Personal AI Assistant for A.I.M.S.

This directory contains the containerized OpenClaw service that provides multi-channel messaging integration (WhatsApp, Telegram, Slack, Discord, etc.).

## Overview

OpenClaw is the "lobster way" 🦞 - a local-first AI assistant that connects to various messaging platforms and routes them through ACHEEVY.

## Configuration

1. Copy `.env.example` to `.env` and configure your API keys and channel settings.

2. Configure channels in `config/openclaw.toml`:
   - WhatsApp
   - Telegram
   - Slack
   - Discord
   - etc.

## Running

### With Docker Compose (recommended)
```bash
cd infra
docker compose up openclaw -d
```

### Standalone
```bash
docker build -t aims-openclaw .
docker run -d --name openclaw -p 18789:18789 --env-file .env aims-openclaw
```

## Integration with ACHEEVY

OpenClaw forwards all incoming messages to the UEF Gateway at `http://uef-gateway:3001/api/channel`, which then routes them through ACHEEVY for processing.

## Ports

- `18789`: Gateway WebSocket (internal)

## Environment Variables

| Variable | Description |
|----------|-------------|
| `OPENAI_API_KEY` | OpenAI API key for LLM |
| `ANTHROPIC_API_KEY` | Anthropic API key |
| `TELEGRAM_BOT_TOKEN` | Telegram bot token |
| `WHATSAPP_SESSION_NAME` | WhatsApp session identifier |
| `SLACK_BOT_TOKEN` | Slack bot OAuth token |
| `DISCORD_BOT_TOKEN` | Discord bot token |
| `UEF_GATEWAY_URL` | URL to UEF Gateway for ACHEEVY routing |

## Features

- Multi-channel messaging (WhatsApp, Telegram, Slack, Discord, etc.)
- Voice wake + talk mode
- Browser control via CDP
- Self-improving skills system
- Integration with ACHEEVY orchestrator
