# Chat w/ ACHEEVY Runtime Integration

## Purpose

The external Chat w/ ACHEEVY runtime is the primary chat interface. A.I.M.S. keeps the canonical application routes and bridges task execution through the ii-agent bridge API.

## Runtime Shape

- `/chat`, `/dashboard/chat`, and `/dashboard/acheevy` redirect to `CHAT_RUNTIME_URL`.
- `frontend/app/api/librechat/acheevy-009/dispatch/route.ts` proxies signed task dispatches to the Chat w/ ACHEEVY execution bridge.
- `frontend/app/api/librechat/acheevy-009/session/[sessionId]/status/route.ts` proxies status polling.
- `frontend/app/api/librechat/acheevy-009/health/route.ts` exposes bridge health for ops checks.

## Required Environment Variables

Add these to `infra/.env.production` on the A.I.M.S. host:

```bash
CHAT_RUNTIME_URL=https://chat.plugmein.cloud
CHAT_RUNTIME_BRIDGE_SECRET=<random-hex-secret>
II_AGENT_BRIDGE_URL=http://ii-agent:8000/bridge
II_AGENT_BRIDGE_KEY=<shared-secret-configured-in-ii-agent>
```

If the upstream execution runtime is already using `AIMS_BRIDGE_SHARED_SECRET`, mirror that value into `II_AGENT_BRIDGE_KEY` or export both names with the same secret.

## Chat Runtime Bridge Usage

The external chat runtime's custom actions, tools, or MCP-like integration glue should call A.I.M.S., not ii-agent directly.

Dispatch:

```http
POST https://plugmein.cloud/api/librechat/acheevy-009/dispatch
X-Chat-Runtime-Bridge-Secret: <CHAT_RUNTIME_BRIDGE_SECRET>
Content-Type: application/json

{
  "task": "Research Hostinger VPS sizing for the next deploy.",
  "source": "chat-interface",
  "agent_type": "general",
  "metadata": {
    "conversationId": "chat-thread-id",
    "userId": "optional-user-id"
  }
}
```

Poll:

```http
GET https://plugmein.cloud/api/chat-runtime/acheevy/session/<sessionId>/status
X-Chat-Runtime-Bridge-Secret: <CHAT_RUNTIME_BRIDGE_SECRET>
```

## Hostinger VPS Install Notes

Install the external chat runtime using the official upstream npm instructions on the Hostinger VPS. Keep it as a separate service and point `CHAT_RUNTIME_URL` at the public chat origin.

Target VPS:

- Hostname: `srv1328075.hstgr.cloud`
- IPv4: `76.13.96.107`
- OS: Ubuntu 24.04 with n8n
- Plan: KVM 2
- CPU: 2 cores
- Memory: 8 GB
- Disk: 100 GB

Recommended layout:

```bash
/opt/chat-runtime
/opt/chat-runtime/.env
```

Minimum runtime requirements:

- Node.js 20.19+
- Git
- MongoDB or MongoDB Atlas
- Reverse proxy on a stable host name such as `chat.plugmein.cloud`

Official preparation flow:

```bash
sudo apt-get update
sudo apt-get install -y git curl

# Verify Node.js meets the upstream requirement first.
node -v

git clone https://github.com/danny-avila/LibreChat.git /opt/chat-runtime
cd /opt/chat-runtime
cp .env.example .env
```

Important:

- Edit `/opt/chat-runtime/.env`
- Set `MONGO_URI` to your MongoDB Atlas or MongoDB Community URI
- Set the model/provider credentials you want exposed in the runtime
- Keep the A.I.M.S. bridge secret only in runtime/server env, not in browser-exposed config

Official build and start flow:

```bash
cd /opt/chat-runtime
npm ci
npm run frontend
npm run backend
```

Local access before reverse proxy:

```bash
http://localhost:3080
```

Next startup after initial build:

```bash
cd /opt/chat-runtime
npm run backend
```

Official update flow:

```bash
cd /opt/chat-runtime
git pull
npm ci
npm run frontend
npm run backend
```

Key runtime values to set:

- `HOST=0.0.0.0`
- `PORT=3080`
- `MONGO_URI=<your-mongo-uri>`
- `OPENROUTER_API_KEY=<your-openrouter-key>`
- `OPENROUTER_BASE_URL=https://openrouter.ai/api/v1`
- `OPENROUTER_MODEL=<your-default-model>`
- the provider/model credentials you plan to expose in the runtime

Recommended A.I.M.S.-specific runtime values to keep alongside the upstream env:

- `CHAT_RUNTIME_BRIDGE_SECRET=<shared-secret>`
- `AIMS_BRIDGE_ENDPOINT=https://plugmein.cloud/api/librechat/acheevy-009/dispatch`
- `AIMS_BRIDGE_STATUS_ENDPOINT=https://plugmein.cloud/api/librechat/acheevy-009/session/:sessionId/status`

## Branding Changes Required In The External Runtime

Because the official runtime is external to this repo, the remaining LibreChat auth and logo surfaces must be changed in that runtime deployment itself.

Required changes:

- Replace the default LibreChat logo with the ACHEEVY helmet asset
- Replace visible `LibreChat` product naming with `Chat w/ ACHEEVY`
- Replace auth/login screen branding so it uses ACHEEVY naming and visuals

Use these repo assets as the source of truth:

- `frontend/public/images/acheevy/acheevy-helmet.png`
- `frontend/public/images/acheevy/acheevy-helmet-chat.png`
- `frontend/public/assets/acheevy_helmet_carbon_fiber.svg`

Then run the chat runtime behind nginx or Caddy on the VPS, replace the default logo with the ACHEEVY helmet asset, and point `CHAT_RUNTIME_URL` in A.I.M.S. to that public URL.

Recommended public origin:

```bash
CHAT_RUNTIME_URL=https://chat.plugmein.cloud

Legacy aliases remain accepted by the server layer for compatibility: `CHAT_INTERFACE_URL`, `CHAT_INTERFACE_BRIDGE_SECRET`, `LIBRECHAT_URL`, and `LIBRECHAT_BRIDGE_SECRET`.
```

Recommended reverse proxy target:

```bash
http://127.0.0.1:3080
```

## Validation

After deploy:

1. Visit `/chat` and confirm it redirects to Chat w/ ACHEEVY.
2. Visit `/dashboard/chat` and `/dashboard/acheevy` and confirm both redirect.
3. Call `/api/librechat/acheevy-009/health` and confirm the bridge reports `agent: ACHEEVY-009`.
4. Dispatch a test task from chat runtime automation and poll until completion.
5. Verify the login page and app header no longer show LibreChat branding and instead show the ACHEEVY helmet and Chat w/ ACHEEVY naming.
