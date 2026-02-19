---
id: "hostinger-vps"
name: "Hostinger VPS"
type: "tool"
category: "infra"
provider: "Hostinger"
description: "Hostinger KVM2 VPS — AIMS Core (76.13.96.107) runs all platform services."
env_vars: []
docs_url: "https://support.hostinger.com/en/articles/vps"
aims_files:
  - "infra/vps-setup.sh"
  - "deploy.sh"
  - "mcp-tools/hostinger-config.json"
---

# Hostinger VPS — Infrastructure Tool Reference

## Overview

AIMS runs on a **single Hostinger KVM2 VPS** that hosts all core platform services and automation workloads.

## Server Details

| | AIMS Core |
|---|---|
| **Hostname** | `srv1328075.hstgr.cloud` |
| **IP** | `76.13.96.107` |
| **Plan** | KVM 2 |
| **Expires** | 2027-02-03 |
| **OS** | Ubuntu 22.04+ |
| **Deploy user** | `aims` |
| **What runs here** | Frontend, UEF Gateway, ACHEEVY, Redis, Nginx, n8n, all agents |
| **Compose file** | `infra/docker-compose.prod.yml` |

## Deployment

### AIMS Core (76.13.96.107)
```bash
./deploy.sh --domain plugmein.cloud --landing-domain aimanagedsolutions.cloud
# First-time cert: add --email admin@aimanagedsolutions.cloud
# SSH: ssh root@76.13.96.107
```

## MCP Integration

Hostinger API is available via MCP server: `mcp-tools/hostinger-config.json`

## Setup Script

```bash
sudo ./infra/vps-setup.sh
```

Installs: Node.js 20, Bun, Docker, Docker Compose, UFW firewall, Fail2ban, Claude Code CLI, Gemini CLI.

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
| DNS not resolving | Update A record at Hostinger DNS to point to `76.13.96.107` |
