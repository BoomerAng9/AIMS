/**
 * Chat API Route — Unified LLM Gateway + Agent Orchestrator
 *
 * THREE execution paths:
 *   1. Agent dispatch: message classified as actionable → /acheevy/execute → orchestrator
 *      → II-Agent / A2A agents / n8n → structured response
 *   2. LLM stream:    conversational message → /llm/stream → Vertex AI / OpenRouter
 *      → SSE text stream (metered through LUC)
 *   3. Direct fallback: gateway unreachable → Vercel AI SDK → OpenRouter
 *
 * The classify step calls /acheevy/classify to determine intent.
 * If requiresAgent=true, we dispatch to the orchestrator.
 * If requiresAgent=false, we stream via the LLM gateway.
 *
 * Feature LLM: Claude Opus 4.6
 * Priority Models: Qwen, Minimax, GLM-5, Kimi, WAN, Nano Banana Pro
 */

import { streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { buildSystemPrompt } from '@/lib/acheevy/persona';

// Vercel Hobby plan caps at 60s; Pro allows up to 300s.
// Use 60 for broad compatibility — upgrade to 300 on Pro plan.
export const maxDuration = 60;

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
const DEFAULT_MODEL = process.env.ACHEEVY_MODEL || process.env.OPENROUTER_MODEL || 'google/gemini-2.5-flash';

// ── Priority Model Roster (all accessible via OpenRouter) ───
// Model IDs must match OpenRouter's catalog exactly (use dashes, not dots for versions)
const PRIORITY_MODELS: Record<string, { id: string; label: string; provider: string }> = {
  'claude-opus':    { id: 'anthropic/claude-opus-4-6',        label: 'Claude Opus 4.6',      provider: 'Anthropic' },
  'claude-sonnet':  { id: 'anthropic/claude-sonnet-4-5-20250929', label: 'Claude Sonnet 4.5', provider: 'Anthropic' },
  'qwen':           { id: 'qwen/qwen-2.5-coder-32b-instruct', label: 'Qwen 2.5 Coder 32B', provider: 'Qwen' },
  'qwen-max':       { id: 'qwen/qwen-max',                   label: 'Qwen Max',             provider: 'Qwen' },
  'minimax':        { id: 'minimax/minimax-01',               label: 'MiniMax-01',           provider: 'MiniMax' },
  'glm':            { id: 'thudm/glm-4-plus',                label: 'GLM-4 Plus',           provider: 'Zhipu' },
  'kimi':           { id: 'moonshotai/moonshot-v1-auto',      label: 'Moonshot v1',          provider: 'Moonshot' },
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
  userId: string,
): Promise<Response | null> {
  if (!UEF_GATEWAY_URL) return null;

  try {
    const res = await fetch(`${UEF_GATEWAY_URL}/acheevy/execute`, {
      method: 'POST',
      headers: gatewayHeaders(),
      body: JSON.stringify({
        userId,
        message: lastMessage,
        intent: classification.intent,
        conversationId: `session-${userId}`,
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
  userId: string,
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
        userId,
        sessionId: `session-${userId}`,
        // Conversational chat → MEDIUM thinking (balanced quality/cost).
        // Model Intelligence auto-selects for agent dispatch; here we set explicitly
        // because this is the direct LLM stream path (not via agentChat()).
        thinking_level: 'medium',
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
// Memory recall — fetch relevant context from the memory system
// ---------------------------------------------------------------------------

async function recallMemories(message: string, userId: string): Promise<string> {
  if (!UEF_GATEWAY_URL) return '';

  try {
    const res = await fetch(`${UEF_GATEWAY_URL}/memory/recall`, {
      method: 'POST',
      headers: gatewayHeaders(),
      body: JSON.stringify({
        userId,
        query: message,
        limit: 5,
        minRelevance: 0.3,
      }),
    });

    if (!res.ok) return '';

    const result = await res.json();
    if (!result.memories || result.memories.length === 0) return '';

    const lines = result.memories.map((s: any, i: number) => {
      const m = s.memory;
      const typeLabel = (m.type || '').replace(/_/g, ' ');
      return `  ${i + 1}. [${typeLabel}] ${m.summary}`;
    });

    return [
      '--- ACHEEVY Memory Context ---',
      `Recalled ${result.memories.length} relevant memories:`,
      ...lines,
      '--- End Memory Context ---',
    ].join('\n');
  } catch {
    return '';
  }
}

// ---------------------------------------------------------------------------
// Local M.I.M. Intent Detection — routes build/validate intents to builders
// ---------------------------------------------------------------------------

interface MIMDetection {
  type: 'idea-validation' | 'build-web' | 'build-mobile' | 'build-automation' | 'deep-scout' | null;
  confidence: number;
}

function detectMIMIntent(message: string): MIMDetection {
  const lower = message.toLowerCase();

  // Idea validation patterns
  const ideaPatterns = [
    /\b(validate|test|check|assess|evaluate)\b.*\b(idea|concept|business|startup)\b/,
    /\bi have (an? )?idea\b/,
    /\b(is this|would this|could this)\b.*\b(work|viable|good idea)\b/,
    /\b(idea validation|validate my idea)\b/,
    /\bwhat do you think (about|of)\b.*\b(idea|concept|app|business)\b/,
  ];

  // Build/create patterns
  const buildWebPatterns = [
    /\b(build|create|make|generate)\b.*\b(website|web app|web page|landing page|webapp|site)\b/,
    /\b(website|web app|landing page)\b.*\b(for me|for my|that)\b/,
  ];

  const buildMobilePatterns = [
    /\b(build|create|make|generate)\b.*\b(mobile app|ios app|android app|phone app|app)\b/,
    /\b(mobile|ios|android)\b.*\b(app|application)\b/,
  ];

  const buildAutomationPatterns = [
    /\b(build|create|make|set up|automate)\b.*\b(automation|workflow|pipeline|integration)\b/,
    /\b(automate|connect|integrate)\b.*\b(when|every|if)\b/,
    /\b(n8n|zapier|make\.com)\b.*\b(workflow|automation)\b/,
  ];

  const deepScoutPatterns = [
    /\b(research|investigate|analyse|analyze|scout|explore)\b.*\b(market|industry|competitor|niche)\b/,
    /\bdeep (scout|research|dive)\b/,
    /\b(market research|competitor analysis|industry analysis)\b/,
  ];

  for (const p of ideaPatterns) {
    if (p.test(lower)) return { type: 'idea-validation', confidence: 0.85 };
  }
  for (const p of deepScoutPatterns) {
    if (p.test(lower)) return { type: 'deep-scout', confidence: 0.85 };
  }
  for (const p of buildMobilePatterns) {
    if (p.test(lower)) return { type: 'build-mobile', confidence: 0.8 };
  }
  for (const p of buildAutomationPatterns) {
    if (p.test(lower)) return { type: 'build-automation', confidence: 0.8 };
  }
  for (const p of buildWebPatterns) {
    if (p.test(lower)) return { type: 'build-web', confidence: 0.8 };
  }

  return { type: null, confidence: 0 };
}

function buildMIMResponse(detection: MIMDetection, originalMessage: string): string | null {
  switch (detection.type) {
    case 'idea-validation':
      return `I can help validate that idea. I've got a full 4-step validation pipeline ready — it covers clarity, gap analysis, audience resonance, and expert perspective.\n\n**→ [Open Deep Scout](/dashboard/deep-scout)** to run the full validation\n\nOr describe your idea right here and I'll give you quick initial feedback.`;

    case 'deep-scout':
      return `My research engine is ready. Deep Scout runs competitive analysis, market research, and opportunity mapping.\n\n**→ [Open Deep Scout](/dashboard/deep-scout)** for the full research pipeline\n\nI can also do a quick analysis right here if you tell me more about what you want to explore.`;

    case 'build-web':
      return `Let's build it. I have a full web app builder with live preview, multi-model support, and iterative editing.\n\n**→ [Open Web App Builder](/dashboard/make-it-mine/web-app)** for the full build experience\n\nOr describe exactly what you need and I'll get started.`;

    case 'build-mobile':
      return `Mobile app — got it. I'll generate a native-looking PWA prototype with bottom nav, touch gestures, and mobile-first design.\n\n**→ [Open Mobile App Builder](/dashboard/make-it-mine/mobile-app)** for the full build experience with phone frame preview\n\nDescribe your app concept and I can start building.`;

    case 'build-automation':
      return `Workflow automation ready. I'll create a visual workflow with triggers, actions, conditions, and connections.\n\n**→ [Open Automation Builder](/dashboard/make-it-mine/automation)** for the visual workflow builder\n\nTell me what you want to automate and I'll map it out.`;

    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// POST handler — the unified entry point
// ---------------------------------------------------------------------------

export async function POST(req: Request) {
  try {
    const { messages, model, personaId, userId: bodyUserId } = await req.json();

    // Derive userId: body > cookie > header > anon fallback
    const userId = bodyUserId
      || req.headers.get('x-user-id')
      || `anon-${req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'}`;
    const modelId = resolveModelId(model);

    // Get the last user message for classification
    const lastUserMessage = [...messages].reverse().find((m: { role: string }) => m.role === 'user');
    const lastMessage = lastUserMessage?.content || '';

    // Step 0: Local M.I.M. intent detection — fast-path for build/validate intents
    const mimDetection = detectMIMIntent(lastMessage);
    if (mimDetection.type && mimDetection.confidence > 0.7) {
      const mimResponse = buildMIMResponse(mimDetection, lastMessage);
      if (mimResponse) {
        console.log(`[ACHEEVY Chat] M.I.M. intent detected: ${mimDetection.type} (${mimDetection.confidence})`);
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
          start(controller) {
            controller.enqueue(encoder.encode(`0:${JSON.stringify(mimResponse)}\n`));
            controller.close();
          },
        });
        return new Response(stream, {
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'X-ACHEEVY-Intent': `mim:${mimDetection.type}`,
            'X-ACHEEVY-MIM': 'true',
          },
        });
      }
    }

    // Memory recall: fetch relevant memories for this user's message
    const memoryContext = await recallMemories(lastMessage, userId);

    const systemPrompt = buildSystemPrompt({
      personaId,
      additionalContext: memoryContext
        ? `User is using the Chat Interface.\n\n${memoryContext}`
        : 'User is using the Chat Interface.',
    });

    // Step 1: Classify intent via gateway
    const classification = await classifyIntent(lastMessage);

    // Step 2: If agent dispatch is needed, route to orchestrator
    if (classification?.requiresAgent && classification.confidence > 0.6) {
      console.log(`[ACHEEVY Chat] Agent dispatch: intent=${classification.intent} confidence=${classification.confidence}`);
      const agentResponse = await tryAgentDispatch(lastMessage, classification, messages, userId);
      if (agentResponse) return agentResponse;
      // If agent dispatch fails, fall through to LLM stream
      console.warn('[ACHEEVY Chat] Agent dispatch failed, falling through to LLM stream');
    }

    // Step 3: LLM stream via UEF Gateway (metered, Vertex AI + OpenRouter)
    const gatewayResponse = await tryGatewayStream(modelId, messages, systemPrompt, userId);
    if (gatewayResponse) return gatewayResponse;

    // Step 4: Direct OpenRouter via Vercel AI SDK (fallback)
    const result = await streamText({
      model: openrouter(modelId),
      system: systemPrompt,
      messages,
    });

    return result.toDataStreamResponse();
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Chat API error';
    console.error('[ACHEEVY Chat]', message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
