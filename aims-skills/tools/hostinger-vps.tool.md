---
id: "hostinger-vps"
name: "Hostinger VPS"
type: "tool"
category: "infra"
provider: "Hostinger"
description: "Two Hostinger KVM2 VPS instances — AIMS Core (31.97.138.45) and n8n Factory (76.13.96.107)."
env_vars: []
docs_url: "https://support.hostinger.com/en/articles/vps"
aims_files:
  - "infra/vps-setup.sh"
  - "deploy.sh"
  - "mcp-tools/hostinger-config.json"
---

# Hostinger VPS — Infrastructure Tool Reference

## Overview

AIMS uses **two separate Hostinger KVM2 VPS instances** to isolate the core platform from automation workloads.

## Server Details

| | AIMS Core | n8n Factory |
|---|---|---|
| **Hostname** | `srv1318308.hstgr.cloud` | `srv1328075.hstgr.cloud` |
| **IP** | `31.97.138.45` | `76.13.96.107` |
| **Plan** | KVM 2 | KVM 2 |
| **Expires** | 2027-02-01 | 2027-02-03 |
| **OS** | Ubuntu 22.04+ | Ubuntu 22.04+ |
| **Deploy user** | `aims` | `aims` |
| **What runs here** | Frontend, UEF Gateway, ACHEEVY, PersonaPlex, Redis, Nginx | n8n workflows, automation workers, webhooks |
| **Compose file** | `infra/docker-compose.prod.yml` | `infra/docker-compose.n8n.yml` |

## Deployment

### AIMS Core (31.97.138.45)
```bash
./deploy.sh --domain plugmein.cloud --email acheevy@aimanagedsolutions.cloud
# SSH: ssh root@31.97.138.45
```

### n8n Factory (76.13.96.107)
```bash
# SSH: ssh root@76.13.96.107
docker compose -f infra/docker-compose.n8n.yml up -d
```

## MCP Integration

Hostinger API is available via MCP server: `mcp-tools/hostinger-config.json`

## Setup Script

```bash
sudo ./infra/vps-setup.sh
```

Installs: Node.js 20, Bun, Docker, Docker Compose, UFW firewall, Fail2ban, Claude Code CLI, Gemini CLI.

## Firewall Rules (UFW) — Both Servers

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
| DNS not resolving | Update A record at Hostinger DNS to point to `31.97.138.45` (AIMS) |
