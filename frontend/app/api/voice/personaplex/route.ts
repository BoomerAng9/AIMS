/**
 * PersonaPlex Voice Session API
 *
 * Manages full-duplex voice sessions with the PersonaPlex avatar:
 *   - POST: Start a new voice session or send a message
 *   - GET: Get session status
 *   - DELETE: End a voice session
 *
 * PersonaPlex runs on GCP Vertex AI with NVIDIA Nemotron-3-Nano-30B-A3B.
 * Voice synthesis and session management happen via the UEF Gateway.
 */

import { NextRequest, NextResponse } from 'next/server';

const GATEWAY_URL = process.env.UEF_GATEWAY_URL || process.env.NEXT_PUBLIC_UEF_GATEWAY_URL || 'http://uef-gateway:4000';

/**
 * POST /api/voice/personaplex
 *
 * Actions:
 *   - { action: 'start' } — Start a new voice session
 *   - { action: 'speak', text, sessionId } — Speak text via PersonaPlex avatar
 *   - { action: 'chat', messages, sessionId } — Send chat messages for voice response
 *   - { action: 'status', type, projectName, summary, sessionId } — Deliver status update
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (!action) {
      return NextResponse.json({ error: 'action is required' }, { status: 400 });
    }

    const res = await fetch(`${GATEWAY_URL}/api/personaplex/${action}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30000),
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => 'Unknown error');
      return NextResponse.json(
        { error: `PersonaPlex ${action} failed`, detail: errBody },
        { status: res.status },
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: 'PersonaPlex request failed', detail: err instanceof Error ? err.message : 'Unknown' },
      { status: 502 },
    );
  }
}

/**
 * GET /api/voice/personaplex?sessionId=xxx
 *
 * Get PersonaPlex session status and capabilities.
 */
export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get('sessionId');

  try {
    const endpoint = sessionId
      ? `${GATEWAY_URL}/api/personaplex/session/${sessionId}`
      : `${GATEWAY_URL}/api/personaplex/status`;

    const res = await fetch(endpoint, {
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      return NextResponse.json({ configured: false, available: false });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ configured: false, available: false, error: 'Gateway unreachable' });
  }
}

/**
 * DELETE /api/voice/personaplex?sessionId=xxx
 *
 * End a PersonaPlex voice session.
 */
export async function DELETE(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get('sessionId');
  if (!sessionId) {
    return NextResponse.json({ error: 'sessionId required' }, { status: 400 });
  }

  try {
    const res = await fetch(`${GATEWAY_URL}/api/personaplex/session/${sessionId}`, {
      method: 'DELETE',
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      return NextResponse.json({ ended: false, error: 'Failed to end session' });
    }

    return NextResponse.json({ ended: true, sessionId });
  } catch {
    return NextResponse.json({ ended: false, error: 'Gateway unreachable' });
  }
}
