/**
 * Chat API Route — Unified LLM Gateway + Agent Orchestrator
 *
 * THREE execution paths:
 *   1. Agent dispatch: message classified as actionable → /acheevy/execute → orchestrator
 *      → II-Agent / A2A agents / n8n / OpenClaw → structured response
 *   2. LLM stream:    conversational message → /llm/stream → Vertex AI / OpenRouter
 *      → SSE text stream (metered through LUC)
 *   3. Direct fallback: gateway unreachable → Vercel AI SDK → OpenRouter
 *
 * The classify step calls /acheevy/classify to determine intent.
 * If requiresAgent=true, we dispatch to the orchestrator.
 * If requiresAgent=false, we stream via the LLM gateway.
 *
 * Feature LLM: Claude Opus 4.6
 * Priority Models: Qwen, Minimax, GLM, Kimi, WAN, Nano Banana Pro
 */

import { streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { buildSystemPrompt } from '@/lib/acheevy/persona';

export const maxDuration = 120;

// ── UEF Gateway (primary — metered through LUC) ─────────────
const UEF_GATEWAY_URL = process.env.UEF_GATEWAY_URL || process.env.NEXT_PUBLIC_UEF_GATEWAY_URL || '';
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || '';

// ── OpenRouter (fallback — direct, unmetered) ───────────────
const openrouter = createOpenAI({
  apiKey: process.env.OPENROUTER_API_KEY || '',
  baseURL: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
  headers: {
    'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://plugmein.cloud',
    'X-Title': 'A.I.M.S. AI Managed Solutions',
  },
});

// ── Feature LLM ─────────────────────────────────────────────
const DEFAULT_MODEL = process.env.ACHEEVY_MODEL || 'anthropic/claude-opus-4.6';

// ── Priority Model Roster (all accessible via OpenRouter) ───
const PRIORITY_MODELS: Record<string, { id: string; label: string; provider: string }> = {
  'claude-opus':    { id: 'anthropic/claude-opus-4.6',        label: 'Claude Opus 4.6',      provider: 'Anthropic' },
  'claude-sonnet':  { id: 'anthropic/claude-sonnet-4.6',      label: 'Claude Sonnet 4.6',    provider: 'Anthropic' },
  'qwen':           { id: 'qwen/qwen-2.5-coder-32b',         label: 'Qwen 2.5 Coder 32B',  provider: 'Qwen' },
  'qwen-max':       { id: 'qwen/qwen-max',                   label: 'Qwen Max',             provider: 'Qwen' },
  'minimax':        { id: 'minimax/minimax-01',               label: 'MiniMax-01',           provider: 'MiniMax' },
  'glm':            { id: 'thudm/glm-4-32b',                 label: 'GLM-4 32B',            provider: 'Zhipu' },
  'kimi':           { id: 'moonshot/kimi-k2.5',               label: 'Kimi K2.5',            provider: 'Moonshot' },
  'wan':            { id: 'alibaba/wan-2.1-t2v-turbo',        label: 'WAN 2.1',              provider: 'Alibaba' },
  'nano-banana':    { id: 'google/gemini-2.5-flash',          label: 'Nano Banana Pro',      provider: 'Google' },
  'gemini-flash':   { id: 'google/gemini-2.5-flash',          label: 'Gemini 2.5 Flash',     provider: 'Google' },
  'gemini-pro':     { id: 'google/gemini-2.5-pro',            label: 'Gemini 2.5 Pro',       provider: 'Google' },
};

function resolveModelId(model?: string): string {
  if (model && PRIORITY_MODELS[model]) return PRIORITY_MODELS[model].id;
  if (model && model.includes('/')) return model;
  return DEFAULT_MODEL;
}

// ── Headers helper ──────────────────────────────────────────
function gatewayHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (INTERNAL_API_KEY) headers['X-API-Key'] = INTERNAL_API_KEY;
  return headers;
}

// ---------------------------------------------------------------------------
// Step 1: Classify intent — determines if we need agent dispatch or LLM chat
// ---------------------------------------------------------------------------

interface ClassifyResult {
  intent: string;
  confidence: number;
  requiresAgent: boolean;
}

async function classifyIntent(lastMessage: string): Promise<ClassifyResult | null> {
  if (!UEF_GATEWAY_URL) return null;

  try {
    const res = await fetch(`${UEF_GATEWAY_URL}/acheevy/classify`, {
      method: 'POST',
      headers: gatewayHeaders(),
      body: JSON.stringify({ message: lastMessage }),
    });

    if (!res.ok) return null;
    return await res.json() as ClassifyResult;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Path A: Agent dispatch — for actionable intents (build, research, verticals)
// ---------------------------------------------------------------------------

async function tryAgentDispatch(
  lastMessage: string,
  classification: ClassifyResult,
  conversationHistory: Array<{ role: string; content: string }>,
): Promise<Response | null> {
  if (!UEF_GATEWAY_URL) return null;

  try {
    const res = await fetch(`${UEF_GATEWAY_URL}/acheevy/execute`, {
      method: 'POST',
      headers: gatewayHeaders(),
      body: JSON.stringify({
        userId: 'web-user',
        message: lastMessage,
        intent: classification.intent,
        conversationId: 'chat-ui',
        context: {
          history: conversationHistory.slice(-6), // last 6 messages for context
          classification,
        },
      }),
    });

    if (!res.ok) return null;

    const result = await res.json();

    // Format orchestrator response as Vercel AI SDK text stream
    const reply = result.reply || 'Task received. Processing...';
    const meta = [];
    if (result.taskId) meta.push(`Task ID: ${result.taskId}`);
    if (result.status) meta.push(`Status: ${result.status}`);
    if (result.data?.pipelineSteps) meta.push(`Pipeline: ${result.data.pipelineSteps.length} steps`);
    if (result.lucUsage) meta.push(`LUC: ${result.lucUsage.amount} ${result.lucUsage.service}`);

    const fullReply = meta.length > 0
      ? `${reply}\n\n---\n*${meta.join(' | ')}*`
      : reply;

    // Emit as Vercel AI SDK text stream format (single-shot)
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(`0:${JSON.stringify(fullReply)}\n`));
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-ACHEEVY-Intent': classification.intent,
        'X-ACHEEVY-Agent': 'true',
      },
    });
  } catch (err) {
    console.warn('[ACHEEVY Chat] Agent dispatch failed:', err instanceof Error ? err.message : err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Path B: LLM stream — for conversational messages
// ---------------------------------------------------------------------------

async function tryGatewayStream(
  modelId: string,
  messages: Array<{ role: string; content: string }>,
  systemPrompt: string,
): Promise<Response | null> {
  if (!UEF_GATEWAY_URL) return null;

  try {
    const gatewayMessages = [
      { role: 'system', content: systemPrompt },
      ...messages,
    ];

    const res = await fetch(`${UEF_GATEWAY_URL}/llm/stream`, {
      method: 'POST',
      headers: gatewayHeaders(),
      body: JSON.stringify({
        model: modelId,
        messages: gatewayMessages,
        agentId: 'acheevy-chat',
        userId: 'web-user',
        sessionId: 'chat-ui',
      }),
    });

    if (!res.ok || !res.body) return null;

    // Transform gateway SSE format to Vercel AI SDK format
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    const reader = res.body.getReader();

    const stream = new ReadableStream({
      async pull(controller) {
        const { done, value } = await reader.read();
        if (done) {
          controller.close();
          return;
        }
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]') { controller.close(); return; }
          try {
            const parsed = JSON.parse(data);
            if (parsed.text) {
              // Emit as Vercel AI SDK text stream format
              controller.enqueue(encoder.encode(`0:${JSON.stringify(parsed.text)}\n`));
            }
          } catch { /* skip malformed */ }
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-LLM-Provider': res.headers.get('X-LLM-Provider') || 'gateway',
        'X-LLM-Model': res.headers.get('X-LLM-Model') || modelId,
      },
    });
  } catch (err) {
    console.warn('[ACHEEVY Chat] Gateway unreachable, falling back to direct OpenRouter:', err instanceof Error ? err.message : err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// POST handler — the unified entry point
// ---------------------------------------------------------------------------

export async function POST(req: Request) {
  try {
    const { messages, model, personaId } = await req.json();
    const modelId = resolveModelId(model);
    const systemPrompt = buildSystemPrompt({ personaId, additionalContext: 'User is using the Chat Interface.' });

    // Get the last user message for classification
    const lastUserMessage = [...messages].reverse().find((m: { role: string }) => m.role === 'user');
    const lastMessage = lastUserMessage?.content || '';

    // Step 1: Classify intent via gateway
    const classification = await classifyIntent(lastMessage);

    // Step 2: If agent dispatch is needed, route to orchestrator
    if (classification?.requiresAgent && classification.confidence > 0.6) {
      console.log(`[ACHEEVY Chat] Agent dispatch: intent=${classification.intent} confidence=${classification.confidence}`);
      const agentResponse = await tryAgentDispatch(lastMessage, classification, messages);
      if (agentResponse) return agentResponse;
      // If agent dispatch fails, fall through to LLM stream
      console.warn('[ACHEEVY Chat] Agent dispatch failed, falling through to LLM stream');
    }

    // Step 3: LLM stream via UEF Gateway (metered, Vertex AI + OpenRouter)
    const gatewayResponse = await tryGatewayStream(modelId, messages, systemPrompt);
    if (gatewayResponse) return gatewayResponse;

    // Step 4: Direct OpenRouter via Vercel AI SDK (fallback)
    const result = await streamText({
      model: openrouter(modelId),
      system: systemPrompt,
      messages,
    });

    return result.toAIStreamResponse();
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Chat API error';
    console.error('[ACHEEVY Chat]', message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
