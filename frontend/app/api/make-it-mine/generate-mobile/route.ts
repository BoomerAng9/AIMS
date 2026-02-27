/**
 * M.I.M. Mobile App Code Generation API — A.I.M.S.
 *
 * POST /api/make-it-mine/generate-mobile
 * Body: { prompt, code?, model?, platform? }
 * Returns: Streaming text response with generated mobile-optimised HTML/PWA
 *
 * Generates progressive web app code that looks and behaves like a native
 * mobile app — with touch gestures, bottom nav, splash screens, etc.
 * Output is a single self-contained HTML file viewable in a mobile frame.
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

const SYSTEM_PROMPT = `You are an expert mobile app developer. You create single-file Progressive Web App (PWA) prototypes using HTML, CSS, and JavaScript that look and behave like native mobile apps.

RULES:
1. Return ONLY the raw HTML code — no markdown fences, no explanations, no \`\`\`html wrapper.
2. Use Tailwind CSS via CDN: <script src="https://cdn.tailwindcss.com"></script>
3. For icons use Lucide Icons CDN: <script src="https://unpkg.com/lucide@latest"></script>
4. For fonts use Google Fonts (Inter or SF Pro-like font).
5. CRITICAL: Design for MOBILE FIRST (375px viewport). Use mobile-native UI patterns.
6. Include a PWA manifest meta tag and mobile viewport meta tag.
7. All interactive features must work with vanilla JavaScript — no frameworks.
8. The page must be fully self-contained in one HTML file.

MOBILE-NATIVE PATTERNS TO USE:
- Bottom tab bar navigation (fixed, with icons + labels)
- iOS/Android-style header bars with back buttons
- Pull-to-refresh gesture simulation
- Card-based layouts with rounded corners (16-20px)
- Touch-friendly buttons (min 44x44px tap targets)
- Slide-in drawers / bottom sheets
- Status bar area padding (safe-area-inset-top)
- Swipeable cards where appropriate
- Native-looking toggle switches, segmented controls
- Smooth page transitions (slide left/right)
- Use env(safe-area-inset-*) CSS for notch/island devices
- System-style fonts and spacing

DESIGN PRINCIPLES:
- Use a clean, modern mobile design language (think iOS 18 / Material Design 3)
- Subtle shadows, clean typography, generous spacing
- Professional color palette with one accent color
- Support both light and dark mode via prefers-color-scheme
- Haptic-like visual feedback on taps (scale transforms)
- Skeleton loading states for realistic feel
- Images via https://picsum.photos/ or SVG placeholders

When asked to MODIFY existing code:
- Return the COMPLETE updated HTML file, not just changed parts.
- Preserve all existing functionality unless explicitly asked to change it.

When the user describes an app:
- Create a multi-screen prototype with realistic content and navigation.
- Include at least 2-3 navigable screens via tabs or routing.
- Make it look like a real App Store / Play Store quality app.`;

const EDIT_SYSTEM_PROMPT = `You are an expert mobile app developer helping modify an existing Progressive Web App prototype.

The user has an existing HTML file and wants changes. You MUST:
1. Return the COMPLETE updated HTML file with all modifications applied.
2. DO NOT return partial code, diffs, or explanations — only the full HTML.
3. Preserve ALL existing functionality unless the user explicitly asks to remove something.
4. Keep the same mobile design language, colors, and navigation structure.
5. No markdown fences, no \`\`\`html wrapper — just raw HTML.
6. Maintain mobile-first design patterns (bottom nav, safe areas, touch targets).`;

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
    console.error('[MIM:generate-mobile] Error:', err);
    const message = err instanceof Error ? err.message : 'Generation failed';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
}
