import type { AdapterExecutionContext, AdapterExecutionResult } from '@paperclipai/adapter-utils';
import { renderPaperclipWakePrompt } from '@paperclipai/adapter-utils/server-utils';
import { resolveBrokerEndpoint, resolveTimeoutMs } from './endpoint.js';

interface BrokerRunResult {
  status: 'completed' | 'failed' | 'needs_review' | 'running' | 'unknown';
  receiptId?: string;
  conversationId?: string;
  output?: string;
  errorCode?: string;
  sessionParams?: Record<string, unknown> | null;
  model?: string;
  usage?: { inputTokens?: number; outputTokens?: number; cachedInputTokens?: number };
  costUsd?: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function parseBrokerResult(value: unknown): BrokerRunResult {
  if (!isRecord(value) || !['completed', 'failed', 'needs_review', 'running', 'unknown'].includes(String(value.status))) {
    throw new Error('A.I.M.S. broker returned an invalid execution receipt.');
  }
  return value as unknown as BrokerRunResult;
}

function sanitizedErrorCode(value: unknown): string {
  if (typeof value !== 'string') return 'broker_execution_failed';
  const normalized = value.trim().replace(/[^A-Za-z0-9_.:-]/g, '').slice(0, 120);
  return normalized || 'broker_execution_failed';
}

export interface ExecuteDependencies {
  env?: NodeJS.ProcessEnv;
  fetchImpl?: typeof fetch;
}

export async function execute(ctx: AdapterExecutionContext): Promise<AdapterExecutionResult> {
  return executeWithDependencies(ctx, {});
}

export async function executeWithDependencies(
  ctx: AdapterExecutionContext,
  dependencies: ExecuteDependencies,
): Promise<AdapterExecutionResult> {
  const endpoint = resolveBrokerEndpoint(dependencies.env);
  const timeoutMs = resolveTimeoutMs(dependencies.env);
  if (!ctx.authToken?.trim()) {
    return {
      exitCode: 1, signal: null, timedOut: false,
      errorCode: 'paperclip_run_token_missing',
      errorMessage: 'Paperclip did not supply its scoped agent/run token; no harness dispatch occurred.',
    };
  }

  const prompt = renderPaperclipWakePrompt(ctx.context, { includeExecutionContract: true });
  if (!prompt.trim()) {
    return {
      exitCode: 1, signal: null, timedOut: false,
      errorCode: 'paperclip_task_context_missing',
      errorMessage: 'Paperclip supplied no usable task context; no harness dispatch occurred.',
    };
  }

  const response = await (dependencies.fetchImpl ?? fetch)(new URL('/api/integrations/paperclip/openhands/runs', endpoint), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${ctx.authToken}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'Idempotency-Key': ctx.runId,
      'X-Paperclip-Run-Id': ctx.runId,
    },
    body: JSON.stringify({
      runId: ctx.runId,
      agentId: ctx.agent.id,
      companyId: ctx.agent.companyId,
      task: prompt.slice(0, 40_000),
      sessionParams: ctx.runtime.sessionParams,
      sessionDisplayId: ctx.runtime.sessionDisplayId,
      taskKey: ctx.runtime.taskKey,
    }),
    redirect: 'error',
    cache: 'no-store',
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!response.ok) {
    const code = response.status === 401 || response.status === 403
      ? 'paperclip_identity_or_binding_rejected'
      : response.status === 503
        ? 'aims_broker_unavailable'
        : 'aims_broker_request_failed';
    return {
      exitCode: 1, signal: null, timedOut: false,
      errorCode: code,
      errorMessage: `A.I.M.S. broker rejected or failed the request (HTTP ${response.status}); no alternate harness was selected.`,
    };
  }

  let receipt: BrokerRunResult;
  try {
    receipt = parseBrokerResult(await response.json());
  } catch {
    return {
      exitCode: 1, signal: null, timedOut: false,
      errorCode: 'aims_broker_invalid_receipt',
      errorMessage: 'A.I.M.S. broker returned an invalid receipt; Paperclip must not mark this run complete.',
    };
  }

  if (receipt.status !== 'completed' || !receipt.receiptId || !receipt.conversationId) {
    const review = receipt.status === 'needs_review' || receipt.status === 'running' || receipt.status === 'unknown';
    return {
      exitCode: review ? null : 1,
      signal: null,
      timedOut: false,
      ...(receipt.errorCode ? { errorCode: sanitizedErrorCode(receipt.errorCode) } : {}),
      errorMessage: review
        ? 'A.I.M.S. did not return a verified terminal completion; this run remains review-required.'
        : 'A.I.M.S. execution failed; no alternate harness was selected.',
      sessionParams: receipt.sessionParams ?? ctx.runtime.sessionParams,
      sessionDisplayId: receipt.conversationId ?? ctx.runtime.sessionDisplayId,
      ...(receipt.model ? { model: receipt.model } : {}),
      resultJson: { status: receipt.status, receiptId: receipt.receiptId ?? null },
    };
  }

  return {
    exitCode: 0,
    signal: null,
    timedOut: false,
    sessionParams: receipt.sessionParams ?? { conversationId: receipt.conversationId },
    sessionDisplayId: receipt.conversationId,
    ...(receipt.model ? { model: receipt.model } : {}),
    ...(receipt.usage ? { usage: {
      inputTokens: receipt.usage.inputTokens ?? 0,
      outputTokens: receipt.usage.outputTokens ?? 0,
      ...(receipt.usage.cachedInputTokens !== undefined ? { cachedInputTokens: receipt.usage.cachedInputTokens } : {}),
    }, usageBasis: 'per_run' as const } : {}),
    ...(typeof receipt.costUsd === 'number' && Number.isFinite(receipt.costUsd) && receipt.costUsd >= 0
      ? { costUsd: receipt.costUsd, billingType: 'api' as const } : {}),
    resultJson: { status: receipt.status, receiptId: receipt.receiptId, conversationId: receipt.conversationId },
    summary: receipt.output?.slice(0, 4_000) ?? 'A.I.M.S. reports verified completion; see the linked receipt for output and evidence.',
  };
}
