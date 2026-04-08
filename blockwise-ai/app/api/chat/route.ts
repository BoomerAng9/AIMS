import { NextRequest } from 'next/server';
import { streamChatCompletion } from '@/lib/mercury';

const SYSTEM_PROMPT = `You are ACHEEVY, the AI assistant for Blockwise AI — a neighborhood intelligence and real estate investment platform. You help real estate professionals:
- Find and analyze properties
- Understand neighborhoods deeply (Block Score, crime, schools, appreciation)
- Run flip calculations using the LUC Real Estate Calculator
- Generate K1 tax documents

Be conversational, knowledgeable about real estate investing, and concise. When a property is in context, reference it specifically. Use the 70% Rule, ARV analysis, and deal status terminology.`;

export async function POST(req: NextRequest) {
  const { messages, propertyContext } = await req.json();

  const systemMessages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...(propertyContext
      ? [{ role: 'system' as const, content: `Current property context: ${JSON.stringify(propertyContext)}` }]
      : []),
  ];

  const stream = await streamChatCompletion([...systemMessages, ...messages]);

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content || '';
        if (text) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
        }
      }
      controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      controller.close();
    },
  });

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
