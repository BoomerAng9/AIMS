---
id: "hostinger-vps"
name: "Hostinger VPS"
type: "tool"
category: "infra"
provider: "Hostinger"
description: "Cloud Startup VPS hosting at 76.13.96.107 — AIMS deployment target."
env_vars: []
docs_url: "https://support.hostinger.com/en/articles/vps"
aims_files:
  - "infra/vps-setup.sh"
  - "deploy.sh"
  - "mcp-tools/hostinger-config.json"
---

# Hostinger VPS — Infrastructure Tool Reference

## Overview

AIMS runs on a Hostinger Cloud Startup VPS. The VPS hosts all Docker containers (frontend, UEF gateway, n8n, Redis, Nginx) and is provisioned via `vps-setup.sh`.

## Server Details

| Property | Value |
|----------|-------|
| IP | 76.13.96.107 |
| OS | Ubuntu 22.04+ |
| Plan | Cloud Startup |
| Deploy user | `aims` |

## MCP Integration

Hostinger API is available via MCP server: `mcp-tools/hostinger-config.json`

## Setup Script

```bash
sudo ./infra/vps-setup.sh
```

Installs: Node.js 20, Bun, Docker, Docker Compose, UFW firewall, Fail2ban, Claude Code CLI, Gemini CLI.

## Deployment

```bash
./deploy.sh --domain plugmein.cloud --email acheevy@aimanagedsolutions.cloud
```

## Firewall Rules (UFW)

| Port | Service |
|------|---------|
| 22 | SSH |
| 80 | HTTP (Nginx + Let's Encrypt) |
| 443 | HTTPS (Nginx SSL) |

All other ports blocked. Internal services communicate via Docker network.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| SSH timeout | Check UFW allows port 22; verify Hostinger firewall rules |
| Docker not starting | Run `systemctl start docker` |
| Disk full | Check `df -h`; prune Docker: `docker system prune -a` |
| DNS not resolving | Update A record at Hostinger DNS to point to 76.13.96.107 |
