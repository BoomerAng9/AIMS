/**
 * WhatsApp Webhook Adapter
 *
 * POST /api/whatsapp/webhook — Receives WhatsApp webhook events
 * GET /api/whatsapp/webhook — Webhook verification (required by Meta)
 *
 * Normalizes WhatsApp messages and routes them through the social gateway.
 */

import { NextRequest, NextResponse } from 'next/server';
import { logAuditEvent, lookupPlatformUser, generateLinkCode } from '@/lib/social/gateway';

const WHATSAPP_VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || '';
const WHATSAPP_API_TOKEN = process.env.WHATSAPP_API_TOKEN || '';
const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || '';

async function sendWhatsAppMessage(to: string, text: string): Promise<boolean> {
  if (!WHATSAPP_API_TOKEN || !WHATSAPP_PHONE_ID) return false;
  try {
    const res = await fetch(
      `https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_ID}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${WHATSAPP_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to,
          type: 'text',
          text: { body: text },
        }),
      }
    );
    return res.ok;
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  const mode = req.nextUrl.searchParams.get('hub.mode');
  const token = req.nextUrl.searchParams.get('hub.verify_token');
  const challenge = req.nextUrl.searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === WHATSAPP_VERIFY_TOKEN) {
    return new Response(challenge || '', { status: 200 });
  }

  return NextResponse.json({
    service: 'aims-whatsapp-webhook',
    status: WHATSAPP_API_TOKEN ? 'configured' : 'missing_token',
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const entry = body?.entry?.[0];
    const change = entry?.changes?.[0];
    const message = change?.value?.messages?.[0];

    if (!message || message.type !== 'text') {
      return NextResponse.json({ ok: true });
    }

    const from = message.from;
    const text = message.text?.body || '';
    const contactName = change?.value?.contacts?.[0]?.profile?.name || 'User';

    logAuditEvent({
      direction: 'inbound',
      provider: 'whatsapp',
      provider_user_id: from,
      message_preview: text.slice(0, 100),
      status: 'received',
    });

    // Check if user is linked
    const platformUser = lookupPlatformUser('whatsapp', from);

    if (!platformUser && text.toLowerCase() === 'link') {
      const linkCode = generateLinkCode('whatsapp', from);
      await sendWhatsAppMessage(from,
        `*Welcome to A.I.M.S.*\n\nYour link code: *${linkCode.code}*\n\nPaste this code in your A.I.M.S. dashboard under Settings > Social Connections to link your WhatsApp.\n\nCode expires in 10 minutes.`
      );
      return NextResponse.json({ ok: true });
    }

    if (!platformUser) {
      await sendWhatsAppMessage(from,
        `Welcome to A.I.M.S. — AI Managed Solutions.\n\nTo get started, send "link" to receive a connection code.`
      );
      return NextResponse.json({ ok: true });
    }

    // Route through ACHEEVY (forward to gateway)
    await fetch(new URL('/api/social/gateway', req.url).toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: 'whatsapp',
        provider_user_id: from,
        channel_id: from,
        message_text: text,
        timestamp: Date.now(),
        metadata: { display_name: contactName },
      }),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[WhatsApp]', error);
    return NextResponse.json({ ok: true });
  }
}
