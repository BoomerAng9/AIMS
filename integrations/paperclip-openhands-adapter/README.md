# A.I.M.S. Paperclip → OpenHands adapter

This external Paperclip adapter forwards an agent run to the A.I.M.S. broker. It
does not connect directly to Agent Server, receive provider secrets, or change a
Paperclip agent's selected model. The broker must verify the short-lived
Paperclip run token against Paperclip, enforce a server-owned company/agent to
owner/tenant/workspace/model binding, apply approval and Second Brain/OKF scope,
and return a terminal receipt before this adapter reports success.

## Paperclip host configuration

- `AIMS_OPENHANDS_BROKER_URL`: private HTTPS URL for the A.I.M.S. UEF broker.
- `AIMS_OPENHANDS_BROKER_TIMEOUT_MS`: optional integer from 1000 to 900000; default 300000.

The agent/run bearer token comes from Paperclip's execution context. It is sent
only to the configured A.I.M.S. HTTPS broker and is never logged. The broker
must verify the token through `GET /api/agents/me`; it must not trust the agent
or company IDs in the request body as proof of identity.

## Adapter routes expected from the broker

- `GET /healthz/integrations/paperclip/openhands`: readiness only; no task is created.
- `POST /api/integrations/paperclip/openhands/runs`: verify identity, resolve
  the binding, execute through Agent Server, and return a sanitized receipt.

The POST request is idempotency-keyed by Paperclip run ID. The response status
must be `completed`, `failed`, `needs_review`, `running`, or `unknown`; only a
`completed` response with both `receiptId` and `conversationId` is reported as
success. Missing bindings, unknown outcomes, and non-terminal runs do not select
another harness.

## UEF broker configuration

Configure these values on the UEF gateway only (never in a Paperclip agent's
public prompt or a committed environment file):

- `PAPERCLIP_API_URL`: trusted Paperclip origin used to validate each agent/run token.
- `OPENHANDS_AGENT_SERVER_URL`: private HTTPS Agent Server origin.
- `OPENHANDS_SESSION_API_KEY`: Agent Server session key.
- `PAPERCLIP_OPENHANDS_BINDINGS_JSON`: explicit allowlist. Every active agent must
  have one unique `{companyId, agentId}` entry with its owner, tenant, Canvas
  Agent Profile UUID, workspace root, relative working directory, and `enabled: true`.

The deployment templates `infra/.env.example` and
`infra/.env.production.example` name these settings but leave them commented out.
Keep the binding list empty until the live Paperclip API, private Canvas network
path, and exact agent/profile/workspace IDs have been verified. Store the Canvas
session key in the deployment's secret store; do not commit a populated env file.

Example shape with placeholders (not usable credentials or IDs):

```json
[
  {
    "companyId": "<paperclip-company-id>",
    "agentId": "<paperclip-agent-id>",
    "tenantId": "<tenant-id>",
    "ownerId": "<owner-id>",
    "agentProfileId": "00000000-0000-4000-8000-000000000000",
    "workspaceRoot": "/workspace/tenants/<tenant-id>",
    "workingDirectory": "<repository-or-project>",
    "enabled": true
  }
]
```

The gateway rejects missing, duplicate, malformed, disabled, or path-escaping
bindings. The adapter does not mutate Paperclip agents or model assignments.
Changing an agent to this adapter requires an instance-admin action and a
per-agent binding; a successful source build alone does not connect that agent.

## Local verification

```sh
npm install --ignore-scripts
npm test
npm run build
```

This package alone does not establish a live connection. Paperclip instance
installation, broker implementation/readiness, agent binding, and a real
Paperclip-to-Canvas acceptance run remain separate gates.
