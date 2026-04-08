/**
 * Admin II-Agent API Proxy
 *
 * OWNER-only proxy to ii-agent endpoints on the UEF Gateway.
 * Validates NextAuth session + OWNER role before forwarding.
 *
 * POST /api/admin/ii-agent  → proxies to UEF /ii-agent/execute (or /research, /build, /slides)
 * GET  /api/admin/ii-agent  → proxies to UEF /ii-agent/health
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

const UEF_URL = process.env.UEF_GATEWAY_URL || process.env.UEF_ENDPOINT || 'http://uef-gateway:3001';
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || '';

// ── Auth gate helper ──────────────────────────────────────────────────────

async function requireOwner(): Promise<
  | { ok: true; userId: string }
  | { ok: false; response: NextResponse }
> {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }

  const role = (session.user as Record<string, unknown>).role;
  if (role !== 'OWNER') {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Forbidden — OWNER role required', code: 'II_AGENT_OWNER_ONLY' },
        { status: 403 },
      ),
    };
  }

  const userId = (session.user as Record<string, unknown>).id as string || session.user.email || 'owner';
  return { ok: true, userId };
}

// ── GET — Health check ────────────────────────────────────────────────────

export async function GET() {
  const auth = await requireOwner();
  if (!auth.ok) return auth.response;

  try {
    const res = await fetch(`${UEF_URL}/ii-agent/health`, {
      headers: {
        'X-API-Key': INTERNAL_API_KEY,
        'X-User-Role': 'OWNER',
        'X-User-Id': auth.userId,
      },
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { status: 'unhealthy', error: `Proxy error: ${message}`, connected: false },
      { status: 502 },
    );
  }
}

// ── POST — Execute task ───────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const auth = await requireOwner();
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json();
    const { action, ...payload } = body;

    // Determine backend endpoint based on action
    const endpointMap: Record<string, string> = {
      execute: '/ii-agent/execute',
      research: '/ii-agent/research',
      build: '/ii-agent/build',
      slides: '/ii-agent/slides',
      cancel: `/ii-agent/cancel/${payload.taskId || ''}`,
    };

    const endpoint = endpointMap[action] || '/ii-agent/execute';
    const streaming = action === 'build' || payload.streaming === true;

    // Inject user context
    const enrichedPayload = {
      ...payload,
      userId: auth.userId,
    };

    if (streaming) {
      // SSE streaming proxy
      const upstreamRes = await fetch(`${UEF_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': INTERNAL_API_KEY,
          'X-User-Role': 'OWNER',
          'X-User-Id': auth.userId,
        },
        body: JSON.stringify({ ...enrichedPayload, streaming: true }),
      });

      if (!upstreamRes.ok) {
        const err = await upstreamRes.text();
        return NextResponse.json(
          { error: `Backend error: ${err}` },
          { status: upstreamRes.status },
        );
      }

      // Forward as SSE stream
      const stream = upstreamRes.body;
      return new NextResponse(stream, {
        status: 200,
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
          'X-LLM-Provider': 'ii-agent',
        },
      });
    }

    // Non-streaming
    const upstreamRes = await fetch(`${UEF_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': INTERNAL_API_KEY,
        'X-User-Role': 'OWNER',
        'X-User-Id': auth.userId,
      },
      body: JSON.stringify(enrichedPayload),
    });

    if (!upstreamRes.ok) {
      const err = await upstreamRes.text();
      return NextResponse.json(
        { error: `Backend error: ${err}` },
        { status: upstreamRes.status },
      );
    }

    const data = await upstreamRes.json();
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Proxy error: ${message}` },
      { status: 502 },
    );
  }
}
