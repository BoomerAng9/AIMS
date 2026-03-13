const LIBRECHAT_DEFAULT_PATH = '/c/new';

function normalizeBaseUrl(rawUrl?: string | null): string | null {
  const value = rawUrl?.trim();
  if (!value) return null;

  try {
    return new URL(value).toString().replace(/\/$/, '');
  } catch {
    return null;
  }
}

export function getLibreChatUrl(): string | null {
  return normalizeBaseUrl(process.env.CHAT_INTERFACE_URL) || normalizeBaseUrl(process.env.LIBRECHAT_URL);
}

export function isLibreChatEnabled(): boolean {
  return getLibreChatUrl() !== null;
}

export function buildLibreChatLaunchUrl(source: string): string | null {
  const baseUrl = getLibreChatUrl();
  if (!baseUrl) return null;

  const url = new URL(`${baseUrl}${LIBRECHAT_DEFAULT_PATH}`);
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

export function getLibreChatBridgeSecret(): string {
  return process.env.CHAT_INTERFACE_BRIDGE_SECRET?.trim() || process.env.LIBRECHAT_BRIDGE_SECRET?.trim() || '';
}
