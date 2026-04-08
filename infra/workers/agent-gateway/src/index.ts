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
  PLUG_ROUTES: KVNamespace;
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
    // Route management API — UEF Gateway pushes route updates here
    // -----------------------------------------------------------------------
    if (url.pathname === '/_worker/routes' && request.method === 'PUT') {
      return handleRouteUpdate(request, env);
    }
    if (url.pathname === '/_worker/routes' && request.method === 'DELETE') {
      return handleRouteDelete(request, env);
    }
    if (url.pathname === '/_worker/routes' && request.method === 'GET') {
      return handleRouteList(request, env);
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

  // Look up plug port mapping from KV
  try {
    const portMapping = await env.PLUG_ROUTES.get(subdomain);
    if (portMapping) {
      const { port, protocol, instanceId } = JSON.parse(portMapping) as {
        port: number;
        protocol?: string;
        instanceId?: string;
      };
      const originUrl = `${protocol || 'http'}://${env.VPS_IP}:${port}`;
      return proxyToUrl(request, originUrl, instanceId);
    }
  } catch {
    // KV lookup failed — fall through to nginx routing
  }

  // Fallback: proxy to origin and let nginx handle subdomain routing
  return proxyToOrigin(request, env);
}

// ---------------------------------------------------------------------------
// Origin proxy
// ---------------------------------------------------------------------------

async function proxyToUrl(request: Request, originUrl: string, instanceId?: string): Promise<Response> {
  const url = new URL(request.url);
  const target = new URL(originUrl);
  target.pathname = url.pathname;
  target.search = url.search;

  const headers = new Headers(request.headers);
  headers.set('X-Forwarded-For', request.headers.get('CF-Connecting-IP') || '');
  headers.set('X-Forwarded-Proto', 'https');
  headers.set('X-AIMS-Worker', 'agent-gateway');
  headers.set('X-AIMS-Plug-Route', 'kv');
  if (instanceId) {
    headers.set('X-AIMS-Instance-Id', instanceId);
  }

  try {
    const response = await fetch(target.toString(), {
      method: request.method,
      headers,
      body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : undefined,
    });

    const responseHeaders = new Headers(response.headers);
    responseHeaders.set('X-AIMS-Plug-Route', 'kv');
    responseHeaders.set('X-Content-Type-Options', 'nosniff');

    return new Response(response.body, { status: response.status, headers: responseHeaders });
  } catch {
    return json({ error: 'Plug instance unreachable', originUrl }, 502);
  }
}

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
// Route management — KV CRUD for plug routes
// ---------------------------------------------------------------------------

async function authenticateManagement(request: Request, env: Env): Promise<boolean> {
  const authHeader = request.headers.get('Authorization') || '';
  return authHeader === `Bearer ${env.GATEWAY_SECRET}`;
}

async function handleRouteUpdate(request: Request, env: Env): Promise<Response> {
  if (!await authenticateManagement(request, env)) {
    return json({ error: 'Unauthorized' }, 401);
  }

  try {
    const body = await request.json() as {
      subdomain: string;
      port: number;
      protocol?: string;
      instanceId?: string;
    };

    if (!body.subdomain || !body.port) {
      return json({ error: 'subdomain and port are required' }, 400);
    }

    await env.PLUG_ROUTES.put(
      body.subdomain,
      JSON.stringify({
        port: body.port,
        protocol: body.protocol || 'http',
        instanceId: body.instanceId,
        updatedAt: new Date().toISOString(),
      }),
    );

    return json({ ok: true, subdomain: body.subdomain, port: body.port });
  } catch {
    return json({ error: 'Invalid request body' }, 400);
  }
}

async function handleRouteDelete(request: Request, env: Env): Promise<Response> {
  if (!await authenticateManagement(request, env)) {
    return json({ error: 'Unauthorized' }, 401);
  }

  try {
    const body = await request.json() as { subdomain: string };
    if (!body.subdomain) {
      return json({ error: 'subdomain is required' }, 400);
    }

    await env.PLUG_ROUTES.delete(body.subdomain);
    return json({ ok: true, deleted: body.subdomain });
  } catch {
    return json({ error: 'Invalid request body' }, 400);
  }
}

async function handleRouteList(request: Request, env: Env): Promise<Response> {
  if (!await authenticateManagement(request, env)) {
    return json({ error: 'Unauthorized' }, 401);
  }

  const list = await env.PLUG_ROUTES.list();
  const routes: Record<string, unknown> = {};

  for (const key of list.keys) {
    const value = await env.PLUG_ROUTES.get(key.name);
    routes[key.name] = value ? JSON.parse(value) : null;
  }

  return json({ routes, count: list.keys.length });
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
