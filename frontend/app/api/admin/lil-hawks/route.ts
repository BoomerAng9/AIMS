/**
 * Admin Lil_Hawks API Proxy
 *
 * OWNER-only proxy to Lil_Hawk squad endpoints.
 * Queries both the Chicken Hawk standalone service and UEF Gateway agent registry.
 *
 * GET  /api/admin/lil-hawks           → squad overview + hawk statuses
 * POST /api/admin/lil-hawks  action=run-prep-squad → run PREP_SQUAD_ALPHA
 * POST /api/admin/lil-hawks  action=squad-status   → get specific squad status
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
        { error: 'Forbidden — OWNER role required', code: 'LIL_HAWKS_OWNER_ONLY' },
        { status: 403 },
      ),
    };
  }

  const userId = (session.user as Record<string, unknown>).id as string || session.user.email || 'owner';
  return { ok: true, userId };
}

// ── GET — Squad overview ─────────────────────────────────────────────────────

export async function GET() {
  const auth = await requireOwner();
  if (!auth.ok) return auth.response;

  try {
    // Get active squads from Chicken Hawk
    let squads: unknown[] = [];
    try {
      const res = await fetch(`${CHICKENHAWK_URL}/api/squads`, {
        signal: AbortSignal.timeout(5000),
      });
      if (res.ok) {
        const data = await res.json();
        squads = data.squads || [];
      }
    } catch {
      // Chicken Hawk not reachable
    }

    // Get registered hawk profiles from UEF Gateway
    let registeredHawks: unknown = null;
    try {
      const res = await fetch(`${UEF_URL}/agents/registry`, {
        headers: {
          'X-API-Key': INTERNAL_API_KEY,
          'X-User-Role': 'OWNER',
          'X-User-Id': auth.userId,
        },
        signal: AbortSignal.timeout(5000),
      });
      if (res.ok) registeredHawks = await res.json();
    } catch {
      // UEF registry not available
    }

    return NextResponse.json({
      activeSquads: squads,
      registeredHawks,
      chickenHawkConnected: squads !== null,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: `Proxy error: ${message}` }, { status: 502 });
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
      case 'run-prep-squad': {
        // Run PREP_SQUAD_ALPHA through UEF Gateway
        const res = await fetch(`${UEF_URL}/agents/prep-squad/run`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': INTERNAL_API_KEY,
            'X-User-Role': 'OWNER',
            'X-User-Id': auth.userId,
          },
          body: JSON.stringify({
            query: payload.query,
            userId: auth.userId,
          }),
        });
        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
      }

      case 'squad-status': {
        const res = await fetch(`${CHICKENHAWK_URL}/api/squads`, {
          signal: AbortSignal.timeout(5000),
        });
        if (!res.ok) throw new Error(`Chicken Hawk returned ${res.status}`);
        const data = await res.json();
        return NextResponse.json(data);
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: `Proxy error: ${message}` }, { status: 502 });
  }
}
