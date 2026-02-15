/**
 * n8n Bridge Client — Connects plugmein.cloud to remote n8n instance
 *
 * Bridges the frontend (VPS 1) to the n8n workflow engine (VPS 2)
 * via authenticated HTTP calls. Used by /api/n8n/* route handlers.
 */

const N8N_REMOTE_URL = process.env.N8N_REMOTE_URL || 'http://76.13.96.107:5678';
const N8N_API_KEY = process.env.N8N_API_KEY || '';
const N8N_AUTH_USER = process.env.N8N_AUTH_USER || 'aims';
const N8N_AUTH_PASSWORD = process.env.N8N_AUTH_PASSWORD || '';

interface N8nRequestOptions {
  path: string;
  method?: string;
  body?: unknown;
  timeout?: number;
}

/**
 * Make an authenticated request to the remote n8n instance
 */
export async function n8nFetch<T = unknown>({
  path,
  method = 'GET',
  body,
  timeout = 15000,
}: N8nRequestOptions): Promise<{ ok: boolean; data: T | null; error?: string; status: number }> {
  const url = `${N8N_REMOTE_URL}${path}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // API key auth (preferred)
  if (N8N_API_KEY) {
    headers['X-N8N-API-KEY'] = N8N_API_KEY;
  }

  // Basic auth fallback
  if (N8N_AUTH_USER && N8N_AUTH_PASSWORD) {
    headers['Authorization'] = `Basic ${Buffer.from(`${N8N_AUTH_USER}:${N8N_AUTH_PASSWORD}`).toString('base64')}`;
  }

  try {
    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(timeout),
    });

    if (!response.ok) {
      return {
        ok: false,
        data: null,
        error: `n8n returned ${response.status}: ${response.statusText}`,
        status: response.status,
      };
    }

    const data = await response.json() as T;
    return { ok: true, data, status: response.status };
  } catch (err: any) {
    if (err.name === 'TimeoutError' || err.name === 'AbortError') {
      return { ok: false, data: null, error: 'n8n request timed out', status: 504 };
    }
    return { ok: false, data: null, error: err.message || 'n8n connection failed', status: 502 };
  }
}

/**
 * Check remote n8n health
 */
export async function n8nHealthCheck(): Promise<{
  healthy: boolean;
  url: string;
  latencyMs: number;
  error?: string;
}> {
  const start = Date.now();
  try {
    const response = await fetch(`${N8N_REMOTE_URL}/healthz`, {
      signal: AbortSignal.timeout(5000),
    });
    return {
      healthy: response.ok,
      url: N8N_REMOTE_URL,
      latencyMs: Date.now() - start,
    };
  } catch (err: any) {
    return {
      healthy: false,
      url: N8N_REMOTE_URL,
      latencyMs: Date.now() - start,
      error: err.message,
    };
  }
}

/**
 * Trigger a webhook on the remote n8n instance (for Boomer_Ang PMO routing)
 */
export async function triggerPmoWebhook(payload: {
  message: string;
  userId?: string;
  pmoOffice?: string;
  director?: string;
  executionLane?: string;
}): Promise<{ ok: boolean; data: unknown; error?: string }> {
  const result = await n8nFetch({
    path: '/webhook/pmo-intake',
    method: 'POST',
    body: payload,
    timeout: 30000,
  });
  return { ok: result.ok, data: result.data, error: result.error };
}
