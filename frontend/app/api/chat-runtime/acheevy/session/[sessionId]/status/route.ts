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

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ sessionId: string }> },
) {
  const isServiceCall = hasValidBridgeSecret(request);

  if (!isServiceCall) {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
  }

  const { sessionId } = await context.params;
  if (!sessionId) {
    return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
  }

  const bridgeKey = getIiAgentBridgeKey();
  const upstream = await fetch(`${getIiAgentBridgeBaseUrl()}/session/${encodeURIComponent(sessionId)}/status`, {
    headers: {
      ...(bridgeKey ? { 'X-II-BRIDGE-KEY': bridgeKey } : {}),
    },
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