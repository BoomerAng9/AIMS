/**
 * Together.ai Client — Generic access to any Together-hosted model
 *
 * OpenAI-compatible. Covers Llama 4 Maverick, DeepSeek, Qwen, Mistral,
 * and anything else Together offers. For Kimi K2.5 specifically (with
 * thinking mode / reasoning_content), use the dedicated kimi.ts client.
 *
 * Usage:
 *   import { together } from './llm/together';
 *   const result = await together.chat({
 *     model: 'meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8',
 *     messages: [{ role: 'user', content: 'Hello' }],
 *   });
 */

import logger from '../logger';
import type { LLMResult, ChatMessage, ModelSpec } from './openrouter';
import { MODELS } from './openrouter';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TOGETHER_API_URL = 'https://api.together.xyz/v1/chat/completions';
const DEFAULT_TOGETHER_MODEL = 'meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TogetherRequest {
  model?: string;            // Together model ID — defaults to Llama 4 Maverick
  messages: ChatMessage[];
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  stream?: boolean;
}

// ---------------------------------------------------------------------------
// Client
// ---------------------------------------------------------------------------

class TogetherClient {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.TOGETHER_API_KEY || '';
  }

  isConfigured(): boolean {
    return this.apiKey.length > 0;
  }

  /**
   * Chat completion via Together.ai (OpenAI-compatible).
   */
  async chat(request: TogetherRequest): Promise<LLMResult> {
    if (!this.isConfigured()) {
      logger.warn('[Together] No API key configured — returning stub');
      return this.stub(request);
    }

    const model = request.model || DEFAULT_TOGETHER_MODEL;
    const body = {
      model,
      messages: request.messages,
      max_tokens: request.maxTokens ?? 4096,
      temperature: request.temperature ?? 0.7,
      top_p: request.topP ?? 0.95,
    };

    logger.info({ model, messageCount: request.messages.length }, '[Together] Sending request');

    const res = await fetch(TOGETHER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errorBody = await res.text().catch(() => 'unknown');
      logger.error({ status: res.status, body: errorBody }, '[Together] API error');
      throw new Error(`Together.ai ${res.status}: ${errorBody}`);
    }

    const data = await res.json() as {
      id: string;
      model: string;
      choices: Array<{ message: { content: string }; finish_reason: string }>;
      usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
    };

    const content = data.choices?.[0]?.message?.content || '';
    const usage = data.usage ?? { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };

    // Resolve pricing from MODELS catalog
    const spec = this.resolveSpec(model);
    const inputCost = (usage.prompt_tokens / 1_000_000) * spec.inputPer1M;
    const outputCost = (usage.completion_tokens / 1_000_000) * spec.outputPer1M;
    const totalCost = Math.round((inputCost + outputCost) * 1_000_000) / 1_000_000;

    logger.info({ model: data.model, tokens: usage.total_tokens, cost: totalCost }, '[Together] Response received');

    return {
      content,
      model: data.model || model,
      tokens: {
        prompt: usage.prompt_tokens,
        completion: usage.completion_tokens,
        total: usage.total_tokens,
      },
      cost: { usd: totalCost },
    };
  }

  /**
   * Quick single-prompt helper.
   */
  async prompt(text: string, opts?: { model?: string; system?: string; maxTokens?: number }): Promise<LLMResult> {
    const messages: ChatMessage[] = [];
    if (opts?.system) messages.push({ role: 'system', content: opts.system });
    messages.push({ role: 'user', content: text });

    return this.chat({ model: opts?.model, messages, maxTokens: opts?.maxTokens });
  }

  // ── Private ──────────────────────────────────────────────────────────────

  private resolveSpec(modelId: string): ModelSpec {
    const byId = Object.values(MODELS).find(m => m.id === modelId);
    if (byId) return byId;

    return {
      id: modelId,
      name: modelId,
      provider: 'Together.ai',
      inputPer1M: 0,
      outputPer1M: 0,
      contextWindow: 128000,
      tier: 'standard',
    };
  }

  private stub(request: TogetherRequest): LLMResult {
    const userMsg = request.messages.find(m => m.role === 'user')?.content || '';
    return {
      content: `[Together Offline] No TOGETHER_API_KEY configured. Query: ${String(userMsg).slice(0, 80)}`,
      model: 'together-stub',
      tokens: { prompt: 0, completion: 0, total: 0 },
      cost: { usd: 0 },
    };
  }
}

export const together = new TogetherClient();
