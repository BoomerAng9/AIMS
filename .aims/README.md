# .aims/ — Project Configuration Hub

**This folder is the single source of truth for A.I.M.S. infrastructure.**

AI editors (Claude, Copilot, Cursor) should read these files FIRST before making infrastructure decisions.

---

## Files

| File | Purpose |
|------|---------|
| `stack.json` | Infrastructure configuration (VPS, GCP, Firebase, domains) |
| `secrets.md` | Where secrets are stored (NOT the secrets themselves) |
| `context.json` | Runtime context for Boomer_Ang agents |
| `README.md` | This file |

---

## Quick Reference

### Stack
```
Compute:  Hostinger VPS (76.13.96.107)
CI/CD:    GCP Cloud Build → Cloud Run
Auth/DB:  Firebase (ai-managed-services)
Frontend: Vercel or VPS Docker
```

### Domains
```
aims.plugmein.cloud      → Frontend (:3000)
api.aims.plugmein.cloud  → API (:8000)
luc.plugmein.cloud       → LUC (:3001)
```

### Key Commands
```bash
# Deploy to VPS
ssh root@76.13.96.107 "cd /root/aims && git pull && docker compose -f infra/docker-compose.production.yml up -d"

# View logs
ssh root@76.13.96.107 "docker logs aims-frontend --tail 100"

# Local dev
cd frontend && npm run dev
```

---

## For AI Editors

When working on this project:

1. **Read `stack.json`** to understand infrastructure
2. **Check `secrets.md`** for env var locations
3. **Never hardcode** IPs, keys, or credentials
4. **Use Hostinger VPS** — not Cloudflare, not AWS, not Azure
5. **Use Firebase** — not Supabase, not MongoDB Atlas
6. **Use GCP Cloud Build** — not GitHub Actions (disabled)

---

## Updates

When infrastructure changes, update `stack.json` immediately.

```bash
# After any infra change
git add .aims/
git commit -m "chore: update .aims stack config"
```
