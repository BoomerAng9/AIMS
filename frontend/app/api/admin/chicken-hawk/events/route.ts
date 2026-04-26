// ⚡ Bolt Optimization: Define module-level ENCODER to prevent repeated instantiation
const ENCODER = new TextEncoder();

/**
 * Admin Chicken Hawk SSE Proxy
 *
 * OWNER-only SSE proxy that connects to chickenhawk-core:4001/events
 * and forwards the event stream to the browser.
 *
 * GET /api/admin/chicken-hawk/events → SSE stream
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

const CHICKENHAWK_URL = process.env.CHICKENHAWK_URL || 'http://chickenhawk-core:4001';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const role = (session.user as Record<string, unknown>).role;
  if (role !== 'OWNER') {
    return NextResponse.json(
      { error: 'Forbidden — OWNER role required', code: 'CHICKEN_HAWK_OWNER_ONLY' },
      { status: 403 },
    );
  }

  // Create a readable stream that proxies from Chicken Hawk
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const res = await fetch(`${CHICKENHAWK_URL}/events`, {
          signal: AbortSignal.timeout(300000), // 5 min max
        });

        if (!res.ok || !res.body) {
          controller.enqueue(
            ENCODER.encode(`data: ${JSON.stringify({ type: 'error', message: 'Chicken Hawk not reachable' })}\n\n`),
          );
          controller.close();
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          controller.enqueue(ENCODER.encode(decoder.decode(value, { stream: true })));
        }

        controller.close();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Connection failed';
        controller.enqueue(
          ENCODER.encode(`data: ${JSON.stringify({ type: 'error', message })}\n\n`),
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
