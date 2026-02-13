/**
 * Discord Webhook Adapter
 *
 * POST /api/discord/webhook — Receives Discord interaction events
 * GET /api/discord/webhook — Health check
 *
 * Normalizes Discord messages and routes through social gateway.
 */

import { NextRequest, NextResponse } from 'next/server';
import { logAuditEvent, lookupPlatformUser, generateLinkCode } from '@/lib/social/gateway';

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN || '';
const DISCORD_PUBLIC_KEY = process.env.DISCORD_PUBLIC_KEY || '';

async function sendDiscordMessage(channelId: string, text: string): Promise<boolean> {
  if (!DISCORD_BOT_TOKEN) return false;
  try {
    const res = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bot ${DISCORD_BOT_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content: text }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function GET() {
  return NextResponse.json({
    service: 'aims-discord-webhook',
    status: DISCORD_BOT_TOKEN ? 'configured' : 'missing_token',
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Handle Discord interaction verification
    if (body.type === 1) {
      return NextResponse.json({ type: 1 });
    }

    // Handle message creates (from bot gateway forwarding)
    const userId = body.author?.id || body.member?.user?.id || body.user_id;
    const channelId = body.channel_id;
    const content = body.content || body.data?.options?.[0]?.value || '';
    const username = body.author?.username || body.member?.user?.username || 'User';

    if (!userId || !content) {
      return NextResponse.json({ ok: true });
    }

    // Ignore bot messages
    if (body.author?.bot) {
      return NextResponse.json({ ok: true });
    }

    logAuditEvent({
      direction: 'inbound',
      provider: 'discord',
      provider_user_id: userId,
      message_preview: content.slice(0, 100),
      status: 'received',
    });

    // Handle commands
    if (content === '!link' || content === '/link') {
      const linkCode = generateLinkCode('discord', userId);
      await sendDiscordMessage(channelId,
        `**Welcome to A.I.M.S.**\n\nYour link code: **${linkCode.code}**\n\nPaste this code in your A.I.M.S. dashboard under Settings > Social Connections to link your Discord.\n\nCode expires in 10 minutes.`
      );
      return NextResponse.json({ ok: true });
    }

    if (content === '!help' || content === '/help') {
      await sendDiscordMessage(channelId,
        `**ACHEEVY Commands:**\n\n\`!link\` — Link your Discord to A.I.M.S.\n\`!disconnect\` — Unlink your account\n\`!help\` — Show this help\n\nOr just type naturally to chat with ACHEEVY.`
      );
      return NextResponse.json({ ok: true });
    }

    // Check linking
    const platformUser = lookupPlatformUser('discord', userId);
    if (!platformUser) {
      await sendDiscordMessage(channelId,
        `Welcome to A.I.M.S.! Use \`!link\` to connect your Discord account.`
      );
      return NextResponse.json({ ok: true });
    }

    // Route through gateway
    await fetch(new URL('/api/social/gateway', req.url).toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: 'discord',
        provider_user_id: userId,
        channel_id: channelId,
        message_text: content,
        timestamp: Date.now(),
        metadata: { username },
      }),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[Discord]', error);
    return NextResponse.json({ ok: true });
  }
}
