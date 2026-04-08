const CHAT_RUNTIME_DEFAULT_PATH = '/c/new';

function normalizeBaseUrl(rawUrl?: string | null): string | null {
  const value = rawUrl?.trim();
  if (!value) return null;

  try {
    return new URL(value).toString().replace(/\/$/, '');
  } catch {
    return null;
  }
}

export function getChatRuntimeUrl(): string | null {
  return normalizeBaseUrl(process.env.CHAT_RUNTIME_URL)
    || normalizeBaseUrl(process.env.CHAT_INTERFACE_URL)
    || normalizeBaseUrl(process.env.LIBRECHAT_URL);
}

export function isChatRuntimeEnabled(): boolean {
  return getChatRuntimeUrl() !== null;
}

export function buildChatRuntimeLaunchUrl(source: string): string | null {
  const baseUrl = getChatRuntimeUrl();
  if (!baseUrl) return null;

  const url = new URL(`${baseUrl}${CHAT_RUNTIME_DEFAULT_PATH}`);
  url.searchParams.set('source', source);
  url.searchParams.set('brand', 'acheevy');
  return url.toString();
}

export function getIiAgentBridgeBaseUrl(): string {
  const explicitBridgeUrl = process.env.II_AGENT_BRIDGE_URL?.trim();
  if (explicitBridgeUrl) {
    return explicitBridgeUrl.replace(/\/$/, '');
  }

  const iiAgentHttpUrl = (process.env.II_AGENT_HTTP_URL || 'http://ii-agent:8000').trim().replace(/\/$/, '');
  return `${iiAgentHttpUrl}/bridge`;
}

export function getIiAgentBridgeKey(): string {
  return process.env.II_AGENT_BRIDGE_KEY?.trim() || process.env.AIMS_BRIDGE_SHARED_SECRET?.trim() || '';
}

export function getChatRuntimeBridgeSecret(): string {
  return process.env.CHAT_RUNTIME_BRIDGE_SECRET?.trim()
    || process.env.CHAT_INTERFACE_BRIDGE_SECRET?.trim()
    || process.env.LIBRECHAT_BRIDGE_SECRET?.trim()
    || '';
}

export function getChatRuntimeBridgeHeaders(secret: string): Record<string, string> {
  if (!secret) return {};

  return {
    'X-Chat-Runtime-Bridge-Secret': secret,
    'X-Chat-Interface-Bridge-Secret': secret,
    'X-LibreChat-Bridge-Secret': secret,
  };
}
