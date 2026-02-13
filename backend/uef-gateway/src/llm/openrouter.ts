/**
 * OpenRouter LLM Client — Power Source for A.I.M.S.
 *
 * Voltron architecture: This module is the engine. Each Boomer_Ang,
 * ACHEEVY, ORACLE, and ByteRover can use it independently or combined.
 *
 * OpenRouter provides unified access to Claude, GPT, Gemini, Llama,
 * Mistral, and 200+ models through a single API key.
 *
 * Usage:
 *   import { openrouter } from './llm/openrouter';
 *   const result = await openrouter.chat({ model: 'anthropic/claude-sonnet-4.5', messages: [...] });
 */

import logger from '../logger';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  model: string;
  messages: ChatMessage[];
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  stream?: false;
}

export interface ChatChoice {
  index: number;
  message: { role: 'assistant'; content: string };
  finish_reason: string;
}

export interface ChatUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface ChatResponse {
  id: string;
  model: string;
  choices: ChatChoice[];
  usage: ChatUsage;
}

export interface LLMResult {
  content: string;
  model: string;
  tokens: {
    prompt: number;
    completion: number;
    total: number;
  };
  cost: {
    usd: number;
  };
}

// ---------------------------------------------------------------------------
// Model catalog — OpenRouter model IDs + pricing (per 1M tokens)
// ---------------------------------------------------------------------------

export interface ModelSpec {
  id: string;
  name: string;
  provider: string;
  inputPer1M: number;
  outputPer1M: number;
  contextWindow: number;
  tier: 'premium' | 'standard' | 'fast' | 'economy';
}

export const MODELS: Record<string, ModelSpec> = {
  // ── Premium Tier ─────────────────────────────────────────────────────
  'claude-opus-4.6': {
    id: 'anthropic/claude-opus-4.6',
    name: 'Claude Opus 4.6',
    provider: 'Anthropic',
    inputPer1M: 5.0,
    outputPer1M: 25.0,
    contextWindow: 1000000,
    tier: 'premium',
  },
  'claude-opus-4.5': {
    id: 'anthropic/claude-opus-4.5',
    name: 'Claude Opus 4.5',
    provider: 'Anthropic',
    inputPer1M: 5.0,
    outputPer1M: 25.0,
    contextWindow: 200000,
    tier: 'premium',
  },
  'gpt-5.2': {
    id: 'openai/gpt-5.2',
    name: 'GPT-5.2',
    provider: 'OpenAI',
    inputPer1M: 5.0,
    outputPer1M: 20.0,
    contextWindow: 128000,
    tier: 'premium',
  },

  // ── Standard Tier ────────────────────────────────────────────────────
  'claude-sonnet-4.5': {
    id: 'anthropic/claude-sonnet-4.5',
    name: 'Claude Sonnet 4.5',
    provider: 'Anthropic',
    inputPer1M: 3.0,
    outputPer1M: 15.0,
    contextWindow: 1000000,
    tier: 'standard',
  },
  'gpt-5.1': {
    id: 'openai/gpt-5.1',
    name: 'GPT-5.1',
    provider: 'OpenAI',
    inputPer1M: 3.0,
    outputPer1M: 12.0,
    contextWindow: 128000,
    tier: 'standard',
  },
  'gemini-3-pro': {
    id: 'google/gemini-3-pro-preview',
    name: 'Gemini 3 Pro',
    provider: 'Google',
    inputPer1M: 1.25,
    outputPer1M: 10.0,
    contextWindow: 1000000,
    tier: 'standard',
  },

  // ── Fast Tier ────────────────────────────────────────────────────────
  'gemini-3.0-flash': {
    id: 'google/gemini-3.0-flash',
    name: 'Gemini 3.0 Flash',
    provider: 'Google',
    inputPer1M: 0.10,
    outputPer1M: 0.40,
    contextWindow: 1000000,
    tier: 'fast',
  },
  'claude-haiku-4.5': {
    id: 'anthropic/claude-haiku-4.5',
    name: 'Claude Haiku 4.5',
    provider: 'Anthropic',
    inputPer1M: 0.80,
    outputPer1M: 4.0,
    contextWindow: 200000,
    tier: 'fast',
  },
  'gemini-2.5-flash': {
    id: 'google/gemini-2.5-flash-preview',
    name: 'Gemini 2.5 Flash',
    provider: 'Google',
    inputPer1M: 0.30,
    outputPer1M: 2.50,
    contextWindow: 1050000,
    tier: 'fast',
  },

  // ── Economy Tier ─────────────────────────────────────────────────────
  'deepseek-v3.2': {
    id: 'deepseek/deepseek-v3.2',
    name: 'DeepSeek V3.2',
    provider: 'DeepSeek',
    inputPer1M: 0.30,
    outputPer1M: 0.88,
    contextWindow: 131072,
    tier: 'economy',
  },
};

// Default model used by agents when no preference is set
// Reads from OPENROUTER_MODEL env var, defaults to Gemini 3.0 Flash
export const DEFAULT_MODEL = process.env.OPENROUTER_MODEL || 'gemini-3.0-flash';

// ---------------------------------------------------------------------------
// OpenRouter Client
// ---------------------------------------------------------------------------

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

class OpenRouterClient {
  private apiKey: string;
  private siteUrl: string;
  private siteName: string;

  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY || '';
    this.siteUrl = process.env.NEXTAUTH_URL || 'https://aims.acheevy.digital';
    this.siteName = 'A.I.M.S. by ACHIEVEMOR';
  }

  /** Check if the client has a valid API key configured */
  isConfigured(): boolean {
    return this.apiKey.length > 0;
  }

  /**
   * Send a chat completion request to OpenRouter.
   * Returns structured result with content, token counts, and USD cost.
   */
  async chat(request: ChatRequest): Promise<LLMResult> {
    if (!this.isConfigured()) {
      logger.warn('[OpenRouter] No API key configured — returning stub response');
      return this.stubResponse(request);
    }

    const modelSpec = this.resolveModel(request.model);

    const body = {
      model: modelSpec.id,
      messages: request.messages,
      max_tokens: request.max_tokens || 4096,
      temperature: request.temperature ?? 0.7,
      top_p: request.top_p,
    };

    logger.info({
      model: modelSpec.id,
      messageCount: request.messages.length,
    }, '[OpenRouter] Sending request');

    const res = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': this.siteUrl,
        'X-Title': this.siteName,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errorBody = await res.text().catch(() => 'Unknown error');
      logger.error({ status: res.status, body: errorBody }, '[OpenRouter] API error');
      throw new Error(`OpenRouter API error ${res.status}: ${errorBody}`);
    }

    const data: ChatResponse = await res.json();

    const content = data.choices?.[0]?.message?.content || '';
    const usage = data.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };

    // Calculate cost from model pricing
    const inputCost = (usage.prompt_tokens / 1_000_000) * modelSpec.inputPer1M;
    const outputCost = (usage.completion_tokens / 1_000_000) * modelSpec.outputPer1M;
    const totalCost = Math.round((inputCost + outputCost) * 1_000_000) / 1_000_000;

    logger.info({
      model: data.model,
      tokens: usage.total_tokens,
      cost: totalCost,
    }, '[OpenRouter] Response received');

    return {
      content,
      model: data.model || modelSpec.id,
      tokens: {
        prompt: usage.prompt_tokens,
        completion: usage.completion_tokens,
        total: usage.total_tokens,
      },
      cost: { usd: totalCost },
    };
  }

  /**
   * Quick helper — single prompt, returns just the text.
   */
  async prompt(text: string, opts?: { model?: string; system?: string; maxTokens?: number }): Promise<LLMResult> {
    const messages: ChatMessage[] = [];
    if (opts?.system) {
      messages.push({ role: 'system', content: opts.system });
    }
    messages.push({ role: 'user', content: text });

    return this.chat({
      model: opts?.model || DEFAULT_MODEL,
      messages,
      max_tokens: opts?.maxTokens,
    });
  }

  /**
   * Resolve a short model key (e.g. 'claude-sonnet') or full OpenRouter ID
   * to a ModelSpec with pricing info.
   */
  private resolveModel(modelKey: string): ModelSpec {
    // Direct lookup by short key
    if (MODELS[modelKey]) return MODELS[modelKey];

    // Try matching by full OpenRouter model ID
    const byId = Object.values(MODELS).find(m => m.id === modelKey);
    if (byId) return byId;

    // Fallback — use the raw string as the ID with unknown pricing
    logger.warn({ model: modelKey }, '[OpenRouter] Unknown model — using zero-cost estimate');
    return {
      id: modelKey,
      name: modelKey,
      provider: 'Unknown',
      inputPer1M: 0,
      outputPer1M: 0,
      contextWindow: 128000,
      tier: 'standard',
    };
  }

  /**
   * Stub response for when no API key is configured.
   * Agents still work (heuristic mode), just without real LLM power.
   */
  private stubResponse(request: ChatRequest): LLMResult {
    const userMsg = request.messages.find(m => m.role === 'user')?.content || '';
    return {
      content: `[LLM Offline] OpenRouter API key not configured. Query received (${userMsg.length} chars). Configure OPENROUTER_API_KEY to enable AI-powered responses.`,
      model: 'stub',
      tokens: { prompt: 0, completion: 0, total: 0 },
      cost: { usd: 0 },
    };
  }

  /** List all available models with their pricing */
  listModels(): ModelSpec[] {
    return Object.values(MODELS);
  }
}

// Singleton export — one client per process
export const openrouter = new OpenRouterClient();
