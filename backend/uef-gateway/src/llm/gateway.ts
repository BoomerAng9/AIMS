/**
 * Unified LLM Gateway — Single source of truth for all LLM operations
 *
 * Routing strategy:
 *   1. Anthropic/Google models → try Vertex AI first, fall back to OpenRouter
 *   2. All other models → OpenRouter directly
 *
 * Every call is metered through the usage tracker, feeding LUC billing
 * with actual costs instead of estimates.
 *
 * This replaces all direct OpenRouter/API calls throughout the codebase.
 */

import { vertexAI } from './vertex-ai';
import { openrouter, MODELS as OPENROUTER_MODELS, DEFAULT_MODEL } from './openrouter';
import { ossModels } from './oss-models';
import { usageTracker } from './usage-tracker';
import type { LLMResult, ChatMessage, ModelSpec } from './openrouter';
import logger from '../logger';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GatewayRequest {
  model?: string;
  messages: ChatMessage[];
  max_tokens?: number;
  temperature?: number;
  /** Agent or service making the call — used for billing attribution */
  agentId?: string;
  /** User ID — used for per-user usage tracking */
  userId?: string;
  /** Session ID — used for per-session usage tracking */
  sessionId?: string;
}

export interface GatewayStreamRequest extends GatewayRequest {
  onToken?: (token: string) => void;
}

type ProviderUsed = 'vertex-ai' | 'openrouter' | 'oss-hosted' | 'personaplex' | 'stub';

// ---------------------------------------------------------------------------
// Gateway
// ---------------------------------------------------------------------------

class LLMGateway {
  /**
   * Send a chat completion request through the optimal provider.
   * Returns structured result with content, token counts, and USD cost.
   */
  async chat(request: GatewayRequest): Promise<LLMResult & { provider: ProviderUsed }> {
    const model = request.model || DEFAULT_MODEL;
    const agentId = request.agentId || 'unknown';
    const userId = request.userId || 'guest';
    const sessionId = request.sessionId || 'default';

    const chatReq = {
      model,
      messages: request.messages,
      max_tokens: request.max_tokens,
      temperature: request.temperature,
    };

    let result: LLMResult;
    let provider: ProviderUsed;

    // Strategy 1: Try Vertex AI for supported models
    if (vertexAI.isConfigured() && vertexAI.canHandle(model)) {
      try {
        result = await vertexAI.chat(chatReq);
        provider = 'vertex-ai';
      } catch (err) {
        logger.warn({ model, err }, '[Gateway] Vertex AI failed, falling back to OpenRouter');
        result = await this.callOpenRouter(chatReq);
        provider = result.model === 'stub' ? 'stub' : 'openrouter';
      }
    }
    // Strategy 2: OSS models on Hostinger VPS or self-hosted infra
    else if (ossModels.canHandle(model)) {
      try {
        result = await ossModels.chat(chatReq);
        provider = 'oss-hosted';
      } catch (err) {
        logger.warn({ model, err }, '[Gateway] OSS model failed, falling back to OpenRouter');
        result = await this.callOpenRouter(chatReq);
        provider = result.model === 'stub' ? 'stub' : 'openrouter';
      }
    }
    // Strategy 3: OpenRouter for everything else
    else {
      result = await this.callOpenRouter(chatReq);
      provider = result.model === 'stub' ? 'stub' : 'openrouter';
    }

    // Record usage (skip stubs)
    if (provider !== 'stub') {
      usageTracker.record({
        userId,
        sessionId,
        model: result.model,
        provider,
        agentId,
        tokens: result.tokens,
        cost: result.cost,
      });
    }

    return { ...result, provider };
  }

  /**
   * Quick helper — single prompt, returns just the text with provider info.
   */
  async prompt(text: string, opts?: {
    model?: string;
    system?: string;
    maxTokens?: number;
    agentId?: string;
    userId?: string;
    sessionId?: string;
  }): Promise<LLMResult & { provider: ProviderUsed }> {
    const messages: ChatMessage[] = [];
    if (opts?.system) messages.push({ role: 'system', content: opts.system });
    messages.push({ role: 'user', content: text });

    return this.chat({
      model: opts?.model,
      messages,
      max_tokens: opts?.maxTokens,
      agentId: opts?.agentId,
      userId: opts?.userId,
      sessionId: opts?.sessionId,
    });
  }

  /**
   * Streaming chat — returns a ReadableStream of text chunks.
   * Falls back to non-streaming if the provider doesn't support it.
   */
  async stream(request: GatewayStreamRequest): Promise<{
    stream: ReadableStream<string>;
    provider: ProviderUsed;
    model: string;
  }> {
    const model = request.model || DEFAULT_MODEL;
    const agentId = request.agentId || 'unknown';
    const userId = request.userId || 'guest';
    const sessionId = request.sessionId || 'default';

    const streamReq = {
      model,
      messages: request.messages,
      max_tokens: request.max_tokens,
      temperature: request.temperature,
    };

    // Try Vertex AI streaming for supported models
    if (vertexAI.isConfigured() && vertexAI.canHandle(model)) {
      try {
        const rawStream = await vertexAI.stream(streamReq);
        const metered = this.meterStream(rawStream, { userId, sessionId, model, provider: 'vertex-ai', agentId });
        return { stream: metered, provider: 'vertex-ai', model };
      } catch (err) {
        logger.warn({ model, err }, '[Gateway] Vertex AI streaming failed, falling back to non-stream');
      }
    }

    // Try real streaming from OpenRouter (true token-by-token)
    if (openrouter.isConfigured()) {
      try {
        const rawStream = await openrouter.streamChat(streamReq);
        const metered = this.meterStream(rawStream, { userId, sessionId, model, provider: 'openrouter', agentId });
        return { stream: metered, provider: 'openrouter', model };
      } catch (err) {
        logger.warn({ model, err }, '[Gateway] OpenRouter streaming failed, falling back to non-stream');
      }
    }

    // Last resort: non-streaming OpenRouter call, simulate stream
    const result = await this.callOpenRouter(streamReq);
    const provider: ProviderUsed = result.model === 'stub' ? 'stub' : 'openrouter';

    if (provider !== 'stub') {
      usageTracker.record({ userId, sessionId, model: result.model, provider, agentId, tokens: result.tokens, cost: result.cost });
    }

    const content = result.content;
    const stream = new ReadableStream<string>({
      start(controller) {
        const chunkSize = 20;
        for (let i = 0; i < content.length; i += chunkSize) {
          controller.enqueue(content.slice(i, i + chunkSize));
        }
        controller.close();
      },
    });

    return { stream, provider, model: result.model };
  }

  /**
   * Check if the gateway has any LLM provider configured.
   */
  isConfigured(): boolean {
    return vertexAI.isConfigured() || openrouter.isConfigured() || ossModels.isConfigured();
  }

  /**
   * List all available models across all providers.
   */
  listModels(): Array<ModelSpec & { availableOn: ProviderUsed[] }> {
    const combined = new Map<string, ModelSpec & { availableOn: ProviderUsed[] }>();

    // Add Vertex AI models
    if (vertexAI.isConfigured()) {
      for (const spec of vertexAI.listModels()) {
        combined.set(spec.id, { ...spec, availableOn: ['vertex-ai'] });
      }
    }

    // Add/merge OpenRouter models
    for (const spec of openrouter.listModels()) {
      const existing = combined.get(spec.id);
      if (existing) {
        existing.availableOn.push('openrouter');
      } else {
        combined.set(spec.id, { ...spec, availableOn: ['openrouter'] });
      }
    }

    // Add OSS models (self-hosted)
    for (const spec of ossModels.listModels()) {
      combined.set(spec.id, { ...spec, availableOn: ['oss-hosted'] });
    }

    return Array.from(combined.values());
  }

  // ── Internal ───────────────────────────────────────────────────────

  private async callOpenRouter(request: { model: string; messages: ChatMessage[]; max_tokens?: number; temperature?: number }): Promise<LLMResult> {
    return openrouter.chat({
      model: request.model,
      messages: request.messages,
      max_tokens: request.max_tokens,
      temperature: request.temperature,
    });
  }

  /**
   * Wrap a ReadableStream to track total characters for billing estimation.
   * Full token counts aren't available during streaming, so we estimate
   * from character count (avg ~4 chars per token).
   */
  private meterStream(
    source: ReadableStream<string>,
    meta: { userId: string; sessionId: string; model: string; provider: ProviderUsed; agentId: string },
  ): ReadableStream<string> {
    const reader = source.getReader();
    let totalChars = 0;

    return new ReadableStream<string>({
      async pull(controller) {
        const { done, value } = await reader.read();
        if (done) {
          // Estimate tokens from character count
          const estimatedTokens = Math.ceil(totalChars / 4);
          const spec = vertexAI.resolveModel(meta.model) || Object.values(OPENROUTER_MODELS).find(m => m.id === meta.model);
          const outputPer1M = spec?.outputPer1M || 0;
          const estimatedCost = (estimatedTokens / 1_000_000) * outputPer1M;

          usageTracker.record({
            userId: meta.userId,
            sessionId: meta.sessionId,
            model: meta.model,
            provider: meta.provider,
            agentId: meta.agentId,
            tokens: { prompt: 0, completion: estimatedTokens, total: estimatedTokens },
            cost: { usd: Math.round(estimatedCost * 1_000_000) / 1_000_000 },
          });

          controller.close();
          return;
        }
        totalChars += value.length;
        controller.enqueue(value);
      },
    });
  }
}

export const llmGateway = new LLMGateway();
