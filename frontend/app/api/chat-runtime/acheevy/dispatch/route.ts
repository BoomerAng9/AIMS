import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/require-role';
import {
  getChatRuntimeBridgeHeaders,
  getChatRuntimeBridgeSecret,
  getIiAgentBridgeBaseUrl,
  getIiAgentBridgeKey,
} from '@/lib/chat-runtime';

function hasValidBridgeSecret(request: NextRequest): boolean {
  const expected = getChatRuntimeBridgeSecret();
  if (!expected) return false;
  const presented = request.headers.get('x-chat-runtime-bridge-secret')?.trim()
    || request.headers.get('x-chat-interface-bridge-secret')?.trim()
    || request.headers.get('x-librechat-bridge-secret')?.trim()
    || '';
  return presented.length > 0 && presented === expected;
}

export async function POST(request: NextRequest) {
  const isServiceCall = hasValidBridgeSecret(request);

  if (!isServiceCall) {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
  }

  const body = await request.json();
  if (!body?.task || typeof body.task !== 'string') {
    return NextResponse.json({ error: 'task is required' }, { status: 400 });
  }

  const bridgeUrl = `${getIiAgentBridgeBaseUrl()}/dispatch`;
  const bridgeKey = getIiAgentBridgeKey();

  const upstream = await fetch(bridgeUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(bridgeKey ? { 'X-II-BRIDGE-KEY': bridgeKey } : {}),
    },
    body: JSON.stringify({
      task: body.task,
      source: body.source || 'chat-runtime',
      callback_url: body.callback_url,
      model_id: body.model_id,
      agent_type: body.agent_type || 'general',
      metadata: body.metadata || {},
    }),
    cache: 'no-store',
  });

  const text = await upstream.text();
  return new NextResponse(text, {
    status: upstream.status,
    headers: {
      'Content-Type': upstream.headers.get('Content-Type') || 'application/json',
      'Cache-Control': 'no-store',
      ...getChatRuntimeBridgeHeaders(getChatRuntimeBridgeSecret()),
    },
  });
}