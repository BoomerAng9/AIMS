/**
 * AIMS Agent Gateway Worker
 *
 * Edge-level intelligence layer that sits in front of the AIMS VPS.
 * Handles agent detection, response caching, plug routing, and
 * security headers — all at the Cloudflare edge before hitting origin.
 *
 * Key behaviors:
 *   1. Agent Detection — identifies AI agent requests at the edge
 *   2. Edge Caching — caches LLM.txt, AI Index, and agent cards
 *   3. Plug Routing — routes subdomain requests to correct plug ports
 *   4. Security — CORS, rate headers, abuse prevention
 */

export interface Env {
  ENVIRONMENT: string;
  ORIGIN_URL: string;
  VPS_IP: string;
  GATEWAY_SECRET: string;
  // PLUG_ROUTES: KVNamespace; // Uncomment after KV setup
}

// ---------------------------------------------------------------------------
// Agent detection patterns
// ---------------------------------------------------------------------------

const AGENT_USER_AGENTS = [
  'AI-Agent', 'OpenClaw', 'Claude', 'GPT', 'Anthropic',
  'Perplexity', 'Cohere', 'Google-Extended', 'ChatGPT',
  'CCBot', 'Bytespider', 'Amazonbot',
];

const AGENT_ACCEPT_TYPES = ['text/markdown', 'application/json+markdown'];

function isAgentRequest(request: Request): boolean {
  const accept = request.headers.get('Accept') || '';
  const ua = request.headers.get('User-Agent') || '';

  if (AGENT_ACCEPT_TYPES.some(t => accept.includes(t))) return true;
  if (request.headers.has('X-Agent-Protocol')) return true;
  if (AGENT_USER_AGENTS.some(a => ua.includes(a))) return true;

  return false;
}

// ---------------------------------------------------------------------------
// Cacheable edge routes — these don't need to hit origin every time
// ---------------------------------------------------------------------------

const EDGE_CACHE_ROUTES: Record<string, number> = {
  '/llm.txt': 3600,           // 1 hour
  '/llm-full.txt': 3600,
  '/ai-index.json': 3600,
  '/.well-known/agent.json': 1800,  // 30 min
  '/a2a/agents': 600,         // 10 min (agent fleet changes more often)
};

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // CORS preflight — fast path
    if (request.method === 'OPTIONS') {
      return handleCors(request, env);
    }

    // Health check — no origin needed
    if (url.pathname === '/_worker/health') {
      return json({
        status: 'ok',
        worker: 'aims-agent-gateway',
        env: env.ENVIRONMENT,
        edge: request.cf?.colo || 'unknown',
      });
    }

    // -----------------------------------------------------------------------
    // Edge-cached routes (LLM.txt, AI Index, agent cards)
    // -----------------------------------------------------------------------
    const cacheTtl = EDGE_CACHE_ROUTES[url.pathname];
    if (cacheTtl) {
      return handleCachedRoute(request, env, ctx, cacheTtl);
    }

    // -----------------------------------------------------------------------
    // Plug subdomain routing (e.g., my-agent.plugmein.cloud)
    // -----------------------------------------------------------------------
    const hostname = url.hostname;
    const baseDomain = extractBaseDomain(hostname);
    if (baseDomain && hostname !== baseDomain && hostname !== `www.${baseDomain}`) {
      return handlePlugRoute(request, env, hostname);
    }

    // -----------------------------------------------------------------------
    // Standard proxy to origin — add agent detection headers
    // -----------------------------------------------------------------------
    return proxyToOrigin(request, env);
  },
};

// ---------------------------------------------------------------------------
// Edge-cached routes
// ---------------------------------------------------------------------------

async function handleCachedRoute(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
  ttl: number,
): Promise<Response> {
  const cache = caches.default;
  const cacheKey = new Request(request.url, { method: 'GET' });

  // Try cache first
  let response = await cache.match(cacheKey);
  if (response) {
    // Clone and add cache hit header
    const headers = new Headers(response.headers);
    headers.set('X-AIMS-Cache', 'HIT');
    headers.set('X-AIMS-Edge', (request.cf?.colo as string) || 'unknown');
    return new Response(response.body, { status: response.status, headers });
  }

  // Cache miss — fetch from origin
  response = await fetchOrigin(request, env);

  if (response.ok) {
    // Clone for cache storage
    const cacheResponse = new Response(response.clone().body, {
      status: response.status,
      headers: response.headers,
    });
    cacheResponse.headers.set('Cache-Control', `public, max-age=${ttl}`);
    ctx.waitUntil(cache.put(cacheKey, cacheResponse));
  }

  const headers = new Headers(response.headers);
  headers.set('X-AIMS-Cache', 'MISS');
  headers.set('X-AIMS-Edge', (request.cf?.colo as string) || 'unknown');

  return new Response(response.body, { status: response.status, headers });
}

// ---------------------------------------------------------------------------
// Plug subdomain routing
// ---------------------------------------------------------------------------

async function handlePlugRoute(request: Request, env: Env, hostname: string): Promise<Response> {
  const subdomain = hostname.split('.')[0];

  // TODO: Once KV is set up, look up the plug port mapping:
  // const portMapping = await env.PLUG_ROUTES.get(subdomain);
  // if (portMapping) {
  //   const { port, protocol } = JSON.parse(portMapping);
  //   const originUrl = `${protocol || 'http'}://${env.VPS_IP}:${port}`;
  //   return proxyToUrl(request, originUrl);
  // }

  // For now, proxy to origin and let nginx handle subdomain routing
  return proxyToOrigin(request, env);
}

// ---------------------------------------------------------------------------
// Origin proxy
// ---------------------------------------------------------------------------

async function proxyToOrigin(request: Request, env: Env): Promise<Response> {
  const response = await fetchOrigin(request, env);
  const headers = new Headers(response.headers);

  // Inject agent detection headers
  if (isAgentRequest(request)) {
    headers.set('X-AIMS-Agent-Detected', 'true');
    headers.set('X-Agent-Protocol', 'aims-a2a/1.0');
    headers.set('X-AIMS-Discovery', '/.well-known/agent.json');
    headers.set('X-Markdown-Tokens', '8000');
  }

  // Security headers
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Frame-Options', 'SAMEORIGIN');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  return new Response(response.body, { status: response.status, headers });
}

async function fetchOrigin(request: Request, env: Env): Promise<Response> {
  const originUrl = new URL(request.url);
  originUrl.hostname = new URL(env.ORIGIN_URL).hostname;
  originUrl.protocol = 'https:';

  const headers = new Headers(request.headers);
  headers.set('X-Forwarded-For', request.headers.get('CF-Connecting-IP') || '');
  headers.set('X-Forwarded-Proto', 'https');
  headers.set('X-AIMS-Worker', 'agent-gateway');

  // Pass through agent detection to origin
  if (isAgentRequest(request)) {
    headers.set('X-Agent-Request', 'true');
  }

  return fetch(originUrl.toString(), {
    method: request.method,
    headers,
    body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : undefined,
  });
}

// ---------------------------------------------------------------------------
// CORS
// ---------------------------------------------------------------------------

function handleCors(request: Request, env: Env): Response {
  const origin = request.headers.get('Origin') || '';
  const allowed =
    origin.endsWith('plugmein.cloud') ||
    origin.endsWith('aimanagedsolutions.cloud') ||
    origin.startsWith('http://localhost');

  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': allowed ? origin : new URL(env.ORIGIN_URL).origin,
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Api-Key, X-Agent-Protocol, Accept',
      'Access-Control-Max-Age': '86400',
    },
  });
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function extractBaseDomain(hostname: string): string | null {
  const parts = hostname.split('.');
  if (parts.length >= 2) {
    return parts.slice(-2).join('.');
  }
  return null;
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
