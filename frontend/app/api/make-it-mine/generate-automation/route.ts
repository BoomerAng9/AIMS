/**
 * M.I.M. Automation Workflow Generation API — A.I.M.S.
 *
 * POST /api/make-it-mine/generate-automation
 * Body: { prompt, code?, model? }
 * Returns: Streaming text response with generated automation workflow HTML
 *
 * Generates visual workflow builder UIs + automation logic.
 * Output is a self-contained HTML file that visualises the workflow
 * with interactive nodes, connections, and configuration panels.
 */

import { NextRequest } from 'next/server';
import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';

const openrouter = createOpenAI({
  apiKey: process.env.OPENROUTER_API_KEY || '',
  baseURL: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
});

const MODELS: Record<string, string> = {
  'deepseek-v3':   'deepseek/deepseek-chat',
  'qwen3-coder':   'qwen/qwen3-coder',
  'gemini-flash':  'google/gemini-2.5-flash',
  'claude-sonnet': 'anthropic/claude-sonnet-4',
  'gpt-4.1-mini':  'openai/gpt-4.1-mini',
};

const DEFAULT_MODEL = 'deepseek-v3';

const SYSTEM_PROMPT = `You are an expert automation architect. You create visual workflow automation prototypes as single-file HTML applications.

RULES:
1. Return ONLY the raw HTML code — no markdown fences, no explanations, no \`\`\`html wrapper.
2. Use Tailwind CSS via CDN: <script src="https://cdn.tailwindcss.com"></script>
3. For icons use Lucide Icons CDN: <script src="https://unpkg.com/lucide@latest"></script>
4. For fonts use Google Fonts (Inter or Geist).
5. Make the design modern, dark-themed (#0A0A0B background), and professional.
6. All interactive features must work with vanilla JavaScript.
7. The page must be fully self-contained in one HTML file.

AUTOMATION VISUAL PATTERNS:
- Node-based workflow canvas with SVG connections between nodes
- Each node should have: icon, title, brief description, status indicator
- Node types: Trigger (green), Action (blue), Condition (amber), Output (purple)
- Curved SVG paths connecting nodes with animated flow dots
- Sidebar/panel showing node configuration when clicked
- Drag-to-reorder or click-to-select nodes
- Visual feedback: running (pulse animation), success (green check), error (red), pending (grey)
- Summary stats bar: total nodes, estimated run time, last run status

NODE CATEGORIES TO SUPPORT:
- Triggers: Webhook, Schedule/Cron, Email received, File uploaded, Database change, API event
- Actions: Send email, HTTP request, Database query, File operation, AI/LLM call, Slack message
- Conditions: If/else branch, Filter, Switch/router, Delay/wait, Loop
- Outputs: Save to database, Send notification, Generate report, Export CSV, Deploy

DESIGN PRINCIPLES:
- Dark minimal UI inspired by n8n, Zapier, Make.com
- Clean node cards with subtle glow on hover/select
- Bezier curve connections with animated gradient lines
- Configuration panel slides in from right when node selected
- Status timeline at bottom showing execution history
- Professional typography, plenty of spacing
- Gold accent (#F59E0B) for primary actions, emerald for success

When asked to MODIFY existing code:
- Return the COMPLETE updated HTML with all modifications.
- Preserve all existing nodes and connections unless asked to change.
- Maintain the same visual language.

When the user describes a workflow:
- Create a complete visual workflow with all necessary nodes.
- Include realistic configuration in node detail panels.
- Show sample data flow between nodes.
- Add execution simulation with animated flow indicators.`;

const EDIT_SYSTEM_PROMPT = `You are an expert automation architect helping modify an existing workflow visualisation.

The user has an existing HTML file and wants changes. You MUST:
1. Return the COMPLETE updated HTML file with all modifications applied.
2. DO NOT return partial code, diffs, or explanations — only the full HTML.
3. Preserve ALL existing nodes, connections, and functionality unless asked to remove them.
4. Keep the same dark design language and workflow canvas structure.
5. No markdown fences, no \`\`\`html wrapper — just raw HTML.`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      prompt,
      code,
      model = DEFAULT_MODEL,
    } = body as {
      prompt: string;
      code?: string;
      model?: string;
    };

    if (!prompt?.trim()) {
      return new Response(
        JSON.stringify({ error: 'Prompt is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const modelId = MODELS[model] || MODELS[DEFAULT_MODEL];
    const isEdit = !!code;
    const systemPrompt = isEdit ? EDIT_SYSTEM_PROMPT : SYSTEM_PROMPT;

    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: systemPrompt },
    ];

    let userMessage = prompt;
    if (isEdit) {
      userMessage = `Here is the current HTML code:\n\n${code}\n\n---\n\nThe user wants these changes:\n${prompt}\n\nReturn the COMPLETE updated HTML file.`;
    }
    messages.push({ role: 'user', content: userMessage });

    const result = await streamText({
      model: openrouter(modelId),
      messages,
      maxTokens: 16384,
      temperature: 0.3,
    });

    return result.toDataStreamResponse();
  } catch (err: unknown) {
    console.error('[MIM:generate-automation] Error:', err);
    const message = err instanceof Error ? err.message : 'Generation failed';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
}
