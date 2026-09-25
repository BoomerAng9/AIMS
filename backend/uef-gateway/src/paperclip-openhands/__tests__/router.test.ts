import express from 'express';
import request from 'supertest';
import { createPaperclipOpenHandsRouter } from '../router';

const binding = {
  companyId: 'company-a',
  agentId: 'agent-a',
  tenantId: 'tenant-a',
  ownerId: 'owner-a',
  agentProfileId: '11111111-2222-4333-8444-555555555555',
  workspaceRoot: '/workspace/tenant-a',
  workingDirectory: 'project',
  enabled: true,
};

const configuredEnv = {
  PAPERCLIP_API_URL: 'https://paperclip.example.test',
  OPENHANDS_AGENT_SERVER_URL: 'https://canvas.example.test',
  OPENHANDS_SESSION_API_KEY: 'test-session-key',
  PAPERCLIP_OPENHANDS_BINDINGS_JSON: JSON.stringify([binding]),
} as NodeJS.ProcessEnv;

function runJwt(overrides: Record<string, unknown> = {}): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const claims = Buffer.from(JSON.stringify({
    sub: 'agent-a', company_id: 'company-a', run_id: 'run-123', exp: Math.floor(Date.now() / 1000) + 60,
    ...overrides,
  })).toString('base64url');
  return `${header}.${claims}.test-signature`;
}

function appFor(fetchImpl: typeof fetch, env = configuredEnv) {
  const app = express();
  app.use(express.json());
  app.use(createPaperclipOpenHandsRouter({ env, fetchImpl, maxWaitMs: 5, pollIntervalMs: 1, wait: async () => undefined }));
  return app;
}

describe('Paperclip to OpenHands bridge', () => {
  test('fails closed when runtime or binding configuration is absent', async () => {
    const app = appFor(jest.fn() as unknown as typeof fetch, {} as NodeJS.ProcessEnv);
    const health = await request(app).get('/healthz/integrations/paperclip/openhands');
    const run = await request(app).post('/api/integrations/paperclip/openhands/runs').send({});
    expect(health.status).toBe(503);
    expect(health.body).toMatchObject({ ready: false, bindingsConfigured: false });
    expect(run.status).toBe(503);
  });

  test('validates Paperclip identity, preserves the configured model profile and tenant workspace, and returns a terminal receipt', async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    const fetchImpl = jest.fn(async (input: URL | RequestInfo, init?: RequestInit) => {
      const url = String(input);
      calls.push({ url, init });
      if (url.endsWith('/api/agents/me')) {
        expect(new Headers(init?.headers).get('Authorization')).toBe(`Bearer ${runJwt()}`);
        expect(new Headers(init?.headers).get('X-Paperclip-Run-Id')).toBe('run-123');
        return Response.json({ id: 'agent-a', companyId: 'company-a' });
      }
      if (url.endsWith('/ready')) return Response.json({ status: 'ready' });
      if (url.endsWith('/api/conversations')) {
        const payload = JSON.parse(String(init?.body));
        expect(payload.agent_profile_id).toBe(binding.agentProfileId);
        expect(payload.workspace.working_dir).toBe('/workspace/tenant-a/project');
        expect(payload.worktree).toBe(true);
        expect(payload.confirmation_policy).toEqual({ kind: 'ConfirmRisky', threshold: 'HIGH', confirm_unknown: true });
        expect(payload.tags.tenantid).toBe('tenant-a');
        return Response.json({ id: payload.conversation_id }, { status: 201 });
      }
      if (url.endsWith('/agent_final_response')) return Response.json({ response: 'Task completed with verified output.' });
      if (url.includes('/api/conversations/')) return Response.json({ execution_status: 'finished' });
      throw new Error(`Unexpected request ${url}`);
    }) as unknown as typeof fetch;

    const response = await request(appFor(fetchImpl))
      .post('/api/integrations/paperclip/openhands/runs')
      .set('Authorization', `Bearer ${runJwt()}`)
      .set('X-Paperclip-Run-Id', 'run-123')
      .send({ runId: 'run-123', agentId: 'agent-a', companyId: 'company-a', task: 'Create a small test file.' });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ status: 'completed', output: 'Task completed with verified output.' });
    expect(response.body.receiptId).toMatch(/^sha256:[a-f0-9]{64}$/);
    expect(calls).toHaveLength(5);
  });

  test('rejects spoofed identity before contacting Agent Canvas', async () => {
    const fetchImpl = jest.fn(async () => Response.json({ id: 'other-agent', companyId: 'company-a' })) as unknown as typeof fetch;
    const response = await request(appFor(fetchImpl))
      .post('/api/integrations/paperclip/openhands/runs')
      .set('Authorization', `Bearer ${runJwt()}`)
      .set('X-Paperclip-Run-Id', 'run-123')
      .send({ runId: 'run-123', agentId: 'agent-a', companyId: 'company-a', task: 'Do work.' });
    expect(response.status).toBe(403);
    expect(response.body.errorCode).toBe('paperclip_run_identity_mismatch');
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  test('rejects a long-lived agent API key before Paperclip identity lookup or Canvas dispatch', async () => {
    const fetchImpl = jest.fn() as unknown as typeof fetch;
    const response = await request(appFor(fetchImpl))
      .post('/api/integrations/paperclip/openhands/runs')
      .set('Authorization', 'Bearer pcp_agent_long_lived_key')
      .set('X-Paperclip-Run-Id', 'run-123')
      .send({ runId: 'run-123', agentId: 'agent-a', companyId: 'company-a', task: 'Do work.' });
    expect(response.status).toBe(401);
    expect(response.body.errorCode).toBe('paperclip_run_token_not_run_bound');
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  test('rejects JWT claims for another run before identity lookup', async () => {
    const fetchImpl = jest.fn() as unknown as typeof fetch;
    const response = await request(appFor(fetchImpl))
      .post('/api/integrations/paperclip/openhands/runs')
      .set('Authorization', `Bearer ${runJwt({ run_id: 'different-run' })}`)
      .set('X-Paperclip-Run-Id', 'run-123')
      .send({ runId: 'run-123', agentId: 'agent-a', companyId: 'company-a', task: 'Do work.' });
    expect(response.status).toBe(401);
    expect(response.body.errorCode).toBe('paperclip_run_token_not_run_bound');
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  test('rejects path traversal and duplicate agent bindings at configuration load', async () => {
    const invalidBindings = [
      [{ ...binding, workingDirectory: '../other-tenant' }],
      [binding, { ...binding, tenantId: 'other-tenant' }],
    ];
    for (const invalidBinding of invalidBindings) {
      const app = appFor(jest.fn() as unknown as typeof fetch, {
        ...configuredEnv,
        PAPERCLIP_OPENHANDS_BINDINGS_JSON: JSON.stringify(invalidBinding),
      });
      const response = await request(app).get('/healthz/integrations/paperclip/openhands');
      expect(response.status).toBe(503);
      expect(response.body.bindingsConfigured).toBe(false);
    }
  });
});
