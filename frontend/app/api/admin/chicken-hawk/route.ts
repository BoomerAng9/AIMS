/**
 * Admin Chicken Hawk API Proxy
 *
 * OWNER-only proxy to Chicken Hawk endpoints (standalone service + UEF Gateway).
 * Validates NextAuth session + OWNER role before forwarding.
 *
 * GET  /api/admin/chicken-hawk                → health + status
 * POST /api/admin/chicken-hawk  action=squads → list active squads
 * POST /api/admin/chicken-hawk  action=manifest → submit manifest
 * POST /api/admin/chicken-hawk  action=emergency-stop → kill switch
 * POST /api/admin/chicken-hawk  action=execute → run via in-process agent
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

const UEF_URL = process.env.UEF_GATEWAY_URL || process.env.UEF_ENDPOINT || 'http://uef-gateway:3001';
const CHICKENHAWK_URL = process.env.CHICKENHAWK_URL || 'http://chickenhawk-core:4001';
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || '';

// ── Auth gate ────────────────────────────────────────────────────────────────

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
        { error: 'Forbidden — OWNER role required', code: 'CHICKEN_HAWK_OWNER_ONLY' },
        { status: 403 },
      ),
    };
  }

  const userId = (session.user as Record<string, unknown>).id as string || session.user.email || 'owner';
  return { ok: true, userId };
}

// ── GET — Health + Status ────────────────────────────────────────────────────

export async function GET() {
  const auth = await requireOwner();
  if (!auth.ok) return auth.response;

  try {
    // Try standalone Chicken Hawk service first
    const [healthRes, statusRes] = await Promise.allSettled([
      fetch(`${CHICKENHAWK_URL}/health`, {
        signal: AbortSignal.timeout(5000),
      }),
      fetch(`${CHICKENHAWK_URL}/status`, {
        signal: AbortSignal.timeout(5000),
      }),
    ]);

    const health = healthRes.status === 'fulfilled' && healthRes.value.ok
      ? await healthRes.value.json()
      : null;

    const status = statusRes.status === 'fulfilled' && statusRes.value.ok
      ? await statusRes.value.json()
      : null;

    // Also check in-process agent via UEF Gateway
    let uefStatus = null;
    try {
      const uefRes = await fetch(`${UEF_URL}/agents/chicken-hawk/status`, {
        headers: {
          'X-API-Key': INTERNAL_API_KEY,
          'X-User-Role': 'OWNER',
          'X-User-Id': auth.userId,
        },
        signal: AbortSignal.timeout(5000),
      });
      if (uefRes.ok) uefStatus = await uefRes.json();
    } catch {
      // UEF agent status not available
    }

    return NextResponse.json({
      standalone: {
        connected: !!health,
        health,
        status: status?.engine || null,
      },
      inProcess: {
        connected: !!uefStatus,
        status: uefStatus,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Proxy error: ${message}`, standalone: { connected: false }, inProcess: { connected: false } },
      { status: 502 },
    );
  }
}

// ── POST — Actions ───────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const auth = await requireOwner();
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json();
    const { action, ...payload } = body;

    switch (action) {
      case 'squads': {
        const res = await fetch(`${CHICKENHAWK_URL}/api/squads`, {
          signal: AbortSignal.timeout(5000),
        });
        if (!res.ok) throw new Error(`Chicken Hawk returned ${res.status}`);
        const data = await res.json();
        return NextResponse.json(data);
      }

      case 'manifest': {
        const res = await fetch(`${CHICKENHAWK_URL}/api/manifest`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload.manifest),
        });
        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
      }

      case 'emergency-stop': {
        const res = await fetch(`${CHICKENHAWK_URL}/api/emergency-stop`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
        const data = await res.json();
        return NextResponse.json(data);
      }

      case 'execute': {
        // Route through UEF Gateway in-process agent
        const res = await fetch(`${UEF_URL}/agents/execute`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': INTERNAL_API_KEY,
            'X-User-Role': 'OWNER',
            'X-User-Id': auth.userId,
          },
          body: JSON.stringify({
            agentId: 'chicken-hawk',
            intent: payload.intent || 'AGENTIC_WORKFLOW',
            query: payload.query,
            context: { userId: auth.userId, ...payload.context },
          }),
        });
        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: `Proxy error: ${message}` }, { status: 502 });
  }
}
