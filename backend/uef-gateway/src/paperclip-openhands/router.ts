import { createHash } from 'node:crypto';
import path from 'node:path';
import express from 'express';

type Binding = {
  companyId: string;
  agentId: string;
  tenantId: string;
  ownerId: string;
  agentProfileId: string;
  workspaceRoot: string;
  workingDirectory: string;
  enabled: boolean;
};

type BridgeConfig = {
  paperclipUrl: URL;
  canvasUrl: URL;
  canvasSessionKey: string;
  bindings: Binding[];
};

type BridgeDependencies = {
  env?: NodeJS.ProcessEnv;
  fetchImpl?: typeof fetch;
  wait?: (ms: number) => Promise<void>;
  maxWaitMs?: number;
  pollIntervalMs?: number;
};

function safeBaseUrl(value: string | undefined): URL | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) return null;
    if (url.protocol === 'http:' && !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) return null;
    return url;
  } catch {
    return null;
  }
}

function parseBindings(raw: string | undefined): Binding[] | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return null;
    const bindings: Binding[] = [];
    for (const item of parsed) {
      if (!item || typeof item !== 'object' || Array.isArray(item)) return null;
      const row = item as Record<string, unknown>;
      if (
        typeof row.companyId !== 'string' || !row.companyId.trim() ||
        typeof row.agentId !== 'string' || !row.agentId.trim() ||
        typeof row.tenantId !== 'string' || !row.tenantId.trim() ||
        typeof row.ownerId !== 'string' || !row.ownerId.trim() ||
        typeof row.agentProfileId !== 'string' || !/^[0-9a-f-]{36}$/i.test(row.agentProfileId) ||
        typeof row.workspaceRoot !== 'string' || !path.posix.isAbsolute(row.workspaceRoot) ||
        typeof row.workingDirectory !== 'string' || path.posix.isAbsolute(row.workingDirectory) ||
        row.workingDirectory.split(/[\\/]+/).includes('..') ||
        typeof row.enabled !== 'boolean'
      ) return null;
      const root = path.posix.resolve(row.workspaceRoot);
      const workspace = path.posix.resolve(root, row.workingDirectory || '.');
      if (workspace !== root && !workspace.startsWith(`${root}/`)) return null;
      if (bindings.some((binding) => binding.companyId === row.companyId && binding.agentId === row.agentId)) return null;
      bindings.push(row as Binding);
    }
    return bindings;
  } catch {
    return null;
  }
}

function readConfig(env: NodeJS.ProcessEnv): BridgeConfig | null {
  const paperclipUrl = safeBaseUrl(env.PAPERCLIP_API_URL);
  const canvasUrl = safeBaseUrl(env.OPENHANDS_AGENT_SERVER_URL);
  const canvasSessionKey = env.OPENHANDS_SESSION_API_KEY?.trim();
  const bindings = parseBindings(env.PAPERCLIP_OPENHANDS_BINDINGS_JSON);
  if (!paperclipUrl || !canvasUrl || !canvasSessionKey || !bindings) return null;
  return { paperclipUrl, canvasUrl, canvasSessionKey, bindings };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function hasMatchingRunJwtClaims(token: string, runId: string, agentId: string, companyId: string): boolean {
  const parts = token.split('.');
  if (parts.length !== 3 || !parts[0] || !parts[1] || !parts[2]) return false;
  try {
    const header: unknown = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8'));
    const claims: unknown = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
    return isRecord(header) && typeof header.alg === 'string' && header.alg !== 'none' &&
      isRecord(claims) && claims.run_id === runId && claims.sub === agentId && claims.company_id === companyId;
  } catch {
    return false;
  }
}

function stableConversationId(runId: string): string {
  const digest = createHash('sha1').update(`aims-paperclip-openhands:${runId}`).digest('hex').slice(0, 32).split('');
  digest[12] = '5';
  digest[16] = ((parseInt(digest[16], 16) & 0x3) | 0x8).toString(16);
  const hex = digest.join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function receiptFingerprint(runId: string, conversationId: string, output: string): string {
  return `sha256:${createHash('sha256').update(`${runId}\n${conversationId}\n${output}`).digest('hex')}`;
}

export function createPaperclipOpenHandsRouter(dependencies: BridgeDependencies = {}): express.Router {
  const router = express.Router();
  const env = dependencies.env ?? process.env;
  const fetchImpl = dependencies.fetchImpl ?? fetch;
  const wait = dependencies.wait ?? ((ms: number) => new Promise((resolve) => setTimeout(resolve, ms)));
  const maxWaitMs = dependencies.maxWaitMs ?? 240_000;
  const pollIntervalMs = dependencies.pollIntervalMs ?? 1_500;

  router.get('/healthz/integrations/paperclip/openhands', (_req, res) => {
    const config = readConfig(env);
    res.status(config ? 200 : 503).json({
      ready: Boolean(config),
      paperclipConfigured: Boolean(safeBaseUrl(env.PAPERCLIP_API_URL)),
      canvasConfigured: Boolean(safeBaseUrl(env.OPENHANDS_AGENT_SERVER_URL) && env.OPENHANDS_SESSION_API_KEY?.trim()),
      bindingsConfigured: Boolean(parseBindings(env.PAPERCLIP_OPENHANDS_BINDINGS_JSON)),
    });
  });

  router.post('/api/integrations/paperclip/openhands/runs', async (req, res) => {
    const config = readConfig(env);
    if (!config) {
      res.status(503).json({ status: 'unknown', errorCode: 'paperclip_openhands_not_configured' });
      return;
    }

    const auth = req.header('authorization') ?? '';
    const token = auth.match(/^Bearer\s+(.+)$/i)?.[1];
    const runId = req.header('x-paperclip-run-id') ?? '';
    const body = req.body as Record<string, unknown> | undefined;
    if (!token || !runId || !isRecord(body) || body.runId !== runId || typeof body.agentId !== 'string' || typeof body.companyId !== 'string' || typeof body.task !== 'string' || !body.task.trim() || body.task.length > 40_000) {
      res.status(400).json({ status: 'unknown', errorCode: 'paperclip_run_request_invalid' });
      return;
    }
    // This is only a shape/claim precheck. Paperclip remains the signature and live-run authority:
    // its agent-JWT middleware verifies the bearer signature and that X-Paperclip-Run-Id matches run_id.
    // A long-lived agent API key must never authorize a caller-selected run ID.
    if (!hasMatchingRunJwtClaims(token, runId, body.agentId, body.companyId)) {
      res.status(401).json({ status: 'unknown', errorCode: 'paperclip_run_token_not_run_bound' });
      return;
    }

    const signal = AbortSignal.timeout(12_000);
    let identityResponse: Response;
    try {
      identityResponse = await fetchImpl(new URL('/api/agents/me', config.paperclipUrl), {
        headers: { Authorization: `Bearer ${token}`, 'X-Paperclip-Run-Id': runId, Accept: 'application/json' },
        redirect: 'error', cache: 'no-store', signal,
      });
    } catch {
      res.status(503).json({ status: 'unknown', errorCode: 'paperclip_identity_service_unavailable' });
      return;
    }
    if (!identityResponse.ok) {
      res.status(identityResponse.status === 401 || identityResponse.status === 403 ? identityResponse.status : 502)
        .json({ status: 'unknown', errorCode: 'paperclip_run_identity_rejected' });
      return;
    }

    let identity: unknown;
    try { identity = await identityResponse.json(); } catch {
      res.status(502).json({ status: 'unknown', errorCode: 'paperclip_identity_response_invalid' });
      return;
    }
    if (!isRecord(identity) || identity.id !== body.agentId || identity.companyId !== body.companyId) {
      res.status(403).json({ status: 'unknown', errorCode: 'paperclip_run_identity_mismatch' });
      return;
    }

    const binding = config.bindings.find((item) => item.companyId === identity.companyId && item.agentId === identity.id && item.enabled);
    if (!binding) {
      res.status(403).json({ status: 'unknown', errorCode: 'paperclip_agent_harness_binding_missing' });
      return;
    }

    try {
      const readyResponse = await fetchImpl(new URL('/ready', config.canvasUrl), {
        headers: { Accept: 'application/json' }, redirect: 'error', cache: 'no-store', signal: AbortSignal.timeout(8_000),
      });
      if (!readyResponse.ok) {
        res.status(503).json({ status: 'unknown', errorCode: 'openhands_agent_server_not_ready' });
        return;
      }

      const conversationId = stableConversationId(`${binding.companyId}:${binding.agentId}:${runId}`);
      const canvasResponse = await fetchImpl(new URL('/api/conversations', config.canvasUrl), {
        method: 'POST',
        headers: { 'X-Session-API-Key': config.canvasSessionKey, 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          conversation_id: conversationId,
          agent_profile_id: binding.agentProfileId,
          workspace: { kind: 'LocalWorkspace', working_dir: path.posix.resolve(binding.workspaceRoot, binding.workingDirectory) },
          worktree: true,
          max_iterations: 80,
          stuck_detection: true,
          confirmation_policy: { kind: 'ConfirmRisky', threshold: 'HIGH', confirm_unknown: true },
          initial_message: { role: 'user', content: [{ type: 'text', text: body.task }], run: true },
          tags: {
            source: 'paperclip',
            tenantid: binding.tenantId.slice(0, 256),
            ownerid: binding.ownerId.slice(0, 256),
            paperclipcompanyid: binding.companyId.slice(0, 256),
            paperclipagentid: binding.agentId.slice(0, 256),
            papercliprunid: runId.slice(0, 256),
          },
        }),
        redirect: 'error', cache: 'no-store', signal: AbortSignal.timeout(20_000),
      });
      if (!canvasResponse.ok) {
        res.status(canvasResponse.status === 401 || canvasResponse.status === 403 ? 503 : 502)
          .json({ status: 'unknown', errorCode: 'openhands_conversation_create_failed' });
        return;
      }

      const created: unknown = await canvasResponse.json();
      if (!isRecord(created) || typeof created.id !== 'string') {
        res.status(502).json({ status: 'unknown', errorCode: 'openhands_conversation_response_invalid' });
        return;
      }
      const id = created.id;
      const deadline = Date.now() + maxWaitMs;
      while (Date.now() < deadline) {
        const statusResponse = await fetchImpl(new URL(`/api/conversations/${encodeURIComponent(id)}`, config.canvasUrl), {
          headers: { 'X-Session-API-Key': config.canvasSessionKey, Accept: 'application/json' },
          redirect: 'error', cache: 'no-store', signal: AbortSignal.timeout(8_000),
        });
        if (!statusResponse.ok) break;
        const statusBody: unknown = await statusResponse.json();
        if (!isRecord(statusBody)) break;
        const executionStatus = statusBody.execution_status;
        if (executionStatus === 'waiting_for_confirmation') {
          res.status(200).json({ status: 'needs_review', conversationId: id, receiptId: receiptFingerprint(runId, id, 'needs_review') });
          return;
        }
        if (executionStatus === 'error' || executionStatus === 'stuck') {
          res.status(200).json({ status: 'failed', conversationId: id, errorCode: `openhands_${executionStatus}`, receiptId: receiptFingerprint(runId, id, executionStatus) });
          return;
        }
        if (executionStatus === 'finished') {
          const finalResponse = await fetchImpl(new URL(`/api/conversations/${encodeURIComponent(id)}/agent_final_response`, config.canvasUrl), {
            headers: { 'X-Session-API-Key': config.canvasSessionKey, Accept: 'application/json' },
            redirect: 'error', cache: 'no-store', signal: AbortSignal.timeout(8_000),
          });
          if (!finalResponse.ok) break;
          const finalBody: unknown = await finalResponse.json();
          const output = isRecord(finalBody) && typeof finalBody.response === 'string' ? finalBody.response : '';
          if (!output.trim()) break;
          res.status(200).json({ status: 'completed', conversationId: id, receiptId: receiptFingerprint(runId, id, output), output: output.slice(0, 40_000) });
          return;
        }
        await wait(Math.min(pollIntervalMs, Math.max(0, deadline - Date.now())));
      }
      res.status(200).json({ status: 'running', conversationId: id, sessionParams: { conversationId: id } });
    } catch {
      res.status(502).json({ status: 'unknown', errorCode: 'openhands_dispatch_or_poll_failed' });
    }
  });

  return router;
}
