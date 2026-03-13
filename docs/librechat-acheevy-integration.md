# LibreChat x ACHEEVY 009 Integration

## Purpose

LibreChat is the primary Chat w/ ACHEEVY interface. A.I.M.S. keeps the canonical application routes and bridges task execution into ACHEEVY 009 through the ii-agent bridge API.

## Runtime Shape

- `/chat`, `/dashboard/chat`, and `/dashboard/acheevy` redirect to `LIBRECHAT_URL`.
- `frontend/app/api/librechat/acheevy-009/dispatch/route.ts` proxies signed task dispatches to the ACHEEVY 009 bridge.
- `frontend/app/api/librechat/acheevy-009/session/[sessionId]/status/route.ts` proxies status polling.
- `frontend/app/api/librechat/acheevy-009/health/route.ts` exposes bridge health for ops checks.

## Required Environment Variables

Add these to `infra/.env.production` on the A.I.M.S. host:

```bash
LIBRECHAT_URL=https://chat.plugmein.cloud
LIBRECHAT_BRIDGE_SECRET=<random-hex-secret>
II_AGENT_BRIDGE_URL=http://ii-agent:8000/bridge
II_AGENT_BRIDGE_KEY=<shared-secret-configured-in-ii-agent>
```

If the ACHEEVY 009 repo is already using `AIMS_BRIDGE_SHARED_SECRET`, mirror that value into `II_AGENT_BRIDGE_KEY` or export both names with the same secret.

## LibreChat-Side Bridge Usage

LibreChat custom actions, tools, or MCP-like integration glue should call A.I.M.S., not ii-agent directly.

Dispatch:

```http
POST https://plugmein.cloud/api/librechat/acheevy-009/dispatch
X-LibreChat-Bridge-Secret: <LIBRECHAT_BRIDGE_SECRET>
Content-Type: application/json

{
  "task": "Research Hostinger VPS sizing for the next deploy.",
  "source": "librechat",
  "agent_type": "general",
  "metadata": {
    "conversationId": "librechat-thread-id",
    "userId": "optional-user-id"
  }
}
```

Poll:

```http
GET https://plugmein.cloud/api/librechat/acheevy-009/session/<sessionId>/status
X-LibreChat-Bridge-Secret: <LIBRECHAT_BRIDGE_SECRET>
```

## Hostinger VPS Install Notes

Install LibreChat using the official upstream instructions on the VPS. Keep it as a separate service and point `LIBRECHAT_URL` at the public LibreChat origin.

Recommended layout:

```bash
/opt/librechat
/opt/librechat/.env
```

Minimum runtime requirements:

- Node.js 20.19+
- Git
- MongoDB or MongoDB Atlas
- Reverse proxy on a stable host name such as `chat.plugmein.cloud`

Suggested bootstrap:

```bash
git clone https://github.com/danny-avila/LibreChat.git /opt/librechat
cd /opt/librechat
npm ci
cp .env.example .env
```

Key LibreChat-side values to set:

- `HOST=0.0.0.0`
- `PORT=3080`
- `MONGO_URI=<your-mongo-uri>`
- the provider/model credentials you plan to expose in LibreChat

Then run LibreChat behind nginx or Caddy on the VPS and point `LIBRECHAT_URL` in A.I.M.S. to that public URL.

## Validation

After deploy:

1. Visit `/chat` and confirm it redirects to LibreChat.
2. Visit `/dashboard/chat` and `/dashboard/acheevy` and confirm both redirect.
3. Call `/api/librechat/acheevy-009/health` and confirm the bridge reports `agent: ACHEEVY-009`.
4. Dispatch a test task from LibreChat-side automation and poll until completion.
