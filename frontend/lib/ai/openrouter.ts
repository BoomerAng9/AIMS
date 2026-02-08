/**
 * OpenRouter AI Client
 *
 * Uses the Vercel AI SDK with OpenRouter as the unified model gateway.
 * Supports Claude, GPT-4, Gemini, Kimi, and other models.
 */

import { createOpenAI } from '@ai-sdk/openai';
import { streamText, generateText, generateObject } from 'ai';
import { z } from 'zod';

// ─────────────────────────────────────────────────────────────
// OpenRouter Configuration
// ─────────────────────────────────────────────────────────────

const openrouter = createOpenAI({
  apiKey: process.env.OPENROUTER_API_KEY || '',
  baseURL: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
  headers: {
    'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://aims.app',
    'X-Title': 'A.I.M.S. AI Managed Solutions',
  },
});

// ─────────────────────────────────────────────────────────────
// Model Registry
// ─────────────────────────────────────────────────────────────

export const MODELS = {
  // ── Claude (Anthropic) — 2025-2026 Lineup ──────────────────
  'claude-opus-4.6': 'anthropic/claude-opus-4-6',
  'claude-opus-4.5': 'anthropic/claude-opus-4-5-20250929',
  'claude-sonnet-4.5': 'anthropic/claude-sonnet-4-5-20250929',
  'claude-haiku-4.5': 'anthropic/claude-haiku-4-5-20251001',

  // ── GPT (OpenAI) ──────────────────────────────────────────
  'gpt-5.2': 'openai/gpt-5.2',
  'gpt-5.1': 'openai/gpt-5.1',
  'gpt-4.1': 'openai/gpt-4.1',
  'gpt-4.1-mini': 'openai/gpt-4.1-mini',

  // ── Gemini (Google) ────────────────────────────────────────
  'gemini-3-pro': 'google/gemini-3-pro-preview',
  'gemini-2.5-flash': 'google/gemini-2.5-flash-preview',
  'gemini-2.5-pro': 'google/gemini-2.5-pro-preview',

  // ── Kimi (Moonshot) ────────────────────────────────────────
  'kimi-k2.5': 'moonshot/kimi-k2.5',

  // ── Open Source ────────────────────────────────────────────
  'llama-4-maverick': 'meta-llama/llama-4-maverick',
  'deepseek-v3.2': 'deepseek/deepseek-v3.2',
  'deepseek-r1': 'deepseek/deepseek-r1',

  // ── Specialized ────────────────────────────────────────────
  'codestral': 'mistralai/codestral-latest',
  'perplexity-online': 'perplexity/sonar-pro',
} as const;

export type ModelId = keyof typeof MODELS;

// ─────────────────────────────────────────────────────────────
// Use Case Model Selection
// ─────────────────────────────────────────────────────────────

export const MODEL_FOR_USE_CASE = {
  // Default conversational
  default: MODELS['claude-sonnet-4.5'],

  // Fast responses
  fast: MODELS['gemini-2.5-flash'],

  // Vision / Image Analysis
  vision: MODELS['claude-opus-4.6'],

  // Code generation
  code: MODELS['claude-opus-4.6'],

  // Research / Search
  research: MODELS['perplexity-online'],

  // Long context (1M+ tokens)
  longContext: MODELS['gemini-2.5-pro'],

  // Cost-effective
  budget: MODELS['claude-haiku-4.5'],

  // Premium reasoning
  premium: MODELS['claude-opus-4.6'],
} as const;

// ─────────────────────────────────────────────────────────────
// Streaming Chat
// ─────────────────────────────────────────────────────────────

export interface StreamChatOptions {
  model?: ModelId | string;
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  onToken?: (token: string) => void;
  onComplete?: (text: string) => void;
  signal?: AbortSignal;
}

export async function streamChat(options: StreamChatOptions) {
  const {
    model = 'claude-sonnet-4.5',
    messages,
    systemPrompt,
    temperature = 0.7,
    maxTokens = 4096,
    signal,
  } = options;

  const modelId = MODELS[model as ModelId] || model;

  const result = await streamText({
    model: openrouter(modelId) as any,
    messages: systemPrompt
      ? [{ role: 'system', content: systemPrompt }, ...messages]
      : messages,
    temperature,
    maxTokens,
    abortSignal: signal,
  });

  return result;
}

// ─────────────────────────────────────────────────────────────
// Generate Text (Non-streaming)
// ─────────────────────────────────────────────────────────────

export interface GenerateOptions {
  model?: ModelId | string;
  prompt: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
}

export async function generate(options: GenerateOptions) {
  const {
    model = 'claude-sonnet-4.5',
    prompt,
    systemPrompt,
    temperature = 0.7,
    maxTokens = 4096,
  } = options;

  const modelId = MODELS[model as ModelId] || model;

  const result = await generateText({
    model: openrouter(modelId) as any,
    prompt,
    system: systemPrompt,
    temperature,
    maxTokens,
  });

  return result.text;
}

// ─────────────────────────────────────────────────────────────
// Structured Output (with Zod schema)
// ─────────────────────────────────────────────────────────────

export async function generateStructured<T>(
  options: GenerateOptions & { schema: z.ZodSchema<T> }
): Promise<T> {
  const {
    model = 'claude-sonnet-4.5',
    prompt,
    systemPrompt,
    schema,
    temperature = 0.3,
    maxTokens = 4096,
  } = options;

  const modelId = MODELS[model as ModelId] || model;

  const result = await generateObject({
    model: openrouter(modelId) as any,
    prompt,
    system: systemPrompt,
    schema,
    temperature,
    maxTokens,
  });

  return result.object;
}

// ─────────────────────────────────────────────────────────────
// Vision / Image Analysis
// ─────────────────────────────────────────────────────────────

export interface VisionOptions {
  model?: ModelId | string;
  images: Array<{ url: string } | { base64: string; mimeType: string }>;
  prompt: string;
  systemPrompt?: string;
}

export async function analyzeImage(options: VisionOptions) {
  const {
    model = 'claude-sonnet-4.5',
    images,
    prompt,
    systemPrompt,
  } = options;

  const modelId = MODELS[model as ModelId] || model;

  // Build message content with images
  const imageContent = images.map(img => {
    if ('url' in img) {
      return { type: 'image' as const, image: img.url };
    }
    return {
      type: 'image' as const,
      image: `data:${img.mimeType};base64,${img.base64}`,
    };
  });

  const result = await generateText({
    model: openrouter(modelId) as any,
    messages: [
      ...(systemPrompt ? [{ role: 'system' as const, content: systemPrompt }] : []),
      {
        role: 'user' as const,
        content: [
          ...imageContent,
          { type: 'text' as const, text: prompt },
        ],
      },
    ],
  });

  return result.text;
}

// ─────────────────────────────────────────────────────────────
// Token Counting (Estimate)
// ─────────────────────────────────────────────────────────────

export function estimateTokens(text: string): number {
  // Rough estimate: ~4 characters per token
  return Math.ceil(text.length / 4);
}

// ─────────────────────────────────────────────────────────────
// Model Cost Estimation
// ─────────────────────────────────────────────────────────────

const MODEL_COSTS: Record<string, { input: number; output: number }> = {
  // Claude 4.5/4.6 family (per 1K tokens)
  'anthropic/claude-opus-4-6': { input: 0.005, output: 0.025 },
  'anthropic/claude-opus-4-5-20250929': { input: 0.005, output: 0.025 },
  'anthropic/claude-sonnet-4-5-20250929': { input: 0.003, output: 0.015 },
  'anthropic/claude-haiku-4-5-20251001': { input: 0.0008, output: 0.004 },
  // GPT-5.x family
  'openai/gpt-5.2': { input: 0.005, output: 0.020 },
  'openai/gpt-5.1': { input: 0.003, output: 0.012 },
  'openai/gpt-4.1': { input: 0.002, output: 0.008 },
  'openai/gpt-4.1-mini': { input: 0.0004, output: 0.0016 },
  // Gemini
  'google/gemini-3-pro-preview': { input: 0.00125, output: 0.010 },
  'google/gemini-2.5-flash-preview': { input: 0.0003, output: 0.0025 },
  'google/gemini-2.5-pro-preview': { input: 0.00125, output: 0.010 },
  // Economy
  'deepseek/deepseek-v3.2': { input: 0.0003, output: 0.00088 },
};

export function estimateCost(
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  const costs = MODEL_COSTS[model] || { input: 0.01, output: 0.03 };
  return (
    (inputTokens / 1000) * costs.input +
    (outputTokens / 1000) * costs.output
  );
}

export default {
  streamChat,
  generate,
  generateStructured,
  analyzeImage,
  estimateTokens,
  estimateCost,
  MODELS,
  MODEL_FOR_USE_CASE,
};
