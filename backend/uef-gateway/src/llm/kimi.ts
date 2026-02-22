/**
 * Kimi K2.5 Client — Moonshot AI Visual Agentic Model
 *
 * Routes to Together.ai (primary) with Fireworks.ai as fallback.
 * Both are OpenAI-compatible. Kimi K2.5 is a 1T-param MoE model
 * with 32B active params, 256K context, native multimodal (vision + video).
 *
 * Two modes:
 *   - Thinking  → temperature=1.0, returns reasoning_content + content
 *   - Instant   → temperature=0.6, returns content only (faster, cheaper)
 *
 * Usage:
 *   import { kimi } from './llm/kimi';
 *   const result = await kimi.chat({ messages: [...], mode: 'thinking' });
 */

import logger from '../logger';
import type { LLMResult, ChatMessage } from './openrouter';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TOGETHER_API_URL = 'https://api.together.xyz/v1/chat/completions';
const FIREWORKS_API_URL = 'https://api.fireworks.ai/inference/v1/chat/completions';

const TOGETHER_MODEL = 'moonshotai/Kimi-K2.5';
const FIREWORKS_MODEL = 'accounts/fireworks/models/kimi-k2-5';

// Pricing per 1M tokens (Together.ai estimates — update when confirmed)
const TOGETHER_INPUT_PER_1M = 0.90;
const TOGETHER_OUTPUT_PER_1M = 0.90;
const FIREWORKS_INPUT_PER_1M = 0.90;
const FIREWORKS_OUTPUT_PER_1M = 0.90;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type KimiMode = 'thinking' | 'instant';

export interface KimiRequest {
  messages: ChatMessage[];
  mode?: KimiMode;
  maxTokens?: number;
  /** Passed through for vision: include image_url content blocks in messages */
  multimodal?: boolean;
}

export interface KimiResult extends LLMResult {
  reasoning?: string;  // Only present in thinking mode
  provider: 'together' | 'fireworks';
}

// ---------------------------------------------------------------------------
// Client
// ---------------------------------------------------------------------------

class KimiClient {
  private togetherKey: string;
  private fireworksKey: string;

  constructor() {
    this.togetherKey = process.env.TOGETHER_API_KEY || '';
    this.fireworksKey = process.env.FIREWORKS_API_KEY || '';
  }

  isConfigured(): boolean {
    return this.togetherKey.length > 0 || this.fireworksKey.length > 0;
  }

  /**
   * Send a chat request to Kimi K2.5.
   * Tries Together.ai first, falls back to Fireworks.ai.
   * Returns reasoning_content separately in thinking mode.
   */
  async chat(request: KimiRequest): Promise<KimiResult> {
    if (!this.isConfigured()) {
      logger.warn('[Kimi] No API key configured — returning stub');
      return this.stub(request);
    }

    const mode = request.mode ?? 'thinking';
    const temperature = mode === 'thinking' ? 1.0 : 0.6;
    const maxTokens = request.maxTokens ?? (mode === 'thinking' ? 16384 : 4096);

    const body: Record<string, unknown> = {
      messages: request.messages,
      max_tokens: maxTokens,
      temperature,
      top_p: 0.95,
    };

    // Instant mode disables the chain-of-thought budget
    if (mode === 'instant') {
      body['thinking'] = { type: 'disabled' };
    }

    // Try Together.ai
    if (this.togetherKey) {
      try {
        return await this.callTogether(body, mode);
      } catch (err) {
        logger.warn({ err }, '[Kimi] Together.ai failed — falling back to Fireworks');
      }
    }

    // Fallback to Fireworks.ai
    if (this.fireworksKey) {
      return await this.callFireworks(body, mode);
    }

    throw new Error('[Kimi] All providers failed and no fallback available');
  }

  /**
   * Quick single-prompt helper. Returns just the text content.
   */
  async prompt(text: string, opts?: { system?: string; mode?: KimiMode; maxTokens?: number }): Promise<KimiResult> {
    const messages: ChatMessage[] = [];
    if (opts?.system) messages.push({ role: 'system', content: opts.system });
    messages.push({ role: 'user', content: text });

    return this.chat({ messages, mode: opts?.mode, maxTokens: opts?.maxTokens });
  }

  // ── Private ──────────────────────────────────────────────────────────────

  private async callTogether(body: Record<string, unknown>, mode: KimiMode): Promise<KimiResult> {
    const res = await fetch(TOGETHER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.togetherKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ...body, model: TOGETHER_MODEL }),
    });

    if (!res.ok) {
      const err = await res.text().catch(() => 'unknown');
      throw new Error(`Together.ai ${res.status}: ${err}`);
    }

    const data = await res.json() as {
      choices: Array<{
        message: { content: string; reasoning_content?: string };
        finish_reason: string;
      }>;
      usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
    };

    return this.toResult(data, mode, 'together', TOGETHER_INPUT_PER_1M, TOGETHER_OUTPUT_PER_1M);
  }

  private async callFireworks(body: Record<string, unknown>, mode: KimiMode): Promise<KimiResult> {
    // Fireworks uses chat_template_kwargs instead of top-level thinking key
    const fireworksBody: Record<string, unknown> = { ...body, model: FIREWORKS_MODEL };
    if (mode === 'instant') {
      delete fireworksBody['thinking'];
      (fireworksBody as Record<string, unknown>)['chat_template_kwargs'] = { thinking: false };
    }

    const res = await fetch(FIREWORKS_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.fireworksKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(fireworksBody),
    });

    if (!res.ok) {
      const err = await res.text().catch(() => 'unknown');
      throw new Error(`Fireworks.ai ${res.status}: ${err}`);
    }

    const data = await res.json() as {
      choices: Array<{
        message: { content: string; reasoning_content?: string };
        finish_reason: string;
      }>;
      usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
    };

    return this.toResult(data, mode, 'fireworks', FIREWORKS_INPUT_PER_1M, FIREWORKS_OUTPUT_PER_1M);
  }

  private toResult(
    data: {
      choices: Array<{ message: { content: string; reasoning_content?: string } }>;
      usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
    },
    mode: KimiMode,
    provider: 'together' | 'fireworks',
    inputRate: number,
    outputRate: number,
  ): KimiResult {
    const choice = data.choices?.[0];
    const content = choice?.message?.content || '';
    const reasoning = choice?.message?.reasoning_content;
    const usage = data.usage ?? { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };

    const inputCost = (usage.prompt_tokens / 1_000_000) * inputRate;
    const outputCost = (usage.completion_tokens / 1_000_000) * outputRate;
    const totalCost = Math.round((inputCost + outputCost) * 1_000_000) / 1_000_000;

    logger.info({
      provider,
      mode,
      tokens: usage.total_tokens,
      cost: totalCost,
      hasReasoning: !!reasoning,
    }, '[Kimi] Response received');

    return {
      content,
      reasoning: mode === 'thinking' ? reasoning : undefined,
      model: `kimi-k2.5 (${provider})`,
      provider,
      tokens: {
        prompt: usage.prompt_tokens,
        completion: usage.completion_tokens,
        total: usage.total_tokens,
      },
      cost: { usd: totalCost },
    };
  }

  private stub(request: KimiRequest): KimiResult {
    const userMsg = request.messages.find(m => m.role === 'user')?.content || '';
    return {
      content: `[Kimi Offline] No TOGETHER_API_KEY or FIREWORKS_API_KEY configured. Query: ${String(userMsg).slice(0, 80)}`,
      model: 'kimi-k2.5-stub',
      provider: 'together',
      tokens: { prompt: 0, completion: 0, total: 0 },
      cost: { usd: 0 },
      stub: true,
      missingConfig: ['TOGETHER_API_KEY', 'FIREWORKS_API_KEY'],
    };
  }
}

export const kimi = new KimiClient();
