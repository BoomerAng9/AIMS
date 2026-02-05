/**
 * Streaming Chat API Route
 * Uses Server-Sent Events (SSE) for real-time streaming responses
 *
 * POST /api/chat
 * Body: { messages, model?, sessionId? }
 * Returns: text/event-stream
 */

import { NextRequest } from 'next/server';

const ACHEEVY_URL = process.env.ACHEEVY_URL || 'http://localhost:3003';

// Model routing
const MODEL_ENDPOINTS: Record<string, { url: string; key: string }> = {
  'kimi-k2.5': {
    url: 'https://api.moonshot.cn/v1/chat/completions',
    key: process.env.MOONSHOT_API_KEY || '',
  },
  'gemini-3-flash': {
    url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent',
    key: process.env.GOOGLE_AI_API_KEY || '',
  },
  'claude-opus-4.6': {
    url: 'https://api.anthropic.com/v1/messages',
    key: process.env.ANTHROPIC_API_KEY || '',
  },
};

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { messages, model = 'gemini-3-flash', sessionId } = body;

  // Create a readable stream for SSE
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Send to ACHEEVY first for intent analysis
        const acheevyResponse = await fetch(`${ACHEEVY_URL}/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            message: messages[messages.length - 1]?.content || '',
          }),
        }).catch(() => null);

        let acheevyData: any = null;
        if (acheevyResponse?.ok) {
          acheevyData = await acheevyResponse.json();
        }

        // Get the appropriate model endpoint
        const endpoint = MODEL_ENDPOINTS[model];

        if (!endpoint?.key) {
          // Fallback: Stream ACHEEVY's response or a default message
          const fallbackText = acheevyData?.reply ||
            "I'm ACHEEVY, your AI assistant. I'm here to help with your projects. What would you like to work on today?";

          // Simulate streaming by chunking the response
          const words = fallbackText.split(' ');
          for (let i = 0; i < words.length; i++) {
            const chunk = words[i] + (i < words.length - 1 ? ' ' : '');
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: chunk })}\n\n`));
            await new Promise(r => setTimeout(r, 30)); // 30ms per word
          }

          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
          return;
        }

        // Make streaming request to the model
        // Implementation varies by provider...

        // For Gemini (Google AI)
        if (model === 'gemini-3-flash') {
          await streamGemini(controller, encoder, messages, endpoint);
        }
        // For Claude (Anthropic)
        else if (model === 'claude-opus-4.6') {
          await streamClaude(controller, encoder, messages, endpoint);
        }
        // For Kimi (Moonshot)
        else if (model === 'kimi-k2.5') {
          await streamKimi(controller, encoder, messages, endpoint);
        }
        else {
          // Unknown model, use fallback
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: "Model not configured." })}\n\n`));
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        }

        controller.close();
      } catch (error: any) {
        console.error('[Chat API] Error:', error);
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: error.message })}\n\n`));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

// ─────────────────────────────────────────────────────────────
// Provider-Specific Streaming
// ─────────────────────────────────────────────────────────────

async function streamGemini(
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder,
  messages: any[],
  endpoint: { url: string; key: string }
) {
  const response = await fetch(`${endpoint.url}?key=${endpoint.key}&alt=sse`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: messages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      })),
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
      },
    }),
  });

  if (!response.ok || !response.body) {
    throw new Error(`Gemini API error: ${response.statusText}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split('\n');

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const data = JSON.parse(line.slice(6));
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: text })}\n\n`));
          }
        } catch {
          // Skip malformed JSON
        }
      }
    }
  }

  controller.enqueue(encoder.encode('data: [DONE]\n\n'));
}

async function streamClaude(
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder,
  messages: any[],
  endpoint: { url: string; key: string }
) {
  const response = await fetch(endpoint.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': endpoint.key,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      stream: true,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
    }),
  });

  if (!response.ok || !response.body) {
    throw new Error(`Claude API error: ${response.statusText}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split('\n');

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const data = JSON.parse(line.slice(6));
          if (data.type === 'content_block_delta') {
            const text = data.delta?.text;
            if (text) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: text })}\n\n`));
            }
          }
        } catch {
          // Skip
        }
      }
    }
  }

  controller.enqueue(encoder.encode('data: [DONE]\n\n'));
}

async function streamKimi(
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder,
  messages: any[],
  endpoint: { url: string; key: string }
) {
  const response = await fetch(endpoint.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${endpoint.key}`,
    },
    body: JSON.stringify({
      model: 'moonshot-v1-128k',
      messages,
      stream: true,
      temperature: 0.7,
    }),
  });

  if (!response.ok || !response.body) {
    throw new Error(`Kimi API error: ${response.statusText}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split('\n');

    for (const line of lines) {
      if (line.startsWith('data: ') && !line.includes('[DONE]')) {
        try {
          const data = JSON.parse(line.slice(6));
          const text = data.choices?.[0]?.delta?.content;
          if (text) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: text })}\n\n`));
          }
        } catch {
          // Skip
        }
      }
    }
  }

  controller.enqueue(encoder.encode('data: [DONE]\n\n'));
}
