/**
 * Telegram Webhook API — ACHEEVY via Telegram
 *
 * POST /api/telegram/webhook
 * Receives Telegram Bot updates, implements account linking, routes messages
 * through the social gateway → ACHEEVY chat orchestration.
 *
 * Account Linking Flow:
 *   1. User sends /start → Bot returns a 6-char link code + instructions
 *   2. User pastes link code in A.I.M.S. dashboard → account bound
 *   3. After linking, messages route through ACHEEVY as if typed in the app
 *   4. Replies return to Telegram by default
 *
 * Commands: /start, /help, /disconnect, /status, /health
 *
 * Required env: TELEGRAM_BOT_TOKEN
 */

import { NextRequest, NextResponse } from 'next/server';
import { streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { buildSystemPrompt } from '@/lib/acheevy/persona';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';

const openrouter = createOpenAI({
  apiKey: process.env.OPENROUTER_API_KEY || '',
  baseURL: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
});

const DEFAULT_MODEL = process.env.ACHEEVY_MODEL || process.env.OPENROUTER_MODEL || 'google/gemini-3.0-flash';

// ── Telegram API Types ──

interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from: {
      id: number;
      first_name: string;
      username?: string;
    };
    chat: {
      id: number;
      type: string;
    };
    text?: string;
    date: number;
  };
}

// ── In-memory stores (replace with DB in production) ──

interface LinkCode {
  code: string;
  telegramUserId: number;
  telegramUsername: string;
  chatId: number;
  createdAt: number;
  expiresAt: number;
  claimed: boolean;
  platformUserId?: string;
}

const linkCodes = new Map<string, LinkCode>();
const telegramToUser = new Map<number, string>(); // telegramId → platformUserId

function generateLinkCode(telegramUserId: number, telegramUsername: string, chatId: number): LinkCode {
  const code = Math.random().toString(36).substring(2, 8).toUpperCase();
  const entry: LinkCode = {
    code,
    telegramUserId,
    telegramUsername,
    chatId,
    createdAt: Date.now(),
    expiresAt: Date.now() + 10 * 60 * 1000,
    claimed: false,
  };
  linkCodes.set(code, entry);
  return entry;
}

// ── Telegram API Helpers ──

async function sendTelegramMessage(chatId: number, text: string): Promise<boolean> {
  if (!TELEGRAM_BOT_TOKEN) return false;
  try {
    const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' }),
    });
    if (!res.ok) {
      console.error(`[Telegram] sendMessage failed: ${res.status}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[Telegram] sendMessage error:', err);
    return false;
  }
}

async function sendTypingAction(chatId: number): Promise<void> {
  if (!TELEGRAM_BOT_TOKEN) return;
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendChatAction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, action: 'typing' }),
    });
  } catch {
    // Non-critical
  }
}

// ── Webhook Handler ──

export async function POST(req: NextRequest) {
  if (!TELEGRAM_BOT_TOKEN) {
    return NextResponse.json({ error: 'TELEGRAM_BOT_TOKEN not configured' }, { status: 503 });
  }

  try {
    const update: TelegramUpdate = await req.json();

    if (!update.message?.text) {
      return NextResponse.json({ ok: true });
    }

    const { text, chat, from } = update.message;
    const chatId = chat.id;
    const telegramUserId = from.id;
    const userName = from.first_name || from.username || 'User';
    const telegramUsername = from.username || from.first_name || 'unknown';

    // ── /start — Account linking flow ──
    if (text === '/start') {
      const isLinked = telegramToUser.has(telegramUserId);
      if (isLinked) {
        await sendTelegramMessage(chatId,
          `*Welcome back, ${userName}!*\n\nYour Telegram is linked to A.I.M.S. Just type naturally to chat with ACHEEVY.\n\n*Commands:*\n/help — Show available commands\n/disconnect — Unlink your Telegram\n/status — System status\n/health — Service health\n\n_Activity Breeds Activity_`
        );
        return NextResponse.json({ ok: true });
      }

      // Generate link code
      const linkCode = generateLinkCode(telegramUserId, telegramUsername, chatId);
      await sendTelegramMessage(chatId,
        `*Welcome to A.I.M.S.* — AI Managed Solutions.\n\nI'm *ACHEEVY*, at your service.\n\n*To link your account:*\n1. Go to your A.I.M.S. dashboard\n2. Navigate to Circuit Box > Social Channels\n3. Paste this code in the Telegram field:\n\n\`${linkCode.code}\`\n\n_Code expires in 10 minutes._\n\n*After linking:*\n• Send messages here → they appear in Chat w/ACHEEVY\n• ACHEEVY replies come back here\n• Use /help for all commands\n• Use /disconnect to unlink\n\n_What will we deploy today?_`
      );
      return NextResponse.json({ ok: true });
    }

    // ── /help ──
    if (text === '/help') {
      await sendTelegramMessage(chatId,
        `*ACHEEVY Commands:*\n\n/start — Welcome + link code (if not linked)\n/help — This help text\n/disconnect — Unlink your Telegram from A.I.M.S.\n/status — System status & active services\n/health — Health check all services\n\n*Or send any message:*\n• Ask questions → AI-powered answers\n• Give instructions → Routes to Boomer\\_Angs\n• Request tasks → Dispatches via Chicken Hawk\n\nAll messages flow through ACHEEVY orchestration.`
      );
      return NextResponse.json({ ok: true });
    }

    // ── /disconnect ──
    if (text === '/disconnect') {
      const wasLinked = telegramToUser.delete(telegramUserId);
      if (wasLinked) {
        await sendTelegramMessage(chatId,
          `Your Telegram has been *unlinked* from A.I.M.S.\n\nTo reconnect, send /start to get a new link code.`
        );
      } else {
        await sendTelegramMessage(chatId,
          `Your Telegram was not linked to any A.I.M.S. account.\n\nSend /start to begin linking.`
        );
      }
      return NextResponse.json({ ok: true });
    }

    // ── /status ──
    if (text === '/status') {
      await sendTypingAction(chatId);
      try {
        const uefUrl = process.env.UEF_GATEWAY_URL || process.env.NEXT_PUBLIC_UEF_GATEWAY_URL || 'http://127.0.0.1:3001';
        const [gatewayRes, coreRes] = await Promise.allSettled([
          fetch(`${uefUrl}/health`, { signal: AbortSignal.timeout(5000) }),
          fetch(`${process.env.CHICKENHAWK_CORE_URL || 'http://127.0.0.1:4001'}/status`, { signal: AbortSignal.timeout(5000) }),
        ]);
        const gateway = gatewayRes.status === 'fulfilled' ? await gatewayRes.value.json() : null;
        const core = coreRes.status === 'fulfilled' ? await coreRes.value.json() : null;
        const lines = [
          '*A.I.M.S. System Status*\n',
          `UEF Gateway: ${gateway ? '🟢 Online' : '🔴 Offline'}`,
          gateway ? `  Uptime: ${Math.round(gateway.uptime)}s` : '',
          `\nChicken Hawk: ${core ? '🟢 Online' : '🔴 Offline'}`,
          core ? `  LLM: ${core.engine?.llm_provider || 'unknown'}` : '',
          core ? `  Adapters: ${core.engine?.registered_adapters?.length || 0}` : '',
          core ? `  Active manifests: ${Object.keys(core.engine?.active_manifests || {}).length}` : '',
          `\nTelegram Link: ${telegramToUser.has(telegramUserId) ? '🟢 Linked' : '🔴 Not linked'}`,
        ].filter(Boolean);
        await sendTelegramMessage(chatId, lines.join('\n'));
      } catch {
        await sendTelegramMessage(chatId, 'Could not reach backend services.');
      }
      return NextResponse.json({ ok: true });
    }

    // ── /health ──
    if (text === '/health') {
      await sendTypingAction(chatId);
      const services = [
        { name: 'UEF Gateway', url: process.env.UEF_GATEWAY_URL || 'http://127.0.0.1:3001' },
        { name: 'CH Core', url: process.env.CHICKENHAWK_CORE_URL || 'http://127.0.0.1:4001' },
        { name: 'CH Policy', url: process.env.CHICKENHAWK_POLICY_URL || 'http://127.0.0.1:4002' },
        { name: 'CH Audit', url: process.env.CHICKENHAWK_AUDIT_URL || 'http://127.0.0.1:4003' },
        { name: 'CH Voice', url: process.env.CHICKENHAWK_VOICE_URL || 'http://127.0.0.1:4004' },
      ];
      const results = await Promise.allSettled(
        services.map(s => fetch(`${s.url}/health`, { signal: AbortSignal.timeout(3000) }))
      );
      const lines = ['*Service Health*\n'];
      results.forEach((r, i) => {
        lines.push(`${r.status === 'fulfilled' && r.value.ok ? '🟢' : '🔴'} ${services[i].name}`);
      });
      lines.push(`\n🔗 Telegram: ${TELEGRAM_BOT_TOKEN ? '🟢 Configured' : '🔴 No token'}`);
      await sendTelegramMessage(chatId, lines.join('\n'));
      return NextResponse.json({ ok: true });
    }

    // ── Check if user is linked ──
    const isLinked = telegramToUser.has(telegramUserId);
    if (!isLinked) {
      await sendTelegramMessage(chatId,
        `Your Telegram is not linked to an A.I.M.S. account yet.\n\nSend /start to get a link code, then paste it in your A.I.M.S. dashboard.`
      );
      return NextResponse.json({ ok: true });
    }

    // ── Route through ACHEEVY chat ──
    const userMessage = text.startsWith('/') ? text.slice(1) : text;

    await sendTypingAction(chatId);

    const systemPrompt = buildSystemPrompt({
      additionalContext: `User "${userName}" is messaging via Telegram (linked account). Keep responses concise (under 4000 chars) and use Markdown formatting. Commands: /status, /health, /help, /disconnect.`,
    });

    const result = await streamText({
      model: openrouter(DEFAULT_MODEL),
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    });

    let fullResponse = '';
    for await (const chunk of result.textStream) {
      fullResponse += chunk;
    }

    if (fullResponse.length > 4000) {
      fullResponse = fullResponse.slice(0, 3990) + '\n\n_(truncated)_';
    }

    await sendTelegramMessage(chatId, fullResponse || 'I couldn\'t generate a response. Please try again.');
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Webhook error';
    console.error('[Telegram]', message);
    return NextResponse.json({ ok: true, error: message });
  }
}

// GET handler — webhook health check
export async function GET() {
  return NextResponse.json({
    service: 'aims-telegram-webhook',
    status: TELEGRAM_BOT_TOKEN ? 'configured' : 'missing_token',
    features: ['account_linking', 'help', 'disconnect', 'status', 'health', 'acheevy_chat'],
    link_codes_active: linkCodes.size,
    linked_users: telegramToUser.size,
    setup_command: TELEGRAM_BOT_TOKEN
      ? 'Webhook ready. Register with: POST https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://plugmein.cloud/api/telegram/webhook'
      : 'Set TELEGRAM_BOT_TOKEN environment variable first.',
  });
}
