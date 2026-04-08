/**
 * Vertex AI LLM Client — Native GCP path for Claude + Gemini
 *
 * Routes Anthropic models through Vertex AI Model Garden (Claude)
 * and Google models through the Gemini API. Returns the same
 * LLMResult interface as OpenRouter so the gateway can swap freely.
 *
 * Requires:
 *   - GOOGLE_CLOUD_PROJECT (GCP project ID)
 *   - GOOGLE_CLOUD_REGION (default: us-central1)
 *   - GOOGLE_APPLICATION_CREDENTIALS or Workload Identity
 *   - For Claude: Anthropic model garden access enabled in the project
 */

import logger from '../logger';
import type { LLMResult, ChatMessage, ModelSpec } from './openrouter';

// ---------------------------------------------------------------------------
// Vertex AI Model Catalog
// ---------------------------------------------------------------------------

export const VERTEX_MODELS: Record<string, ModelSpec & { vertexId: string; provider: 'anthropic' | 'google' }> = {
  // Anthropic via Model Garden
  'claude-opus-4.6': {
    id: 'anthropic/claude-opus-4.6',
    vertexId: 'claude-opus-4-6@20250514',
    name: 'Claude Opus 4.6',
    provider: 'anthropic',
    inputPer1M: 5.0,
    outputPer1M: 25.0,
    contextWindow: 1000000,
    tier: 'premium',
  },
  'claude-sonnet-4.6': {
    id: 'anthropic/claude-sonnet-4.6',
    vertexId: 'claude-sonnet-4-6@20250218',
    name: 'Claude Sonnet 4.6',
    provider: 'anthropic',
    inputPer1M: 3.0,
    outputPer1M: 15.0,
    contextWindow: 1000000,
    tier: 'standard',
  },
  'claude-haiku-4.6': {
    id: 'anthropic/claude-haiku-4.6',
    vertexId: 'claude-haiku-4-6@20250218',
    name: 'Claude Haiku 4.6',
    provider: 'anthropic',
    inputPer1M: 0.80,
    outputPer1M: 4.0,
    contextWindow: 200000,
    tier: 'fast',
  },

  // Google Gemini (native Vertex AI)
  'gemini-3-pro': {
    id: 'google/gemini-3-pro',
    vertexId: 'gemini-3.0-pro',
    name: 'Gemini 3 Pro',
    provider: 'google',
    inputPer1M: 1.25,
    outputPer1M: 10.0,
    contextWindow: 1000000,
    tier: 'standard',
  },
  'gemini-3.0-flash': {
    id: 'google/gemini-3.0-flash',
    vertexId: 'gemini-3.0-flash',
    name: 'Gemini 3.0 Flash',
    provider: 'google',
    inputPer1M: 0.10,
    outputPer1M: 0.40,
    contextWindow: 1000000,
    tier: 'fast',
  },
};

// ---------------------------------------------------------------------------
// Auth — Google Access Token
// ---------------------------------------------------------------------------

interface GoogleToken {
  accessToken: string;
  expiresAt: number;
}

let cachedToken: GoogleToken | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.accessToken;
  }

  // Use Google Auth Library if available, otherwise fall back to metadata server
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { GoogleAuth } = require('google-auth-library');
    const auth = new GoogleAuth({ scopes: ['https://www.googleapis.com/auth/cloud-platform'] });
    const client = await auth.getClient();
    const tokenResponse = await client.getAccessToken();
    const token = tokenResponse.token || tokenResponse.res?.data?.access_token;
    if (!token) throw new Error('No access token returned');
    cachedToken = { accessToken: token, expiresAt: Date.now() + 3500_000 };
    return token;
  } catch (err) {
    logger.error({ err }, '[VertexAI] Failed to get access token');
    throw new Error('Vertex AI authentication failed — check GOOGLE_APPLICATION_CREDENTIALS');
  }
}

// ---------------------------------------------------------------------------
// Client
// ---------------------------------------------------------------------------

const PROJECT = process.env.GOOGLE_CLOUD_PROJECT || '';
const REGION = process.env.GOOGLE_CLOUD_REGION || 'us-central1';

class VertexAIClient {
  isConfigured(): boolean {
    return PROJECT.length > 0;
  }

  canHandle(modelKey: string): boolean {
    // Resolve by short key or by OpenRouter-style ID
    return !!this.resolveModel(modelKey);
  }

  async chat(request: { model: string; messages: ChatMessage[]; max_tokens?: number; temperature?: number }): Promise<LLMResult> {
    const spec = this.resolveModel(request.model);
    if (!spec) {
      throw new Error(`[VertexAI] Model "${request.model}" not available on Vertex AI`);
    }

    if (spec.provider === 'anthropic') {
      return this.callAnthropic(spec, request);
    }
    return this.callGemini(spec, request);
  }

  async stream(request: { model: string; messages: ChatMessage[]; max_tokens?: number; temperature?: number }): Promise<ReadableStream<string>> {
    const spec = this.resolveModel(request.model);
    if (!spec) {
      throw new Error(`[VertexAI] Model "${request.model}" not available on Vertex AI`);
    }

    if (spec.provider === 'anthropic') {
      return this.streamAnthropic(spec, request);
    }
    return this.streamGemini(spec, request);
  }

  // ── Anthropic via Model Garden ──────────────────────────────────────

  private async callAnthropic(
    spec: (typeof VERTEX_MODELS)[string],
    request: { messages: ChatMessage[]; max_tokens?: number; temperature?: number },
  ): Promise<LLMResult> {
    const token = await getAccessToken();
    const url = `https://${REGION}-aiplatform.googleapis.com/v1/projects/${PROJECT}/locations/${REGION}/publishers/anthropic/models/${spec.vertexId}:rawPredict`;

    const { system, messages } = this.splitSystemMessage(request.messages);

    const body: Record<string, unknown> = {
      anthropic_version: 'vertex-2023-10-16',
      max_tokens: request.max_tokens || 4096,
      temperature: request.temperature ?? 0.7,
      messages,
    };
    if (system) body.system = system;

    logger.info({ model: spec.vertexId, messageCount: messages.length }, '[VertexAI/Anthropic] Sending request');

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errorBody = await res.text().catch(() => 'Unknown error');
      logger.error({ status: res.status, body: errorBody }, '[VertexAI/Anthropic] API error');
      throw new Error(`Vertex AI Anthropic error ${res.status}: ${errorBody}`);
    }

    const data = await res.json() as {
      content: Array<{ type: string; text?: string }>;
      usage: { input_tokens: number; output_tokens: number };
    };

    const content = data.content?.find((c: { type: string }) => c.type === 'text')?.text || '';
    const usage = data.usage || { input_tokens: 0, output_tokens: 0 };
    const totalTokens = usage.input_tokens + usage.output_tokens;

    const inputCost = (usage.input_tokens / 1_000_000) * spec.inputPer1M;
    const outputCost = (usage.output_tokens / 1_000_000) * spec.outputPer1M;
    const totalCost = Math.round((inputCost + outputCost) * 1_000_000) / 1_000_000;

    logger.info({ model: spec.vertexId, tokens: totalTokens, cost: totalCost }, '[VertexAI/Anthropic] Response received');

    return {
      content,
      model: spec.id,
      tokens: { prompt: usage.input_tokens, completion: usage.output_tokens, total: totalTokens },
      cost: { usd: totalCost },
    };
  }

  private async streamAnthropic(
    spec: (typeof VERTEX_MODELS)[string],
    request: { messages: ChatMessage[]; max_tokens?: number; temperature?: number },
  ): Promise<ReadableStream<string>> {
    const token = await getAccessToken();
    const url = `https://${REGION}-aiplatform.googleapis.com/v1/projects/${PROJECT}/locations/${REGION}/publishers/anthropic/models/${spec.vertexId}:streamRawPredict`;

    const { system, messages } = this.splitSystemMessage(request.messages);

    const body: Record<string, unknown> = {
      anthropic_version: 'vertex-2023-10-16',
      max_tokens: request.max_tokens || 4096,
      temperature: request.temperature ?? 0.7,
      stream: true,
      messages,
    };
    if (system) body.system = system;

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok || !res.body) {
      const errorBody = await res.text().catch(() => 'Unknown error');
      throw new Error(`Vertex AI Anthropic stream error ${res.status}: ${errorBody}`);
    }

    return this.parseAnthropicSSE(res.body);
  }

  // ── Gemini (Native) ────────────────────────────────────────────────

  private async callGemini(
    spec: (typeof VERTEX_MODELS)[string],
    request: { messages: ChatMessage[]; max_tokens?: number; temperature?: number },
  ): Promise<LLMResult> {
    const token = await getAccessToken();
    const url = `https://${REGION}-aiplatform.googleapis.com/v1/projects/${PROJECT}/locations/${REGION}/publishers/google/models/${spec.vertexId}:generateContent`;

    const { systemInstruction, contents } = this.toGeminiFormat(request.messages);

    const body: Record<string, unknown> = {
      contents,
      generationConfig: {
        maxOutputTokens: request.max_tokens || 4096,
        temperature: request.temperature ?? 0.7,
      },
    };
    if (systemInstruction) body.systemInstruction = systemInstruction;

    logger.info({ model: spec.vertexId, partsCount: contents.length }, '[VertexAI/Gemini] Sending request');

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errorBody = await res.text().catch(() => 'Unknown error');
      logger.error({ status: res.status, body: errorBody }, '[VertexAI/Gemini] API error');
      throw new Error(`Vertex AI Gemini error ${res.status}: ${errorBody}`);
    }

    const data = await res.json() as {
      candidates: Array<{ content: { parts: Array<{ text: string }> } }>;
      usageMetadata?: { promptTokenCount: number; candidatesTokenCount: number; totalTokenCount: number };
    };

    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const usage = data.usageMetadata || { promptTokenCount: 0, candidatesTokenCount: 0, totalTokenCount: 0 };

    const inputCost = (usage.promptTokenCount / 1_000_000) * spec.inputPer1M;
    const outputCost = (usage.candidatesTokenCount / 1_000_000) * spec.outputPer1M;
    const totalCost = Math.round((inputCost + outputCost) * 1_000_000) / 1_000_000;

    logger.info({ model: spec.vertexId, tokens: usage.totalTokenCount, cost: totalCost }, '[VertexAI/Gemini] Response received');

    return {
      content,
      model: spec.id,
      tokens: { prompt: usage.promptTokenCount, completion: usage.candidatesTokenCount, total: usage.totalTokenCount },
      cost: { usd: totalCost },
    };
  }

  private async streamGemini(
    spec: (typeof VERTEX_MODELS)[string],
    request: { messages: ChatMessage[]; max_tokens?: number; temperature?: number },
  ): Promise<ReadableStream<string>> {
    const token = await getAccessToken();
    const url = `https://${REGION}-aiplatform.googleapis.com/v1/projects/${PROJECT}/locations/${REGION}/publishers/google/models/${spec.vertexId}:streamGenerateContent?alt=sse`;

    const { systemInstruction, contents } = this.toGeminiFormat(request.messages);

    const body: Record<string, unknown> = {
      contents,
      generationConfig: {
        maxOutputTokens: request.max_tokens || 4096,
        temperature: request.temperature ?? 0.7,
      },
    };
    if (systemInstruction) body.systemInstruction = systemInstruction;

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok || !res.body) {
      const errorBody = await res.text().catch(() => 'Unknown error');
      throw new Error(`Vertex AI Gemini stream error ${res.status}: ${errorBody}`);
    }

    return this.parseGeminiSSE(res.body);
  }

  // ── SSE Parsers ────────────────────────────────────────────────────

  private parseAnthropicSSE(body: ReadableStream<Uint8Array>): ReadableStream<string> {
    const reader = body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    return new ReadableStream<string>({
      async pull(controller) {
        const { done, value } = await reader.read();
        if (done) { controller.close(); return; }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') { controller.close(); return; }
          try {
            const event = JSON.parse(jsonStr);
            if (event.type === 'content_block_delta' && event.delta?.text) {
              controller.enqueue(event.delta.text);
            }
          } catch { /* skip malformed */ }
        }
      },
    });
  }

  private parseGeminiSSE(body: ReadableStream<Uint8Array>): ReadableStream<string> {
    const reader = body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    return new ReadableStream<string>({
      async pull(controller) {
        const { done, value } = await reader.read();
        if (done) { controller.close(); return; }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          try {
            const event = JSON.parse(jsonStr);
            const text = event.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) controller.enqueue(text);
          } catch { /* skip malformed */ }
        }
      },
    });
  }

  // ── Helpers ────────────────────────────────────────────────────────

  private splitSystemMessage(messages: ChatMessage[]): { system: string | null; messages: Array<{ role: 'user' | 'assistant'; content: string }> } {
    const system = messages.find(m => m.role === 'system')?.content || null;
    const rest = messages.filter(m => m.role !== 'system').map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));
    return { system, messages: rest };
  }

  private toGeminiFormat(messages: ChatMessage[]): {
    systemInstruction: { parts: Array<{ text: string }> } | null;
    contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }>;
  } {
    const systemMsg = messages.find(m => m.role === 'system');
    const systemInstruction = systemMsg ? { parts: [{ text: systemMsg.content }] } : null;

    const contents = messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: (m.role === 'assistant' ? 'model' : 'user') as 'user' | 'model',
        parts: [{ text: m.content }],
      }));

    return { systemInstruction, contents };
  }

  resolveModel(modelKey: string): (typeof VERTEX_MODELS)[string] | null {
    if (VERTEX_MODELS[modelKey]) return VERTEX_MODELS[modelKey];
    const byId = Object.values(VERTEX_MODELS).find(m => m.id === modelKey);
    if (byId) return byId;
    return null;
  }

  listModels(): Array<ModelSpec & { vertexId: string }> {
    return Object.values(VERTEX_MODELS);
  }
}

export const vertexAI = new VertexAIClient();
