/**
 * Edge Relay — Thin proxy to UEF Gateway from the edge
 *
 * Accepts lightweight requests from wearable/mobile clients,
 * enriches them with edge context (geo, device type),
 * and forwards to the UEF Gateway.
 *
 * This is the wearable's single entry point into ACHEEVY orchestration.
 * Supports both fire-and-forget (async) and synchronous request modes.
 *
 * Runtime: Vercel Edge (30s timeout)
 */

export const runtime = 'edge';
export const maxDuration = 30;

const UEF_GATEWAY_URL = process.env.UEF_GATEWAY_URL || process.env.NEXT_PUBLIC_UEF_GATEWAY_URL || '';
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || '';

interface RelayRequest {
  /** UEF Gateway path to forward to (e.g. "/acheevy/execute", "/llm/chat") */
  path: string;
  /** HTTP method (defaults to POST) */
  method?: 'GET' | 'POST' | 'PUT';
  /** Request body to forward */
  body?: Record<string, unknown>;
  /** If true, respond immediately with 202 and let gateway process async */
  async?: boolean;
}

export async function POST(req: Request) {
  if (!UEF_GATEWAY_URL) {
    return new Response(
      JSON.stringify({ error: 'Gateway not configured' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } },
    );
  }

  try {
    const relay: RelayRequest = await req.json();

    if (!relay.path || typeof relay.path !== 'string') {
      return new Response(
        JSON.stringify({ error: 'path required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // Allowlist — only specific gateway paths can be relayed
    const ALLOWED_PATHS = [
      '/acheevy/execute',
      '/acheevy/classify',
      '/llm/chat',
      '/health',
      '/luc/balance',
    ];

    if (!ALLOWED_PATHS.some(p => relay.path.startsWith(p))) {
      return new Response(
        JSON.stringify({ error: 'Path not allowed' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // Enrich body with edge context
    const edgeContext = {
      edgeRegion: req.headers.get('x-edge-region') || undefined,
      edgeCountry: req.headers.get('x-edge-country') || undefined,
      edgeCity: req.headers.get('x-edge-city') || undefined,
      deviceType: req.headers.get('x-device-type') || undefined,
      relayedAt: Date.now(),
    };

    const enrichedBody = relay.body
      ? { ...relay.body, _edge: edgeContext }
      : { _edge: edgeContext };

    const gatewayHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (INTERNAL_API_KEY) gatewayHeaders['X-API-Key'] = INTERNAL_API_KEY;

    // Forward auth header if present
    const authHeader = req.headers.get('authorization');
    if (authHeader) gatewayHeaders['Authorization'] = authHeader;

    const method = relay.method || 'POST';
    const fetchOpts: RequestInit = {
      method,
      headers: gatewayHeaders,
    };
    if (method !== 'GET') {
      fetchOpts.body = JSON.stringify(enrichedBody);
    }

    // Fire-and-forget mode — respond immediately, let gateway handle async
    if (relay.async) {
      // Don't await — fire and forget
      fetch(`${UEF_GATEWAY_URL}${relay.path}`, fetchOpts).catch(() => {});

      return new Response(
        JSON.stringify({
          accepted: true,
          ts: Date.now(),
          path: relay.path,
        }),
        {
          status: 202,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    // Synchronous mode — wait for gateway response and relay it back
    const res = await fetch(`${UEF_GATEWAY_URL}${relay.path}`, fetchOpts);

    const responseBody = await res.text();
    return new Response(responseBody, {
      status: res.status,
      headers: {
        'Content-Type': res.headers.get('content-type') || 'application/json',
        'X-Gateway-Status': String(res.status),
        'X-Edge-Relayed': 'true',
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Relay failed';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 502, headers: { 'Content-Type': 'application/json' } },
    );
  }
}
