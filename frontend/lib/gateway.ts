/**
 * gatewayFetch — Standardized utility for all frontend → UEF Gateway calls.
 *
 * Features:
 *   - Automatic UEF_GATEWAY_URL resolution (env var fallback chain)
 *   - X-API-Key header injection from env
 *   - JSON content-type defaults
 *   - Error normalization with structured GatewayError
 *   - Optional retry with exponential backoff (network errors only)
 *   - LUC metering header pass-through
 *   - Timeout support
 *
 * Usage (in API routes):
 *   import { gatewayFetch, gatewayJSON } from '@/lib/gateway';
 *
 *   // Simple GET
 *   const data = await gatewayJSON('/plug-catalog/browse');
 *
 *   // POST with body
 *   const result = await gatewayJSON('/instances/deploy', {
 *     method: 'POST',
 *     body: { plugId: 'abc', config: {} },
 *   });
 *
 *   // Raw Response (for streaming)
 *   const res = await gatewayFetch('/llm/stream', { method: 'POST', body: { ... } });
 *   return new Response(res.body, { headers: { 'Content-Type': 'text/event-stream' } });
 */

// ── Gateway URL resolution ──

function resolveGatewayUrl(): string {
  return (
    process.env.UEF_GATEWAY_URL ||
    process.env.NEXT_PUBLIC_UEF_GATEWAY_URL ||
    process.env.UEF_ENDPOINT ||
    'http://localhost:3001'
  );
}

// ── Error types ──

export class GatewayError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'GatewayError';
  }

  /** True for 5xx errors or network failures */
  get isRetryable(): boolean {
    return this.status >= 500 || this.status === 0;
  }

  /** Convert to a safe JSON-serializable object for API responses */
  toJSON() {
    return {
      error: this.message,
      status: this.status,
      code: this.code,
    };
  }
}

// ── Options ──

export interface GatewayFetchOptions extends Omit<RequestInit, 'body'> {
  /** Request body — objects are auto-serialized to JSON */
  body?: unknown;
  /** Max retries for network/5xx errors (default: 0 = no retry) */
  retries?: number;
  /** Base delay between retries in ms (default: 1000, doubles each retry) */
  retryDelay?: number;
  /** Request timeout in ms (default: 30000) */
  timeout?: number;
  /** Additional headers to merge */
  extraHeaders?: Record<string, string>;
  /** LUC user ID for metering */
  lucUserId?: string;
}

// ── Core fetch ──

/**
 * Make a raw fetch to the UEF Gateway. Returns the Response object.
 * Use this when you need streaming (SSE) or custom response handling.
 */
export async function gatewayFetch(
  path: string,
  options: GatewayFetchOptions = {},
): Promise<Response> {
  const {
    body,
    retries = 0,
    retryDelay = 1000,
    timeout = 30_000,
    extraHeaders = {},
    lucUserId,
    ...fetchOptions
  } = options;

  const baseUrl = resolveGatewayUrl();
  const url = `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;

  // Build headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...extraHeaders,
  };

  // Inject API key if available
  const apiKey = process.env.UEF_API_KEY || process.env.GATEWAY_API_KEY;
  if (apiKey) {
    headers['X-API-Key'] = apiKey;
  }

  // LUC metering
  if (lucUserId) {
    headers['X-LUC-User-Id'] = lucUserId;
  }

  // Serialize body
  const serializedBody = body != null && typeof body === 'object'
    ? JSON.stringify(body)
    : body as string | undefined;

  // Attempt with retries
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = timeout > 0
        ? setTimeout(() => controller.abort(), timeout)
        : null;

      const res = await fetch(url, {
        ...fetchOptions,
        headers: { ...headers, ...(fetchOptions.headers as Record<string, string>) },
        body: serializedBody,
        signal: controller.signal,
      });

      if (timeoutId) clearTimeout(timeoutId);

      // Non-retryable client errors — fail immediately
      if (res.status >= 400 && res.status < 500) {
        let errorBody: any = {};
        try {
          errorBody = await res.json();
        } catch { /* ignore parse errors */ }

        throw new GatewayError(
          errorBody.error || errorBody.message || `Gateway returned ${res.status}`,
          res.status,
          errorBody.code,
          errorBody,
        );
      }

      // Server errors — retry if attempts remain
      if (res.status >= 500) {
        if (attempt < retries) {
          await sleep(retryDelay * Math.pow(2, attempt));
          continue;
        }
        throw new GatewayError(
          `Gateway server error: ${res.status}`,
          res.status,
        );
      }

      return res;
    } catch (err) {
      if (err instanceof GatewayError && !err.isRetryable) {
        throw err;
      }

      lastError = err instanceof Error ? err : new Error(String(err));

      // Network error or abort — retry if attempts remain
      if (attempt < retries) {
        await sleep(retryDelay * Math.pow(2, attempt));
        continue;
      }
    }
  }

  throw lastError || new GatewayError('Gateway fetch failed', 0);
}

// ── Convenience wrappers ──

/**
 * Fetch from UEF Gateway and parse JSON response.
 * Throws GatewayError on non-2xx responses.
 */
export async function gatewayJSON<T = unknown>(
  path: string,
  options: GatewayFetchOptions = {},
): Promise<T> {
  const res = await gatewayFetch(path, options);
  return res.json() as Promise<T>;
}

/**
 * POST JSON to UEF Gateway and parse JSON response.
 */
export async function gatewayPost<T = unknown>(
  path: string,
  body: unknown,
  options: Omit<GatewayFetchOptions, 'body' | 'method'> = {},
): Promise<T> {
  return gatewayJSON<T>(path, { ...options, method: 'POST', body });
}

/**
 * Convert a GatewayError to a NextResponse for API routes.
 */
export function gatewayErrorResponse(error: unknown): Response {
  if (error instanceof GatewayError) {
    return Response.json(error.toJSON(), { status: error.status || 502 });
  }
  return Response.json(
    { error: error instanceof Error ? error.message : 'Internal server error' },
    { status: 502 },
  );
}

// ── Helpers ──

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
