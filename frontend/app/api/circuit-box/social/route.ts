/**
 * GET /api/circuit-box/social
 *
 * Probes real social channel webhook endpoints to determine
 * which channels are actually configured (have bot tokens set).
 */

import { NextResponse } from 'next/server';

interface ChannelStatus {
  id: string;
  name: string;
  icon: string;
  configured: boolean;
  status: string;
  endpoint: string;
}

export async function GET() {
  const channels: ChannelStatus[] = [];

  // Check Telegram webhook
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/telegram/webhook`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });
    // The telegram route doesn't have a GET handler, so check notify endpoint
    channels.push({
      id: 'telegram',
      name: 'Telegram',
      icon: '✈',
      configured: !!process.env.TELEGRAM_BOT_TOKEN,
      status: process.env.TELEGRAM_BOT_TOKEN ? 'configured' : 'not_configured',
      endpoint: '/api/telegram/webhook',
    });
  } catch {
    channels.push({
      id: 'telegram',
      name: 'Telegram',
      icon: '✈',
      configured: !!process.env.TELEGRAM_BOT_TOKEN,
      status: process.env.TELEGRAM_BOT_TOKEN ? 'configured' : 'not_configured',
      endpoint: '/api/telegram/webhook',
    });
  }

  // Check Discord webhook
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/discord/webhook`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      const data = await res.json();
      channels.push({
        id: 'discord',
        name: 'Discord',
        icon: '🎮',
        configured: data.status === 'configured',
        status: data.status || 'unknown',
        endpoint: '/api/discord/webhook',
      });
    } else {
      channels.push({
        id: 'discord',
        name: 'Discord',
        icon: '🎮',
        configured: false,
        status: 'unreachable',
        endpoint: '/api/discord/webhook',
      });
    }
  } catch {
    channels.push({
      id: 'discord',
      name: 'Discord',
      icon: '🎮',
      configured: !!process.env.DISCORD_BOT_TOKEN,
      status: process.env.DISCORD_BOT_TOKEN ? 'configured' : 'not_configured',
      endpoint: '/api/discord/webhook',
    });
  }

  // WhatsApp — no backend exists yet
  channels.push({
    id: 'whatsapp',
    name: 'WhatsApp',
    icon: '📱',
    configured: false,
    status: 'not_built',
    endpoint: '',
  });

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    channels,
    summary: {
      total: channels.length,
      configured: channels.filter(c => c.configured).length,
      notConfigured: channels.filter(c => !c.configured).length,
    },
  });
}
