// Blockwise AI — Mercury 2 LLM Client (Inception Labs)
// OpenAI-compatible API — 1,000 tok/sec, $0.25/$0.75 per 1M tokens

import OpenAI from 'openai';

const mercury = new OpenAI({
  apiKey: process.env.MERCURY_API_KEY || '',
  baseURL: process.env.MERCURY_API_URL || 'https://api.inceptionlabs.ai/v1',
});

export async function chatCompletion(
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
  options?: { temperature?: number; maxTokens?: number }
) {
  const response = await mercury.chat.completions.create({
    model: 'mercury-coder-small',
    messages,
    temperature: options?.temperature ?? 0.7,
    max_tokens: options?.maxTokens ?? 2048,
  });
  return response.choices[0]?.message?.content || '';
}

export async function streamChatCompletion(
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
  options?: { temperature?: number; maxTokens?: number }
) {
  return mercury.chat.completions.create({
    model: 'mercury-coder-small',
    messages,
    temperature: options?.temperature ?? 0.7,
    max_tokens: options?.maxTokens ?? 2048,
    stream: true,
  });
}

export { mercury };
