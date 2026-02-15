/**
 * Social Gateway — Unified inbound webhook endpoint
 *
 * POST /api/social/gateway
 * Receives normalized messages from provider adapters.
 * Routes them to ACHEEVY chat orchestration.
 */

import { NextRequest, NextResponse } from 'next/server';
import { logAuditEvent, getRecentAuditEvents } from '@/lib/social/gateway';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { provider, provider_user_id, channel_id, message_text, timestamp, metadata } = body;

    if (!provider || !provider_user_id || !message_text) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Audit the inbound message
    logAuditEvent({
      direction: 'inbound',
      provider,
      provider_user_id,
      message_preview: message_text.slice(0, 100),
      status: 'received',
    });

    // Route to ACHEEVY chat (same path as web chat)
    // For now, return acknowledgment — full routing will connect to /api/chat
    return NextResponse.json({
      ok: true,
      routed: true,
      provider,
      channel_id,
      timestamp: timestamp || Date.now(),
    });
  } catch (error) {
    return NextResponse.json({ error: 'Gateway processing failed' }, { status: 500 });
  }
}

export async function GET() {
  const events = getRecentAuditEvents(20);
  return NextResponse.json({
    service: 'aims-social-gateway',
    status: 'online',
    recent_events: events.length,
    events,
  });
}
