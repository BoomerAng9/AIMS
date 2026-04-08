/**
 * Open-Source Model Client — Self-Hosted Models on Hostinger VPS
 *
 * Connects to OSS models cloned and running on Hostinger KVM VPS
 * or any other infrastructure. Models are served via:
 *   - vLLM (OpenAI-compatible API)
 *   - Ollama
 *   - Text Generation Inference (TGI)
 *   - Custom HTTP endpoints
 *
 * All models conform to the same LLMResult interface as Vertex AI
 * and OpenRouter, so the gateway can swap freely.
 */

import logger from '../logger';
import type { LLMResult, ChatMessage, ModelSpec } from './openrouter';

// ---------------------------------------------------------------------------
// OSS Model Catalog
// ---------------------------------------------------------------------------

export interface OSSModelSpec extends ModelSpec {
  endpointType: 'vllm' | 'ollama' | 'tgi' | 'custom';
  defaultEndpoint: string;
  envVar: string;
}

export const OSS_MODELS: Record<string, OSSModelSpec> = {
  'llama-3.1-70b': {
    id: 'oss/llama-3.1-70b',
    name: 'Llama 3.1 70B',
    provider: 'self-hosted',
    inputPer1M: 0,
    outputPer1M: 0,
    contextWindow: 128000,
    tier: 'standard',
    endpointType: 'vllm',
    defaultEndpoint: 'http://localhost:8000/v1',
    envVar: 'OSS_LLAMA_ENDPOINT',
  },
  'mistral-large': {
    id: 'oss/mistral-large',
    name: 'Mistral Large',
    provider: 'self-hosted',
    inputPer1M: 0,
    outputPer1M: 0,
    contextWindow: 32000,
    tier: 'standard',
    endpointType: 'vllm',
    defaultEndpoint: 'http://localhost:8001/v1',
    envVar: 'OSS_MISTRAL_ENDPOINT',
  },
  'codellama-34b': {
    id: 'oss/codellama-34b',
    name: 'Code Llama 34B',
    provider: 'self-hosted',
    inputPer1M: 0,
    outputPer1M: 0,
    contextWindow: 16000,
    tier: 'fast',
    endpointType: 'vllm',
    defaultEndpoint: 'http://localhost:8002/v1',
    envVar: 'OSS_CODELLAMA_ENDPOINT',
  },
  'deepseek-coder-v2': {
    id: 'oss/deepseek-coder-v2',
    name: 'DeepSeek Coder V2',
    provider: 'self-hosted',
    inputPer1M: 0,
    outputPer1M: 0,
    contextWindow: 128000,
    tier: 'standard',
    endpointType: 'vllm',
    defaultEndpoint: 'http://localhost:8003/v1',
    envVar: 'OSS_DEEPSEEK_ENDPOINT',
  },
  'qwen2.5-72b': {
    id: 'oss/qwen2.5-72b',
    name: 'Qwen 2.5 72B',
    provider: 'self-hosted',
    inputPer1M: 0,
    outputPer1M: 0,
    contextWindow: 131072,
    tier: 'standard',
    endpointType: 'ollama',
    defaultEndpoint: 'http://localhost:11434',
    envVar: 'OSS_QWEN_ENDPOINT',
  },
};

// ---------------------------------------------------------------------------
// Hostinger VPS Config
// ---------------------------------------------------------------------------

const HOSTINGER_VPS_HOST = process.env.HOSTINGER_VPS_HOST || '76.13.96.107';
const HOSTINGER_VPS_PORT = process.env.HOSTINGER_VPS_PORT || '8000';

// ---------------------------------------------------------------------------
// OSS Model Client
// ---------------------------------------------------------------------------

class OSSModelClient {
  private getEndpoint(spec: OSSModelSpec): string {
    const envEndpoint = process.env[spec.envVar];
    if (envEndpoint) return envEndpoint;

    // If on Hostinger VPS, use the VPS host
    if (process.env.USE_HOSTINGER_VPS === 'true') {
      const port = spec.defaultEndpoint.match(/:(\d+)/)?.[1] || HOSTINGER_VPS_PORT;
      return `http://${HOSTINGER_VPS_HOST}:${port}/v1`;
    }

    return spec.defaultEndpoint;
  }

  isConfigured(): boolean {
    // Check if any OSS model endpoint is reachable
    return Object.values(OSS_MODELS).some(spec => !!process.env[spec.envVar]);
  }

  canHandle(modelKey: string): boolean {
    return !!this.resolveModel(modelKey);
  }

  resolveModel(modelKey: string): OSSModelSpec | null {
    if (OSS_MODELS[modelKey]) return OSS_MODELS[modelKey];
    const byId = Object.values(OSS_MODELS).find(m => m.id === modelKey);
    return byId || null;
  }

  async chat(request: {
    model: string;
    messages: ChatMessage[];
    max_tokens?: number;
    temperature?: number;
  }): Promise<LLMResult> {
    const spec = this.resolveModel(request.model);
    if (!spec) {
      throw new Error(`[OSS] Model "${request.model}" not in OSS catalog`);
    }

    const endpoint = this.getEndpoint(spec);

    switch (spec.endpointType) {
      case 'vllm':
      case 'custom':
        return this.callOpenAICompat(spec, endpoint, request);
      case 'ollama':
        return this.callOllama(spec, endpoint, request);
      case 'tgi':
        return this.callTGI(spec, endpoint, request);
    }
  }

  // ── OpenAI-Compatible (vLLM, etc.) ──────────────────────────

  private async callOpenAICompat(
    spec: OSSModelSpec,
    endpoint: string,
    request: { messages: ChatMessage[]; max_tokens?: number; temperature?: number },
  ): Promise<LLMResult> {
    const url = `${endpoint}/chat/completions`;

    logger.info({ model: spec.id, endpoint: url }, '[OSS/vLLM] Sending request');

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: spec.name,
        messages: request.messages.map(m => ({ role: m.role, content: m.content })),
        max_tokens: request.max_tokens || 4096,
        temperature: request.temperature ?? 0.7,
      }),
    });

    if (!res.ok) {
      const errorBody = await res.text().catch(() => 'Unknown error');
      throw new Error(`OSS model error ${res.status}: ${errorBody}`);
    }

    const data = await res.json() as {
      choices: Array<{ message: { content: string } }>;
      usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
    };

    return {
      content: data.choices?.[0]?.message?.content || '',
      model: spec.id,
      tokens: {
        prompt: data.usage?.prompt_tokens || 0,
        completion: data.usage?.completion_tokens || 0,
        total: data.usage?.total_tokens || 0,
      },
      cost: { usd: 0 }, // Self-hosted = no per-token cost
    };
  }

  // ── Ollama ──────────────────────────────────────────────────

  private async callOllama(
    spec: OSSModelSpec,
    endpoint: string,
    request: { messages: ChatMessage[]; max_tokens?: number; temperature?: number },
  ): Promise<LLMResult> {
    const url = `${endpoint}/api/chat`;

    logger.info({ model: spec.id, endpoint: url }, '[OSS/Ollama] Sending request');

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: spec.name.toLowerCase().replace(/\s+/g, '-'),
        messages: request.messages.map(m => ({ role: m.role, content: m.content })),
        stream: false,
        options: {
          num_predict: request.max_tokens || 4096,
          temperature: request.temperature ?? 0.7,
        },
      }),
    });

    if (!res.ok) {
      const errorBody = await res.text().catch(() => 'Unknown error');
      throw new Error(`Ollama error ${res.status}: ${errorBody}`);
    }

    const data = await res.json() as {
      message: { content: string };
      eval_count?: number;
      prompt_eval_count?: number;
    };

    const promptTokens = data.prompt_eval_count || 0;
    const completionTokens = data.eval_count || 0;

    return {
      content: data.message?.content || '',
      model: spec.id,
      tokens: {
        prompt: promptTokens,
        completion: completionTokens,
        total: promptTokens + completionTokens,
      },
      cost: { usd: 0 },
    };
  }

  // ── Text Generation Inference (TGI) ────────────────────────

  private async callTGI(
    spec: OSSModelSpec,
    endpoint: string,
    request: { messages: ChatMessage[]; max_tokens?: number; temperature?: number },
  ): Promise<LLMResult> {
    const url = `${endpoint}/generate`;

    // TGI uses a simpler prompt format
    const prompt = request.messages.map(m => `${m.role}: ${m.content}`).join('\n');

    logger.info({ model: spec.id, endpoint: url }, '[OSS/TGI] Sending request');

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_new_tokens: request.max_tokens || 4096,
          temperature: request.temperature ?? 0.7,
        },
      }),
    });

    if (!res.ok) {
      const errorBody = await res.text().catch(() => 'Unknown error');
      throw new Error(`TGI error ${res.status}: ${errorBody}`);
    }

    const data = await res.json() as {
      generated_text: string;
      details?: { generated_tokens: number };
    };

    const completionTokens = data.details?.generated_tokens || Math.ceil((data.generated_text?.length || 0) / 4);

    return {
      content: data.generated_text || '',
      model: spec.id,
      tokens: {
        prompt: 0,
        completion: completionTokens,
        total: completionTokens,
      },
      cost: { usd: 0 },
    };
  }

  listModels(): OSSModelSpec[] {
    return Object.values(OSS_MODELS);
  }
}

export const ossModels = new OSSModelClient();
