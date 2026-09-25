const DEFAULT_TIMEOUT_MS = 300_000;

export function resolveBrokerEndpoint(env: NodeJS.ProcessEnv = process.env): URL {
  const raw = env.AIMS_OPENHANDS_BROKER_URL?.trim();
  if (!raw) throw new TypeError('AIMS_OPENHANDS_BROKER_URL is not configured on the Paperclip server.');
  const url = new URL(raw);
  const loopback = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  if ((url.protocol !== 'https:' && !(loopback && url.protocol === 'http:')) ||
      url.username || url.password || url.search || url.hash) {
    throw new TypeError('A.I.M.S. broker URL must use HTTPS (or loopback HTTP) and contain no credentials, query, or fragment.');
  }
  return url;
}

export function resolveTimeoutMs(env: NodeJS.ProcessEnv = process.env): number {
  const configured = env.AIMS_OPENHANDS_BROKER_TIMEOUT_MS?.trim();
  if (!configured) return DEFAULT_TIMEOUT_MS;
  const timeout = Number(configured);
  if (!Number.isSafeInteger(timeout) || timeout < 300_000 || timeout > 900_000) {
    throw new TypeError('AIMS_OPENHANDS_BROKER_TIMEOUT_MS must be an integer from 300000 to 900000.');
  }
  return timeout;
}
