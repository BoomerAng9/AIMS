import { NextResponse } from 'next/server';
import { getIiAgentBridgeBaseUrl, getIiAgentBridgeKey, isLibreChatEnabled } from '@/lib/librechat';

export async function GET() {
  const bridgeKey = getIiAgentBridgeKey();

  try {
    const response = await fetch(`${getIiAgentBridgeBaseUrl()}/health`, {
      headers: {
        ...(bridgeKey ? { 'X-II-BRIDGE-KEY': bridgeKey } : {}),
      },
      cache: 'no-store',
    });

    const payload = await response.json();
    return NextResponse.json({
      chatInterfaceConfigured: isLibreChatEnabled(),
      bridge: payload,
    }, { status: response.ok ? 200 : response.status });
  } catch (error) {
    return NextResponse.json({
      chatInterfaceConfigured: isLibreChatEnabled(),
      bridge: {
        status: 'offline',
        error: error instanceof Error ? error.message : 'Bridge request failed',
      },
    }, { status: 503 });
  }
}
