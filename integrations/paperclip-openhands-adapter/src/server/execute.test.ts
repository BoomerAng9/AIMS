import test from 'node:test';
import assert from 'node:assert/strict';
import type { AdapterExecutionContext } from '@paperclipai/adapter-utils';
import { executeWithDependencies } from './execute.js';

function context(authToken = 'paperclip-run-token'): AdapterExecutionContext {
  return {
    runId: 'run-123',
    agent: { id: 'agent-1', companyId: 'company-1', name: 'ACHEEVY', adapterType: 'aims_openhands', adapterConfig: {} },
    runtime: { sessionId: null, sessionParams: null, sessionDisplayId: null, taskKey: 'issue-123' },
    config: {},
    context: { issue: { id: 'issue-123', title: 'Create a harmless local file', description: 'Create hello.txt.' } },
    authToken,
    onLog: async () => undefined,
  };
}

const env = { AIMS_OPENHANDS_BROKER_URL: 'https://aims.example.test' } as NodeJS.ProcessEnv;

test('fails closed without Paperclip run identity and makes no broker call', async () => {
  let called = false;
  const result = await executeWithDependencies(context(''), {
    env,
    fetchImpl: async () => { called = true; return new Response('{}'); },
  });
  assert.equal(result.errorCode, 'paperclip_run_token_missing');
  assert.equal(called, false);
});

test('forwards only the assigned run identity and uses Paperclip token plus idempotency', async () => {
  let capturedUrl = '';
  let capturedHeaders: Headers | undefined;
  let capturedBody: Record<string, unknown> | undefined;
  const result = await executeWithDependencies(context(), {
    env,
    fetchImpl: async (input, init) => {
      capturedUrl = String(input);
      capturedHeaders = new Headers(init?.headers);
      capturedBody = JSON.parse(String(init?.body)) as Record<string, unknown>;
      return Response.json({
        status: 'completed', receiptId: 'receipt-1', conversationId: 'conversation-1',
        output: 'Created hello.txt; verified its contents.', model: 'existing-paperclip-binding',
        usage: { inputTokens: 10, outputTokens: 4 }, costUsd: 0,
      });
    },
  });
  assert.equal(capturedUrl, 'https://aims.example.test/api/integrations/paperclip/openhands/runs');
  assert.equal(capturedHeaders?.get('authorization'), 'Bearer paperclip-run-token');
  assert.equal(capturedHeaders?.get('idempotency-key'), 'run-123');
  assert.equal(capturedHeaders?.get('x-paperclip-run-id'), 'run-123');
  assert.equal(capturedBody?.agentId, 'agent-1');
  assert.equal(capturedBody?.companyId, 'company-1');
  assert.equal(result.exitCode, 0);
  assert.equal(result.sessionDisplayId, 'conversation-1');
  assert.equal(result.model, 'existing-paperclip-binding');
  assert.equal(result.costUsd, 0);
});

test('does not choose a fallback harness when the broker rejects identity', async () => {
  const result = await executeWithDependencies(context(), {
    env,
    fetchImpl: async () => new Response('{}', { status: 403 }),
  });
  assert.equal(result.exitCode, 1);
  assert.equal(result.errorCode, 'paperclip_identity_or_binding_rejected');
});

test('does not mark a non-terminal broker result complete', async () => {
  const result = await executeWithDependencies(context(), {
    env,
    fetchImpl: async () => Response.json({ status: 'running', conversationId: 'conversation-1' }),
  });
  assert.equal(result.exitCode, null);
  assert.match(result.errorMessage ?? '', /review-required/);
});
