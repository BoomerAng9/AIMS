/**
 * M.I.M. Mobile App Generation API — A.I.M.S.
 *
 * POST /api/make-it-mine/mobile
 * Body: { prompt, code?, model?, framework?, history? }
 * Returns: Streaming text response with generated React Native / Flutter code
 *
 * Powered by OpenRouter (multi-model).
 */

import { NextRequest } from 'next/server';
import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';

const openrouter = createOpenAI({
  apiKey: process.env.OPENROUTER_API_KEY || '',
  baseURL: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
});

const MODELS: Record<string, string> = {
  'deepseek-v3': 'deepseek/deepseek-chat',
  'qwen3-coder': 'qwen/qwen3-coder',
  'gemini-flash': 'google/gemini-2.5-flash',
  'claude-sonnet': 'anthropic/claude-sonnet-4',
  'gpt-4.1-mini': 'openai/gpt-4.1-mini',
};

const DEFAULT_MODEL = 'qwen3-coder';

// ── React Native System Prompt ──
const RN_SYSTEM_PROMPT = `You are an expert React Native developer. You create mobile app screens using React Native with Expo.

RULES:
1. Return ONLY the raw TypeScript/JSX code — no markdown fences, no explanations.
2. Use React Native core components: View, Text, ScrollView, TouchableOpacity, TextInput, Image, FlatList, etc.
3. Use the StyleSheet API for styling — no external CSS.
4. Use @expo/vector-icons for icons (MaterialIcons, Ionicons, FontAwesome).
5. Export a single default React component that renders the complete screen.
6. Make the design modern, clean, and mobile-optimized.
7. Use proper spacing, shadows, and border radius for a polished native feel.
8. Include realistic placeholder content.
9. The code must be self-contained in one file — import only from react-native, expo, and @expo/vector-icons.
10. Use TypeScript with proper typing.
11. Support both iOS and Android with Platform-specific adjustments where needed.
12. Include proper SafeAreaView handling.
13. Use modern patterns: useState, useRef, useCallback, useMemo.
14. Color palette: Use a professional, modern palette. Prefer subtle gradients or clean flat colors.

When asked to MODIFY existing code:
- Return the COMPLETE updated file, not just changed parts.
- Preserve all existing functionality unless explicitly asked to change it.
- Maintain the same design language and color palette.

When the user describes an app:
- Create a fully functional screen with realistic content.
- Include navigation headers, tab bars, or bottom sheets where appropriate.
- Make it look like a real production app.`;

// ── Flutter System Prompt ──
const FLUTTER_SYSTEM_PROMPT = `You are an expert Flutter developer. You create mobile app screens using Flutter/Dart.

RULES:
1. Return ONLY the raw Dart code — no markdown fences, no explanations.
2. Use Material Design 3 widgets: Scaffold, AppBar, ListView, Card, ElevatedButton, etc.
3. Use the built-in Icons class for icons.
4. The file must contain a complete runnable widget with all necessary imports.
5. Make the design modern, clean, and mobile-optimized using Material 3 theming.
6. Use proper spacing, elevation, and border radius for a polished feel.
7. Include realistic placeholder content.
8. The code must be self-contained — import only from flutter SDK packages.
9. Use proper state management with StatefulWidget or hooks.
10. Color palette: Use ColorScheme.fromSeed() with a professional seed color.
11. Include proper SafeArea handling.
12. Support responsive layouts with MediaQuery and LayoutBuilder.

When asked to MODIFY existing code:
- Return the COMPLETE updated file, not just changed parts.
- Preserve all existing functionality unless explicitly asked to change it.

When the user describes an app:
- Create a fully functional screen with realistic content.
- Make it look like a real production app.`;

const EDIT_SYSTEM_PROMPT_RN = `You are an expert React Native developer helping modify an existing mobile app screen.

The user has existing code and wants changes. You MUST:
1. Return the COMPLETE updated file with all modifications.
2. DO NOT return partial code, diffs, or explanations — only the full code.
3. Preserve ALL existing functionality unless asked to remove it.
4. No markdown fences — just raw TypeScript/JSX.`;

const EDIT_SYSTEM_PROMPT_FLUTTER = `You are an expert Flutter developer helping modify an existing mobile app screen.

The user has existing code and wants changes. You MUST:
1. Return the COMPLETE updated Dart file with all modifications.
2. DO NOT return partial code, diffs, or explanations — only the full code.
3. Preserve ALL existing functionality unless asked to remove it.
4. No markdown fences — just raw Dart code.`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      prompt,
      code,
      model = DEFAULT_MODEL,
      framework = 'react-native',
      history = [],
    } = body as {
      prompt: string;
      code?: string;
      model?: string;
      framework?: 'react-native' | 'flutter';
      history?: Array<{ role: 'user' | 'assistant'; content: string }>;
    };

    if (!prompt?.trim()) {
      return new Response(
        JSON.stringify({ error: 'Prompt is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const modelId = MODELS[model] || MODELS[DEFAULT_MODEL];
    const isEdit = !!code;

    let systemPrompt: string;
    if (isEdit) {
      systemPrompt = framework === 'flutter' ? EDIT_SYSTEM_PROMPT_FLUTTER : EDIT_SYSTEM_PROMPT_RN;
    } else {
      systemPrompt = framework === 'flutter' ? FLUTTER_SYSTEM_PROMPT : RN_SYSTEM_PROMPT;
    }

    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: systemPrompt },
    ];

    if (history.length > 0) {
      for (const msg of history) {
        messages.push({ role: msg.role, content: msg.content });
      }
    }

    let userMessage = prompt;
    if (isEdit) {
      const lang = framework === 'flutter' ? 'Dart' : 'TypeScript/React Native';
      userMessage = `Here is the current ${lang} code:\n\n${code}\n\n---\n\nThe user wants these changes:\n${prompt}\n\nReturn the COMPLETE updated file.`;
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
    console.error('[MIM:mobile] Error:', err);
    const message = err instanceof Error ? err.message : 'Generation failed';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
}
