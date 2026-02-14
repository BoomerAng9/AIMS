/**
 * Telegram Notify API — Internal notification endpoint
 *
 * POST /api/telegram/notify
 * Sends a one-way notification to the Commander's Telegram chat.
 * Used by Editor's Desk (Ship/Reject), Heartbeat alerts, and n8n workflows.
 *
 * Body: { message: string }
 * Required env: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID
 */

import { NextRequest, NextResponse } from 'next/server';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '';

export async function POST(req: NextRequest) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    return NextResponse.json(
      { error: 'Telegram not configured (TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID missing)' },
      { status: 503 },
    );
  }

  try {
    const { message } = (await req.json()) as { message?: string };

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Missing message field' }, { status: 400 });
    }

    const res = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: message.slice(0, 4096), // Telegram max message length
          parse_mode: 'Markdown',
        }),
      },
    );

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: 'Telegram API error', detail: err }, { status: 502 });
    }

    return NextResponse.json({ sent: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
