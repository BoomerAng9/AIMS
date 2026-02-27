/**
 * M.I.M. AI Code Generation API — A.I.M.S. Web App Builder
 *
 * POST /api/make-it-mine/generate
 * Body: { prompt, code?, model?, history? }
 * Returns: Streaming text response with generated HTML/CSS/JS
 *
 * Powered by OpenRouter (multi-model).
 * Full HTML generation + iterative editing via ACHEEVY.
 */

import { NextRequest } from 'next/server';
import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';

// ── LLM Provider ──
const openrouter = createOpenAI({
  apiKey: process.env.OPENROUTER_API_KEY || '',
  baseURL: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
});

// ── Supported Models ──
const MODELS: Record<string, string> = {
  'deepseek-v3': 'deepseek/deepseek-chat',
  'qwen3-coder': 'qwen/qwen3-coder',
  'gemini-flash': 'google/gemini-2.5-flash',
  'claude-sonnet': 'anthropic/claude-sonnet-4',
  'gpt-4.1-mini': 'openai/gpt-4.1-mini',
};

const DEFAULT_MODEL = 'deepseek-v3';

// ── System Prompt ──
const SYSTEM_PROMPT = `You are an expert web developer. You create single-file web applications using HTML, CSS, and JavaScript.

RULES:
1. Return ONLY the raw HTML code — no markdown fences, no explanations, no \`\`\`html wrapper.
2. Use Tailwind CSS via CDN: <script src="https://cdn.tailwindcss.com"></script>
3. For icons use Lucide Icons CDN: <script src="https://unpkg.com/lucide@latest"></script>
4. For fonts use Google Fonts via <link> tag.
5. Make the design modern, clean, and responsive.
6. Use semantic HTML5 elements.
7. Include smooth transitions and hover effects where appropriate.
8. All interactive features must work with vanilla JavaScript — no frameworks needed.
9. The page must be fully self-contained in one HTML file.
10. Use a professional color palette. Prefer subtle gradients, glass-morphism, or clean flat design.
11. Images should use placeholder services like https://picsum.photos/ or SVG placeholders.

When asked to MODIFY existing code:
- Return the COMPLETE updated HTML file, not just the changed parts.
- Preserve all existing functionality unless explicitly asked to change it.
- Maintain the same design language and color palette.

When the user describes a product, website, or app:
- Create a fully functional prototype with realistic content.
- Include navigation, hero section, features, and footer where appropriate.
- Make it look like a real production website.`;

// ── Edit System Prompt (for follow-up modifications) ──
const EDIT_SYSTEM_PROMPT = `You are an expert web developer helping modify an existing web application.

The user has an existing HTML file and wants to make changes. You MUST:
1. Return the COMPLETE updated HTML file with all modifications applied.
2. DO NOT return partial code, diffs, or explanations — only the full HTML.
3. Preserve ALL existing functionality unless the user explicitly asks to remove something.
4. Keep the same design language, colors, and structure.
5. No markdown fences, no \`\`\`html wrapper — just raw HTML.`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      prompt,
      code,
      model = DEFAULT_MODEL,
      history = [],
    } = body as {
      prompt: string;
      code?: string;
      model?: string;
      history?: Array<{ role: 'user' | 'assistant'; content: string }>;
    };

    if (!prompt?.trim()) {
      return new Response(
        JSON.stringify({ error: 'Prompt is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // Select model
    const modelId = MODELS[model] || MODELS[DEFAULT_MODEL];

    // Build messages
    const isEdit = !!code;
    const systemPrompt = isEdit ? EDIT_SYSTEM_PROMPT : SYSTEM_PROMPT;

    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: systemPrompt },
    ];

    // Add conversation history for iterative editing
    if (history.length > 0) {
      for (const msg of history) {
        messages.push({ role: msg.role, content: msg.content });
      }
    }

    // Build the user message
    let userMessage = prompt;
    if (isEdit) {
      userMessage = `Here is the current HTML code:\n\n${code}\n\n---\n\nThe user wants to make these changes:\n${prompt}\n\nReturn the COMPLETE updated HTML file.`;
    }
    messages.push({ role: 'user', content: userMessage });

    // Stream the response
    const result = await streamText({
      model: openrouter(modelId),
      messages,
      maxTokens: 16384,
      temperature: 0.3,
    });

    return result.toDataStreamResponse();
  } catch (err: unknown) {
    console.error('[MIM:generate] Error:', err);
    const message = err instanceof Error ? err.message : 'Generation failed';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
}
